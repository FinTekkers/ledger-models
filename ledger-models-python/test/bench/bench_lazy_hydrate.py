"""End-to-end perf bench for lazy-hydrate of Transaction wrappers.

Measures: build N link-mode TransactionProtos, populate LinkCache.TRANSACTION
with their resolved counterparts, then construct N Transaction wrappers and
read trade_name + embedded portfolio name on each. Reports wall-clock,
per-op micros, and (best-effort) heap delta.

Run: `python3 -m test.bench.bench_lazy_hydrate` from ledger-models-python.

This is a microbenchmark — it isolates the wrapper accessor + cache lookup
path, not the gRPC fetch. The Fetcher is deliberately not exercised: we
pre-warm the cache so every accessor read is a cache hit. That mirrors the
realistic steady-state (resolver pre-warm before the read loop).
"""

from __future__ import annotations

import gc
import time
import sys
from datetime import datetime, timezone
from typing import List
from uuid import uuid4

import tracemalloc

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto

from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.util import link_cache


def _as_of() -> LocalTimestampProto:
    return LocalTimestampProto(
        timestamp=Timestamp(seconds=1_700_000_000, nanos=0),
        time_zone="UTC",
    )


def _build_pair(as_of: LocalTimestampProto):
    """Return (link_proto, resolved_proto) — same UUID, different is_link."""
    txn_uuid = uuid4()
    port_uuid = uuid4()
    uuid_proto = UUIDProto(raw_uuid=txn_uuid.bytes)
    port_uuid_proto = UUIDProto(raw_uuid=port_uuid.bytes)

    resolved_portfolio = PortfolioProto(
        object_class="Portfolio",
        version="0.0.1",
        uuid=port_uuid_proto,
        as_of=as_of,
        is_link=False,
        portfolio_name=f"P-{port_uuid.hex[:8]}",
    )
    resolved = TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=uuid_proto,
        as_of=as_of,
        is_link=False,
        trade_name=f"T-{txn_uuid.hex[:8]}",
        portfolio=resolved_portfolio,
    )
    link = TransactionProto(uuid=uuid_proto, as_of=as_of, is_link=True)
    return txn_uuid, link, resolved


def run(n: int):
    as_of = _as_of()
    pairs = []
    for _ in range(n):
        pairs.append(_build_pair(as_of))

    # Pre-warm: write each resolved into LinkCache.TRANSACTION (and
    # embedded portfolio into LinkCache.PORTFOLIO so portfolio accessors
    # also see cache hits — mirrors resolver-then-read flow).
    from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    for txn_uuid, _link, resolved in pairs:
        link_cache.TRANSACTION.put(txn_uuid, resolved, as_of_dt)
        if resolved.HasField("portfolio"):
            port_uuid = ProtoSerializationUtil.deserialize(resolved.portfolio.uuid).uuid
            link_cache.PORTFOLIO.put(port_uuid, resolved.portfolio, as_of_dt)

    gc.collect()
    tracemalloc.start()
    snap_before = tracemalloc.take_snapshot()
    t0 = time.perf_counter()

    sink = 0
    for _txn_uuid, link, _resolved in pairs:
        t = Transaction(link)
        t._ensure_hydrated()
        # Read accessors to exercise the cached proto + nested portfolio
        # cache-hit path.
        if t.proto.trade_name:
            sink += 1

    t1 = time.perf_counter()
    snap_after = tracemalloc.take_snapshot()
    tracemalloc.stop()

    elapsed = t1 - t0
    per_op_us = (elapsed / n) * 1_000_000 if n else 0

    stats = snap_after.compare_to(snap_before, "filename")
    delta_kb = sum(s.size_diff for s in stats) / 1024.0

    print(
        f"N={n:>6}  elapsed={elapsed * 1000:>9.2f} ms  per_op={per_op_us:>8.2f} us  "
        f"heap_delta={delta_kb:>8.2f} KiB  reads={sink}"
    )

    # Cleanup so subsequent runs don't accumulate.
    for txn_uuid, _link, resolved in pairs:
        link_cache.TRANSACTION.evict(txn_uuid)
        if resolved.HasField("portfolio"):
            port_uuid = ProtoSerializationUtil.deserialize(resolved.portfolio.uuid).uuid
            link_cache.PORTFOLIO.evict(port_uuid)


def main(argv: List[str]):
    sizes = [int(x) for x in argv[1:]] if len(argv) > 1 else [10, 100, 1_000, 10_000]
    print(f"# python3 {sys.version.split()[0]}")
    print(f"# bench: lazy-hydrate Transaction via pre-warmed LinkCache")
    for n in sizes:
        run(n)


if __name__ == "__main__":
    main(sys.argv)
