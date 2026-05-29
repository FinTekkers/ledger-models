"""End-to-end DB perf bench: real gRPC round-trips against ledger-service.

Requires:
  - ledger-service running on localhost:8082 (start via
    ~/second-brain/services.sh start ledger-service)
  - postgres seeded with at least 10 Securities + 10 Portfolios + 10 Transactions
  - API_URL=localhost in the environment

Measurements:
  1. Single getByUuid: Portfolio, Security, Transaction (each separately)
  2. Transaction → lazy-resolve embedded Portfolio name (full hydrate chain)
  3. Each of (1) × 10 different UUIDs, serial
  4. 10 entities resolved in bulk via LinkResolver.resolve_portfolios

Run:
  cd ledger-models-python
  API_URL=localhost python3 -m test.bench.bench_e2e_db_latency
"""

from __future__ import annotations

import os
import statistics
import sys
import time
from typing import List, Optional
from uuid import UUID

# Default to localhost — this bench has no meaning against api.fintekkers.org
os.environ.setdefault("API_URL", "localhost")

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.requests.portfolio.query_portfolio_request_pb2 import (
    QueryPortfolioRequestProto,
)
from fintekkers.requests.security.query_security_request_pb2 import (
    QuerySecurityRequestProto,
)
from fintekkers.requests.transaction.query_transaction_request_pb2 import (
    QueryTransactionRequestProto,
)

from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
from fintekkers.wrappers.requests.security import QuerySecurityRequest
from fintekkers.wrappers.requests.transaction import QueryTransactionRequest
from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.services.transaction import TransactionService
from fintekkers.wrappers.util import link_cache
from fintekkers.wrappers.util.link_resolver import LinkResolver


# ---------- helpers ----------

def _us_since(t0: float) -> float:
    return (time.perf_counter() - t0) * 1_000_000.0


def _fmt_stats(label: str, samples_us: List[float], n_per: int = 1):
    """Print min/mean/p50/p95/max in microseconds. n_per scales for per-op."""
    per = [s / n_per for s in samples_us]
    if not per:
        print(f"  {label:<55} (no samples)")
        return
    per.sort()
    p50 = per[len(per) // 2]
    p95 = per[min(len(per) - 1, int(len(per) * 0.95))]
    print(
        f"  {label:<55} "
        f"min={per[0]:>10.1f} us  mean={statistics.mean(per):>10.1f} us  "
        f"p50={p50:>10.1f} us  p95={p95:>10.1f} us  max={per[-1]:>10.1f} us  "
        f"n={len(per)}"
    )


# ---------- discover UUIDs ----------

def _safe_collect(generator, accessor, limit: int) -> List[UUID]:
    """Robust drain: handles Python 3.9 PEP 479 (generator StopIteration
    can't propagate) and partial-list outcomes."""
    seen: List[UUID] = []
    try:
        for item in generator:
            try:
                seen.append(accessor(item))
            except Exception:
                continue
            if len(seen) >= limit:
                break
    except (StopIteration, RuntimeError):
        pass
    return seen


def _pg_uuids(table: str, limit: int) -> List[UUID]:
    """Direct postgres fallback. The search RPCs require filters that aren't
    universally seeded; reading primary keys directly always works for a bench."""
    try:
        import psycopg2
    except ImportError:
        return []
    try:
        conn = psycopg2.connect(
            host="localhost", port=5432, user="postgres",
            password="cejmot-gabze7-qaJdej", dbname="ledger",
        )
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT primarykey FROM {table} ORDER BY asof DESC LIMIT %s;",
                    (limit,),
                )
                rows = cur.fetchall()
        conn.close()
        return [UUID(str(r[0])) for r in rows]
    except Exception as e:
        print(f"  (psycopg2 fallback failed for {table}: {e})")
        return []


def find_portfolio_uuids(limit: int) -> List[UUID]:
    svc = PortfolioService()
    req = QueryPortfolioRequestProto(
        object_class="PortfolioRequest", version="0.0.1",
        search_portfolio_input=PositionFilterProto(),
    )
    uuids = _safe_collect(
        svc.search(QueryPortfolioRequest(req)),
        lambda p: ProtoSerializationUtil.deserialize(p.proto.uuid).uuid,
        limit,
    )
    return uuids or _pg_uuids("portfolio", limit)


def find_security_uuids(limit: int) -> List[UUID]:
    """Security search requires a non-trivial filter; the postgres fallback
    is simpler and always works for a bench against a seeded DB."""
    return _pg_uuids("security", limit)


def find_transaction_uuids(limit: int) -> List[UUID]:
    return _pg_uuids("transaction", limit)


# ---------- benches ----------

def bench_single_get(label: str, fn, uuids: List[UUID]):
    """Measure fn(uuid) once per UUID (cold-cache for that UUID, warm
    gRPC connection)."""
    # Warmup: one call to amortize TCP handshake + first-RPC overhead.
    if uuids:
        try:
            fn(uuids[0])
        except Exception:
            pass

    samples: List[float] = []
    for u in uuids:
        # Evict to ensure cold-cache RPC (the warmup may have populated cache)
        if "Portfolio" in label:
            link_cache.PORTFOLIO.evict(u)
        elif "Security" in label:
            link_cache.SECURITY.evict(u)
        elif "Transaction" in label:
            link_cache.TRANSACTION.evict(u)
        t0 = time.perf_counter()
        fn(u)
        samples.append(_us_since(t0))
    _fmt_stats(label, samples)


def bench_lazy_resolve_portfolio_on_txn(uuids: List[UUID]):
    """For each txn UUID: fetch txn, then read txn.portfolio.portfolio_name —
    triggers the Portfolio Fetcher if the embedded portfolio is link-mode.
    Measures the full chain wall-clock."""
    svc = TransactionService()
    samples: List[float] = []
    for u in uuids:
        link_cache.TRANSACTION.evict(u)
        t0 = time.perf_counter()
        txn = svc.get_transaction_by_uuid(u)
        if txn is None:
            continue
        # Hydrate the txn proto first (no-op if already full)
        txn._ensure_hydrated()
        # Access portfolio name through the Portfolio wrapper (which lazy-
        # hydrates if the embedded sub-message is is_link=true)
        if txn.proto.HasField("portfolio"):
            port_proto = txn.proto.portfolio
            if port_proto.is_link:
                port_uuid = ProtoSerializationUtil.deserialize(port_proto.uuid).uuid
                link_cache.PORTFOLIO.evict(port_uuid)
            p = Portfolio(port_proto)
            _ = p.get_name()
        samples.append(_us_since(t0))
    _fmt_stats("Transaction + lazy-resolve portfolio name", samples)


def bench_bulk_resolve_portfolios(uuids: List[UUID]):
    """Measure LinkResolver.resolve_portfolios on N transaction-like wrappers
    whose embedded portfolio links share UUIDs. Compares to N serial gets."""
    from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
    from fintekkers.models.transaction.transaction_pb2 import TransactionProto
    from fintekkers.models.util.uuid_pb2 import UUIDProto

    # Build N link-mode TransactionProtos each with an embedded link-mode
    # Portfolio pointing at one of the seeded UUIDs.
    txns = []
    for u in uuids:
        link_cache.PORTFOLIO.evict(u)
        link = PortfolioProto(uuid=UUIDProto(raw_uuid=u.bytes), is_link=True)
        t = Transaction(TransactionProto(portfolio=link))
        txns.append(t)

    resolver = LinkResolver()
    t0 = time.perf_counter()
    resolver.resolve_portfolios(txns)
    elapsed_us = _us_since(t0)
    print(
        f"  Bulk resolve_portfolios (N={len(uuids)})                       "
        f"total={elapsed_us:>10.1f} us  per_op={elapsed_us / len(uuids):>10.1f} us"
    )


# ---------- main ----------

def main():
    print(f"# python {sys.version.split()[0]} — E2E DB perf vs localhost:8082")
    print(f"# API_URL={os.environ.get('API_URL')}")

    # 1. Discover at least 10 UUIDs of each type. If discovery fails, the
    # database isn't seeded — bail with a clear message.
    print("\n[discovering UUIDs]")
    port_uuids = find_portfolio_uuids(10)
    sec_uuids = find_security_uuids(10)
    txn_uuids = find_transaction_uuids(10)
    print(f"  found portfolios={len(port_uuids)}  securities={len(sec_uuids)}  transactions={len(txn_uuids)}")

    # 2. Single-entity getByUuid (cold cache each time, samples = 10 different
    # UUIDs). Each row = per-op statistics across the 10 samples.
    print("\n[single getByUuid — 10 distinct cold-cache calls each]")
    port_svc = PortfolioService()
    sec_svc = SecurityService()
    txn_svc = TransactionService()
    if port_uuids:
        bench_single_get("Portfolio.getByUuid", lambda u: port_svc.get_portfolio_by_uuid(u), port_uuids)
    if sec_uuids:
        bench_single_get("Security.getByUuid", lambda u: sec_svc.get_security_by_uuid(u), sec_uuids)
    if txn_uuids:
        bench_single_get("Transaction.getByUuid", lambda u: txn_svc.get_transaction_by_uuid(u), txn_uuids)
    else:
        print("  Transaction.getByUuid                                  (skipped — no transaction rows in DB)")

    # 3. Lazy-resolve chain: get txn + read embedded portfolio name
    print("\n[Transaction + lazy-resolve embedded Portfolio name]")
    if txn_uuids:
        bench_lazy_resolve_portfolio_on_txn(txn_uuids)
    else:
        print("  (skipped — no transaction rows in DB)")

    # 4. Bulk: 10 portfolios via resolve_portfolios (one batched RPC)
    print("\n[Bulk vs serial portfolios]")
    if port_uuids:
        bench_bulk_resolve_portfolios(port_uuids)


if __name__ == "__main__":
    main()
