//! LM-485 test fake: an in-memory SecurityMetric gRPC server on
//! 127.0.0.1:0, built on the generated `security_metric_server`.
//!
//! - GetLatest: for each requested security, in REVERSE request order:
//!   omits a security unknown to the store, else returns its latest point on
//!   or before `date` (zero points when none).
//! - Search: streams the range in chunks of 2 points; one zero-point
//!   message when there are none.
//! - CreateOrUpdate: stores the points and returns the header with a
//!   distinct as_of per call (2026-11-23T21:00:00Z + call count seconds).
//!
//! Every request is kept so tests can read it. Include with
//! `#[path = "common/security_metric_fake.rs"] mod security_metric_fake;`.
#![allow(dead_code)]

use std::collections::{BTreeMap, HashMap};
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};

use chrono::{Datelike, NaiveDate};
use ledger_models::fintekkers::models::security::{
    SecurityMetricPointProto, SecurityMetricSeriesProto, SecurityMetricTypeProto,
};
use ledger_models::fintekkers::models::util::{LocalDateProto, LocalTimestampProto, UuidProto};
use ledger_models::fintekkers::requests::security_metric::{
    CreateSecurityMetricRequestProto, CreateSecurityMetricResponseProto, GetLatestSecurityMetricRequestProto,
    GetLatestSecurityMetricResponseProto, SearchSecurityMetricRequestProto, SearchSecurityMetricResponseProto,
};
use ledger_models::fintekkers::services::security_metric_service::security_metric_server::{
    SecurityMetric, SecurityMetricServer,
};
use ledger_models::fintekkers::wrappers::models::utils::decimal::{decimal_proto, decode_decimal};
use ledger_models::fintekkers::wrappers::util::object_types::stamp_own;
use rust_decimal::Decimal;
use tonic::codegen::futures_core::Stream;
use tonic::{Request, Response, Status};
use uuid::Uuid;

/// SPY, seeded with SHARES_OUTSTANDING on 2026-11-19 and 2026-11-20.
pub const SPY: Uuid = Uuid::from_bytes([0x5b; 16]);
/// The as_of of the first CreateOrUpdate is this + 1 second.
pub const BASE_AS_OF_SECONDS: i64 = 1_795_467_600; // 2026-11-23T21:00:00Z

pub fn d(s: &str) -> NaiveDate {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").unwrap_or_else(|e| panic!("{s}: {e}"))
}

pub fn dec(s: &str) -> Decimal {
    s.parse().unwrap_or_else(|e| panic!("{s}: {e}"))
}

pub fn uuid_proto(u: Uuid) -> UuidProto {
    UuidProto { raw_uuid: u.as_bytes().to_vec() }
}

pub fn uuid_of(p: &UuidProto) -> Uuid {
    Uuid::from_slice(&p.raw_uuid).expect("16-byte uuid")
}

pub fn date_proto(day: NaiveDate) -> LocalDateProto {
    LocalDateProto { year: day.year() as u32, month: day.month(), day: day.day() }
}

pub fn date_of(p: &LocalDateProto) -> NaiveDate {
    NaiveDate::from_ymd_opt(p.year as i32, p.month, p.day).expect("valid date")
}

#[derive(Default)]
pub struct FakeState {
    pub store: HashMap<(Uuid, i32), BTreeMap<NaiveDate, Decimal>>,
    pub get_latest_requests: Vec<GetLatestSecurityMetricRequestProto>,
    pub search_requests: Vec<SearchSecurityMetricRequestProto>,
    pub create_requests: Vec<CreateSecurityMetricRequestProto>,
    pub create_responses: Vec<CreateSecurityMetricResponseProto>,
    /// Messages streamed by each Search call.
    pub search_messages: Vec<usize>,
}

#[derive(Clone)]
struct Fake {
    state: Arc<Mutex<FakeState>>,
}

fn series(uuid: Uuid, metric: i32, points: Vec<(NaiveDate, Decimal)>) -> SecurityMetricSeriesProto {
    stamp_own(SecurityMetricSeriesProto {
        security_id: Some(uuid_proto(uuid)),
        metric,
        as_of: Some(LocalTimestampProto {
            timestamp: Some(prost_types::Timestamp { seconds: BASE_AS_OF_SECONDS, nanos: 0 }),
            time_zone: "UTC".to_string(),
        }),
        points: points
            .into_iter()
            .map(|(day, value)| SecurityMetricPointProto {
                observation_date: Some(date_proto(day)),
                value: Some(decimal_proto(&value)),
            })
            .collect(),
        ..Default::default()
    })
}

/// A finished stream over prepared messages.
pub struct VecStream(std::vec::IntoIter<Result<SearchSecurityMetricResponseProto, Status>>);

impl Stream for VecStream {
    type Item = Result<SearchSecurityMetricResponseProto, Status>;
    fn poll_next(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        Poll::Ready(self.0.next())
    }
}

#[tonic::async_trait]
impl SecurityMetric for Fake {
    async fn create_or_update(
        &self,
        request: Request<CreateSecurityMetricRequestProto>,
    ) -> Result<Response<CreateSecurityMetricResponseProto>, Status> {
        let request = request.into_inner();
        let mut state = self.state.lock().unwrap();
        state.create_requests.push(request.clone());
        let call = state.create_requests.len() as i64;
        let s = request.series.clone().ok_or_else(|| Status::invalid_argument("no series"))?;
        let uuid = uuid_of(s.security_id.as_ref().ok_or_else(|| Status::invalid_argument("no security_id"))?);
        let stored = state.store.entry((uuid, s.metric)).or_default();
        for p in &s.points {
            let value = decode_decimal(p.value.as_ref().expect("value")).unwrap().to_rust_decimal().unwrap();
            stored.insert(date_of(p.observation_date.as_ref().expect("date")), value);
        }
        let mut header = series(uuid, s.metric, vec![]);
        header.as_of = Some(LocalTimestampProto {
            timestamp: Some(prost_types::Timestamp { seconds: BASE_AS_OF_SECONDS + call, nanos: 0 }),
            time_zone: "UTC".to_string(),
        });
        let response = stamp_own(CreateSecurityMetricResponseProto {
            operation_type: request.operation_type,
            series: Some(header),
            ..Default::default()
        });
        state.create_responses.push(response.clone());
        Ok(Response::new(response))
    }

    type SearchStream = VecStream;

    async fn search(
        &self,
        request: Request<SearchSecurityMetricRequestProto>,
    ) -> Result<Response<Self::SearchStream>, Status> {
        let request = request.into_inner();
        let mut state = self.state.lock().unwrap();
        state.search_requests.push(request.clone());
        let uuid = uuid_of(request.security_id.as_ref().ok_or_else(|| Status::invalid_argument("no security_id"))?);
        let metric = *request.metrics.first().ok_or_else(|| Status::invalid_argument("no metric"))?;
        let from = request.start_date.as_ref().map(date_of).unwrap_or(NaiveDate::MIN);
        let to = request.end_date.as_ref().map(date_of).unwrap_or(NaiveDate::MAX);
        let points: Vec<(NaiveDate, Decimal)> = state
            .store
            .get(&(uuid, metric))
            .map(|m| m.range(from..=to).map(|(k, v)| (*k, *v)).collect())
            .unwrap_or_default();
        let mut messages: Vec<Result<SearchSecurityMetricResponseProto, Status>> = points
            .chunks(2)
            .map(|c| {
                Ok(stamp_own(SearchSecurityMetricResponseProto {
                    series: Some(series(uuid, metric, c.to_vec())),
                    ..Default::default()
                }))
            })
            .collect();
        if messages.is_empty() {
            messages.push(Ok(stamp_own(SearchSecurityMetricResponseProto {
                series: Some(series(uuid, metric, vec![])),
                ..Default::default()
            })));
        }
        state.search_messages.push(messages.len());
        Ok(Response::new(VecStream(messages.into_iter())))
    }

    async fn get_latest(
        &self,
        request: Request<GetLatestSecurityMetricRequestProto>,
    ) -> Result<Response<GetLatestSecurityMetricResponseProto>, Status> {
        let request = request.into_inner();
        let mut state = self.state.lock().unwrap();
        state.get_latest_requests.push(request.clone());
        let on = date_of(request.date.as_ref().ok_or_else(|| Status::invalid_argument("no date"))?);
        let mut out = vec![];
        for id in request.security_ids.iter().rev() {
            let uuid = uuid_of(id);
            if !state.store.keys().any(|(u, _)| *u == uuid) {
                continue;
            }
            for metric in &request.metrics {
                let latest: Vec<(NaiveDate, Decimal)> = state
                    .store
                    .get(&(uuid, *metric))
                    .and_then(|m| m.range(..=on).next_back().map(|(k, v)| (*k, *v)))
                    .into_iter()
                    .collect();
                out.push(series(uuid, *metric, latest));
            }
        }
        Ok(Response::new(stamp_own(GetLatestSecurityMetricResponseProto { series: out, ..Default::default() })))
    }
}

/// A running fake. Dropping it stops the server.
pub struct FakeServer {
    pub port: u16,
    pub state: Arc<Mutex<FakeState>>,
    shutdown: Option<tokio::sync::oneshot::Sender<()>>,
}

impl FakeServer {
    /// Starts on 127.0.0.1:0, seeded with SPY's two share counts.
    pub async fn start() -> FakeServer {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let port = listener.local_addr().expect("local addr").port();
        let incoming = tonic::transport::server::TcpIncoming::from_listener(listener, true, None).expect("incoming");
        let state = Arc::new(Mutex::new(FakeState::default()));
        let (tx, rx) = tokio::sync::oneshot::channel::<()>();
        let service = SecurityMetricServer::new(Fake { state: state.clone() });
        tokio::spawn(async move {
            tonic::transport::Server::builder()
                .add_service(service)
                .serve_with_incoming_shutdown(incoming, async {
                    let _ = rx.await;
                })
                .await
                .expect("fake server");
        });
        let server = FakeServer { port, state, shutdown: Some(tx) };
        server.seed(
            SPY,
            SecurityMetricTypeProto::SharesOutstanding,
            &[("2026-11-19", "15204137000"), ("2026-11-20", "15210000000")],
        );
        server
    }

    pub fn seed(&self, uuid: Uuid, metric: SecurityMetricTypeProto, points: &[(&str, &str)]) {
        let mut state = self.state.lock().unwrap();
        let stored = state.store.entry((uuid, metric as i32)).or_default();
        for (day, value) in points {
            stored.insert(d(day), dec(value));
        }
    }

    /// The env a default service would read: PRICE_SERVICE_HOST/_PORT only.
    pub fn env(&self) -> impl Fn(&str) -> Option<String> {
        price_env(self.port)
    }

    pub fn get_latest_calls(&self) -> usize {
        self.state.lock().unwrap().get_latest_requests.len()
    }

    pub fn search_calls(&self) -> usize {
        self.state.lock().unwrap().search_requests.len()
    }

    pub fn create_calls(&self) -> usize {
        self.state.lock().unwrap().create_requests.len()
    }

    pub fn last_get_latest(&self) -> GetLatestSecurityMetricRequestProto {
        self.state.lock().unwrap().get_latest_requests.last().cloned().expect("a GetLatest request")
    }

    pub fn stop(mut self) {
        if let Some(tx) = self.shutdown.take() {
            let _ = tx.send(());
        }
    }
}

impl Drop for FakeServer {
    fn drop(&mut self) {
        if let Some(tx) = self.shutdown.take() {
            let _ = tx.send(());
        }
    }
}

/// An injected env with PRICE_SERVICE_HOST=127.0.0.1 and PRICE_SERVICE_PORT=port.
pub fn price_env(port: u16) -> impl Fn(&str) -> Option<String> {
    move |name: &str| match name {
        "PRICE_SERVICE_HOST" => Some("127.0.0.1".to_string()),
        "PRICE_SERVICE_PORT" => Some(port.to_string()),
        _ => None,
    }
}

/// A port on 127.0.0.1 that nothing listens on: bound, read, closed.
pub fn closed_port() -> u16 {
    let listener = std::net::TcpListener::bind("127.0.0.1:0").expect("bind");
    let port = listener.local_addr().expect("local addr").port();
    drop(listener);
    port
}
