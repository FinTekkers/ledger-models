"""SecurityMetricService (LM-485): latest values, history and writes of
security metric series (shares outstanding, NAV per share, total net assets).

    service = SecurityMetricService()
    service.get(SHARES_OUTSTANDING, [uuid1, uuid2], on=date(2026, 11, 23))
    service.get_history(SHARES_OUTSTANDING, uuid1, date(2026, 1, 1))
    service.record(SHARES_OUTSTANDING, uuid1, {date(2026, 11, 20): 15204137000})

No setup: the address comes from ``service_address.resolve(Service.PRICE)``
(BROKER_HOST first), as for the other service wrappers. A server can install
a local source with ``set_security_metric_fetcher`` instead, as with
``set_security_fetcher``. The rules live in
``fintekkers.wrappers.models.security.security_metric``.
"""

from datetime import date, datetime
from typing import Iterable, Mapping, Optional, Protocol, Sequence
from uuid import UUID

import grpc

from fintekkers.requests.security_metric.create_security_metric_request_pb2 import (
    CreateSecurityMetricRequestProto,
    CreateSecurityMetricResponseProto,
)
from fintekkers.requests.security_metric.get_latest_security_metric_request_pb2 import (
    GetLatestSecurityMetricRequestProto,
    GetLatestSecurityMetricResponseProto,
)
from fintekkers.requests.security_metric.search_security_metric_request_pb2 import (
    SearchSecurityMetricRequestProto,
    SearchSecurityMetricResponseProto,
)
from fintekkers.services.security_metric_service.security_metric_service_pb2_grpc import SecurityMetricStub
from fintekkers.wrappers.models.security.security_metric import (
    RECORD_CHUNK_SIZE,
    MetricLike,
    MetricResult,
    MetricSeries,
    PointsLike,
    SecurityMetricServiceError,
    ServiceUnavailable,
    build_create,
    build_get_latest,
    build_search,
    check_metric,
    chunk_record,
    map_latest,
    merge_chunks,
    validate_record,
)
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.services.util.service_address import Endpoint, Service, resolve

# Deadline for each call, in seconds.
DEFAULT_TIMEOUT_SECONDS = 30.0


class SecurityMetricFetcher(Protocol):
    """Where the service sends its three requests. The default is a gRPC
    client; a server can install a local one."""

    def get_latest(self, request: GetLatestSecurityMetricRequestProto) -> GetLatestSecurityMetricResponseProto: ...

    def search(self, request: SearchSecurityMetricRequestProto) -> Iterable[SearchSecurityMetricResponseProto]: ...

    def create_or_update(self, request: CreateSecurityMetricRequestProto) -> CreateSecurityMetricResponseProto: ...


_installed_fetcher: Optional[SecurityMetricFetcher] = None


def set_security_metric_fetcher(fetcher: Optional[SecurityMetricFetcher]) -> None:
    """Install a process-wide fetcher used by SecurityMetricService() and
    Security.get_metric. None restores the gRPC client."""
    global _installed_fetcher
    _installed_fetcher = fetcher


class GrpcSecurityMetricFetcher:
    """Calls the SecurityMetric gRPC service at ``endpoint``. Errors name the
    address: UNAVAILABLE is ServiceUnavailable, any other status a
    SecurityMetricServiceError."""

    def __init__(self, endpoint: Endpoint, timeout: Optional[float] = None):
        self.endpoint = endpoint
        self.timeout = timeout
        if endpoint.plaintext:
            channel = grpc.insecure_channel(endpoint.target)
        else:
            channel = grpc.secure_channel(endpoint.target, grpc.ssl_channel_credentials())
        self._stub = SecurityMetricStub(channel)

    def _timeout(self) -> float:
        return self.timeout if self.timeout is not None else DEFAULT_TIMEOUT_SECONDS

    def _error(self, rpc: str, e: grpc.RpcError) -> SecurityMetricServiceError:
        address = self.endpoint.target
        code = e.code()
        details = e.details() if hasattr(e, "details") else str(e)
        if code == grpc.StatusCode.UNAVAILABLE:
            return ServiceUnavailable(
                f"SecurityMetric service unreachable at {address} ({details})", address, code.name)
        name = code.name if code is not None else "UNKNOWN"
        return SecurityMetricServiceError(
            f"SecurityMetric {rpc} failed at {address}: {name} ({details})", address, name)

    def get_latest(self, request):
        try:
            return self._stub.GetLatest(request, timeout=self._timeout())
        except grpc.RpcError as e:
            raise self._error("GetLatest", e) from e

    def search(self, request):
        try:
            return list(self._stub.Search(request, timeout=self._timeout()))
        except grpc.RpcError as e:
            raise self._error("Search", e) from e

    def create_or_update(self, request):
        try:
            return self._stub.CreateOrUpdate(request, timeout=self._timeout())
        except grpc.RpcError as e:
            raise self._error("CreateOrUpdate", e) from e


class SecurityMetricService:
    """``SecurityMetricService()`` is the process singleton (like
    PriceService); pass ``fetcher`` or ``env`` for a separate instance.
    Tests that use the singleton call ``_reset_for_tests()``."""

    _instance = None

    def __new__(cls, fetcher: Optional[SecurityMetricFetcher] = None,
                env: Optional[Mapping[str, str]] = None):
        if fetcher is None and env is None:
            if cls._instance is None:
                cls._instance = cls._create(None, None)
            return cls._instance
        return cls._create(fetcher, env)

    def __init__(self, fetcher: Optional[SecurityMetricFetcher] = None,
                 env: Optional[Mapping[str, str]] = None):
        pass

    @classmethod
    def _create(cls, fetcher, env):
        instance = super().__new__(cls)
        instance._fetcher = fetcher
        instance._env = env
        instance._grpc = None
        return instance

    @classmethod
    def _reset_for_tests(cls) -> None:
        cls._instance = None

    @property
    def fetcher(self) -> SecurityMetricFetcher:
        """This instance's fetcher, else the installed one, else a gRPC
        client for the address from the service config."""
        if self._fetcher is not None:
            return self._fetcher
        if _installed_fetcher is not None:
            return _installed_fetcher
        if self._grpc is None:
            self._grpc = GrpcSecurityMetricFetcher(resolve(Service.PRICE, self._env))
        return self._grpc

    def get(self, metric: MetricLike, uuids: Sequence[UUID],
            on: Optional[date] = None) -> dict[UUID, Optional[MetricResult]]:
        """The latest point on or before ``on`` (today when omitted) for each
        security, in one GetLatest call. Every UUID is a key; absent is None."""
        metric = check_metric(metric)
        on = on if on is not None else date.today()
        uuids = list(uuids)
        if not uuids:
            return {}
        response = self.fetcher.get_latest(build_get_latest(metric, uuids, on))
        return map_latest(response, metric, uuids, on)

    def get_history(self, metric: MetricLike, uuid: UUID, from_date: date,
                    to_date: Optional[date] = None) -> MetricSeries:
        """Points from ``from_date`` to ``to_date`` (today when omitted),
        ascending, with streamed chunks joined and gaps kept."""
        metric = check_metric(metric)
        to_date = to_date if to_date is not None else date.today()
        request = build_search(metric, uuid, from_date, to_date)
        return merge_chunks(self.fetcher.search(request), uuid, metric)

    def record(self, metric: MetricLike, uuid: UUID, points: PointsLike) -> datetime:
        """Stores ``points`` ({date: value} or (date, value) pairs) and returns
        the server-stamped as_of of the last request. Bad input raises
        InvalidMetricPoints before any call; more than RECORD_CHUNK_SIZE points
        go in several requests."""
        metric = check_metric(metric)
        chunks = chunk_record(validate_record(metric, points), RECORD_CHUNK_SIZE)
        fetcher = self.fetcher
        stored = 0
        as_of: Optional[datetime] = None
        for chunk in chunks:
            try:
                response = fetcher.create_or_update(build_create(metric, uuid, chunk))
            except SecurityMetricServiceError as e:
                if stored:
                    e.args = (f"{e.args[0]}; {stored} points already stored",)
                raise
            stored += len(chunk)
            if not response.series.HasField("as_of"):
                raise SecurityMetricServiceError("CreateOrUpdate response has no as_of")
            as_of = ProtoSerializationUtil.deserialize(response.series.as_of)
        return as_of
