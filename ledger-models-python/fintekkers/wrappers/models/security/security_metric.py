"""Security metric series helpers (LM-485): results, series and the pure
rules behind ``Security.get_metric`` and ``SecurityMetricService``.

No I/O here. The service wrapper in
``fintekkers.wrappers.services.security_metric`` sends what these functions
build. The same rules hold in Java, JS and Rust, checked in every language
against ``test-fixtures/security-metric/cases.json``. See
``docs/adr/security_metric_series.md``.

Absent is never 0: a missing point is ``None``, and a stored 0 is a real 0.
"""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Iterable, Mapping, Optional, Sequence, Union
from uuid import UUID

from fintekkers.models.security.security_metric_pb2 import (
    SecurityMetricPointProto,
    SecurityMetricSeriesProto,
)
from fintekkers.models.security.security_metric_type_pb2 import (
    NAV_PER_SHARE,
    SHARES_OUTSTANDING,
    TOTAL_NET_ASSETS,
    UNKNOWN_SECURITY_METRIC,
    SecurityMetricTypeProto,
)
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.security_metric.create_security_metric_request_pb2 import (
    CreateSecurityMetricRequestProto,
)
from fintekkers.requests.security_metric.get_latest_security_metric_request_pb2 import (
    GetLatestSecurityMetricRequestProto,
    GetLatestSecurityMetricResponseProto,
)
from fintekkers.requests.security_metric.search_security_metric_request_pb2 import (
    SearchSecurityMetricRequestProto,
    SearchSecurityMetricResponseProto,
)
from fintekkers.requests.util.operation_pb2 import CREATE
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util.object_types import stamp_own

__all__ = [
    "SHARES_OUTSTANDING", "NAV_PER_SHARE", "TOTAL_NET_ASSETS", "RECORD_CHUNK_SIZE",
    "MetricResult", "MetricPoint", "MetricSeries", "Violation",
    "SecurityMetricInputError", "MissingSecurityId", "UnknownMetric", "InvalidMetricPoints",
    "SecurityMetricServiceError", "ServiceUnavailable",
]

# Points per CreateOrUpdate request; larger inputs are sent in several.
RECORD_CHUNK_SIZE = 5000

MetricLike = Union[int, str]
DateLike = Union[date, str]
ValueLike = Union[Decimal, int, float, str, None]
PointsLike = Union[Mapping[DateLike, ValueLike], Iterable[tuple]]


# ---------------------------------------------------------------- errors

class SecurityMetricInputError(ValueError):
    """Bad input from the caller, raised before any call."""


class MissingSecurityId(SecurityMetricInputError):
    def __init__(self):
        super().__init__("security has no UUID: cannot fetch its metrics")


class UnknownMetric(SecurityMetricInputError):
    def __init__(self, metric):
        self.metric = metric
        super().__init__(f"unknown security metric: {metric}")


@dataclass(frozen=True)
class Violation:
    """One rejected point: its ISO date (None for the whole input) and why."""
    date: Optional[str]
    reason: str
    detail: str = ""


class InvalidMetricPoints(SecurityMetricInputError):
    """Every point ``record`` rejected, not only the first."""

    def __init__(self, metric_name: str, violations: Sequence[Violation]):
        self.violations = list(violations)
        parts = []
        for v in self.violations:
            text = v.reason if not v.detail else f"{v.reason} ({v.detail})"
            parts.append(text if v.date is None else f"{v.date}: {text}")
        super().__init__(f"invalid {metric_name} points: " + "; ".join(parts))


class SecurityMetricServiceError(RuntimeError):
    """The SecurityMetric service failed or answered something malformed."""

    def __init__(self, message: str, address: Optional[str] = None, code: Optional[str] = None):
        self.address = address
        self.code = code
        super().__init__(message)


class ServiceUnavailable(SecurityMetricServiceError):
    """The SecurityMetric service could not be reached at ``address``."""


# ---------------------------------------------------------------- values

@dataclass(frozen=True)
class MetricResult:
    """The latest point on or before ``on``."""
    value: Decimal
    date: date
    on: date

    @property
    def age_days(self) -> int:
        """Calendar days from the observation date to ``on``."""
        return (self.on - self.date).days


@dataclass(frozen=True)
class MetricPoint:
    date: date
    value: Decimal


class MetricSeries:
    """An ascending series of (date, value). Dates with no point are gaps."""

    def __init__(self, security_id: UUID, metric: int, as_of: Optional[datetime],
                 points: Sequence[MetricPoint]):
        self.security_id = security_id
        self.metric = metric
        self.as_of = as_of
        self.points: list[MetricPoint] = list(points)

    @property
    def latest(self) -> Optional[MetricPoint]:
        """The last point, or None when the series is empty."""
        return self.points[-1] if self.points else None

    def to_dict(self) -> dict[date, Decimal]:
        """Date -> value, ascending."""
        return {p.date: p.value for p in self.points}

    def to_pandas(self):
        """A ``pandas.Series`` of values indexed by date. Needs pandas, which
        is not a dependency of this package."""
        try:
            import pandas
        except ImportError as e:
            raise ImportError("MetricSeries.to_pandas() needs pandas: pip install pandas") from e
        return pandas.Series(
            [p.value for p in self.points],
            index=pandas.Index([p.date for p in self.points], name="date"),
            name=metric_name(self.metric),
            dtype=object,
        )

    def __len__(self) -> int:
        return len(self.points)

    def __iter__(self):
        return iter(self.points)

    def __repr__(self) -> str:
        return f"MetricSeries({metric_name(self.metric)}, {self.security_id}, {len(self.points)} points)"


# ---------------------------------------------------------------- rules

def metric_name(metric: int) -> str:
    try:
        return SecurityMetricTypeProto.Name(metric)
    except ValueError:
        return str(metric)


def check_metric(metric: MetricLike) -> int:
    """The enum value for ``metric`` (the enum value or its name).
    UNKNOWN_SECURITY_METRIC or anything else raises UnknownMetric."""
    if isinstance(metric, str):
        if metric in SecurityMetricTypeProto.keys() and metric != "UNKNOWN_SECURITY_METRIC":
            return SecurityMetricTypeProto.Value(metric)
        raise UnknownMetric(metric)
    if isinstance(metric, bool) or not isinstance(metric, int):
        raise UnknownMetric(metric)
    if metric == UNKNOWN_SECURITY_METRIC or metric not in SecurityMetricTypeProto.values():
        raise UnknownMetric(metric_name(metric))
    return metric


def _uuid_proto(uuid: UUID) -> UUIDProto:
    return UUIDProto(raw_uuid=uuid.bytes)


def _date_proto(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def _to_date(d: LocalDateProto) -> date:
    return date(d.year, d.month, d.day)


def build_get_latest(metric: int, uuids: Sequence[UUID], on: date) -> GetLatestSecurityMetricRequestProto:
    """One GetLatest request for every security in ``uuids`` (duplicates dropped)."""
    unique = list(dict.fromkeys(uuids))
    return stamp_own(GetLatestSecurityMetricRequestProto(
        security_ids=[_uuid_proto(u) for u in unique],
        metrics=[metric],
        date=_date_proto(on),
    ))


def map_latest(response: GetLatestSecurityMetricResponseProto, metric: int,
               uuids: Sequence[UUID], on: date) -> dict[UUID, Optional[MetricResult]]:
    """Every requested UUID -> its result, or None when absent. Series are
    matched by security_id, never by position."""
    results: dict[UUID, Optional[MetricResult]] = {u: None for u in uuids}
    for series in response.series:
        if series.metric != metric or not series.security_id.raw_uuid:
            continue
        uuid = UUID(bytes=series.security_id.raw_uuid)
        if uuid not in results or not series.points:
            continue
        point = series.points[-1]
        results[uuid] = MetricResult(decode_decimal(point.value), _to_date(point.observation_date), on)
    return results


def build_search(metric: int, uuid: UUID, from_date: date, to_date: date) -> SearchSecurityMetricRequestProto:
    if from_date > to_date:
        raise SecurityMetricInputError(f"from date {from_date} is after to date {to_date}")
    return stamp_own(SearchSecurityMetricRequestProto(
        security_id=_uuid_proto(uuid),
        metrics=[metric],
        start_date=_date_proto(from_date),
        end_date=_date_proto(to_date),
    ))


def merge_chunks(chunks: Iterable[SearchSecurityMetricResponseProto], security_id: UUID,
                 metric: int) -> MetricSeries:
    """Joins consecutive Search messages into one series. Gaps stay gaps; a
    date out of order or repeated is a SecurityMetricServiceError."""
    points: list[MetricPoint] = []
    as_of: Optional[datetime] = None
    for chunk in chunks:
        series = chunk.series
        if as_of is None and series.HasField("as_of"):
            as_of = ProtoSerializationUtil.deserialize(series.as_of)
        for p in series.points:
            d = _to_date(p.observation_date)
            if points and d <= points[-1].date:
                raise SecurityMetricServiceError(
                    f"Search returned {d} after {points[-1].date}: dates must be strictly ascending")
            points.append(MetricPoint(d, decode_decimal(p.value)))
    return MetricSeries(security_id, metric, as_of, points)


def _parse_date(d) -> date:
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        return date.fromisoformat(d)
    raise SecurityMetricInputError(f"not a date: {d!r}")


def _parse_value(v) -> Optional[Decimal]:
    """None stays None (a missing value); floats go through str so 0.1 stays 0.1."""
    if v is None:
        return None
    if isinstance(v, bool):
        raise SecurityMetricInputError(f"not a number: {v!r}")
    if isinstance(v, Decimal):
        return v
    if isinstance(v, (int, float)):
        return Decimal(str(v))
    if isinstance(v, str):
        try:
            return Decimal(v)
        except InvalidOperation:
            raise SecurityMetricInputError(f"not a number: {v!r}") from None
    raise SecurityMetricInputError(f"not a number: {v!r}")


def validate_record(metric: int, points: PointsLike) -> list[MetricPoint]:
    """Native (date, value) pairs or a {date: value} map -> ascending points.

    Raises InvalidMetricPoints listing every bad point: no points, a missing
    value, a fractional SHARES_OUTSTANDING or a duplicate date. A share count
    such as 15204137000.00 is whole and is sent at scale 0."""
    pairs = list(points.items()) if isinstance(points, Mapping) else list(points)
    violations: list[Violation] = []
    if not pairs:
        violations.append(Violation(None, "no points"))
    seen: set[date] = set()
    accepted: list[MetricPoint] = []
    for pair in pairs:
        d_raw, v_raw = pair
        d = _parse_date(d_raw)
        try:
            value = _parse_value(v_raw)
        except SecurityMetricInputError:
            violations.append(Violation(d.isoformat(), "not a number", repr(v_raw)))
            continue
        if d in seen:
            violations.append(Violation(d.isoformat(), "duplicate date"))
            continue
        seen.add(d)
        if value is None:
            violations.append(Violation(d.isoformat(), "missing value"))
            continue
        if not value.is_finite():
            violations.append(Violation(d.isoformat(), "not a number", str(value)))
            continue
        if metric == SHARES_OUTSTANDING:
            if value != value.to_integral_value():
                violations.append(Violation(d.isoformat(), "fractional share count", str(value)))
                continue
            value = value.to_integral_value()
        accepted.append(MetricPoint(d, value))
    if violations:
        raise InvalidMetricPoints(metric_name(metric), violations)
    return sorted(accepted, key=lambda p: p.date)


def chunk_record(points: Sequence[MetricPoint], chunk_size: int = RECORD_CHUNK_SIZE) -> list[list[MetricPoint]]:
    return [list(points[i:i + chunk_size]) for i in range(0, len(points), chunk_size)]


def build_create(metric: int, uuid: UUID, chunk: Sequence[MetricPoint]) -> CreateSecurityMetricRequestProto:
    series = stamp_own(SecurityMetricSeriesProto(
        security_id=_uuid_proto(uuid),
        metric=metric,
        points=[SecurityMetricPointProto(observation_date=_date_proto(p.date), value=encode_decimal(p.value))
                for p in chunk],
    ))
    return stamp_own(CreateSecurityMetricRequestProto(operation_type=CREATE, series=series))
