"""An in-memory SecurityMetric gRPC server on 127.0.0.1 for the LM-485 tests.

GetLatest answers in reverse request order and leaves out securities it has
no data for; Search streams chunks of 2 points; CreateOrUpdate stores the
points and stamps a distinct as_of per call. Every request is kept.
"""
import socket
from concurrent import futures
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

import grpc
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.security.security_metric_pb2 import SecurityMetricPointProto, SecurityMetricSeriesProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.security_metric.create_security_metric_request_pb2 import CreateSecurityMetricResponseProto
from fintekkers.requests.security_metric.get_latest_security_metric_request_pb2 import (
    GetLatestSecurityMetricResponseProto,
)
from fintekkers.requests.security_metric.search_security_metric_request_pb2 import SearchSecurityMetricResponseProto
from fintekkers.services.security_metric_service import security_metric_service_pb2_grpc
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal
from fintekkers.wrappers.util.object_types import stamp_own

AS_OF_BASE = datetime(2026, 11, 23, 21, 0, 0, tzinfo=timezone.utc)
CHUNK = 2


def _date(d: LocalDateProto) -> date:
    return date(d.year, d.month, d.day)


def _date_proto(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def stamped_as_of(call: int) -> datetime:
    """The as_of the fake stamps on its ``call``-th CreateOrUpdate (1-based)."""
    return AS_OF_BASE + timedelta(seconds=call)


class FakeSecurityMetric(security_metric_service_pb2_grpc.SecurityMetricServicer):
    def __init__(self):
        # (uuid, metric) -> {date: Decimal}
        self.store: dict[tuple[UUID, int], dict[date, Decimal]] = {}
        self.get_latest_requests = []
        self.search_requests = []
        self.create_requests = []

    def seed(self, uuid: UUID, metric: int, points: dict) -> None:
        self.store.setdefault((uuid, metric), {}).update(
            {d: Decimal(str(v)) for d, v in points.items()})

    def _header(self, uuid: UUID, metric: int) -> SecurityMetricSeriesProto:
        return stamp_own(SecurityMetricSeriesProto(
            security_id=UUIDProto(raw_uuid=uuid.bytes), metric=metric,
            as_of=LocalTimestampProto(timestamp=Timestamp(seconds=int(AS_OF_BASE.timestamp())), time_zone="UTC")))

    def _point(self, d: date, v: Decimal) -> SecurityMetricPointProto:
        return SecurityMetricPointProto(observation_date=_date_proto(d), value=encode_decimal(v))

    def GetLatest(self, request, context):
        self.get_latest_requests.append(request)
        on = _date(request.date)
        known = {u for (u, _m) in self.store}
        response = stamp_own(GetLatestSecurityMetricResponseProto())
        for sid in reversed(request.security_ids):
            uuid = UUID(bytes=sid.raw_uuid)
            if uuid not in known:
                continue
            for metric in request.metrics:
                series = self._header(uuid, metric)
                dates = [d for d in self.store.get((uuid, metric), {}) if d <= on]
                if dates:
                    d = max(dates)
                    series.points.append(self._point(d, self.store[(uuid, metric)][d]))
                response.series.append(series)
        return response

    def Search(self, request, context):
        self.search_requests.append(request)
        uuid = UUID(bytes=request.security_id.raw_uuid)
        start, end = _date(request.start_date), _date(request.end_date)
        for metric in request.metrics:
            values = self.store.get((uuid, metric), {})
            dates = sorted(d for d in values if start <= d <= end)
            if not dates:
                yield stamp_own(SearchSecurityMetricResponseProto(series=self._header(uuid, metric)))
            for i in range(0, len(dates), CHUNK):
                series = self._header(uuid, metric)
                series.points.extend(self._point(d, values[d]) for d in dates[i:i + CHUNK])
                yield stamp_own(SearchSecurityMetricResponseProto(series=series))

    def CreateOrUpdate(self, request, context):
        self.create_requests.append(request)
        uuid = UUID(bytes=request.series.security_id.raw_uuid)
        self.store.setdefault((uuid, request.series.metric), {}).update(
            {_date(p.observation_date): decode_decimal(p.value) for p in request.series.points})
        as_of = stamped_as_of(len(self.create_requests))
        header = stamp_own(SecurityMetricSeriesProto(
            security_id=request.series.security_id, metric=request.series.metric,
            as_of=LocalTimestampProto(timestamp=Timestamp(seconds=int(as_of.timestamp())), time_zone="UTC")))
        return stamp_own(CreateSecurityMetricResponseProto(operation_type=request.operation_type, series=header))


class FakeServer:
    """Starts ``FakeSecurityMetric`` on a free port; ``stop()`` shuts it down."""

    def __init__(self):
        self.servicer = FakeSecurityMetric()
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
        security_metric_service_pb2_grpc.add_SecurityMetricServicer_to_server(self.servicer, self.server)
        self.port = self.server.add_insecure_port("127.0.0.1:0")
        self.server.start()

    def stop(self) -> None:
        self.server.stop(None)


def closed_port() -> int:
    """A port on 127.0.0.1 that nothing listens on."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]
