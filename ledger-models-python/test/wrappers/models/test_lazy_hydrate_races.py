"""Race-condition tests for Portfolio + Transaction lazy hydration.

Mirrors the Java PortfolioLazyHydrateRaceTest + TransactionLazyHydrateRaceTest.
Same contract: 16 threads concurrently call accessor on link-mode wrappers
that share a UUID; every thread must observe the resolved value with no
exceptions, and the LinkCache ends with exactly the resolved proto.
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto

from fintekkers.wrappers.models import portfolio as portfolio_module
from fintekkers.wrappers.models import transaction as transaction_module
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.util import link_cache


def _as_of() -> LocalTimestampProto:
    return LocalTimestampProto(
        timestamp=Timestamp(seconds=1_700_000_000, nanos=0),
        time_zone="UTC",
    )


def _run_race(target, threads: int = 16):
    barrier = threading.Barrier(threads)
    results: list[Optional[str]] = [None] * threads
    errors: list[Optional[BaseException]] = [None] * threads

    def worker(i: int):
        try:
            barrier.wait()
            results[i] = target()
        except BaseException as e:  # pragma: no cover - bubble up in assertion
            errors[i] = e

    ts = [threading.Thread(target=worker, args=(i,), name=f"race-{i}") for i in range(threads)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    return results, errors


def test_portfolio_concurrent_accessor_reads_on_shared_uuid_succeed():
    uuid = uuid4()
    as_of_proto = _as_of()
    uuid_proto = UUIDProto(raw_uuid=uuid.bytes)
    resolved = PortfolioProto(
        object_class="Portfolio",
        version="0.0.1",
        uuid=uuid_proto,
        as_of=as_of_proto,
        is_link=False,
        portfolio_name="RESOLVED",
    )

    saved = portfolio_module._portfolio_fetcher
    counter = {"calls": 0, "lock": threading.Lock()}

    def fake_fetcher(uid: UUID, ao: Optional[datetime]):
        with counter["lock"]:
            counter["calls"] += 1
        return resolved

    portfolio_module.set_portfolio_fetcher(fake_fetcher)
    link_cache.PORTFOLIO.evict(uuid)

    try:
        link_proto = PortfolioProto(
            uuid=uuid_proto, as_of=as_of_proto, is_link=True
        )

        def reader() -> str:
            return Portfolio(link_proto).get_name()

        results, errors = _run_race(reader)
        assert all(e is None for e in errors), f"errors: {[type(e).__name__ for e in errors if e]}"
        assert all(r == "RESOLVED" for r in results)
        # Fetcher may have fired 1..N times — no per-key dedup at the wrapper
        # layer. Cache must converge to the resolved entry regardless.
        from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
        as_of_dt = ProtoSerializationUtil.deserialize(as_of_proto)
        cached = link_cache.PORTFOLIO.get(uuid, as_of_dt)
        assert cached is not None
        assert cached.portfolio_name == "RESOLVED"
    finally:
        portfolio_module._portfolio_fetcher = saved
        link_cache.PORTFOLIO.evict(uuid)


def test_transaction_concurrent_accessor_reads_on_shared_uuid_succeed():
    uuid = uuid4()
    as_of_proto = _as_of()
    uuid_proto = UUIDProto(raw_uuid=uuid.bytes)
    resolved = TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=uuid_proto,
        as_of=as_of_proto,
        is_link=False,
        trade_name="RESOLVED-TRADE",
    )

    saved = transaction_module._transaction_fetcher
    counter = {"calls": 0, "lock": threading.Lock()}

    def fake_fetcher(uid: UUID, ao: Optional[datetime]):
        with counter["lock"]:
            counter["calls"] += 1
        return resolved

    transaction_module.set_transaction_fetcher(fake_fetcher)
    link_cache.TRANSACTION.evict(uuid)

    try:
        link_proto = TransactionProto(
            uuid=uuid_proto, as_of=as_of_proto, is_link=True
        )

        def reader() -> bool:
            t = Transaction(link_proto)
            t._ensure_hydrated()
            return t.proto.trade_name == "RESOLVED-TRADE"

        results, errors = _run_race(reader)
        assert all(e is None for e in errors), f"errors: {[type(e).__name__ for e in errors if e]}"
        assert all(r is True for r in results)
        from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
        as_of_dt = ProtoSerializationUtil.deserialize(as_of_proto)
        cached = link_cache.TRANSACTION.get(uuid, as_of_dt)
        assert cached is not None
        assert cached.trade_name == "RESOLVED-TRADE"
    finally:
        transaction_module._transaction_fetcher = saved
        link_cache.TRANSACTION.evict(uuid)
