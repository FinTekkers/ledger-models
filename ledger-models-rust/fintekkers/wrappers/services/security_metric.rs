//! `SecurityMetricService` (LM-485): reads and writes security metrics such
//! as shares outstanding through the SecurityMetric gRPC service, in native
//! types. The rules live in
//! [`models::security_metric`](crate::fintekkers::wrappers::models::security_metric);
//! this module only makes the calls.
//!
//! The address comes from [`service_address`] with [`Service::Price`]
//! (`BROKER_HOST` wins, then `PRICE_SERVICE_HOST/_PORT`, `API_URL`,
//! `localhost:8083`). Loopback is plaintext, any other host TLS. Each call
//! has a deadline, 30 seconds unless set with
//! [`SecurityMetricService::with_timeout`].
//!
//! Calls go through a [`SecurityMetricFetcher`]: the default one wraps the
//! generated tonic client; tests and in-process callers can pass their own
//! with [`SecurityMetricService::with_fetcher`]. Prefer an explicit instance
//! over the process-wide default ([`SecurityMetricService::default_instance`]),
//! e.g. in tests that run in parallel.

#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic)]

use std::collections::HashMap;
use std::sync::{Arc, OnceLock, RwLock};
use std::time::Duration;

use async_trait::async_trait;
use chrono::{DateTime, Local, NaiveDate};
use chrono_tz::Tz;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::fintekkers::models::security::SecurityMetricTypeProto;
use crate::fintekkers::requests::security_metric::{
    CreateSecurityMetricRequestProto, CreateSecurityMetricResponseProto,
    GetLatestSecurityMetricRequestProto, GetLatestSecurityMetricResponseProto,
    SearchSecurityMetricRequestProto, SearchSecurityMetricResponseProto,
};
use crate::fintekkers::services::security_metric_service::security_metric_client::SecurityMetricClient;
use crate::fintekkers::wrappers::models::security_metric::{
    self as core, decode_timestamp, MetricResult, MetricSeries, SecurityMetricError, RECORD_CHUNK_SIZE,
};
use crate::fintekkers::wrappers::util::service_address::{self, Service, ServiceAddress};

/// The default deadline of each call.
pub const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// The three SecurityMetric calls. The default implementation is
/// [`GrpcSecurityMetricFetcher`]; tests provide their own.
// async_trait marks each boxed future #[must_use] twice.
#[allow(clippy::double_must_use)]
#[async_trait]
pub trait SecurityMetricFetcher: Send + Sync {
    async fn get_latest(
        &self,
        request: GetLatestSecurityMetricRequestProto,
    ) -> Result<GetLatestSecurityMetricResponseProto, SecurityMetricError>;

    /// Every message of the Search stream, in order.
    async fn search(
        &self,
        request: SearchSecurityMetricRequestProto,
    ) -> Result<Vec<SearchSecurityMetricResponseProto>, SecurityMetricError>;

    async fn create_or_update(
        &self,
        request: CreateSecurityMetricRequestProto,
    ) -> Result<CreateSecurityMetricResponseProto, SecurityMetricError>;
}

/// The default fetcher: the generated tonic client for `address`. It
/// connects on the first call and maps gRPC errors to
/// [`SecurityMetricError`] naming `host:port`.
pub struct GrpcSecurityMetricFetcher {
    address: ServiceAddress,
    timeout: Duration,
    client: tokio::sync::Mutex<Option<SecurityMetricClient<tonic::transport::Channel>>>,
}

impl GrpcSecurityMetricFetcher {
    pub fn new(address: ServiceAddress, timeout: Duration) -> Self {
        GrpcSecurityMetricFetcher { address, timeout, client: tokio::sync::Mutex::new(None) }
    }

    /// `host:port`, as error messages name it.
    pub fn address_label(&self) -> String {
        format!("{}:{}", self.address.host, self.address.port)
    }

    async fn client(&self) -> Result<SecurityMetricClient<tonic::transport::Channel>, SecurityMetricError> {
        let mut slot = self.client.lock().await;
        if let Some(client) = slot.as_ref() {
            return Ok(client.clone());
        }
        let unreachable = |details: String| SecurityMetricError::ServiceUnavailable {
            address: self.address_label(),
            details,
            points_stored: 0,
        };
        let endpoint = self
            .address
            .endpoint()
            .map_err(|e| unreachable(format!("invalid address: {}", e)))?
            .connect_timeout(self.timeout)
            .timeout(self.timeout);
        let channel = endpoint.connect().await.map_err(|e| unreachable(error_chain(&e)))?;
        let client = SecurityMetricClient::new(channel);
        *slot = Some(client.clone());
        Ok(client)
    }

    fn map_status(&self, rpc: &str, status: tonic::Status) -> SecurityMetricError {
        SecurityMetricError::from_status(rpc, &self.address_label(), &status)
    }
}

/// `e` and every source, joined with `: `.
fn error_chain(e: &dyn std::error::Error) -> String {
    let mut parts = vec![e.to_string()];
    let mut source = e.source();
    while let Some(s) = source {
        parts.push(s.to_string());
        source = s.source();
    }
    parts.join(": ")
}

#[async_trait]
impl SecurityMetricFetcher for GrpcSecurityMetricFetcher {
    async fn get_latest(
        &self,
        request: GetLatestSecurityMetricRequestProto,
    ) -> Result<GetLatestSecurityMetricResponseProto, SecurityMetricError> {
        let mut client = self.client().await?;
        client
            .get_latest(request)
            .await
            .map(|r| r.into_inner())
            .map_err(|s| self.map_status("GetLatest", s))
    }

    async fn search(
        &self,
        request: SearchSecurityMetricRequestProto,
    ) -> Result<Vec<SearchSecurityMetricResponseProto>, SecurityMetricError> {
        let mut client = self.client().await?;
        let mut stream = client
            .search(request)
            .await
            .map_err(|s| self.map_status("Search", s))?
            .into_inner();
        let mut chunks = Vec::new();
        while let Some(chunk) = stream.message().await.map_err(|s| self.map_status("Search", s))? {
            chunks.push(chunk);
        }
        Ok(chunks)
    }

    async fn create_or_update(
        &self,
        request: CreateSecurityMetricRequestProto,
    ) -> Result<CreateSecurityMetricResponseProto, SecurityMetricError> {
        let mut client = self.client().await?;
        client
            .create_or_update(request)
            .await
            .map(|r| r.into_inner())
            .map_err(|s| self.map_status("CreateOrUpdate", s))
    }
}

/// Reads and writes security metrics. Cheap to share: wrap it in an `Arc`
/// or build one per caller.
pub struct SecurityMetricService {
    fetcher: Arc<dyn SecurityMetricFetcher>,
    address: Option<ServiceAddress>,
}

static DEFAULT_INSTANCE: OnceLock<RwLock<Option<Arc<SecurityMetricService>>>> = OnceLock::new();

fn default_slot() -> &'static RwLock<Option<Arc<SecurityMetricService>>> {
    DEFAULT_INSTANCE.get_or_init(|| RwLock::new(None))
}

impl SecurityMetricService {
    /// The service at the PRICE address in the process environment. Does
    /// not connect: the first call does.
    pub fn from_env() -> Result<Self, SecurityMetricError> {
        Self::from_env_with(|name| std::env::var(name).ok())
    }

    /// The service at the PRICE address resolved from `env`, a variable
    /// lookup returning `None` when unset (no process environment read).
    pub fn from_env_with(env: impl Fn(&str) -> Option<String>) -> Result<Self, SecurityMetricError> {
        let address = service_address::resolve_with(Service::Price, env)?;
        Ok(Self::from_address(address, DEFAULT_TIMEOUT))
    }

    /// The service at `address`, each call with deadline `timeout`.
    pub fn from_address(address: ServiceAddress, timeout: Duration) -> Self {
        let fetcher = Arc::new(GrpcSecurityMetricFetcher::new(address.clone(), timeout));
        SecurityMetricService { fetcher, address: Some(address) }
    }

    /// A service whose calls go through `fetcher`.
    pub fn with_fetcher(fetcher: Arc<dyn SecurityMetricFetcher>) -> Self {
        SecurityMetricService { fetcher, address: None }
    }

    /// The same service with call deadline `timeout`. Applies to the
    /// default gRPC fetcher only; a custom fetcher is kept as is.
    pub fn with_timeout(self, timeout: Duration) -> Self {
        match self.address {
            Some(address) => Self::from_address(address, timeout),
            None => self,
        }
    }

    /// The resolved address, or `None` for a custom fetcher.
    pub fn address(&self) -> Option<&ServiceAddress> {
        self.address.as_ref()
    }

    /// The process-wide instance used by `SecurityWrapper::get_metric` and
    /// its shortcuts: built from the environment on first use, or around
    /// the fetcher passed to [`set_default_fetcher`](Self::set_default_fetcher).
    pub fn default_instance() -> Result<Arc<SecurityMetricService>, SecurityMetricError> {
        let slot = default_slot();
        if let Some(service) = slot.read().unwrap_or_else(|p| p.into_inner()).as_ref() {
            return Ok(service.clone());
        }
        let mut write = slot.write().unwrap_or_else(|p| p.into_inner());
        if let Some(service) = write.as_ref() {
            return Ok(service.clone());
        }
        let service = Arc::new(Self::from_env()?);
        *write = Some(service.clone());
        Ok(service)
    }

    /// Makes the process-wide instance call `fetcher`; `None` drops it so
    /// the next use rebuilds it from the environment. Process-wide: tests
    /// that run in parallel should pass an instance instead.
    pub fn set_default_fetcher(fetcher: Option<Arc<dyn SecurityMetricFetcher>>) {
        let service = fetcher.map(|f| Arc::new(Self::with_fetcher(f)));
        *default_slot().write().unwrap_or_else(|p| p.into_inner()) = service;
    }

    /// The latest value of `metric` on or before `on` (default: today) for
    /// each of `uuids`. Every requested UUID is a key; its value is `None`
    /// when unknown, never 0. One GetLatest call; none for no UUIDs.
    pub async fn get(
        &self,
        metric: SecurityMetricTypeProto,
        uuids: &[Uuid],
        on: Option<NaiveDate>,
    ) -> Result<HashMap<Uuid, Option<MetricResult>>, SecurityMetricError> {
        let metric = core::check_metric(metric)?;
        if uuids.is_empty() {
            return Ok(HashMap::new());
        }
        let on = on.unwrap_or_else(today);
        let response = self.fetcher.get_latest(core::build_get_latest(metric, uuids, on)).await?;
        core::map_latest(&response, metric, uuids, on)
    }

    /// The latest value of `metric` for one security, or `None` when
    /// unknown.
    pub async fn get_one(
        &self,
        metric: SecurityMetricTypeProto,
        uuid: Uuid,
        on: Option<NaiveDate>,
    ) -> Result<Option<MetricResult>, SecurityMetricError> {
        Ok(self.get(metric, &[uuid], on).await?.remove(&uuid).flatten())
    }

    /// Every point of `metric` for `uuid` from `from` to `to` (default:
    /// today), both inclusive. One Search call.
    pub async fn get_history(
        &self,
        metric: SecurityMetricTypeProto,
        uuid: Uuid,
        from: NaiveDate,
        to: Option<NaiveDate>,
    ) -> Result<MetricSeries, SecurityMetricError> {
        let metric = core::check_metric(metric)?;
        let request = core::build_search(metric, uuid, from, to.unwrap_or_else(today))?;
        let chunks = self.fetcher.search(request).await?;
        core::merge_chunks(&chunks, uuid, metric)
    }

    /// Stores `points` (date, value) of `metric` for `uuid`; a value may be
    /// a `Decimal` or an `Option<Decimal>` (`None` is rejected). Validated
    /// before any call; sent in chunks of [`RECORD_CHUNK_SIZE`], one
    /// CreateOrUpdate each. Returns the as_of the server stamped on the last
    /// chunk. If a later chunk fails, the error says how many points were
    /// already stored.
    pub async fn record<V>(
        &self,
        metric: SecurityMetricTypeProto,
        uuid: Uuid,
        points: &[(NaiveDate, V)],
    ) -> Result<DateTime<Tz>, SecurityMetricError>
    where
        V: Into<Option<Decimal>> + Clone,
    {
        let metric = core::check_metric(metric)?;
        let points = core::validate_record(metric, points)?;
        let mut stored = 0;
        let mut as_of = None;
        for chunk in core::chunk_record(&points, RECORD_CHUNK_SIZE) {
            let response = self
                .fetcher
                .create_or_update(core::build_create(metric, uuid, &chunk))
                .await
                .map_err(|e| e.with_points_stored(stored))?;
            let stamped = response.series.as_ref().and_then(|s| s.as_of.as_ref()).ok_or_else(|| {
                SecurityMetricError::InvalidResponse("CreateOrUpdate returned no as_of".to_string())
                    .with_points_stored(stored + chunk.len())
            })?;
            as_of = Some(
                decode_timestamp(stamped, "CreateOrUpdate").map_err(|e| e.with_points_stored(stored + chunk.len()))?,
            );
            stored += chunk.len();
        }
        as_of.ok_or_else(|| SecurityMetricError::InvalidInput("no points to record".to_string()))
    }
}

fn today() -> NaiveDate {
    Local::now().date_naive()
}
