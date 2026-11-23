//! Dated security metrics (LM-482): shares outstanding, NAV per share and
//! total net assets, read through an installed [`SecurityMetricFetcher`].
//!
//! `SecurityWrapper::get_security_metric` and
//! `SecurityWrapper::get_security_metric_series` call the installed fetcher
//! only; they make no network call of their own. There is no default fetcher:
//! with none installed they return [`SecurityMetricError::NoFetcher`]. The
//! fetcher is sync, like `SecurityFetchFn`; an async caller (a tonic client)
//! bridges with its own runtime inside the fetcher. See
//! docs/adr/security_metric.md.

use std::fmt;
use std::sync::{Arc, OnceLock, RwLock};

use chrono::NaiveDate;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::fintekkers::models::security::SecurityMetricTypeProto;

/// One observation: the value and the date it is for. The date is the
/// observation's own, which may be earlier than the date asked for. There is
/// no observation for an unknown value: absent is never 0.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SecurityMetricObservation {
    pub value: Decimal,
    pub observation_date: NaiveDate,
}

/// Why a metric read failed.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SecurityMetricError {
    /// No fetcher is installed: call [`set_security_metric_fetcher`].
    NoFetcher,
    /// The series range's `from` is after its `to`.
    InvalidRange { from: NaiveDate, to: NaiveDate },
    /// The security has no id to look the metric up by.
    NoSecurityId,
    /// The fetcher failed.
    Fetcher(String),
}

impl fmt::Display for SecurityMetricError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SecurityMetricError::NoFetcher => write!(
                f,
                "No SecurityMetricFetcher installed: call set_security_metric_fetcher(...)"
            ),
            SecurityMetricError::InvalidRange { from, to } => {
                write!(f, "security metric series: from {from} is after to {to}")
            }
            SecurityMetricError::NoSecurityId => write!(f, "security metric: the security has no uuid"),
            SecurityMetricError::Fetcher(message) => write!(f, "SecurityMetricFetcher failed: {message}"),
        }
    }
}

impl std::error::Error for SecurityMetricError {}

/// Where the metric helpers read observations from. Production wires an
/// adapter over the SecurityMetric gRPC service; tests install a fake.
pub trait SecurityMetricFetcher: Send + Sync {
    /// The observation with the latest observation_date on or before `date`,
    /// or None when there is none.
    fn latest(
        &self,
        security_id: Uuid,
        metric: SecurityMetricTypeProto,
        date: NaiveDate,
    ) -> Result<Option<SecurityMetricObservation>, SecurityMetricError>;

    /// The observations with observation_date in `[from, to]`, inclusive.
    fn series(
        &self,
        security_id: Uuid,
        metric: SecurityMetricTypeProto,
        from: NaiveDate,
        to: NaiveDate,
    ) -> Result<Vec<SecurityMetricObservation>, SecurityMetricError>;
}

static SECURITY_METRIC_FETCHER: OnceLock<RwLock<Option<Arc<dyn SecurityMetricFetcher>>>> = OnceLock::new();

fn security_metric_fetcher_slot() -> &'static RwLock<Option<Arc<dyn SecurityMetricFetcher>>> {
    SECURITY_METRIC_FETCHER.get_or_init(|| RwLock::new(None))
}

/// Install the fetcher the metric helpers read from. Process-wide.
pub fn set_security_metric_fetcher(fetcher: Arc<dyn SecurityMetricFetcher>) {
    *security_metric_fetcher_slot().write().unwrap_or_else(|e| e.into_inner()) = Some(fetcher);
}

/// Remove the installed fetcher; the helpers return `NoFetcher` again.
pub fn clear_security_metric_fetcher() {
    *security_metric_fetcher_slot().write().unwrap_or_else(|e| e.into_inner()) = None;
}

/// The installed fetcher, or `NoFetcher`. Never builds a default.
pub(crate) fn security_metric_fetcher() -> Result<Arc<dyn SecurityMetricFetcher>, SecurityMetricError> {
    security_metric_fetcher_slot()
        .read()
        .unwrap_or_else(|e| e.into_inner())
        .clone()
        .ok_or(SecurityMetricError::NoFetcher)
}

/// The fetcher's latest observation on or before `date`.
pub(crate) fn latest(
    security_id: Uuid,
    metric: SecurityMetricTypeProto,
    date: NaiveDate,
) -> Result<Option<SecurityMetricObservation>, SecurityMetricError> {
    security_metric_fetcher()?.latest(security_id, metric, date)
}

/// The fetcher's observations in `[from, to]`, sorted by observation_date.
pub(crate) fn series(
    security_id: Uuid,
    metric: SecurityMetricTypeProto,
    from: NaiveDate,
    to: NaiveDate,
) -> Result<Vec<SecurityMetricObservation>, SecurityMetricError> {
    let fetcher = security_metric_fetcher()?;
    if from > to {
        return Err(SecurityMetricError::InvalidRange { from, to });
    }
    let mut observations = fetcher.series(security_id, metric, from, to)?;
    observations.sort_by_key(|o| o.observation_date);
    Ok(observations)
}
