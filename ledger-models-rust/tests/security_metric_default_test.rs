//! LM-485: `SecurityWrapper::get_metric` and its shortcuts with no service
//! passed, i.e. through `SecurityMetricService::default_instance`.
//!
//! The default instance is process-wide, so this binary holds a single test:
//! nothing else can run in parallel with it and see its fetcher or env.

#[path = "common/security_metric_fake.rs"]
mod security_metric_fake;

use std::sync::Arc;
use std::time::Duration;

use ledger_models::fintekkers::models::security::SecurityMetricTypeProto::SharesOutstanding;
use ledger_models::fintekkers::wrappers::models::security::{link_of_latest, SecurityWrapper};
use ledger_models::fintekkers::wrappers::services::security_metric::{
    GrpcSecurityMetricFetcher, SecurityMetricService,
};
use ledger_models::fintekkers::wrappers::util::service_address::{resolve_with, Service};
use security_metric_fake::{d, dec, FakeServer, SPY};
use uuid::Uuid;

#[tokio::test]
async fn get_metric_and_shortcuts_use_the_default_instance() {
    let fake = FakeServer::start().await;
    let spy = SecurityWrapper::new(link_of_latest(SPY));
    let monday = Some(d("2026-11-23"));

    // 1. A fetcher installed with set_default_fetcher.
    let address = resolve_with(Service::Price, fake.env()).expect("address resolves");
    SecurityMetricService::set_default_fetcher(Some(Arc::new(GrpcSecurityMetricFetcher::new(
        address,
        Duration::from_secs(5),
    ))));
    assert!(SecurityMetricService::default_instance().unwrap().address().is_none(), "the installed fetcher");

    let got = spy.get_metric(SharesOutstanding, monday).await.unwrap().expect("a value");
    let short = spy.shares_outstanding(monday).await.unwrap().expect("a value");
    assert_eq!(fake.get_latest_calls(), 2);
    assert_eq!(got, short);
    assert_eq!(got.value, dec("15210000000"));
    assert_eq!(got.date, d("2026-11-20"), "Monday gives Friday's point");
    assert_eq!(got.age_days(), 3);

    let history = spy.shares_outstanding_history(d("2026-11-01"), Some(d("2026-11-30"))).await.unwrap();
    assert_eq!(fake.search_calls(), 1);
    assert_eq!(
        history.points.iter().map(|p| (p.date, p.value)).collect::<Vec<_>>(),
        vec![(d("2026-11-19"), dec("15204137000")), (d("2026-11-20"), dec("15210000000"))]
    );
    let unknown = SecurityWrapper::new(link_of_latest(Uuid::from_bytes([0x99; 16])));
    assert_eq!(unknown.shares_outstanding(monday).await.unwrap(), None, "absent, never 0");

    // 2. Reset: the next use builds the instance from the process env (the
    // only test in this binary, so setting the env here is safe).
    SecurityMetricService::set_default_fetcher(None);
    std::env::remove_var("BROKER_HOST");
    std::env::set_var("PRICE_SERVICE_HOST", "127.0.0.1");
    std::env::set_var("PRICE_SERVICE_PORT", fake.port.to_string());
    let from_env = spy.get_metric(SharesOutstanding, monday).await.unwrap().expect("a value");
    assert_eq!(from_env, got);
    assert_eq!(fake.get_latest_calls(), 4);
    let instance = SecurityMetricService::default_instance().unwrap();
    assert_eq!(instance.address().map(|a| (a.host.as_str(), a.port)), Some(("127.0.0.1", fake.port)));

    SecurityMetricService::set_default_fetcher(None);
    fake.stop();
}
