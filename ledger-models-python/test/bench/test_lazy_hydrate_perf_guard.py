"""Performance-regression guard for the Transaction wrapper's lazy-hydrate
read path (pre-warmed cache hit).

Baseline measured on a Mac Mini M-series: ~11.19 µs/op at N=10000.
Default ceiling = baseline + 15% headroom = 12.87 µs/op.

Override via env var LAZY_HYDRATE_PERF_CEILING_US for slower CI hardware.
"""

from __future__ import annotations

import gc
import os
import time
from typing import List
from uuid import uuid4

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto

from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache


N = 10_000
DEFAULT_CEILING_US = 12.87  # 11.19 * 1.15


def _read_ceiling_us() -> float:
    raw = os.environ.get("LAZY_HYDRATE_PERF_CEILING_US")
    if not raw:
        return DEFAULT_CEILING_US
    try:
        return float(raw)
    except ValueError:
        return DEFAULT_CEILING_US


def _run_once() -> float:
    as_of_proto = LocalTimestampProto(
        timestamp=Timestamp(seconds=1_700_000_000, nanos=0), time_zone="UTC"
    )
    as_of_dt = ProtoSerializationUtil.deserialize(as_of_proto)

    txn_uuids = []
    port_uuids = []
    links: List[TransactionProto] = []

    for _ in range(N):
        txn_uuid = uuid4()
        port_uuid = uuid4()
        txn_uuids.append(txn_uuid)
        port_uuids.append(port_uuid)

        txn_uuid_proto = UUIDProto(raw_uuid=txn_uuid.bytes)
        port_uuid_proto = UUIDProto(raw_uuid=port_uuid.bytes)

        resolved_port = PortfolioProto(
            uuid=port_uuid_proto, as_of=as_of_proto, is_link=False,
            portfolio_name=f"P-{port_uuid.hex[:8]}",
        )
        resolved = TransactionProto(
            uuid=txn_uuid_proto, as_of=as_of_proto, is_link=False,
            trade_name=f"T-{txn_uuid.hex[:8]}", portfolio=resolved_port,
        )
        link_cache.TRANSACTION.put(txn_uuid, resolved, as_of_dt)
        link_cache.PORTFOLIO.put(port_uuid, resolved_port, as_of_dt)

        links.append(TransactionProto(uuid=txn_uuid_proto, as_of=as_of_proto, is_link=True))

    gc.collect()
    t0 = time.perf_counter()
    sink = 0
    for link in links:
        t = Transaction(link)
        t._ensure_hydrated()
        if t.proto.trade_name:
            sink += 1
    t1 = time.perf_counter()
    assert sink == N

    for u in txn_uuids:
        link_cache.TRANSACTION.evict(u)
    for u in port_uuids:
        link_cache.PORTFOLIO.evict(u)

    return ((t1 - t0) / N) * 1_000_000.0


def test_per_op_stays_within_15pct_of_baseline_at_n_10000():
    ceiling_us = _read_ceiling_us()

    # Warmup: discard timing. (Python has no JIT, but this still pages in
    # the hot code and ensures both runs see the same allocation churn.)
    _run_once()
    per_op_us = _run_once()

    print(
        f"LazyHydratePerfGuard (python): N={N}  per_op={per_op_us:.2f} us  "
        f"ceiling={ceiling_us:.2f} us"
    )
    assert per_op_us <= ceiling_us, (
        f"Transaction lazy-hydrate per-op ({per_op_us:.2f} us) exceeded ceiling "
        f"({ceiling_us:.2f} us). Either a regression or noisy hardware; override "
        f"via LAZY_HYDRATE_PERF_CEILING_US env var if running on slow CI."
    )
