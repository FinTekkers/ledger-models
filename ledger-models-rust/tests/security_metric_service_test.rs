//! LM-485: SecurityMetricService and the SecurityWrapper metric accessors
//! through the real tonic client against an in-memory fake server
//! (tests/common/security_metric_fake.rs).
//!
//! Each test builds its own service from an injected env
//! (PRICE_SERVICE_HOST=127.0.0.1, PRICE_SERVICE_PORT=<fake port>). No test
//! touches the process-wide default: tests run in parallel threads.

#[path = "common/security_metric_fake.rs"]
mod security_metric_fake;

use std::sync::{Arc, Mutex};
use std::time::Duration;

use async_trait::async_trait;
use chrono::{TimeZone, Utc};
use ledger_models::fintekkers::models::security::{SecurityMetricTypeProto, SecurityProto};
use ledger_models::fintekkers::requests::security_metric::{
    CreateSecurityMetricRequestProto, CreateSecurityMetricResponseProto, GetLatestSecurityMetricRequestProto,
    GetLatestSecurityMetricResponseProto, SearchSecurityMetricRequestProto, SearchSecurityMetricResponseProto,
};
use ledger_models::fintekkers::wrappers::models::security::{link_of_latest, SecurityWrapper};
use ledger_models::fintekkers::wrappers::models::security_metric::{SecurityMetricError, RECORD_CHUNK_SIZE};
use ledger_models::fintekkers::wrappers::models::utils::decimal::decode_decimal;
use ledger_models::fintekkers::wrappers::services::security_metric::{SecurityMetricFetcher, SecurityMetricService};
use num_bigint::BigInt;
use rust_decimal::Decimal;
use security_metric_fake::{closed_port, d, date_of, dec, price_env, uuid_of, FakeServer, BASE_AS_OF_SECONDS, SPY};
use uuid::Uuid;

use SecurityMetricTypeProto::{NavPerShare, SharesOutstanding, TotalNetAssets};

const QQQ: Uuid = Uuid::from_bytes([0x11; 16]);
const UNKNOWN: Uuid = Uuid::from_bytes([0x99; 16]);

fn service_for(fake: &FakeServer) -> SecurityMetricService {
    SecurityMetricService::from_env_with(fake.env()).expect("address resolves")
}

fn security(uuid: Uuid) -> SecurityWrapper {
    // A link-mode security: the UUID is enough, it is never hydrated.
    SecurityWrapper::new(link_of_latest(uuid))
}

// 1. Default-fetcher journey: the env-built service, through the wrapper.
#[tokio::test]
async fn get_metric_and_shortcut_go_through_the_real_client() {
    let fake = FakeServer::start().await;
    let service = service_for(&fake);
    assert_eq!(service.address().map(|a| (a.host.as_str(), a.port)), Some(("127.0.0.1", fake.port)));
    let spy = security(SPY);
    let on = Some(d("2026-11-23"));

    let got = spy.get_metric_with(&service, SharesOutstanding, on).await.unwrap().expect("a value");
    assert_eq!(fake.get_latest_calls(), 1);
    let short = spy.metrics_with(&service).shares_outstanding(on).await.unwrap().expect("a value");
    assert_eq!(fake.get_latest_calls(), 2);

    assert_eq!(got, short);
    assert_eq!(got.value, dec("15210000000"));
    assert_eq!(got.date, d("2026-11-20"));
    assert_eq!(got.on, d("2026-11-23"));
    assert_eq!(got.age_days(), 3);
    let request = fake.last_get_latest();
    assert_eq!(request.security_ids.iter().map(uuid_of).collect::<Vec<_>>(), vec![SPY]);
    assert_eq!(request.metrics, vec![SharesOutstanding as i32]);
    fake.stop();
}

// 2. Omitted `on`: the date the fake recorded, never "today" computed here.
#[tokio::test]
async fn omitted_on_uses_the_date_sent_on_the_wire() {
    let fake = FakeServer::start().await;
    let old = Uuid::from_bytes([0x22; 16]);
    fake.seed(old, NavPerShare, &[("2001-01-02", "10.50")]);
    let service = service_for(&fake);

    let got = security(old).metrics_with(&service).nav_per_share(None).await.unwrap().expect("a value");
    let recorded = date_of(fake.last_get_latest().date.as_ref().expect("date sent"));
    assert_eq!(got.on, recorded);
    assert_eq!(got.age_days(), (recorded - got.date).num_days());
    assert_eq!(got.value.to_string(), "10.50");
    fake.stop();
}

// 3. History: 5 points with a gap, sent as 3 chunks (2 + 2 + 1).
#[tokio::test]
async fn history_joins_chunks_ascending_and_keeps_the_gap() {
    let fake = FakeServer::start().await;
    let fund = Uuid::from_bytes([0x33; 16]);
    let seeded = [
        ("2026-11-16", "100.1"),
        ("2026-11-17", "100.2"),
        ("2026-11-18", "100.3"),
        ("2026-11-20", "100.5"),
        ("2026-11-23", "100.8"),
    ];
    fake.seed(fund, NavPerShare, &seeded);
    let service = service_for(&fake);

    let series = security(fund)
        .metrics_with(&service)
        .nav_per_share_history(d("2026-11-01"), Some(d("2026-11-30")))
        .await
        .unwrap();
    assert_eq!(fake.search_calls(), 1);
    assert_eq!(fake.state.lock().unwrap().search_messages, vec![3], "2 + 2 + 1 points");

    let want: Vec<_> = seeded.iter().map(|(day, v)| (d(day), dec(v))).collect();
    let have: Vec<_> = series.points.iter().map(|p| (p.date, p.value)).collect();
    assert_eq!(have, want, "ascending, 11-19 and 11-21/22 stay gaps");
    assert_eq!(series.latest().map(|p| (p.date, p.value)), Some((d("2026-11-23"), dec("100.8"))));
    assert_eq!(series.to_dict(), want.iter().copied().collect());
    assert_eq!(series.security_id, fund);
    assert_eq!(series.metric, NavPerShare);
    assert_eq!(
        series.as_of.map(|t| t.with_timezone(&Utc)),
        Some(Utc.timestamp_opt(BASE_AS_OF_SECONDS, 0).unwrap())
    );
    assert!(!series.to_dict().contains_key(&d("2026-11-19")), "a gap is never filled");

    // Through get_metric_history_with too, and an empty range is empty.
    let empty = security(fund)
        .get_metric_history_with(&service, NavPerShare, d("2020-01-01"), Some(d("2020-12-31")))
        .await
        .unwrap();
    assert!(empty.points.is_empty());
    assert!(empty.latest().is_none());
    fake.stop();
}

// 4. Batch get: reversed reply, unknown omitted; one call, each on its UUID.
#[tokio::test]
async fn batch_get_matches_by_uuid_and_keeps_unknown_as_none() {
    let fake = FakeServer::start().await;
    fake.seed(QQQ, SharesOutstanding, &[("2026-11-18", "566150000")]);
    let service = service_for(&fake);

    let got = service.get(SharesOutstanding, &[SPY, QQQ, UNKNOWN], Some(d("2026-11-23"))).await.unwrap();
    assert_eq!(fake.get_latest_calls(), 1);
    assert_eq!(got.len(), 3);
    assert_eq!(got[&SPY].as_ref().map(|r| r.value), Some(dec("15210000000")));
    assert_eq!(got[&QQQ].as_ref().map(|r| (r.value, r.date)), Some((dec("566150000"), d("2026-11-18"))));
    assert!(got.contains_key(&UNKNOWN));
    assert!(got[&UNKNOWN].is_none());

    // No UUIDs: no call.
    assert!(service.get(SharesOutstanding, &[], None).await.unwrap().is_empty());
    assert_eq!(fake.get_latest_calls(), 1);
    fake.stop();
}

// 5. record: exact wire decimal, native dates, chunking, last as_of.
#[tokio::test]
async fn record_sends_exact_values_in_chunks_and_returns_the_last_as_of() {
    let fake = FakeServer::start().await;
    let service = service_for(&fake);
    let fund = Uuid::from_bytes([0x44; 16]);

    let as_of = service.record(SharesOutstanding, fund, &[(d("2026-11-20"), dec("15204137000"))]).await.unwrap();
    {
        let state = fake.state.lock().unwrap();
        assert_eq!(state.create_requests.len(), 1);
        let series = state.create_requests[0].series.as_ref().unwrap();
        let point = &series.points[0];
        assert_eq!(date_of(point.observation_date.as_ref().unwrap()), d("2026-11-20"));
        let value = decode_decimal(point.value.as_ref().unwrap()).unwrap();
        assert_eq!(value.unscaled, BigInt::from(15_204_137_000_i64));
        assert_eq!(value.scale, 0);
        assert_eq!(as_of.with_timezone(&Utc), Utc.timestamp_opt(BASE_AS_OF_SECONDS + 1, 0).unwrap());
    }

    let start = d("2000-01-01");
    let many: Vec<_> = (0..=RECORD_CHUNK_SIZE as i64)
        .map(|i| (start + chrono::Duration::days(i), Decimal::from(1_000 + i)))
        .collect();
    let as_of = service.record(SharesOutstanding, fund, &many).await.unwrap();
    let state = fake.state.lock().unwrap();
    assert_eq!(state.create_requests.len(), 3, "1 earlier + 2 chunks");
    let chunks = &state.create_requests[1..];
    let mut sent = vec![];
    for request in chunks {
        let series = request.series.as_ref().unwrap();
        assert_eq!(uuid_of(series.security_id.as_ref().unwrap()), fund);
        assert_eq!(series.metric, SharesOutstanding as i32);
        for p in &series.points {
            let value = decode_decimal(p.value.as_ref().unwrap()).unwrap().to_rust_decimal().unwrap();
            sent.push((date_of(p.observation_date.as_ref().unwrap()), value));
        }
    }
    assert_eq!(chunks[0].series.as_ref().unwrap().points.len(), RECORD_CHUNK_SIZE);
    assert_eq!(chunks[1].series.as_ref().unwrap().points.len(), 1);
    assert_eq!(sent, many, "every point once, ascending");
    let last = state.create_responses.last().unwrap().series.as_ref().unwrap().as_of.clone().unwrap();
    assert_eq!(as_of.timestamp(), last.timestamp.unwrap().seconds);
    assert_eq!(as_of.with_timezone(&Utc), Utc.timestamp_opt(BASE_AS_OF_SECONDS + 3, 0).unwrap());
}

// 6. Fractional shares and duplicate dates: rejected, nothing sent.
#[tokio::test]
async fn invalid_points_are_rejected_before_any_call() {
    let fake = FakeServer::start().await;
    let service = service_for(&fake);

    let e = service.record(SharesOutstanding, SPY, &[(d("2026-11-20"), dec("1.5"))]).await.unwrap_err();
    assert!(matches!(e, SecurityMetricError::InvalidMetricPoints { .. }), "{e:?}");
    assert_eq!(e.violations()[0].reason, "fractional share count");

    let e = service
        .record(NavPerShare, SPY, &[(d("2026-11-20"), dec("512.34")), (d("2026-11-20"), dec("512.35"))])
        .await
        .unwrap_err();
    assert_eq!(e.violations().len(), 1);
    assert_eq!(e.violations()[0].reason, "duplicate date");
    assert_eq!(e.violations()[0].date, Some(d("2026-11-20")));
    assert!(e.to_string().contains("2026-11-20: duplicate date"), "{e}");

    let missing: [(chrono::NaiveDate, Option<Decimal>); 1] = [(d("2026-11-20"), None)];
    let e = service.record(TotalNetAssets, SPY, &missing).await.unwrap_err();
    assert_eq!(e.violations()[0].reason, "missing value");

    assert_eq!(fake.create_calls(), 0);
    fake.stop();
}

// 7. Unreachable through the entry point: names 127.0.0.1:<port>.
#[tokio::test]
async fn closed_port_is_service_unavailable_naming_the_address() {
    let port = closed_port();
    let service = SecurityMetricService::from_env_with(price_env(port)).unwrap().with_timeout(Duration::from_secs(5));
    let e = security(SPY).get_metric_with(&service, SharesOutstanding, Some(d("2026-11-23"))).await.unwrap_err();
    assert!(matches!(e, SecurityMetricError::ServiceUnavailable { .. }), "{e:?}");
    assert!(e.is_service_error());
    assert!(e.to_string().contains(&format!("127.0.0.1:{port}")), "{e}");
    assert!(e.to_string().starts_with("SecurityMetric service unreachable at"), "{e}");
}

// 9. Absent through the real stack: None, never 0.
#[tokio::test]
async fn no_point_on_or_before_on_is_none_not_zero() {
    let fake = FakeServer::start().await;
    let service = service_for(&fake);
    let early = Some(d("2026-11-01"));

    let spy = security(SPY);
    assert_eq!(spy.get_metric_with(&service, SharesOutstanding, early).await.unwrap(), None);
    assert_eq!(spy.metrics_with(&service).shares_outstanding(early).await.unwrap(), None);
    let unknown = security(UNKNOWN);
    assert_eq!(unknown.get_metric_with(&service, NavPerShare, early).await.unwrap(), None);
    assert_eq!(unknown.metrics_with(&service).total_net_assets(early).await.unwrap(), None);
    assert_eq!(fake.get_latest_calls(), 4);

    // A stored 0 is a real 0.
    fake.seed(UNKNOWN, NavPerShare, &[("2026-10-30", "0")]);
    let zero = unknown.get_metric_with(&service, NavPerShare, early).await.unwrap().expect("a stored zero");
    assert_eq!(zero.value, Decimal::ZERO);
    fake.stop();
}

// 10. MissingSecurityId and UnknownMetric name the problem; nothing sent.
#[tokio::test]
async fn missing_uuid_and_unknown_metric_name_the_problem() {
    let fake = FakeServer::start().await;
    let service = service_for(&fake);

    let no_uuid = SecurityWrapper::new(SecurityProto::default());
    let e = no_uuid.get_metric_with(&service, SharesOutstanding, None).await.unwrap_err();
    assert_eq!(e, SecurityMetricError::MissingSecurityId);
    assert_eq!(e.to_string(), "security has no UUID: cannot fetch its metrics");
    let e = no_uuid.metrics_with(&service).nav_per_share_history(d("2026-11-01"), None).await.unwrap_err();
    assert_eq!(e, SecurityMetricError::MissingSecurityId);
    // The default-instance entry point checks the UUID before anything else.
    assert_eq!(no_uuid.get_metric(SharesOutstanding, None).await.unwrap_err(), SecurityMetricError::MissingSecurityId);

    let e = security(SPY).get_metric_with(&service, SecurityMetricTypeProto::UnknownSecurityMetric, None).await.unwrap_err();
    assert!(matches!(e, SecurityMetricError::UnknownMetric(_)), "{e:?}");
    assert!(e.to_string().contains("UNKNOWN_SECURITY_METRIC"), "{e}");
    let e = service.get_history(SecurityMetricTypeProto::UnknownSecurityMetric, SPY, d("2026-11-01"), None).await.unwrap_err();
    assert!(e.to_string().contains("UNKNOWN_SECURITY_METRIC"), "{e}");
    let e = service
        .record(SecurityMetricTypeProto::UnknownSecurityMetric, SPY, &[(d("2026-11-20"), Decimal::ONE)])
        .await
        .unwrap_err();
    assert!(e.to_string().contains("UNKNOWN_SECURITY_METRIC"), "{e}");

    let e = service.get_history(NavPerShare, SPY, d("2026-11-20"), Some(d("2026-11-19"))).await.unwrap_err();
    assert_eq!(e.to_string(), "from date 2026-11-20 is after to date 2026-11-19");

    assert_eq!((fake.get_latest_calls(), fake.search_calls(), fake.create_calls()), (0, 0, 0));
    fake.stop();
}

// A later record chunk failing says how many points were already stored.
struct FailSecondCreate {
    calls: Mutex<usize>,
}

#[async_trait]
impl SecurityMetricFetcher for FailSecondCreate {
    async fn get_latest(
        &self,
        _: GetLatestSecurityMetricRequestProto,
    ) -> Result<GetLatestSecurityMetricResponseProto, SecurityMetricError> {
        Ok(Default::default())
    }

    async fn search(
        &self,
        _: SearchSecurityMetricRequestProto,
    ) -> Result<Vec<SearchSecurityMetricResponseProto>, SecurityMetricError> {
        Ok(vec![])
    }

    async fn create_or_update(
        &self,
        request: CreateSecurityMetricRequestProto,
    ) -> Result<CreateSecurityMetricResponseProto, SecurityMetricError> {
        let mut calls = self.calls.lock().unwrap();
        *calls += 1;
        if *calls == 2 {
            return Err(SecurityMetricError::from_status(
                "CreateOrUpdate",
                "127.0.0.1:8083",
                &tonic::Status::not_found("security does not exist"),
            ));
        }
        let mut header = request.series.unwrap();
        header.points.clear();
        header.as_of = Some(ledger_models::fintekkers::models::util::LocalTimestampProto {
            timestamp: Some(prost_types::Timestamp { seconds: BASE_AS_OF_SECONDS, nanos: 0 }),
            time_zone: "UTC".to_string(),
        });
        Ok(CreateSecurityMetricResponseProto { series: Some(header), ..Default::default() })
    }
}

#[tokio::test]
async fn a_failed_later_chunk_names_the_points_already_stored() {
    let service = SecurityMetricService::with_fetcher(Arc::new(FailSecondCreate { calls: Mutex::new(0) }));
    assert!(service.address().is_none());
    let start = d("2000-01-01");
    let many: Vec<_> = (0..=RECORD_CHUNK_SIZE as i64).map(|i| (start + chrono::Duration::days(i), Decimal::from(i))).collect();
    let e = service.record(SharesOutstanding, SPY, &many).await.unwrap_err();
    assert_eq!(
        e.to_string(),
        "SecurityMetric CreateOrUpdate failed at 127.0.0.1:8083: NOT_FOUND (security does not exist); 5000 points already stored"
    );
    // The custom fetcher is used for empty GetLatest replies too: every UUID
    // stays a key with None.
    let got = service.get(NavPerShare, &[SPY, QQQ], None).await.unwrap();
    assert_eq!(got.len(), 2);
    assert!(got.values().all(Option::is_none));
}

// A gRPC error other than UNAVAILABLE names the RPC, address and code.
#[tokio::test]
async fn grpc_errors_name_rpc_address_and_code() {
    let fake = FakeServer::start().await;
    let service = service_for(&fake);
    // The fake rejects a Search with no security_id; build_search always
    // sets it, so send a raw request through the default fetcher instead.
    let e = ledger_models::fintekkers::wrappers::services::security_metric::GrpcSecurityMetricFetcher::new(
        service.address().unwrap().clone(),
        Duration::from_secs(5),
    )
    .search(SearchSecurityMetricRequestProto::default())
    .await
    .unwrap_err();
    assert_eq!(
        e.to_string(),
        format!("SecurityMetric Search failed at 127.0.0.1:{}: INVALID_ARGUMENT (no security_id)", fake.port)
    );
    fake.stop();
}
