//! SecurityMetric wrapper core (LM-485): the pure rules behind
//! [`SecurityMetricService`](crate::fintekkers::wrappers::services::security_metric::SecurityMetricService)
//! and the `SecurityWrapper` metric accessors. No I/O here.
//!
//! - [`MetricResult`]: the latest value on or before a date, with its date.
//! - [`MetricSeries`]: the points of one metric of one security, ascending.
//! - Request builders ([`build_get_latest`], [`build_search`],
//!   [`build_create`]) stamp what they build.
//! - [`map_latest`] and [`merge_chunks`] turn responses into native types.
//! - [`validate_record`] and [`chunk_record`] check and split a write.
//!
//! Absent means unknown, never 0: a security with no point is `None`, and a
//! stored 0 is a real `Some` 0. The same rules are checked in every language
//! against `test-fixtures/security-metric/cases.json`.

#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]

use std::collections::{BTreeMap, HashMap, HashSet};
use std::fmt;

use chrono::{DateTime, Datelike, NaiveDate};
use chrono_tz::Tz;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::fintekkers::models::security::{
    SecurityMetricPointProto, SecurityMetricSeriesProto, SecurityMetricTypeProto,
};
use crate::fintekkers::models::util::{LocalDateProto, LocalTimestampProto, UuidProto};
use crate::fintekkers::requests::security_metric::{
    CreateSecurityMetricRequestProto, GetLatestSecurityMetricRequestProto,
    GetLatestSecurityMetricResponseProto, SearchSecurityMetricRequestProto,
    SearchSecurityMetricResponseProto,
};
use crate::fintekkers::requests::util::RequestOperationTypeProto;
use crate::fintekkers::wrappers::models::utils::decimal;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use crate::fintekkers::wrappers::util::object_types;
use crate::fintekkers::wrappers::util::service_address::ServiceAddressError;

/// Most points sent in one CreateOrUpdate request; a longer write is split.
pub const RECORD_CHUNK_SIZE: usize = 5000;

// ---------- native types ----------

/// The latest value of a metric on or before the date asked for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MetricResult {
    /// The stored value, with its scale.
    pub value: Decimal,
    /// The observation date of the value.
    pub date: NaiveDate,
    /// The date asked for.
    pub on: NaiveDate,
}

impl MetricResult {
    /// Calendar days from `date` to `on`: a Friday point asked for on
    /// Monday is 3 days old.
    pub fn age_days(&self) -> i64 {
        (self.on - self.date).num_days()
    }
}

/// One observation: a date and its value.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MetricPoint {
    pub date: NaiveDate,
    pub value: Decimal,
}

/// The points of one metric of one security in a date range, as known at
/// `as_of`. A date with no point is unknown: it is never filled.
#[derive(Debug, Clone, PartialEq)]
pub struct MetricSeries {
    pub security_id: Uuid,
    pub metric: SecurityMetricTypeProto,
    /// The knowledge time of the first chunk that carried one; `None` when
    /// no chunk did.
    pub as_of: Option<DateTime<Tz>>,
    /// Strictly ascending by date.
    pub points: Vec<MetricPoint>,
}

impl MetricSeries {
    /// The last point, or `None` for an empty series.
    pub fn latest(&self) -> Option<MetricPoint> {
        self.points.last().copied()
    }

    /// The points keyed by date.
    pub fn to_dict(&self) -> BTreeMap<NaiveDate, Decimal> {
        self.points.iter().map(|p| (p.date, p.value)).collect()
    }
}

/// One rejected point of a write: its date (`None` for the whole input) and
/// the reason, one of `no points`, `missing value`, `fractional share count`
/// or `duplicate date`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Violation {
    pub date: Option<NaiveDate>,
    pub reason: String,
    /// The offending value, when it helps (a fractional share count).
    pub value: Option<Decimal>,
}

impl fmt::Display for Violation {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if let Some(date) = self.date {
            write!(f, "{}: ", date)?;
        }
        f.write_str(&self.reason)?;
        if let Some(value) = self.value {
            write!(f, " ({})", value)?;
        }
        Ok(())
    }
}

// ---------- errors ----------

/// Every failure of the SecurityMetric helpers. Input errors
/// ([`is_input_error`](Self::is_input_error)) are the caller's to fix and
/// are raised before any call; the rest come from the service.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SecurityMetricError {
    /// The security has no UUID.
    MissingSecurityId,
    /// The metric is UNKNOWN_SECURITY_METRIC or a value this library does
    /// not know; holds its name or number.
    UnknownMetric(String),
    /// A write was rejected before any call; lists every bad point in input
    /// order.
    InvalidMetricPoints { metric: String, violations: Vec<Violation> },
    /// Any other bad argument, e.g. a from date after the to date.
    InvalidInput(String),
    /// The service address in the environment is malformed.
    InvalidAddress(ServiceAddressError),
    /// The service could not be reached (gRPC UNAVAILABLE or a failed
    /// connect). `address` is `host:port`.
    ServiceUnavailable { address: String, details: String, points_stored: usize },
    /// The service answered with an error status. `code` is the gRPC code
    /// name, e.g. `NOT_FOUND`.
    Service { address: String, rpc: String, code: String, details: String, points_stored: usize },
    /// The service answered with something these rules reject, e.g. Search
    /// dates out of order.
    InvalidResponse(String),
}

impl SecurityMetricError {
    /// True for errors in the caller's input, raised before any call.
    pub fn is_input_error(&self) -> bool {
        matches!(
            self,
            SecurityMetricError::MissingSecurityId
                | SecurityMetricError::UnknownMetric(_)
                | SecurityMetricError::InvalidMetricPoints { .. }
                | SecurityMetricError::InvalidInput(_)
        )
    }

    /// True for errors from the service or its address.
    pub fn is_service_error(&self) -> bool {
        !self.is_input_error()
    }

    /// The violations of an `InvalidMetricPoints` error; empty otherwise.
    pub fn violations(&self) -> &[Violation] {
        match self {
            SecurityMetricError::InvalidMetricPoints { violations, .. } => violations,
            _ => &[],
        }
    }

    /// Maps a gRPC status from `rpc` (e.g. `GetLatest`) at `address`
    /// (`host:port`): UNAVAILABLE is `ServiceUnavailable`, anything else
    /// `Service`. For custom fetchers that call the service themselves.
    pub fn from_status(rpc: &str, address: &str, status: &tonic::Status) -> Self {
        if status.code() == tonic::Code::Unavailable {
            SecurityMetricError::ServiceUnavailable {
                address: address.to_string(),
                details: status.message().to_string(),
                points_stored: 0,
            }
        } else {
            SecurityMetricError::Service {
                address: address.to_string(),
                rpc: rpc.to_string(),
                code: code_name(status.code()).to_string(),
                details: status.message().to_string(),
                points_stored: 0,
            }
        }
    }

    /// The same error, noting that `n` points of a write were stored before
    /// it failed. Only service errors carry the count.
    pub fn with_points_stored(self, n: usize) -> Self {
        match self {
            SecurityMetricError::ServiceUnavailable { address, details, .. } => {
                SecurityMetricError::ServiceUnavailable { address, details, points_stored: n }
            }
            SecurityMetricError::Service { address, rpc, code, details, .. } => {
                SecurityMetricError::Service { address, rpc, code, details, points_stored: n }
            }
            SecurityMetricError::InvalidResponse(message) if n > 0 => {
                SecurityMetricError::InvalidResponse(format!("{}; {} points already stored", message, n))
            }
            other => other,
        }
    }
}

impl fmt::Display for SecurityMetricError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SecurityMetricError::MissingSecurityId => {
                f.write_str("security has no UUID: cannot fetch its metrics")
            }
            SecurityMetricError::UnknownMetric(name) => write!(f, "unknown security metric: {}", name),
            SecurityMetricError::InvalidMetricPoints { metric, violations } => {
                let listed: Vec<String> = violations.iter().map(|v| v.to_string()).collect();
                write!(f, "invalid {} points: {}", metric, listed.join("; "))
            }
            SecurityMetricError::InvalidInput(message) => f.write_str(message),
            SecurityMetricError::InvalidAddress(e) => {
                write!(f, "SecurityMetric service address is malformed: {}", e)
            }
            SecurityMetricError::ServiceUnavailable { address, details, points_stored } => {
                write!(f, "SecurityMetric service unreachable at {} ({})", address, details)?;
                write_stored(f, *points_stored)
            }
            SecurityMetricError::Service { address, rpc, code, details, points_stored } => {
                write!(f, "SecurityMetric {} failed at {}: {} ({})", rpc, address, code, details)?;
                write_stored(f, *points_stored)
            }
            SecurityMetricError::InvalidResponse(message) => f.write_str(message),
        }
    }
}

fn write_stored(f: &mut fmt::Formatter<'_>, n: usize) -> fmt::Result {
    if n > 0 {
        write!(f, "; {} points already stored", n)?;
    }
    Ok(())
}

impl std::error::Error for SecurityMetricError {}

impl From<ServiceAddressError> for SecurityMetricError {
    fn from(e: ServiceAddressError) -> Self {
        SecurityMetricError::InvalidAddress(e)
    }
}

/// The gRPC name of `code`, e.g. `NOT_FOUND`.
pub fn code_name(code: tonic::Code) -> &'static str {
    use tonic::Code::*;
    match code {
        Ok => "OK",
        Cancelled => "CANCELLED",
        Unknown => "UNKNOWN",
        InvalidArgument => "INVALID_ARGUMENT",
        DeadlineExceeded => "DEADLINE_EXCEEDED",
        NotFound => "NOT_FOUND",
        AlreadyExists => "ALREADY_EXISTS",
        PermissionDenied => "PERMISSION_DENIED",
        ResourceExhausted => "RESOURCE_EXHAUSTED",
        FailedPrecondition => "FAILED_PRECONDITION",
        Aborted => "ABORTED",
        OutOfRange => "OUT_OF_RANGE",
        Unimplemented => "UNIMPLEMENTED",
        Internal => "INTERNAL",
        Unavailable => "UNAVAILABLE",
        DataLoss => "DATA_LOSS",
        Unauthenticated => "UNAUTHENTICATED",
    }
}

// ---------- the rules ----------

/// The metric, or `UnknownMetric` naming it when it is
/// UNKNOWN_SECURITY_METRIC or a number this library does not know.
pub fn check_metric(metric: impl Into<i32>) -> Result<SecurityMetricTypeProto, SecurityMetricError> {
    let raw: i32 = metric.into();
    match SecurityMetricTypeProto::from_i32(raw) {
        Some(SecurityMetricTypeProto::UnknownSecurityMetric) => Err(SecurityMetricError::UnknownMetric(
            SecurityMetricTypeProto::UnknownSecurityMetric.as_str_name().to_string(),
        )),
        Some(known) => Ok(known),
        None => Err(SecurityMetricError::UnknownMetric(raw.to_string())),
    }
}

/// GetLatest for `metric` of each of `uuids` (repeats dropped, first
/// position kept) on `on`, stamped.
pub fn build_get_latest(
    metric: SecurityMetricTypeProto,
    uuids: &[Uuid],
    on: NaiveDate,
) -> GetLatestSecurityMetricRequestProto {
    object_types::stamp_own(GetLatestSecurityMetricRequestProto {
        security_ids: dedupe(uuids).into_iter().map(uuid_proto).collect(),
        metrics: vec![metric.into()],
        date: Some(date_proto(on)),
        ..Default::default()
    })
}

/// Maps a GetLatest response to every requested UUID: its latest value, or
/// `None` when the response has no series for it or the series has no
/// point. Series are matched by `security_id`, never by position; series
/// for another metric or an unrequested security are ignored.
pub fn map_latest(
    response: &GetLatestSecurityMetricResponseProto,
    metric: SecurityMetricTypeProto,
    uuids: &[Uuid],
    on: NaiveDate,
) -> Result<HashMap<Uuid, Option<MetricResult>>, SecurityMetricError> {
    let mut out: HashMap<Uuid, Option<MetricResult>> = uuids.iter().map(|u| (*u, None)).collect();
    for series in &response.series {
        if series.metric != metric as i32 {
            continue;
        }
        let Some(uuid) = series_uuid(series, "GetLatest")? else { continue };
        let Some(slot) = out.get_mut(&uuid) else { continue };
        if let Some(last) = series.points.last() {
            let point = decode_point(last, "GetLatest")?;
            *slot = Some(MetricResult { value: point.value, date: point.date, on });
        }
    }
    Ok(out)
}

/// Search for `metric` of `uuid` from `from` to `to`, both inclusive,
/// stamped. `from` after `to` is `InvalidInput`.
pub fn build_search(
    metric: SecurityMetricTypeProto,
    uuid: Uuid,
    from: NaiveDate,
    to: NaiveDate,
) -> Result<SearchSecurityMetricRequestProto, SecurityMetricError> {
    if from > to {
        return Err(SecurityMetricError::InvalidInput(format!(
            "from date {} is after to date {}",
            from, to
        )));
    }
    Ok(object_types::stamp_own(SearchSecurityMetricRequestProto {
        security_id: Some(uuid_proto(uuid)),
        metrics: vec![metric.into()],
        start_date: Some(date_proto(from)),
        end_date: Some(date_proto(to)),
        ..Default::default()
    }))
}

/// Joins the points of consecutive Search messages. Dates must be strictly
/// ascending across the whole stream, else `InvalidResponse` naming the
/// offending date. No messages, or messages with no points, are an empty
/// series; gaps stay gaps.
pub fn merge_chunks(
    chunks: &[SearchSecurityMetricResponseProto],
    security_id: Uuid,
    metric: SecurityMetricTypeProto,
) -> Result<MetricSeries, SecurityMetricError> {
    let mut as_of = None;
    let mut points: Vec<MetricPoint> = Vec::new();
    for series in chunks.iter().filter_map(|c| c.series.as_ref()) {
        if as_of.is_none() {
            if let Some(ts) = series.as_of.as_ref() {
                as_of = Some(decode_timestamp(ts, "Search")?);
            }
        }
        for p in &series.points {
            let point = decode_point(p, "Search")?;
            if let Some(previous) = points.last() {
                if point.date <= previous.date {
                    return Err(SecurityMetricError::InvalidResponse(format!(
                        "Search returned {} after {}: dates must be strictly ascending",
                        point.date, previous.date
                    )));
                }
            }
            points.push(point);
        }
    }
    Ok(MetricSeries { security_id, metric, as_of, points })
}

/// Checks a write and returns its points ascending by date. Values of
/// SHARES_OUTSTANDING are whole numbers and come back at scale 0
/// (`15204137000.00` becomes `15204137000`). Every bad point is collected,
/// in input order, into one `InvalidMetricPoints`.
pub fn validate_record<V>(
    metric: SecurityMetricTypeProto,
    points: &[(NaiveDate, V)],
) -> Result<Vec<MetricPoint>, SecurityMetricError>
where
    V: Into<Option<Decimal>> + Clone,
{
    let metric = check_metric(metric)?;
    let mut violations = Vec::new();
    if points.is_empty() {
        violations.push(Violation { date: None, reason: "no points".to_string(), value: None });
    }
    let shares = metric == SecurityMetricTypeProto::SharesOutstanding;
    let mut seen = HashSet::new();
    let mut good = Vec::with_capacity(points.len());
    for (date, value) in points {
        let first = seen.insert(*date);
        let value: Option<Decimal> = value.clone().into();
        let reject = |reason: &str, value: Option<Decimal>| Violation {
            date: Some(*date),
            reason: reason.to_string(),
            value,
        };
        let Some(mut value) = value else {
            violations.push(reject("missing value", None));
            continue;
        };
        if shares {
            if !value.fract().is_zero() {
                violations.push(reject("fractional share count", Some(value)));
                continue;
            }
            value.rescale(0);
        }
        if !first {
            violations.push(reject("duplicate date", None));
            continue;
        }
        good.push(MetricPoint { date: *date, value });
    }
    if !violations.is_empty() {
        return Err(SecurityMetricError::InvalidMetricPoints {
            metric: metric.as_str_name().to_string(),
            violations,
        });
    }
    good.sort_by_key(|p| p.date);
    Ok(good)
}

/// Splits `points` into consecutive runs of at most `chunk_size` (at least
/// 1).
pub fn chunk_record(points: &[MetricPoint], chunk_size: usize) -> Vec<Vec<MetricPoint>> {
    points.chunks(chunk_size.max(1)).map(|c| c.to_vec()).collect()
}

/// CreateOrUpdate (operation CREATE) of one series holding `chunk`, with
/// the request and the series stamped.
pub fn build_create(
    metric: SecurityMetricTypeProto,
    uuid: Uuid,
    chunk: &[MetricPoint],
) -> CreateSecurityMetricRequestProto {
    let series = object_types::stamp_own(SecurityMetricSeriesProto {
        security_id: Some(uuid_proto(uuid)),
        metric: metric.into(),
        points: chunk
            .iter()
            .map(|p| SecurityMetricPointProto {
                observation_date: Some(date_proto(p.date)),
                value: Some(decimal::decimal_proto(&p.value)),
            })
            .collect(),
        ..Default::default()
    });
    object_types::stamp_own(CreateSecurityMetricRequestProto {
        operation_type: RequestOperationTypeProto::Create.into(),
        series: Some(series),
        ..Default::default()
    })
}

// ---------- helpers shared with the service ----------

pub(crate) fn uuid_proto(uuid: Uuid) -> UuidProto {
    UuidProto { raw_uuid: uuid.as_bytes().to_vec() }
}

pub(crate) fn date_proto(d: NaiveDate) -> LocalDateProto {
    LocalDateProto { year: d.year() as u32, month: d.month(), day: d.day() }
}

pub(crate) fn decode_timestamp(ts: &LocalTimestampProto, rpc: &str) -> Result<DateTime<Tz>, SecurityMetricError> {
    ProtoSerializationUtil::deserialize_timestamp(ts)
        .map_err(|e| SecurityMetricError::InvalidResponse(format!("{} returned an unreadable as_of: {}", rpc, e)))
}

fn dedupe(uuids: &[Uuid]) -> Vec<Uuid> {
    let mut seen = HashSet::new();
    uuids.iter().copied().filter(|u| seen.insert(*u)).collect()
}

fn series_uuid(series: &SecurityMetricSeriesProto, rpc: &str) -> Result<Option<Uuid>, SecurityMetricError> {
    match series.security_id.as_ref() {
        None => Ok(None),
        Some(id) => ProtoSerializationUtil::try_deserialize_uuid(id).map_err(|e| {
            SecurityMetricError::InvalidResponse(format!("{} returned an unreadable security_id: {}", rpc, e))
        }),
    }
}

fn decode_point(p: &SecurityMetricPointProto, rpc: &str) -> Result<MetricPoint, SecurityMetricError> {
    let date_proto = p.observation_date.as_ref().ok_or_else(|| {
        SecurityMetricError::InvalidResponse(format!("{} returned a point with no observation_date", rpc))
    })?;
    let date = ProtoSerializationUtil::deserialize_date(date_proto).map_err(|_| {
        SecurityMetricError::InvalidResponse(format!(
            "{} returned an invalid observation_date {}-{}-{}",
            rpc, date_proto.year, date_proto.month, date_proto.day
        ))
    })?;
    let value_proto = p.value.as_ref().ok_or_else(|| {
        SecurityMetricError::InvalidResponse(format!("{} returned a point on {} with no value", rpc, date))
    })?;
    let value = ProtoSerializationUtil::deserialize_decimal(value_proto).map_err(|e| {
        SecurityMetricError::InvalidResponse(format!("{} returned an unreadable value on {}: {}", rpc, date, e))
    })?;
    Ok(MetricPoint { date, value })
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    fn d(s: &str) -> NaiveDate {
        NaiveDate::parse_from_str(s, "%Y-%m-%d").unwrap()
    }

    #[test]
    fn age_days_counts_calendar_days() {
        let r = MetricResult { value: Decimal::ONE, date: d("2026-11-20"), on: d("2026-11-23") };
        assert_eq!(r.age_days(), 3);
    }

    #[test]
    fn check_metric_names_unknown_values() {
        let e = check_metric(SecurityMetricTypeProto::UnknownSecurityMetric).unwrap_err();
        assert_eq!(e.to_string(), "unknown security metric: UNKNOWN_SECURITY_METRIC");
        assert_eq!(check_metric(99).unwrap_err().to_string(), "unknown security metric: 99");
        assert_eq!(check_metric(1).unwrap(), SecurityMetricTypeProto::SharesOutstanding);
    }

    #[test]
    fn build_get_latest_dedupes_keeping_order() {
        let (a, b) = (Uuid::from_bytes([1; 16]), Uuid::from_bytes([2; 16]));
        let r = build_get_latest(SecurityMetricTypeProto::NavPerShare, &[b, a, b], d("2026-11-23"));
        assert_eq!(r.security_ids, vec![uuid_proto(b), uuid_proto(a)]);
        assert_eq!(r.metrics, vec![SecurityMetricTypeProto::NavPerShare as i32]);
        assert_eq!(r.date, Some(date_proto(d("2026-11-23"))));
        assert_eq!(object_types::read_type(&r), object_types::read_type(&object_types::stamp_own(r.clone())));
        assert!(r.version.is_some());
    }

    #[test]
    fn build_search_rejects_from_after_to() {
        let e = build_search(SecurityMetricTypeProto::NavPerShare, Uuid::nil(), d("2026-11-20"), d("2026-11-19"))
            .unwrap_err();
        assert!(e.is_input_error());
        assert_eq!(e.to_string(), "from date 2026-11-20 is after to date 2026-11-19");
    }

    #[test]
    fn invalid_points_message_lists_every_violation() {
        let points = [(d("2026-11-18"), Some(Decimal::new(15, 1))), (d("2026-11-19"), Some(Decimal::ONE)), (d("2026-11-19"), Some(Decimal::TWO))];
        let e = validate_record(SecurityMetricTypeProto::SharesOutstanding, &points).unwrap_err();
        assert_eq!(
            e.to_string(),
            "invalid SHARES_OUTSTANDING points: 2026-11-18: fractional share count (1.5); 2026-11-19: duplicate date"
        );
    }

    #[test]
    fn service_errors_name_the_address_and_code() {
        let e = SecurityMetricError::from_status("GetLatest", "127.0.0.1:8083", &tonic::Status::not_found("no such security"));
        assert_eq!(e.to_string(), "SecurityMetric GetLatest failed at 127.0.0.1:8083: NOT_FOUND (no such security)");
        let e = SecurityMetricError::from_status("Search", "127.0.0.1:8083", &tonic::Status::unavailable("down"));
        assert_eq!(e.to_string(), "SecurityMetric service unreachable at 127.0.0.1:8083 (down)");
        assert!(e.with_points_stored(5000).to_string().ends_with("; 5000 points already stored"));
    }

    #[test]
    fn chunk_size_zero_does_not_panic() {
        let p = [MetricPoint { date: d("2026-11-20"), value: Decimal::ONE }];
        assert_eq!(chunk_record(&p, 0).len(), 1);
    }
}
