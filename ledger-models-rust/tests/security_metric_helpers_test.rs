//! LM-482 — `SecurityWrapper::get_security_metric` and
//! `get_security_metric_series` read only from the installed
//! SecurityMetricFetcher, with a fake one here.
//!
//! The fetcher slot is process-wide and cargo runs tests on parallel
//! threads, so every test holds `SLOT` while it installs or clears it.

use std::sync::{Arc, Mutex, MutexGuard};

use chrono::NaiveDate;
use ledger_models::fintekkers::models::security::SecurityMetricTypeProto;
use ledger_models::fintekkers::wrappers::models::security::{
    clear_security_fetcher, link_of_latest, set_security_fetcher, SecurityWrapper,
};
use ledger_models::fintekkers::wrappers::models::security_metric::{
    clear_security_metric_fetcher, set_security_metric_fetcher, SecurityMetricError, SecurityMetricFetcher,
    SecurityMetricObservation,
};
use ledger_models::fintekkers::wrappers::util::link_resolver::LinkResolverError;
use rust_decimal::Decimal;
use uuid::Uuid;

static SLOT: Mutex<()> = Mutex::new(());

fn lock() -> MutexGuard<'static, ()> {
    SLOT.lock().unwrap_or_else(|e| e.into_inner())
}

#[derive(Clone, Debug, PartialEq)]
enum Call {
    Latest(Uuid, SecurityMetricTypeProto, NaiveDate),
    Series(Uuid, SecurityMetricTypeProto, NaiveDate, NaiveDate),
}

/// Returns canned observations and records each call's arguments.
struct FakeFetcher {
    latest: Option<SecurityMetricObservation>,
    series: Vec<SecurityMetricObservation>,
    calls: Mutex<Vec<Call>>,
}

impl FakeFetcher {
    fn new(latest: Option<SecurityMetricObservation>, series: Vec<SecurityMetricObservation>) -> Arc<Self> {
        Arc::new(FakeFetcher { latest, series, calls: Mutex::new(vec![]) })
    }

    fn calls(&self) -> Vec<Call> {
        self.calls.lock().unwrap().clone()
    }
}

impl SecurityMetricFetcher for FakeFetcher {
    fn latest(
        &self,
        security_id: Uuid,
        metric: SecurityMetricTypeProto,
        date: NaiveDate,
    ) -> Result<Option<SecurityMetricObservation>, SecurityMetricError> {
        self.calls.lock().unwrap().push(Call::Latest(security_id, metric, date));
        Ok(self.latest.clone())
    }

    fn series(
        &self,
        security_id: Uuid,
        metric: SecurityMetricTypeProto,
        from: NaiveDate,
        to: NaiveDate,
    ) -> Result<Vec<SecurityMetricObservation>, SecurityMetricError> {
        self.calls.lock().unwrap().push(Call::Series(security_id, metric, from, to));
        Ok(self.series.clone())
    }
}

fn day(year: i32, month: u32, day: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(year, month, day).unwrap()
}

fn observation(value: &str, date: NaiveDate) -> SecurityMetricObservation {
    SecurityMetricObservation { value: value.parse::<Decimal>().unwrap(), observation_date: date }
}

/// A link-only security: uuid set, nothing else.
fn link_security() -> (Uuid, SecurityWrapper) {
    let id = Uuid::new_v4();
    (id, SecurityWrapper::new(link_of_latest(id)))
}

#[test]
fn a_hit_returns_the_fetchers_value_and_observation_date() {
    let _guard = lock();
    let fake = FakeFetcher::new(Some(observation("1003282116", day(2024, 5, 31))), vec![]);
    set_security_metric_fetcher(fake.clone());
    let (id, security) = link_security();

    let got = security.get_security_metric(SecurityMetricTypeProto::SharesOutstanding, day(2024, 6, 3));

    clear_security_metric_fetcher();
    // The observation's own date, not the date asked for.
    assert_eq!(got, Ok(Some(observation("1003282116", day(2024, 5, 31)))));
    assert_eq!(fake.calls(), vec![Call::Latest(id, SecurityMetricTypeProto::SharesOutstanding, day(2024, 6, 3))]);
}

#[test]
fn a_miss_returns_none_never_zero() {
    let _guard = lock();
    set_security_metric_fetcher(FakeFetcher::new(None, vec![]));
    let (_, security) = link_security();

    let got = security.get_security_metric(SecurityMetricTypeProto::NavPerShare, day(2024, 6, 3));

    clear_security_metric_fetcher();
    assert_eq!(got, Ok(None));
}

#[test]
fn a_real_zero_is_returned_as_zero() {
    let _guard = lock();
    set_security_metric_fetcher(FakeFetcher::new(Some(observation("0", day(2024, 5, 31))), vec![]));
    let (_, security) = link_security();

    let got = security.get_security_metric(SecurityMetricTypeProto::TotalNetAssets, day(2024, 6, 3));

    clear_security_metric_fetcher();
    assert_eq!(got, Ok(Some(observation("0", day(2024, 5, 31)))));
}

#[test]
fn the_series_comes_back_in_date_order_from_shuffled_input() {
    let _guard = lock();
    let fake = FakeFetcher::new(
        None,
        vec![
            observation("3", day(2024, 1, 4)),
            observation("1", day(2024, 1, 2)),
            observation("2", day(2024, 1, 3)),
        ],
    );
    set_security_metric_fetcher(fake.clone());
    let (id, security) = link_security();

    let got = security.get_security_metric_series(SecurityMetricTypeProto::NavPerShare, day(2024, 1, 1), day(2024, 1, 31));

    clear_security_metric_fetcher();
    assert_eq!(
        got,
        Ok(vec![
            observation("1", day(2024, 1, 2)),
            observation("2", day(2024, 1, 3)),
            observation("3", day(2024, 1, 4)),
        ])
    );
    assert_eq!(
        fake.calls(),
        vec![Call::Series(id, SecurityMetricTypeProto::NavPerShare, day(2024, 1, 1), day(2024, 1, 31))]
    );
}

#[test]
fn with_no_fetcher_both_helpers_name_the_missing_fetcher_and_clear_restores_it() {
    let _guard = lock();
    let (_, security) = link_security();
    let check = |security: &SecurityWrapper| {
        let latest = security.get_security_metric(SecurityMetricTypeProto::SharesOutstanding, day(2024, 6, 3));
        let series =
            security.get_security_metric_series(SecurityMetricTypeProto::SharesOutstanding, day(2024, 1, 1), day(2024, 6, 3));
        for err in [latest.unwrap_err(), series.unwrap_err()] {
            assert!(matches!(err, SecurityMetricError::NoFetcher), "{err:?}");
            let message = err.to_string();
            assert!(message.contains("SecurityMetricFetcher"), "{message}");
            assert!(message.contains("set_security_metric_fetcher"), "{message}");
        }
    };

    clear_security_metric_fetcher();
    check(&security);

    set_security_metric_fetcher(FakeFetcher::new(None, vec![]));
    assert_eq!(security.get_security_metric(SecurityMetricTypeProto::SharesOutstanding, day(2024, 6, 3)), Ok(None));
    clear_security_metric_fetcher();
    check(&security);
}

#[test]
fn a_link_only_security_never_calls_the_link_fetcher() {
    let _guard = lock();
    set_security_fetcher(Arc::new(|uuid, _as_of| -> Result<_, LinkResolverError> {
        panic!("the link fetcher was called for {uuid}");
    }));
    let fake = FakeFetcher::new(Some(observation("512.3456", day(2024, 5, 31))), vec![observation("1", day(2024, 1, 2))]);
    set_security_metric_fetcher(fake);
    let (_, security) = link_security();

    let latest = security.get_security_metric(SecurityMetricTypeProto::NavPerShare, day(2024, 6, 3));
    let series = security.get_security_metric_series(SecurityMetricTypeProto::NavPerShare, day(2024, 1, 1), day(2024, 6, 3));

    clear_security_metric_fetcher();
    clear_security_fetcher();
    assert_eq!(latest, Ok(Some(observation("512.3456", day(2024, 5, 31)))));
    assert_eq!(series, Ok(vec![observation("1", day(2024, 1, 2))]));
}

#[test]
fn a_series_with_from_after_to_is_an_invalid_range() {
    let _guard = lock();
    let fake = FakeFetcher::new(None, vec![]);
    set_security_metric_fetcher(fake.clone());
    let (_, security) = link_security();

    let got = security.get_security_metric_series(SecurityMetricTypeProto::NavPerShare, day(2024, 2, 1), day(2024, 1, 1));

    clear_security_metric_fetcher();
    assert_eq!(got, Err(SecurityMetricError::InvalidRange { from: day(2024, 2, 1), to: day(2024, 1, 1) }));
    assert!(fake.calls().is_empty());
}
