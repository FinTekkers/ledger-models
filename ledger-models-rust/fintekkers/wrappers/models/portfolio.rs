use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use crate::fintekkers::wrappers::util::link_cache;
use crate::fintekkers::wrappers::util::link_resolver::LinkResolverError;
use std::sync::{Arc, OnceLock, RwLock};
use uuid::Uuid;

// ---------- Fetcher hook (parity with Java/Python/TS Portfolio fetchers) ----------

/// Sync fetcher signature: "(uuid, as_of) → PortfolioProto". Mirrors
/// [`crate::fintekkers::wrappers::models::security::SecurityFetchFn`].
/// Closure-typed (rather than trait-typed) for the same reason — implementers
/// just provide a function of this shape and we don't introduce a new
/// interface that would track gRPC evolution.
pub type PortfolioFetchFn = Arc<
    dyn Fn(Uuid, Option<&LocalTimestampProto>) -> Result<PortfolioProto, LinkResolverError>
        + Send
        + Sync,
>;

static PORTFOLIO_FETCHER: OnceLock<RwLock<Option<PortfolioFetchFn>>> = OnceLock::new();

fn portfolio_fetcher_slot() -> &'static RwLock<Option<PortfolioFetchFn>> {
    PORTFOLIO_FETCHER.get_or_init(|| RwLock::new(None))
}

/// Register the fetcher used when a link-mode `PortfolioWrapper` misses the
/// `LinkCache`. Called once at process start by the service-client layer;
/// tests register a closure that returns canned protos.
/// See `docs/adr/lazy-link-hydration.md`.
pub fn set_portfolio_fetcher(fetcher: PortfolioFetchFn) {
    *portfolio_fetcher_slot().write().unwrap() = Some(fetcher);
}

/// Test helper — clear any registered fetcher.
pub fn clear_portfolio_fetcher() {
    *portfolio_fetcher_slot().write().unwrap() = None;
}

fn current_portfolio_fetcher() -> Option<PortfolioFetchFn> {
    {
        let read = portfolio_fetcher_slot().read().unwrap();
        if let Some(f) = read.as_ref() {
            return Some(f.clone());
        }
    }
    let mut write = portfolio_fetcher_slot().write().unwrap();
    if write.is_none() {
        *write = Some(default_portfolio_fetch_fn());
    }
    write.clone()
}

// ---------- Default gRPC fetcher ----------
//
// Same worker-thread + tokio runtime + mpsc bridge as SecurityWrapper —
// the sync wrapper API calls into the worker, which owns an async
// PortfolioClient and a tokio runtime.

use crate::fintekkers::services::portfolio_service::portfolio_client::PortfolioClient;
use crate::fintekkers::requests::portfolio::{
    QueryPortfolioRequestProto, QueryPortfolioResponseProto,
};
use std::sync::mpsc;

struct PortfolioFetchRequest {
    uuid: Uuid,
    as_of: Option<LocalTimestampProto>,
    reply: mpsc::Sender<Result<PortfolioProto, LinkResolverError>>,
}

static PORTFOLIO_WORKER_TX: OnceLock<mpsc::Sender<PortfolioFetchRequest>> = OnceLock::new();

fn portfolio_worker_tx() -> mpsc::Sender<PortfolioFetchRequest> {
    PORTFOLIO_WORKER_TX
        .get_or_init(spawn_portfolio_worker)
        .clone()
}

fn spawn_portfolio_worker() -> mpsc::Sender<PortfolioFetchRequest> {
    let (tx, rx) = mpsc::channel::<PortfolioFetchRequest>();
    std::thread::Builder::new()
        .name("portfolio-fetcher".into())
        .spawn(move || {
            let rt = tokio::runtime::Builder::new_multi_thread()
                .worker_threads(1)
                .enable_all()
                .build()
                .expect("failed to build default portfolio-fetcher runtime");
            rt.block_on(async move {
                let mut client: Option<PortfolioClient<tonic::transport::Channel>> = None;
                while let Ok(req) = rx.recv() {
                    let client_ref = match &mut client {
                        Some(c) => c,
                        None => {
                            match connect_default_portfolio_client().await {
                                Ok(c) => {
                                    client = Some(c);
                                    client.as_mut().unwrap()
                                }
                                Err(e) => {
                                    let _ = req.reply.send(Err(e));
                                    continue;
                                }
                            }
                        }
                    };
                    let request = QueryPortfolioRequestProto {
                        object_class: "PortfolioRequest".into(),
                        version: "0.0.1".into(),
                        uu_ids: vec![UuidProto { raw_uuid: req.uuid.as_bytes().to_vec() }],
                        as_of: req.as_of,
                        ..Default::default()
                    };
                    let result: Result<PortfolioProto, LinkResolverError> = client_ref
                        .get_by_ids(request)
                        .await
                        .map_err(LinkResolverError::Rpc)
                        .and_then(|resp: tonic::Response<QueryPortfolioResponseProto>| {
                            resp.into_inner()
                                .portfolio_response
                                .into_iter()
                                .next()
                                .ok_or(LinkResolverError::NotFound {
                                    uuid: req.uuid,
                                    as_of_bucket: "latest".to_string(),
                                })
                        });
                    let _ = req.reply.send(result);
                }
            });
        })
        .expect("failed to spawn portfolio-fetcher worker");
    tx
}

async fn connect_default_portfolio_client(
) -> Result<PortfolioClient<tonic::transport::Channel>, LinkResolverError> {
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://api.fintekkers.org".to_string());
    let endpoint = if url.contains(':') {
        url
    } else {
        // PortfolioService default port matches Python ServiceType convention.
        format!("{}:8081", url)
    };
    let channel = tonic::transport::Channel::from_shared(endpoint)
        .map_err(|e| LinkResolverError::Malformed(e.to_string()))?
        .connect()
        .await
        .map_err(|e| LinkResolverError::Malformed(e.to_string()))?;
    Ok(PortfolioClient::new(channel))
}

fn default_portfolio_fetch_fn() -> PortfolioFetchFn {
    Arc::new(|uuid, as_of| {
        let (reply_tx, reply_rx) = mpsc::channel();
        portfolio_worker_tx()
            .send(PortfolioFetchRequest {
                uuid,
                as_of: as_of.cloned(),
                reply: reply_tx,
            })
            .map_err(|e| LinkResolverError::Malformed(format!("fetcher worker gone: {}", e)))?;
        reply_rx
            .recv()
            .map_err(|e| LinkResolverError::Malformed(format!("fetcher worker hung up: {}", e)))?
    })
}

pub struct PortfolioWrapper {
    proto: PortfolioProto,
    /// Lazy hydration slot. Mirror of SecurityWrapper.resolved — see
    /// docs/adr/lazy-link-hydration.md.
    resolved: OnceLock<PortfolioProto>,
}

impl AsRef<PortfolioProto> for PortfolioWrapper {
    fn as_ref(&self) -> &PortfolioProto {
        &self.proto
    }
}

impl PortfolioWrapper {
    pub fn new(proto: PortfolioProto) -> Self {
        PortfolioWrapper { proto, resolved: OnceLock::new() }
    }

    /// True iff the original wrapped proto was a link reference. Stays
    /// reflective of the constructor-time proto even after hydration —
    /// matches SecurityWrapper.
    pub fn is_link(&self) -> bool {
        self.proto.is_link
    }

    fn active(&self) -> &PortfolioProto {
        self.resolved.get().unwrap_or(&self.proto)
    }

    /// Lazy hydration. On a link-mode proto, look up the LinkCache first;
    /// on a miss, fall back to the registered fetcher (see
    /// [`set_portfolio_fetcher`]) and write through to the cache. Mirrors
    /// `SecurityWrapper::ensure_hydrated`. Panics only when both paths are
    /// exhausted (cache empty AND no fetcher registered), which is a
    /// deployment bug.
    fn ensure_hydrated(&self) {
        if !self.proto.is_link {
            return;
        }
        if self.resolved.get().is_some() {
            return;
        }
        let uuid_proto = self.proto.uuid.as_ref()
            .expect("Cannot read fields on link-mode PortfolioWrapper with no UUID set");
        let uuid_bytes: [u8; 16] = uuid_proto.raw_uuid.as_slice().try_into()
            .expect("PortfolioWrapper UUID must be 16 bytes");
        let uuid = uuid::Uuid::from_bytes(uuid_bytes);
        let as_of = self.proto.as_of.as_ref();

        // 1. Cache hit?
        if let Some(arc) = link_cache::portfolio().get(uuid, as_of) {
            let _ = self.resolved.set((*arc).clone());
            return;
        }

        // 2. Fetcher fallback.
        if let Some(fetcher) = current_portfolio_fetcher() {
            match fetcher(uuid, as_of) {
                Ok(resolved) => {
                    let resolved_as_of = resolved.as_of.clone().or_else(|| as_of.cloned());
                    link_cache::portfolio().put(uuid, resolved.clone(), resolved_as_of);
                    let _ = self.resolved.set(resolved);
                    return;
                }
                Err(e) => panic!(
                    "Cannot read fields on link-mode PortfolioWrapper uuid={} \
                     — fetcher returned error: {}. See docs/adr/lazy-link-hydration.md.",
                    uuid, e
                ),
            }
        }

        // 3. No cache, no fetcher.
        panic!(
            "Cannot read fields on link-mode PortfolioWrapper uuid={} \
             — LinkCache miss and no fetcher registered. \
             Call portfolio::set_portfolio_fetcher(...) at process start, \
             or pre-warm via LinkResolver. \
             See docs/adr/lazy-link-hydration.md.",
            uuid
        );
    }

    pub fn portfolio_name(&self) -> &str {
        self.ensure_hydrated();
        &self.active().portfolio_name
    }
}

pub struct PortfolioProtoBuilder {
    as_of: LocalTimestampWrapper,
    valid_from: LocalTimestampWrapper,
    valid_to: Option<LocalTimestampWrapper>,

    object_class: String,
    version: String,
    is_link: bool,

    uuid: UUIDWrapper,
    portfolio_name: String,
}

impl PortfolioProtoBuilder {
    pub fn new() -> PortfolioProtoBuilder {
        let uuid = UUIDWrapper::new_random();
        let uuid_str = uuid.to_string();

        PortfolioProtoBuilder {
            as_of: LocalTimestampWrapper::now(),
            valid_from: LocalTimestampWrapper::now(),
            valid_to: None,

            object_class: "Portfolio".to_string(),
            version: "0.0.1".to_string(),
            is_link: false,

            uuid: UUIDWrapper::new_random(),
            portfolio_name: uuid_str,
        }
    }

    pub fn as_of(mut self, as_of: LocalTimestampWrapper) -> Self {
        self.as_of = as_of.into();
        self
    }

    pub fn valid_from(mut self, valid_from: LocalTimestampWrapper) -> Self {
        self.valid_from = valid_from.into();
        self
    }

    pub fn valid_to(mut self, valid_to: LocalTimestampWrapper) -> Self {
        self.valid_to = valid_to.into();
        self
    }

    pub fn object_class(mut self, object_class: String) -> PortfolioProtoBuilder {
        self.object_class = object_class;
        self
    }

    pub fn version(mut self, version: String) -> PortfolioProtoBuilder {
        self.version = version;
        self
    }

    pub fn uuid(mut self, uuid: UUIDWrapper) -> PortfolioProtoBuilder {
        self.uuid = uuid;
        self
    }

    pub fn is_link(mut self, is_link: bool) -> PortfolioProtoBuilder {
        self.is_link = is_link;
        self
    }

    pub fn portfolio_name(mut self, portfolio_name: String) -> PortfolioProtoBuilder {
        self.portfolio_name = portfolio_name;
        self
    }

    pub fn build(self) -> Result<PortfolioProto, Error> {
        let valid_to = match self.valid_to {
            Some(..) => Some(self.valid_to.unwrap().proto),
            None => None
        };

        Ok(PortfolioProto {
            as_of: Some(self.as_of.into()),
            valid_from: Some(self.valid_from.into()),
            valid_to,

            object_class: self.object_class,
            version: self.version,
            is_link: self.is_link,

            uuid: Some(self.uuid.into()),
            portfolio_name: self.portfolio_name,
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_portfolio_name() {
        let portfolio = PortfolioWrapper::new(PortfolioProto {
            as_of: None,
            valid_from: None,
            valid_to: None,

            object_class: "Portfolio".to_string(),
            version: "0.01".to_string(),
            uuid: None,
            is_link: false,
            portfolio_name: "Dummy Name".to_string(),
        });

        assert_eq!(portfolio.portfolio_name(), "Dummy Name");
    }

    // ---- Lazy hydrate (FinTekkers/second-brain — lazy-link-hydration ADR) ----

    use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
    use prost_types::Timestamp;
    use uuid::Uuid;

    fn make_as_of(seconds: i64) -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp { seconds, nanos: 0 }),
            time_zone: "UTC".to_string(),
        }
    }

    fn full_portfolio(uuid: Uuid, as_of: LocalTimestampProto, name: &str) -> PortfolioProto {
        PortfolioProto {
            object_class: "Portfolio".to_string(),
            version: "0.0.1".to_string(),
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: false,
            portfolio_name: name.to_string(),
            ..Default::default()
        }
    }

    fn link_portfolio(uuid: Uuid, as_of: LocalTimestampProto) -> PortfolioProto {
        PortfolioProto {
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: true,
            ..Default::default()
        }
    }

    #[test]
    fn lazy_portfolio_name_on_link_hydrates_from_cache() {
        // Fresh uuid → targeted evict() at end; never call clear() (it
        // wipes entries owned by tests running in parallel).
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(1_700_000_000);
        let resolved = full_portfolio(uuid, as_of.clone(), "Strategy Z");
        link_cache::portfolio().put(uuid, resolved, Some(as_of.clone()));

        let p = PortfolioWrapper::new(link_portfolio(uuid, as_of));
        assert!(p.is_link());
        assert_eq!(p.portfolio_name(), "Strategy Z");
        link_cache::portfolio().evict(uuid);
    }

    // ---- Fetcher path (parity with SecurityWrapper's lazy_e tests) ----
    use super::{set_portfolio_fetcher, clear_portfolio_fetcher};
    use crate::fintekkers::wrappers::util::link_resolver::LinkResolverError;
    use std::sync::{Arc, Mutex};
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// Single-threaded gate for fetcher-path tests. Mirrors
    /// `FETCHER_TEST_LOCK` in security.rs.
    static FETCHER_TEST_LOCK: Mutex<()> = Mutex::new(());

    #[test]
    fn lazy_e_cache_miss_calls_fetcher_then_writes_through_then_error_panics() {
        // Mirrors the SecurityWrapper happy-path + error-path test. Two
        // sub-assertions in one test to avoid the global-fetcher-slot race
        // between parallel #[test] cases. Never call clear() on
        // link_cache::portfolio() — wipes parallel tests' entries.
        use std::panic;

        let _serialize = FETCHER_TEST_LOCK.lock().expect("test lock poisoned");

        // ---- Sub-assertion 1: happy path ----
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(1_700_000_040);
        let resolved = full_portfolio(uuid, as_of.clone(), "FROM-FETCHER");
        let calls = Arc::new(AtomicUsize::new(0));
        let calls_inner = calls.clone();
        set_portfolio_fetcher(Arc::new(move |_uuid, _as_of| {
            calls_inner.fetch_add(1, Ordering::SeqCst);
            Ok(resolved.clone())
        }));

        let wrapper = PortfolioWrapper::new(link_portfolio(uuid, as_of.clone()));
        assert_eq!(wrapper.portfolio_name(), "FROM-FETCHER");
        assert_eq!(calls.load(Ordering::SeqCst), 1);

        let cached = link_cache::portfolio().get(uuid, Some(&as_of));
        assert!(cached.is_some(), "fetcher must write-through to LinkCache");

        let wrapper2 = PortfolioWrapper::new(link_portfolio(uuid, as_of.clone()));
        assert_eq!(wrapper2.portfolio_name(), "FROM-FETCHER");
        assert_eq!(
            calls.load(Ordering::SeqCst),
            1,
            "second read must hit cache, not refetch"
        );

        // ---- Sub-assertion 2: error path ----
        set_portfolio_fetcher(Arc::new(|uuid, _as_of| {
            Err(LinkResolverError::NotFound {
                uuid,
                as_of_bucket: "latest".to_string(),
            })
        }));
        let err_uuid = Uuid::new_v4();
        let wrapper_err = PortfolioWrapper::new(link_portfolio(err_uuid, make_as_of(1_700_000_050)));
        let panic_result = panic::catch_unwind(panic::AssertUnwindSafe(|| {
            let _ = wrapper_err.portfolio_name();
        }));
        assert!(panic_result.is_err(), "accessor read must panic on fetcher error");
        let panic_msg = panic_result
            .err()
            .and_then(|e| {
                e.downcast_ref::<String>().cloned().or_else(|| {
                    e.downcast_ref::<&str>().map(|s| s.to_string())
                })
            })
            .unwrap_or_default();
        assert!(
            panic_msg.contains("fetcher returned error"),
            "panic message should include 'fetcher returned error', got: {panic_msg}"
        );

        clear_portfolio_fetcher();
        link_cache::portfolio().evict(uuid);
        link_cache::portfolio().evict(err_uuid);
    }

    #[test]
    fn test_portfolio_builder() {
        let proto = PortfolioProtoBuilder::new()
            .portfolio_name("Portfolio".to_string())
            .build().unwrap();

        assert!(proto.portfolio_name.contains("Portfolio"));

        let proto2 = PortfolioProtoBuilder::new()
            .build().unwrap();

        //Check it's 36 chars long and has a hyphen (i.e. its the UUID)
        assert!(proto2.portfolio_name.contains("-"));
        assert_eq!(36, proto2.portfolio_name.len())
    }
}