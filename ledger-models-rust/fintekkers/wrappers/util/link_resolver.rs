//! LinkResolver — bulk hydration of `is_link=true` entity references into
//! full entities. Rust parity for the JS / Python / Java implementations
//! shipped under FinTekkers/second-brain#196.
//!
//! Surface (mirrors the other languages, modulo Rust idioms):
//!
//! - [`LinkResolver::get_security`] / [`LinkResolver::get_portfolio`] —
//!   single-UUID resolution, cached on `(uuid, as_of)`.
//! - [`LinkResolver::resolve_securities_on_prices`],
//!   [`LinkResolver::resolve_securities_on_transactions`],
//!   [`LinkResolver::resolve_portfolios_on_transactions`] — bulk hydrate.
//!   Returns a new [`Vec`] with hydrated copies (Rust Prost messages are
//!   value types — cheap to clone, but we don't mutate input in place).
//!
//! Caching:
//!
//! - In-process LRU keyed on `(uuid, as_of)`. Default 1000 entries, optional
//!   TTL. `cache_size = 0` disables caching (for tests).
//!
//! Time-travel: per the [`is_link_pattern.md`] addendum, when a link
//! sub-message has `as_of` set the resolver fetches the version of the
//! entity at that timestamp; otherwise latest. Bulk lookups group items
//! by `as_of` bucket and fire one `get_by_ids` RPC per bucket — the
//! request proto carries a single `as_of`, so different timestamps cannot
//! share a request.
//!
//! Concurrent in-flight de-dup is intentionally not implemented in this
//! initial Rust impl — same-key requests fired in parallel before the
//! cache is populated will hit the wire twice. Acceptable for v1; can be
//! added with `tokio::sync::broadcast` or `futures::future::Shared`
//! later. Documented as a follow-up in the PR body.
//!
//! [`is_link_pattern.md`]: ../../../../../docs/adr/is_link_pattern.md

use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::SecurityProto;
use crate::fintekkers::models::transaction::TransactionProto;
use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use crate::fintekkers::wrappers::util::link_cache;
use crate::fintekkers::requests::portfolio::{
    QueryPortfolioRequestProto, QueryPortfolioResponseProto,
};
use crate::fintekkers::requests::security::{
    QuerySecurityRequestProto, QuerySecurityResponseProto,
};

const LATEST_BUCKET: &str = "latest";

/// Functional-interface seam for testability. Production callers use
/// the tonic-client-backed impl; tests provide their own.
#[async_trait]
pub trait SecurityFetcher: Send + Sync {
    async fn get_by_ids(
        &self,
        request: QuerySecurityRequestProto,
    ) -> Result<QuerySecurityResponseProto, tonic::Status>;
}

#[async_trait]
pub trait PortfolioFetcher: Send + Sync {
    async fn get_by_ids(
        &self,
        request: QueryPortfolioRequestProto,
    ) -> Result<QueryPortfolioResponseProto, tonic::Status>;
}

/// Errors surfaced by the resolver. Network errors come through as
/// `tonic::Status`; semantic ones (not-found) get a typed variant so
/// callers can distinguish.
#[derive(Debug)]
pub enum LinkResolverError {
    NotFound { uuid: Uuid, as_of_bucket: String },
    Rpc(tonic::Status),
    Malformed(String),
}

impl std::fmt::Display for LinkResolverError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LinkResolverError::NotFound { uuid, as_of_bucket } => {
                write!(f, "entity not found: {}@{}", uuid, as_of_bucket)
            }
            LinkResolverError::Rpc(s) => write!(f, "rpc error: {}", s),
            LinkResolverError::Malformed(s) => write!(f, "malformed link: {}", s),
        }
    }
}

impl std::error::Error for LinkResolverError {}

impl From<tonic::Status> for LinkResolverError {
    fn from(s: tonic::Status) -> Self {
        LinkResolverError::Rpc(s)
    }
}

/// Tiny LRU. `Mutex<LinkedHashMap>` would be ideal for true LRU semantics,
/// but pulling in a dep for ~30 lines isn't worth it. We use a `HashMap`
/// + a `Vec<String>` insertion-order log; on overflow we drop the oldest
/// entries. Bumping on get is skipped — true LRU is overkill for our
/// access pattern (post-search hydration of a fixed result set).
struct TinyCache<V> {
    max_size: usize,
    ttl: Option<Duration>,
    data: HashMap<String, (V, Instant)>,
    order: std::collections::VecDeque<String>,
}

impl<V: Clone> TinyCache<V> {
    fn new(max_size: usize, ttl_ms: Option<u64>) -> Self {
        Self {
            max_size,
            ttl: ttl_ms.map(Duration::from_millis),
            data: HashMap::new(),
            order: std::collections::VecDeque::new(),
        }
    }

    fn get(&mut self, key: &str) -> Option<V> {
        if self.max_size == 0 {
            return None;
        }
        let entry = self.data.get(key)?;
        if let Some(ttl) = self.ttl {
            if entry.1.elapsed() > ttl {
                self.data.remove(key);
                return None;
            }
        }
        Some(entry.0.clone())
    }

    fn set(&mut self, key: String, value: V) {
        if self.max_size == 0 {
            return;
        }
        if !self.data.contains_key(&key) {
            self.order.push_back(key.clone());
        }
        self.data.insert(key, (value, Instant::now()));
        while self.data.len() > self.max_size {
            if let Some(oldest) = self.order.pop_front() {
                self.data.remove(&oldest);
            } else {
                break;
            }
        }
    }

    fn clear(&mut self) {
        self.data.clear();
        self.order.clear();
    }
}

pub struct LinkResolver<S: SecurityFetcher, P: PortfolioFetcher> {
    security_fetcher: S,
    portfolio_fetcher: P,
    security_cache: Mutex<TinyCache<SecurityProto>>,
    portfolio_cache: Mutex<TinyCache<PortfolioProto>>,
}

impl<S: SecurityFetcher, P: PortfolioFetcher> LinkResolver<S, P> {
    /// `cache_size = 0` disables caching. `ttl_ms = None` = no TTL.
    pub fn new(
        security_fetcher: S,
        portfolio_fetcher: P,
        cache_size: usize,
        ttl_ms: Option<u64>,
    ) -> Self {
        Self {
            security_fetcher,
            portfolio_fetcher,
            security_cache: Mutex::new(TinyCache::new(cache_size, ttl_ms)),
            portfolio_cache: Mutex::new(TinyCache::new(cache_size, ttl_ms)),
        }
    }

    pub fn with_defaults(security_fetcher: S, portfolio_fetcher: P) -> Self {
        Self::new(security_fetcher, portfolio_fetcher, 1000, None)
    }

    pub fn clear_cache(&self) {
        self.security_cache.lock().unwrap().clear();
        self.portfolio_cache.lock().unwrap().clear();
    }

    // ---------- single-UUID accessors ----------

    pub async fn get_security(
        &self,
        uuid: Uuid,
        as_of: Option<LocalTimestampProto>,
    ) -> Result<SecurityProto, LinkResolverError> {
        let key = cache_key(uuid, as_of.as_ref());

        if let Some(cached) = self.security_cache.lock().unwrap().get(&key) {
            return Ok(cached);
        }

        let protos = self
            .batch_fetch_securities(vec![uuid], as_of.clone())
            .await?;
        let proto = protos.into_iter().next().ok_or_else(|| {
            LinkResolverError::NotFound {
                uuid,
                as_of_bucket: bucket_key(as_of.as_ref()),
            }
        })?;
        self.security_cache.lock().unwrap().set(key, proto.clone());
        populate_security_link_cache(&proto);
        Ok(proto)
    }

    pub async fn get_portfolio(
        &self,
        uuid: Uuid,
        as_of: Option<LocalTimestampProto>,
    ) -> Result<PortfolioProto, LinkResolverError> {
        let key = cache_key(uuid, as_of.as_ref());
        if let Some(cached) = self.portfolio_cache.lock().unwrap().get(&key) {
            return Ok(cached);
        }
        let protos = self
            .batch_fetch_portfolios(vec![uuid], as_of.clone())
            .await?;
        let proto = protos.into_iter().next().ok_or_else(|| {
            LinkResolverError::NotFound {
                uuid,
                as_of_bucket: bucket_key(as_of.as_ref()),
            }
        })?;
        self.portfolio_cache.lock().unwrap().set(key, proto.clone());
        populate_portfolio_link_cache(&proto);
        Ok(proto)
    }

    // ---------- bulk accessors ----------

    /// Hydrate the embedded security on each Price. Returns a new `Vec`
    /// with hydrated copies; Prost messages are value types so the rebuild
    /// (clone + assign field) is cheap.
    pub async fn resolve_securities_on_prices(
        &self,
        prices: Vec<PriceProto>,
    ) -> Result<Vec<PriceProto>, LinkResolverError> {
        self.ensure_securities_cached(&prices, |p| p.security.as_ref())
            .await?;

        let mut out = Vec::with_capacity(prices.len());
        for mut p in prices {
            if let Some(sec) = p.security.as_ref() {
                if sec.is_link {
                    if let Some(uuid_proto) = sec.uuid.as_ref() {
                        if let Some(uuid) = uuid_from_proto(uuid_proto) {
                            let key = cache_key(uuid, sec.as_of.as_ref());
                            if let Some(resolved) =
                                self.security_cache.lock().unwrap().get(&key)
                            {
                                p.security = Some(resolved);
                            }
                        }
                    }
                }
            }
            out.push(p);
        }
        Ok(out)
    }

    pub async fn resolve_securities_on_transactions(
        &self,
        txns: Vec<TransactionProto>,
    ) -> Result<Vec<TransactionProto>, LinkResolverError> {
        self.ensure_securities_cached(&txns, |t| t.security.as_ref())
            .await?;

        let mut out = Vec::with_capacity(txns.len());
        for mut t in txns {
            if let Some(sec) = t.security.as_ref() {
                if sec.is_link {
                    if let Some(uuid_proto) = sec.uuid.as_ref() {
                        if let Some(uuid) = uuid_from_proto(uuid_proto) {
                            let key = cache_key(uuid, sec.as_of.as_ref());
                            if let Some(resolved) =
                                self.security_cache.lock().unwrap().get(&key)
                            {
                                t.security = Some(resolved);
                            }
                        }
                    }
                }
            }
            out.push(t);
        }
        Ok(out)
    }

    pub async fn resolve_portfolios_on_transactions(
        &self,
        txns: Vec<TransactionProto>,
    ) -> Result<Vec<TransactionProto>, LinkResolverError> {
        self.ensure_portfolios_cached(&txns).await?;

        let mut out = Vec::with_capacity(txns.len());
        for mut t in txns {
            if let Some(port) = t.portfolio.as_ref() {
                if port.is_link {
                    if let Some(uuid_proto) = port.uuid.as_ref() {
                        if let Some(uuid) = uuid_from_proto(uuid_proto) {
                            let key = cache_key(uuid, port.as_of.as_ref());
                            if let Some(resolved) =
                                self.portfolio_cache.lock().unwrap().get(&key)
                            {
                                t.portfolio = Some(resolved);
                            }
                        }
                    }
                }
            }
            out.push(t);
        }
        Ok(out)
    }

    // ---------- internals ----------

    async fn ensure_securities_cached<T>(
        &self,
        items: &[T],
        get_sec: impl Fn(&T) -> Option<&SecurityProto>,
    ) -> Result<(), LinkResolverError> {
        // bucket_key → (proto for the bucket's as_of, dedup map of cache_key → uuid)
        let mut buckets: HashMap<String, (Option<LocalTimestampProto>, HashMap<String, Uuid>)> =
            HashMap::new();

        for item in items {
            let Some(sec) = get_sec(item) else {
                continue;
            };
            if !sec.is_link {
                continue;
            }
            let Some(uuid_proto) = sec.uuid.as_ref() else {
                continue;
            };
            let Some(uuid) = uuid_from_proto(uuid_proto) else {
                continue;
            };
            let bk = bucket_key(sec.as_of.as_ref());
            let ck = cache_key(uuid, sec.as_of.as_ref());
            if self.security_cache.lock().unwrap().get(&ck).is_some() {
                continue;
            }
            let entry = buckets
                .entry(bk)
                .or_insert_with(|| (sec.as_of.clone(), HashMap::new()));
            entry.1.entry(ck).or_insert(uuid);
        }

        for (bk, (as_of, uuid_map)) in buckets {
            let uuids: Vec<Uuid> = uuid_map.values().copied().collect();
            let fetched = self
                .batch_fetch_securities(uuids, as_of.clone())
                .await?;
            let mut cache = self.security_cache.lock().unwrap();
            for proto in fetched {
                if let Some(uuid_proto) = proto.uuid.as_ref() {
                    if let Some(uuid) = uuid_from_proto(uuid_proto) {
                        cache.set(format!("{}@{}", uuid, bk), proto.clone());
                        populate_security_link_cache(&proto);
                    }
                }
            }
        }
        Ok(())
    }

    async fn ensure_portfolios_cached(
        &self,
        items: &[TransactionProto],
    ) -> Result<(), LinkResolverError> {
        let mut buckets: HashMap<String, (Option<LocalTimestampProto>, HashMap<String, Uuid>)> =
            HashMap::new();

        for item in items {
            let Some(port) = item.portfolio.as_ref() else {
                continue;
            };
            if !port.is_link {
                continue;
            }
            let Some(uuid_proto) = port.uuid.as_ref() else {
                continue;
            };
            let Some(uuid) = uuid_from_proto(uuid_proto) else {
                continue;
            };
            let bk = bucket_key(port.as_of.as_ref());
            let ck = cache_key(uuid, port.as_of.as_ref());
            if self.portfolio_cache.lock().unwrap().get(&ck).is_some() {
                continue;
            }
            let entry = buckets
                .entry(bk)
                .or_insert_with(|| (port.as_of.clone(), HashMap::new()));
            entry.1.entry(ck).or_insert(uuid);
        }

        for (bk, (as_of, uuid_map)) in buckets {
            let uuids: Vec<Uuid> = uuid_map.values().copied().collect();
            let fetched = self
                .batch_fetch_portfolios(uuids, as_of.clone())
                .await?;
            let mut cache = self.portfolio_cache.lock().unwrap();
            for proto in fetched {
                if let Some(uuid_proto) = proto.uuid.as_ref() {
                    if let Some(uuid) = uuid_from_proto(uuid_proto) {
                        cache.set(format!("{}@{}", uuid, bk), proto.clone());
                        populate_portfolio_link_cache(&proto);
                    }
                }
            }
        }
        Ok(())
    }

    async fn batch_fetch_securities(
        &self,
        uuids: Vec<Uuid>,
        as_of: Option<LocalTimestampProto>,
    ) -> Result<Vec<SecurityProto>, LinkResolverError> {
        if uuids.is_empty() {
            return Ok(vec![]);
        }
        let request = QuerySecurityRequestProto {
            object_class: "SecurityRequest".into(),
            version: "0.0.1".into(),
            uu_ids: uuids.into_iter().map(uuid_to_proto).collect(),
            as_of,
            ..Default::default()
        };
        let response = self.security_fetcher.get_by_ids(request).await?;
        Ok(response.security_response)
    }

    async fn batch_fetch_portfolios(
        &self,
        uuids: Vec<Uuid>,
        as_of: Option<LocalTimestampProto>,
    ) -> Result<Vec<PortfolioProto>, LinkResolverError> {
        if uuids.is_empty() {
            return Ok(vec![]);
        }
        let request = QueryPortfolioRequestProto {
            object_class: "PortfolioRequest".into(),
            version: "0.0.1".into(),
            uu_ids: uuids.into_iter().map(uuid_to_proto).collect(),
            as_of,
            ..Default::default()
        };
        let response = self.portfolio_fetcher.get_by_ids(request).await?;
        Ok(response.portfolio_response)
    }
}

// ---------- key + uuid helpers ----------

fn bucket_key(as_of: Option<&LocalTimestampProto>) -> String {
    use prost::Message;
    match as_of {
        None => LATEST_BUCKET.into(),
        Some(ts) => {
            let mut buf = Vec::with_capacity(ts.encoded_len());
            ts.encode(&mut buf).expect("LocalTimestampProto encode");
            // base64 without bringing in an extra dep: hex is good enough
            // for a deterministic cache key.
            buf.iter().map(|b| format!("{:02x}", b)).collect::<String>()
        }
    }
}

fn cache_key(uuid: Uuid, as_of: Option<&LocalTimestampProto>) -> String {
    format!("{}@{}", uuid, bucket_key(as_of))
}

/// Mirror a freshly-fetched SecurityProto into the process-wide
/// `link_cache::security()`. `SecurityWrapper::ensure_hydrated` consults
/// this cache, so pre-warming via the resolver immediately benefits
/// accessor reads with no second RPC. Skips silently when the resolved
/// proto lacks uuid or as_of — the cache requires both for newest-wins.
fn populate_security_link_cache(proto: &SecurityProto) {
    let Some(uuid_proto) = proto.uuid.as_ref() else { return };
    let Some(as_of) = proto.as_of.clone() else { return };
    let Some(uuid) = uuid_from_proto(uuid_proto) else { return };
    link_cache::security().put(uuid, proto.clone(), Some(as_of));
}

fn populate_portfolio_link_cache(proto: &PortfolioProto) {
    let Some(uuid_proto) = proto.uuid.as_ref() else { return };
    let Some(as_of) = proto.as_of.clone() else { return };
    let Some(uuid) = uuid_from_proto(uuid_proto) else { return };
    link_cache::portfolio().put(uuid, proto.clone(), Some(as_of));
}

fn uuid_from_proto(proto: &UuidProto) -> Option<Uuid> {
    if proto.raw_uuid.len() != 16 {
        return None;
    }
    let mut bytes = [0u8; 16];
    bytes.copy_from_slice(&proto.raw_uuid);
    Some(Uuid::from_bytes(bytes))
}

fn uuid_to_proto(uuid: Uuid) -> UuidProto {
    UuidProto {
        raw_uuid: uuid.as_bytes().to_vec(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use prost_types::Timestamp;
    use std::sync::Mutex as StdMutex;

    /// Recording fetcher: serves from a HashMap and logs each call's
    /// requested UUIDs + as_of seconds. Tests inspect the log.
    struct RecordingSecurityFetcher {
        store: HashMap<String, SecurityProto>,
        log: StdMutex<Vec<(Vec<String>, Option<i64>)>>,
    }

    #[async_trait]
    impl SecurityFetcher for RecordingSecurityFetcher {
        async fn get_by_ids(
            &self,
            request: QuerySecurityRequestProto,
        ) -> Result<QuerySecurityResponseProto, tonic::Status> {
            let uuids: Vec<String> = request
                .uu_ids
                .iter()
                .filter_map(|u| uuid_from_proto(u).map(|x| x.to_string()))
                .collect();
            let as_of_seconds = request
                .as_of
                .as_ref()
                .and_then(|a| a.timestamp.as_ref())
                .map(|t| t.seconds);
            self.log
                .lock()
                .unwrap()
                .push((uuids.clone(), as_of_seconds));

            let response_list: Vec<SecurityProto> = uuids
                .iter()
                .filter_map(|u| self.store.get(u).cloned())
                .collect();
            Ok(QuerySecurityResponseProto {
                security_response: response_list,
                ..Default::default()
            })
        }
    }

    struct RecordingPortfolioFetcher {
        store: HashMap<String, PortfolioProto>,
        log: StdMutex<Vec<(Vec<String>, Option<i64>)>>,
    }

    #[async_trait]
    impl PortfolioFetcher for RecordingPortfolioFetcher {
        async fn get_by_ids(
            &self,
            request: QueryPortfolioRequestProto,
        ) -> Result<QueryPortfolioResponseProto, tonic::Status> {
            let uuids: Vec<String> = request
                .uu_ids
                .iter()
                .filter_map(|u| uuid_from_proto(u).map(|x| x.to_string()))
                .collect();
            let as_of_seconds = request
                .as_of
                .as_ref()
                .and_then(|a| a.timestamp.as_ref())
                .map(|t| t.seconds);
            self.log
                .lock()
                .unwrap()
                .push((uuids.clone(), as_of_seconds));
            let response_list: Vec<PortfolioProto> = uuids
                .iter()
                .filter_map(|u| self.store.get(u).cloned())
                .collect();
            Ok(QueryPortfolioResponseProto {
                portfolio_response: response_list,
                ..Default::default()
            })
        }
    }

    fn full_security(uuid: Uuid, name: &str) -> SecurityProto {
        SecurityProto {
            object_class: "Security".into(),
            version: "0.0.1".into(),
            uuid: Some(uuid_to_proto(uuid)),
            is_link: false,
            issuer_name: name.into(),
            ..Default::default()
        }
    }

    fn full_portfolio(uuid: Uuid, name: &str) -> PortfolioProto {
        PortfolioProto {
            object_class: "Portfolio".into(),
            version: "0.0.1".into(),
            uuid: Some(uuid_to_proto(uuid)),
            is_link: false,
            portfolio_name: name.into(),
            ..Default::default()
        }
    }

    fn link_security(uuid: Uuid, as_of: Option<LocalTimestampProto>) -> SecurityProto {
        SecurityProto {
            uuid: Some(uuid_to_proto(uuid)),
            is_link: true,
            as_of,
            ..Default::default()
        }
    }

    fn link_price(security_uuid: Uuid, as_of: Option<LocalTimestampProto>) -> PriceProto {
        PriceProto {
            object_class: "Price".into(),
            version: "0.0.1".into(),
            uuid: Some(uuid_to_proto(Uuid::new_v4())),
            security: Some(link_security(security_uuid, as_of)),
            ..Default::default()
        }
    }

    fn as_of_at(seconds: i64) -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp {
                seconds,
                nanos: 0,
            }),
            time_zone: "UTC".into(),
        }
    }

    fn make_resolver(
        sec_store: HashMap<String, SecurityProto>,
        port_store: HashMap<String, PortfolioProto>,
        cache_size: usize,
    ) -> LinkResolver<RecordingSecurityFetcher, RecordingPortfolioFetcher> {
        LinkResolver::new(
            RecordingSecurityFetcher {
                store: sec_store,
                log: StdMutex::new(vec![]),
            },
            RecordingPortfolioFetcher {
                store: port_store,
                log: StdMutex::new(vec![]),
            },
            cache_size,
            None,
        )
    }

    #[tokio::test]
    async fn bulk_resolve_securities_dedupes_uuids() {
        let a = Uuid::new_v4();
        let b = Uuid::new_v4();
        let c = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(a.to_string(), full_security(a, "AAPL"));
        store.insert(b.to_string(), full_security(b, "MSFT"));
        store.insert(c.to_string(), full_security(c, "GOOG"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let prices = vec![
            link_price(a, None),
            link_price(a, None),
            link_price(b, None),
            link_price(a, None),
            link_price(c, None),
        ];

        let out = resolver
            .resolve_securities_on_prices(prices)
            .await
            .unwrap();

        let log = resolver.security_fetcher.log.lock().unwrap();
        assert_eq!(log.len(), 1, "5 prices, 3 unique → 1 RPC");
        assert_eq!(log[0].0.len(), 3, "RPC carries 3 deduped UUIDs");
        let requested: std::collections::HashSet<&String> = log[0].0.iter().collect();
        assert!(requested.contains(&a.to_string()));
        assert!(requested.contains(&b.to_string()));
        assert!(requested.contains(&c.to_string()));
        drop(log);

        for p in out {
            let sec = p.security.as_ref().unwrap();
            assert!(!sec.is_link);
            assert!(["AAPL", "MSFT", "GOOG"].contains(&sec.issuer_name.as_str()));
        }
    }

    #[tokio::test]
    async fn cache_hit_skips_second_rpc() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let s1 = resolver.get_security(uuid, None).await.unwrap();
        let s2 = resolver.get_security(uuid, None).await.unwrap();

        assert_eq!(resolver.security_fetcher.log.lock().unwrap().len(), 1);
        assert_eq!(s1.issuer_name, "AAPL");
        assert_eq!(s2.issuer_name, "AAPL");
    }

    #[tokio::test]
    async fn cache_disabled_re_rpcs() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 0);

        resolver.get_security(uuid, None).await.unwrap();
        resolver.get_security(uuid, None).await.unwrap();

        assert_eq!(resolver.security_fetcher.log.lock().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn non_link_items_pass_through_unchanged() {
        let resolver = make_resolver(HashMap::new(), HashMap::new(), 1000);
        let p = PriceProto {
            object_class: "Price".into(),
            uuid: Some(uuid_to_proto(Uuid::new_v4())),
            security: Some(full_security(Uuid::new_v4(), "AAPL")),
            ..Default::default()
        };
        let out = resolver
            .resolve_securities_on_prices(vec![p])
            .await
            .unwrap();
        assert_eq!(resolver.security_fetcher.log.lock().unwrap().len(), 0);
        assert_eq!(out[0].security.as_ref().unwrap().issuer_name, "AAPL");
    }

    #[tokio::test]
    async fn items_missing_security_skipped_cleanly() {
        let resolver = make_resolver(HashMap::new(), HashMap::new(), 1000);
        let p = PriceProto {
            object_class: "Price".into(),
            uuid: Some(uuid_to_proto(Uuid::new_v4())),
            security: None,
            ..Default::default()
        };
        let out = resolver
            .resolve_securities_on_prices(vec![p])
            .await
            .unwrap();
        assert_eq!(resolver.security_fetcher.log.lock().unwrap().len(), 0);
        assert_eq!(out.len(), 1);
    }

    #[tokio::test]
    async fn cross_call_cache_reuse() {
        let a = Uuid::new_v4();
        let b = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(a.to_string(), full_security(a, "AAPL"));
        store.insert(b.to_string(), full_security(b, "MSFT"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        resolver
            .resolve_securities_on_prices(vec![link_price(a, None), link_price(b, None)])
            .await
            .unwrap();
        assert_eq!(resolver.security_fetcher.log.lock().unwrap().len(), 1);

        resolver
            .resolve_securities_on_prices(vec![link_price(a, None), link_price(b, None)])
            .await
            .unwrap();
        assert_eq!(
            resolver.security_fetcher.log.lock().unwrap().len(),
            1,
            "2nd call should be all cache hits"
        );
    }

    // ---------- as_of-aware ----------

    #[tokio::test]
    async fn link_without_as_of_omits_as_of_on_request() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        resolver
            .resolve_securities_on_prices(vec![link_price(uuid, None)])
            .await
            .unwrap();

        let log = resolver.security_fetcher.log.lock().unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].1, None);
    }

    #[tokio::test]
    async fn link_with_as_of_carries_as_of_on_request() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let t1 = as_of_at(1_700_000_000);
        resolver
            .resolve_securities_on_prices(vec![link_price(uuid, Some(t1))])
            .await
            .unwrap();

        let log = resolver.security_fetcher.log.lock().unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].1, Some(1_700_000_000));
    }

    #[tokio::test]
    async fn two_as_of_buckets_for_same_uuid_fire_separate_rpcs() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let t1 = as_of_at(1_700_000_000);
        let t2 = as_of_at(1_800_000_000);

        resolver
            .resolve_securities_on_prices(vec![
                link_price(uuid, Some(t1)),
                link_price(uuid, Some(t2)),
            ])
            .await
            .unwrap();

        let log = resolver.security_fetcher.log.lock().unwrap();
        assert_eq!(log.len(), 2);
        let seconds: std::collections::HashSet<Option<i64>> =
            log.iter().map(|e| e.1).collect();
        assert!(seconds.contains(&Some(1_700_000_000)));
        assert!(seconds.contains(&Some(1_800_000_000)));
    }

    #[tokio::test]
    async fn same_as_of_for_same_uuid_dedups_to_one_rpc() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let t_a = as_of_at(1_700_000_000);
        let t_b = as_of_at(1_700_000_000);

        resolver
            .resolve_securities_on_prices(vec![
                link_price(uuid, Some(t_a)),
                link_price(uuid, Some(t_b)),
            ])
            .await
            .unwrap();

        let log = resolver.security_fetcher.log.lock().unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].0.len(), 1, "same uuid in same as_of bucket → deduped");
    }

    #[tokio::test]
    async fn cache_key_includes_as_of() {
        let uuid = Uuid::new_v4();
        let mut store = HashMap::new();
        store.insert(uuid.to_string(), full_security(uuid, "AAPL"));
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let t1 = as_of_at(1_700_000_000);

        resolver.get_security(uuid, None).await.unwrap();
        assert_eq!(resolver.security_fetcher.log.lock().unwrap().len(), 1);

        resolver.get_security(uuid, Some(t1.clone())).await.unwrap();
        assert_eq!(
            resolver.security_fetcher.log.lock().unwrap().len(),
            2,
            "(uuid, t1) is a different cache key from (uuid, latest)"
        );

        resolver
            .get_security(uuid, Some(as_of_at(1_700_000_000)))
            .await
            .unwrap();
        assert_eq!(
            resolver.security_fetcher.log.lock().unwrap().len(),
            2,
            "cache hit on (uuid, t1) — proto-equal LocalTimestampProto serializes identically"
        );
    }

    // ---------- transaction (security + portfolio) ----------

    #[tokio::test]
    async fn resolve_both_security_and_portfolio_on_transactions() {
        let sec_a = Uuid::new_v4();
        let sec_b = Uuid::new_v4();
        let port_x = Uuid::new_v4();
        let port_y = Uuid::new_v4();

        let mut sec_store = HashMap::new();
        sec_store.insert(sec_a.to_string(), full_security(sec_a, "AAPL"));
        sec_store.insert(sec_b.to_string(), full_security(sec_b, "MSFT"));
        let mut port_store = HashMap::new();
        port_store.insert(port_x.to_string(), full_portfolio(port_x, "Strategy X"));
        port_store.insert(port_y.to_string(), full_portfolio(port_y, "Strategy Y"));

        let resolver = make_resolver(sec_store, port_store, 1000);

        let mk_txn = |sec_uuid: Uuid, port_uuid: Uuid| TransactionProto {
            object_class: "Transaction".into(),
            uuid: Some(uuid_to_proto(Uuid::new_v4())),
            security: Some(link_security(sec_uuid, None)),
            portfolio: Some(PortfolioProto {
                uuid: Some(uuid_to_proto(port_uuid)),
                is_link: true,
                ..Default::default()
            }),
            ..Default::default()
        };

        let txns = vec![
            mk_txn(sec_a, port_x),
            mk_txn(sec_b, port_y),
            mk_txn(sec_a, port_x),
        ];

        let with_sec = resolver
            .resolve_securities_on_transactions(txns)
            .await
            .unwrap();
        let hydrated = resolver
            .resolve_portfolios_on_transactions(with_sec)
            .await
            .unwrap();

        assert_eq!(
            resolver.security_fetcher.log.lock().unwrap().len(),
            1,
            "1 batched RPC for 2 unique securities"
        );
        assert_eq!(
            resolver.portfolio_fetcher.log.lock().unwrap().len(),
            1,
            "1 batched RPC for 2 unique portfolios"
        );

        for t in hydrated {
            assert!(!t.security.as_ref().unwrap().is_link);
            assert!(!t.portfolio.as_ref().unwrap().is_link);
            assert!(["AAPL", "MSFT"]
                .contains(&t.security.as_ref().unwrap().issuer_name.as_str()));
            assert!(["Strategy X", "Strategy Y"]
                .contains(&t.portfolio.as_ref().unwrap().portfolio_name.as_str()));
        }
    }

    // ---------- LinkCache write-through ----------

    fn full_security_with_as_of(uuid: Uuid, name: &str, as_of: LocalTimestampProto) -> SecurityProto {
        SecurityProto {
            object_class: "Security".into(),
            version: "0.0.1".into(),
            uuid: Some(uuid_to_proto(uuid)),
            as_of: Some(as_of),
            is_link: false,
            issuer_name: name.into(),
            ..Default::default()
        }
    }

    fn full_portfolio_with_as_of(uuid: Uuid, name: &str, as_of: LocalTimestampProto) -> PortfolioProto {
        PortfolioProto {
            object_class: "Portfolio".into(),
            version: "0.0.1".into(),
            uuid: Some(uuid_to_proto(uuid)),
            as_of: Some(as_of),
            is_link: false,
            portfolio_name: name.into(),
            ..Default::default()
        }
    }

    #[tokio::test]
    async fn get_security_populates_link_cache() {
        link_cache::security().clear();
        let uuid = Uuid::new_v4();
        let as_of = as_of_at(1_700_000_000);
        let mut store = HashMap::new();
        store.insert(
            uuid.to_string(),
            full_security_with_as_of(uuid, "ACME", as_of.clone()),
        );
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let out = resolver.get_security(uuid, Some(as_of.clone())).await.unwrap();
        assert_eq!(out.issuer_name, "ACME");

        let cached = link_cache::security().get(uuid, Some(&as_of));
        assert!(cached.is_some(), "link_cache::security() must contain the resolved proto");
        assert_eq!(cached.unwrap().issuer_name, "ACME");
        link_cache::security().clear();
    }

    #[tokio::test]
    async fn get_portfolio_populates_link_cache() {
        link_cache::portfolio().clear();
        let uuid = Uuid::new_v4();
        let as_of = as_of_at(1_700_000_001);
        let mut store = HashMap::new();
        store.insert(
            uuid.to_string(),
            full_portfolio_with_as_of(uuid, "Strategy Z", as_of.clone()),
        );
        let resolver = make_resolver(HashMap::new(), store, 1000);

        let out = resolver.get_portfolio(uuid, Some(as_of.clone())).await.unwrap();
        assert_eq!(out.portfolio_name, "Strategy Z");

        let cached = link_cache::portfolio().get(uuid, Some(&as_of));
        assert!(cached.is_some(), "link_cache::portfolio() must contain the resolved proto");
        assert_eq!(cached.unwrap().portfolio_name, "Strategy Z");
        link_cache::portfolio().clear();
    }

    #[tokio::test]
    async fn bulk_resolve_securities_on_prices_populates_link_cache() {
        link_cache::security().clear();
        let uuid = Uuid::new_v4();
        let as_of = as_of_at(1_700_000_002);
        let mut store = HashMap::new();
        store.insert(
            uuid.to_string(),
            full_security_with_as_of(uuid, "BULK", as_of.clone()),
        );
        let resolver = make_resolver(store, HashMap::new(), 1000);

        let price = link_price(uuid, Some(as_of.clone()));
        let _ = resolver.resolve_securities_on_prices(vec![price]).await.unwrap();

        let cached = link_cache::security().get(uuid, Some(&as_of));
        assert!(cached.is_some(), "bulk resolve must populate link_cache::security()");
        assert_eq!(cached.unwrap().issuer_name, "BULK");
        link_cache::security().clear();
    }
}
