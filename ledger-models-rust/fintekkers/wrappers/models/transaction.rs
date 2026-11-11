use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::position::PositionStatusProto;
use crate::fintekkers::models::price::{PriceProto, PriceTypeProto};
use crate::fintekkers::models::security::security_proto::NonBondDetails;
use crate::fintekkers::models::security::{ProductTypeProto, SecurityProto};
use crate::fintekkers::models::transaction::{TransactionProto, TransactionTypeProto};
use crate::fintekkers::models::util::{LocalDateProto, LocalTimestampProto, ObjectTypeProto, UuidProto};
use crate::fintekkers::requests::transaction::CreateTransactionRequestProto;
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::wrappers::models::default_price_types::resolve_trade_price_type;
use crate::fintekkers::wrappers::models::product_inputs::ProductInputError;
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::decimal::decimal_proto;
use crate::fintekkers::wrappers::models::portfolio::PortfolioWrapper;
use crate::fintekkers::wrappers::models::security::{validate_security, SecurityWrapper};
use crate::fintekkers::wrappers::models::utils::errors::{object_id_of, Error};
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use chrono::{DateTime, Datelike, NaiveDate};
use chrono_tz::Tz;
use rust_decimal::Decimal;
use crate::fintekkers::wrappers::util::link_cache;
use crate::fintekkers::wrappers::util::link_resolver::LinkResolverError;
use crate::fintekkers::wrappers::util::service_address::{
    self, Service, ServiceAddress, ServiceAddressError,
};
use std::collections::HashSet;
use std::sync::{Arc, OnceLock, RwLock};
use uuid::Uuid;

// ---------- Fetcher hook (parity with Security/Portfolio wrappers) ----------

/// Sync fetcher signature: "(uuid, as_of) → TransactionProto". Mirrors
/// [`crate::fintekkers::wrappers::models::security::SecurityFetchFn`] and
/// [`crate::fintekkers::wrappers::models::portfolio::PortfolioFetchFn`].
pub type TransactionFetchFn = Arc<
    dyn Fn(Uuid, Option<&LocalTimestampProto>) -> Result<TransactionProto, LinkResolverError>
        + Send
        + Sync,
>;

static TRANSACTION_FETCHER: OnceLock<RwLock<Option<TransactionFetchFn>>> = OnceLock::new();

fn transaction_fetcher_slot() -> &'static RwLock<Option<TransactionFetchFn>> {
    TRANSACTION_FETCHER.get_or_init(|| RwLock::new(None))
}

/// Register the fetcher used when a link-mode `TransactionWrapper` misses the
/// `LinkCache`. Called once at process start by the service-client layer;
/// tests register a closure that returns canned protos.
pub fn set_transaction_fetcher(fetcher: TransactionFetchFn) {
    *transaction_fetcher_slot().write().unwrap() = Some(fetcher);
}

/// Test helper — clear any registered fetcher.
pub fn clear_transaction_fetcher() {
    *transaction_fetcher_slot().write().unwrap() = None;
}

fn current_transaction_fetcher() -> Option<TransactionFetchFn> {
    {
        let read = transaction_fetcher_slot().read().unwrap();
        if let Some(f) = read.as_ref() {
            return Some(f.clone());
        }
    }
    let mut write = transaction_fetcher_slot().write().unwrap();
    if write.is_none() {
        *write = Some(default_transaction_fetch_fn());
    }
    write.clone()
}

// ---------- Default gRPC fetcher ----------

use crate::fintekkers::services::transaction_service::transaction_client::TransactionClient;
use crate::fintekkers::requests::transaction::QueryTransactionResponseProto;
use crate::fintekkers::wrappers::util::object_types;
use std::sync::mpsc;

struct TransactionFetchRequest {
    uuid: Uuid,
    as_of: Option<LocalTimestampProto>,
    reply: mpsc::Sender<Result<TransactionProto, LinkResolverError>>,
}

static TRANSACTION_WORKER_TX: OnceLock<mpsc::Sender<TransactionFetchRequest>> = OnceLock::new();

fn transaction_worker_tx() -> mpsc::Sender<TransactionFetchRequest> {
    TRANSACTION_WORKER_TX
        .get_or_init(spawn_transaction_worker)
        .clone()
}

fn spawn_transaction_worker() -> mpsc::Sender<TransactionFetchRequest> {
    let (tx, rx) = mpsc::channel::<TransactionFetchRequest>();
    std::thread::Builder::new()
        .name("transaction-fetcher".into())
        .spawn(move || {
            let rt = tokio::runtime::Builder::new_multi_thread()
                .worker_threads(1)
                .enable_all()
                .build()
                .expect("failed to build default transaction-fetcher runtime");
            rt.block_on(async move {
                let mut client: Option<TransactionClient<tonic::transport::Channel>> = None;
                while let Ok(req) = rx.recv() {
                    let client_ref = match &mut client {
                        Some(c) => c,
                        None => {
                            match connect_default_transaction_client().await {
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
                    let request = object_types::query_transaction_request(
                        vec![UuidProto { raw_uuid: req.uuid.as_bytes().to_vec() }],
                        req.as_of,
                    );
                    let result: Result<TransactionProto, LinkResolverError> = client_ref
                        .get_by_ids(request)
                        .await
                        .map_err(LinkResolverError::Rpc)
                        .and_then(|resp: tonic::Response<QueryTransactionResponseProto>| {
                            resp.into_inner()
                                .transaction_response
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
        .expect("failed to spawn transaction-fetcher worker");
    tx
}

/// Where the default transaction client connects: the broker when `BROKER_HOST`
/// is set, else `LEDGER_SERVICE_HOST/_PORT`, else `API_URL`, else
/// `localhost`, on the ledger port. `env` is a variable lookup, so tests
/// can check this without touching the process environment.
pub(crate) fn default_transaction_endpoint_with(
    env: impl Fn(&str) -> Option<String>,
) -> Result<ServiceAddress, ServiceAddressError> {
    service_address::resolve_with(Service::Transaction, env)
}

async fn connect_default_transaction_client(
) -> Result<TransactionClient<tonic::transport::Channel>, LinkResolverError> {
    let address = default_transaction_endpoint_with(|name| std::env::var(name).ok())
        .map_err(|e| LinkResolverError::Malformed(e.to_string()))?;
    let channel = address
        .endpoint()
        .map_err(|e| LinkResolverError::Malformed(e.to_string()))?
        .connect()
        .await
        .map_err(|e| LinkResolverError::Malformed(e.to_string()))?;
    Ok(TransactionClient::new(channel))
}

fn default_transaction_fetch_fn() -> TransactionFetchFn {
    Arc::new(|uuid, as_of| {
        let (reply_tx, reply_rx) = mpsc::channel();
        transaction_worker_tx()
            .send(TransactionFetchRequest {
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

// ---------- Wrapper ----------

/// Nested Price defaults, filled once at construction (parity with Java
/// `Transaction(TransactionProto)`, Python `Transaction.__init__` and the JS
/// `Transaction` constructor): a non-link price with no UUID (unset or empty
/// raw_uuid) gets a random UUID; a non-link price with no as_of gets the
/// transaction's as_of, the rule Python `create_from` and JS `Price.create`
/// use. Set values are never overwritten; link prices pass through as sent.
/// The nested security has its own fill: `fill_security_defaults`.
fn fill_price_defaults(mut proto: TransactionProto) -> TransactionProto {
    let txn_as_of = proto.as_of.clone();
    if let Some(price) = proto.price.as_mut().filter(|p| !p.is_link) {
        if price.uuid.as_ref().map_or(true, |u| u.raw_uuid.is_empty()) {
            price.uuid = Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() });
        }
        if price.as_of.is_none() {
            price.as_of = txn_as_of;
        }
    }
    proto
}

fn missing_uuid(uuid: &Option<UuidProto>) -> bool {
    uuid.as_ref().map_or(true, |u| u.raw_uuid.is_empty())
}

/// Nested Security defaults, filled once at construction (LM-276, parity with
/// Java `Transaction(TransactionProto)`, Python `Transaction.__init__` and the
/// JS `Transaction` constructor): a non-link security with no UUID (unset or
/// empty raw_uuid) gets a random UUID, and so does its non-link
/// settlement_currency. Without this, `security()` wraps a UUID-less proto with
/// no stable ID. Set UUIDs are never overwritten; a link security (and anything
/// inside it) and a link currency pass through as sent. Applies to the wrapped
/// proto only, not to a proto hydrated later via `resolved`.
fn fill_security_defaults(mut proto: TransactionProto) -> TransactionProto {
    if let Some(security) = proto.security.as_mut().filter(|s| !s.is_link) {
        if missing_uuid(&security.uuid) {
            security.uuid = Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() });
        }
        if let Some(currency) = security.settlement_currency.as_mut().filter(|c| !c.is_link) {
            if missing_uuid(&currency.uuid) {
                currency.uuid = Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() });
            }
        }
    }
    proto
}

pub struct TransactionWrapper {
    proto: TransactionProto,
    /// Lazy hydration slot. Mirror of SecurityWrapper.resolved.
    resolved: OnceLock<TransactionProto>,
}

impl AsRef<TransactionProto> for TransactionWrapper {
    fn as_ref(&self) -> &TransactionProto {
        &self.proto
    }
}

impl TransactionWrapper {
    pub fn new(proto: TransactionProto) -> Self {
        TransactionWrapper { proto: fill_security_defaults(fill_price_defaults(proto)), resolved: OnceLock::new() }
    }

    /// True iff the original wrapped proto was a link reference. Mirrors
    /// SecurityWrapper / PortfolioWrapper.
    pub fn is_link(&self) -> bool {
        self.proto.is_link
    }

    pub fn uuid_wrapper(&self) -> UUIDWrapper {
        UUIDWrapper::new(self.proto.uuid.as_ref().unwrap().clone())
    }

    /// The transaction's as_of. Unset or a blank time zone is
    /// `Error::Validation` naming `transaction.as_of` /
    /// `transaction.as_of.time_zone`; never defaulted. `new` stays
    /// infallible, so this is where Rust rejects the input.
    pub fn try_as_of(&self) -> Result<DateTime<Tz>, Error> {
        ProtoSerializationUtil::deserialize_required_timestamp(self.proto.as_of.as_ref(), "transaction.as_of")
    }

    fn active(&self) -> &TransactionProto {
        self.resolved.get().unwrap_or(&self.proto)
    }

    /// Lazy hydration. On a link-mode proto, look up the LinkCache first;
    /// on a miss, fall back to the registered fetcher (see
    /// [`set_transaction_fetcher`]) and write through to the cache. Mirrors
    /// Java / Python / TS wrapper behavior.
    fn ensure_hydrated(&self) {
        if !self.proto.is_link {
            return;
        }
        if self.resolved.get().is_some() {
            return;
        }
        let uuid_proto = self.proto.uuid.as_ref()
            .expect("Cannot read fields on link-mode TransactionWrapper with no UUID set");
        let uuid_bytes: [u8; 16] = uuid_proto.raw_uuid.as_slice().try_into()
            .expect("TransactionWrapper UUID must be 16 bytes");
        let uuid = Uuid::from_bytes(uuid_bytes);
        let as_of = self.proto.as_of.as_ref();

        // 1. Cache hit?
        if let Some(arc) = link_cache::transaction().get(uuid, as_of) {
            let _ = self.resolved.set((*arc).clone());
            return;
        }

        // 2. Fetcher fallback.
        if let Some(fetcher) = current_transaction_fetcher() {
            match fetcher(uuid, as_of) {
                Ok(resolved) => {
                    let resolved_as_of = resolved.as_of.clone().or_else(|| as_of.cloned());
                    link_cache::transaction().put(uuid, resolved.clone(), resolved_as_of);
                    let _ = self.resolved.set(resolved);
                    return;
                }
                Err(e) => panic!(
                    "Cannot read fields on link-mode TransactionWrapper uuid={} \
                     — fetcher returned error: {}. See docs/adr/lazy-link-hydration.md.",
                    uuid, e
                ),
            }
        }

        // 3. No cache, no fetcher.
        panic!(
            "Cannot read fields on link-mode TransactionWrapper uuid={} \
             — LinkCache miss and no fetcher registered. \
             Call transaction::set_transaction_fetcher(...) at process start, \
             or pre-warm via LinkResolver. \
             See docs/adr/lazy-link-hydration.md.",
            uuid
        );
    }

    // ---------- accessors ----------

    /// Returns the transaction's `transaction_type` enum value as i32.
    pub fn transaction_type_i32(&self) -> i32 {
        self.ensure_hydrated();
        self.active().transaction_type
    }

    /// Returns the trade name string. Empty when not set.
    pub fn trade_name(&self) -> &str {
        self.ensure_hydrated();
        &self.active().trade_name
    }

    /// Returns true if the transaction is marked cancelled.
    pub fn is_cancelled(&self) -> bool {
        self.ensure_hydrated();
        self.active().is_cancelled
    }

    /// Returns the position status enum value as i32.
    pub fn position_status_i32(&self) -> i32 {
        self.ensure_hydrated();
        self.active().position_status
    }

    /// Embedded Security as a wrapper. Returns `None` if the underlying
    /// proto has no security set. The returned `SecurityWrapper` is itself
    /// lazy — link-mode embedded securities hydrate on accessor read via
    /// the security `LinkCache` + Fetcher path.
    pub fn security(&self) -> Option<SecurityWrapper> {
        self.ensure_hydrated();
        self.active().security.as_ref().map(|s| SecurityWrapper::new(s.clone()))
    }

    /// Embedded Portfolio as a wrapper. Same lazy semantic as `security()`.
    pub fn portfolio(&self) -> Option<PortfolioWrapper> {
        self.ensure_hydrated();
        self.active().portfolio.as_ref().map(|p| PortfolioWrapper::new(p.clone()))
    }
}

/// Field-path prefix for the inline security's violations.
pub const SECURITY_PREFIX: &str = "security.";
/// Field path of the child list; violations are on `child_transactions[i]`.
pub const CHILD_TRANSACTIONS: &str = "child_transactions";
/// Message prefix of the second-cash-child violation, the same in every language.
pub const SECOND_CASH_CHILD: &str = "second cash child";
/// Message prefix of the repeated-child-ID violation, the same in every language.
pub const DUPLICATE_CHILD_ID: &str = "duplicate child id";

/// Transaction input rules: Rust counterpart of Java's
/// `TransactionRules.validate` (docs/adr/typed-input-errors.md). Pure: proto
/// in, violations out. [`validate_security`] runs on an inline security, with
/// field paths prefixed `security.`. Child structure (LM-438) is checked at
/// every level of `child_transactions`: at most one cash child, and no two
/// children with the same UUID. Each violation is on `child_transactions[i]`
/// (nested: `child_transactions[1].child_transactions[0]`) and its
/// `object_id` is the UUID of the transaction that owns the list. A child
/// with no UUID, or an empty one, is never a duplicate. A child whose
/// security is a link is not counted as cash: hydrate it first.
/// `TransactionWrapper::new` does not call this, so stored rows that break a
/// rule still load; writers call it before sending.
pub fn validate_transaction(proto: &TransactionProto) -> Vec<FieldViolationProto> {
    let mut out: Vec<FieldViolationProto> = proto
        .security
        .as_ref()
        .map(validate_security)
        .unwrap_or_default()
        .into_iter()
        .map(|mut v| {
            v.field = format!("{SECURITY_PREFIX}{}", v.field);
            v
        })
        .collect();
    add_child_violations(proto, "", &mut out);
    out
}

/// `Err(Error::Validation(..))` carrying every violation if
/// [`validate_transaction`] finds any.
pub fn require_valid_transaction(proto: &TransactionProto) -> Result<(), Error> {
    let violations = validate_transaction(proto);
    if violations.is_empty() {
        Ok(())
    } else {
        Err(Error::Validation(violations))
    }
}

fn add_child_violations(parent: &TransactionProto, prefix: &str, out: &mut Vec<FieldViolationProto>) {
    let parent_uuid = object_id_of(parent.uuid.as_ref());
    let parent_id = display_id(parent_uuid.as_ref());
    let mut first_cash: Option<String> = None;
    let mut seen_ids: HashSet<Vec<u8>> = HashSet::new();
    for (i, child) in parent.child_transactions.iter().enumerate() {
        let field = format!("{prefix}{CHILD_TRANSACTIONS}[{i}]");
        let child_uuid = object_id_of(child.uuid.as_ref());
        let child_id = display_id(child_uuid.as_ref());
        if is_cash_child(child) {
            match &first_cash {
                Some(first) => out.push(FieldViolationProto {
                    field: field.clone(),
                    object_id: parent_uuid.clone(),
                    message: format!(
                        "{SECOND_CASH_CHILD}: transaction {parent_id} already has cash child {first}; {child_id} is a second one"
                    ),
                }),
                None => first_cash = Some(child_id.clone()),
            }
        }
        if let Some(u) = &child_uuid {
            if !seen_ids.insert(u.raw_uuid.clone()) {
                out.push(FieldViolationProto {
                    field: field.clone(),
                    object_id: parent_uuid.clone(),
                    message: format!(
                        "{DUPLICATE_CHILD_ID}: transaction {parent_id} already has a child with id {child_id}"
                    ),
                });
            }
        }
        add_child_violations(child, &format!("{field}."), out);
    }
}

/// Same test as Java `Security.isCash()` on an inline security; a link is not cash.
fn is_cash_child(child: &TransactionProto) -> bool {
    match &child.security {
        Some(s) if !s.is_link => {
            s.product_type == ProductTypeProto::Currency as i32
                || matches!(s.non_bond_details, Some(NonBondDetails::CashDetails(_)))
        }
        _ => false,
    }
}

/// Hyphenated UUID for a message, or `null` when unset.
fn display_id(uuid: Option<&UuidProto>) -> String {
    uuid.and_then(|u| Uuid::from_slice(&u.raw_uuid).ok())
        .map(|u| u.to_string())
        .unwrap_or_else(|| "null".to_string())
}

// ---------- Create a transaction (LM-461) ----------

/// Builds a new transaction and its trade price: the Rust counterpart of
/// Python `Transaction.create_from` / `CreateTransactionRequest.create_transaction_request`,
/// with the same fields.
///
/// The trade price's `price_type` is `price_type` when given (passed through
/// unchanged), else the default for the security's product_type in
/// hierarchy.json `default_price_types` (bonds `PERCENTAGE`, stocks
/// `ABSOLUTE`). With neither, `build` is
/// [`ProductInputError::NoDefaultPriceType`] naming the product and nothing
/// is built. `Some(UNKNOWN_PRICE_TYPE)` counts as omitted. The price number
/// goes through as given. See docs/adr/default_price_types.md.
pub struct CreateTransaction {
    pub security: SecurityProto,
    pub portfolio: PortfolioProto,
    pub trade_date: NaiveDate,
    pub settlement_date: NaiveDate,
    pub position_status: PositionStatusProto,
    pub transaction_type: TransactionTypeProto,
    pub price: Decimal,
    pub quantity: Decimal,
    pub as_of: LocalTimestampWrapper,
    pub price_type: Option<PriceTypeProto>,
}

impl CreateTransaction {
    /// The stamped `TransactionProto`, with a stamped trade price. The caller's
    /// security and portfolio are copied in as given.
    pub fn build(self) -> Result<TransactionProto, ProductInputError> {
        let price_type = resolve_trade_price_type(Some(&self.security), self.price_type)?;
        let as_of: LocalTimestampProto = self.as_of.into();
        let price = object_types::stamp(
            PriceProto {
                uuid: Some(UUIDWrapper::new_random().into()),
                as_of: Some(as_of.clone()),
                price: Some(decimal_proto(&self.price)),
                security: Some(self.security.clone()),
                price_type: price_type as i32,
                ..Default::default()
            },
            ObjectTypeProto::ObjectTypePrice,
        );
        Ok(object_types::stamp(
            TransactionProto {
                uuid: Some(UUIDWrapper::new_random().into()),
                as_of: Some(as_of),
                is_cancelled: false,
                is_link: false,
                portfolio: Some(self.portfolio),
                security: Some(self.security),
                position_status: self.position_status as i32,
                price: Some(price),
                transaction_type: self.transaction_type as i32,
                quantity: Some(decimal_proto(&self.quantity)),
                trade_date: Some(local_date(self.trade_date)),
                settlement_date: Some(local_date(self.settlement_date)),
                trade_name: "No trade name".to_string(),
                ..Default::default()
            },
            ObjectTypeProto::ObjectTypeTransaction,
        ))
    }

    /// [`Self::build`] wrapped in a stamped `CreateTransactionRequestProto`.
    pub fn build_request(self) -> Result<CreateTransactionRequestProto, ProductInputError> {
        Ok(object_types::stamp(
            CreateTransactionRequestProto { create_transaction_input: Some(self.build()?), ..Default::default() },
            ObjectTypeProto::ObjectTypeCreateTransactionRequest,
        ))
    }
}

fn local_date(d: NaiveDate) -> LocalDateProto {
    LocalDateProto { year: d.year() as u32, month: d.month(), day: d.day() }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::fintekkers::models::portfolio::PortfolioProto;
    use crate::fintekkers::models::security::SecurityProto;
    use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
    use prost_types::Timestamp;

    fn make_as_of(seconds: i64) -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp { seconds, nanos: 0 }),
            time_zone: "UTC".to_string(),
        }
    }

    fn full_txn(uuid: Uuid, as_of: LocalTimestampProto, trade_name: &str) -> TransactionProto {
        TransactionProto {
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: false,
            trade_name: trade_name.to_string(),
            security: Some(SecurityProto {
                uuid: Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() }),
                is_link: false,
                issuer_name: "ACME".to_string(),
                ..Default::default()
            }),
            portfolio: Some(PortfolioProto {
                uuid: Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() }),
                is_link: false,
                portfolio_name: "PORT".to_string(),
                ..Default::default()
            }),
            ..Default::default()
        }
    }

    fn link_txn(uuid: Uuid, as_of: LocalTimestampProto) -> TransactionProto {
        TransactionProto {
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: true,
            ..Default::default()
        }
    }

    #[test]
    fn non_link_accessors_read_through() {
        let uuid = Uuid::new_v4();
        let proto = full_txn(uuid, make_as_of(1_700_000_100), "TEST-TRADE");
        let txn = TransactionWrapper::new(proto);
        assert!(!txn.is_link());
        assert_eq!(txn.trade_name(), "TEST-TRADE");
        assert!(txn.security().is_some());
        assert_eq!(txn.security().unwrap().proto.issuer_name, "ACME");
        assert!(txn.portfolio().is_some());
    }

    #[test]
    fn lazy_cache_hit_hydrates() {
        // Fresh uuid → targeted evict at end; never .clear() (parallel tests).
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(1_700_000_110);
        let resolved = full_txn(uuid, as_of.clone(), "FROM-CACHE");
        link_cache::transaction().put(uuid, resolved, Some(as_of.clone()));

        let t = TransactionWrapper::new(link_txn(uuid, as_of));
        assert!(t.is_link());
        assert_eq!(t.trade_name(), "FROM-CACHE");
        link_cache::transaction().evict(uuid);
    }

    // ---- Fetcher path (mirror Security/Portfolio lazy_e tests) ----
    use super::{set_transaction_fetcher, clear_transaction_fetcher};
    use std::sync::Mutex;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static FETCHER_TEST_LOCK: Mutex<()> = Mutex::new(());

    #[test]
    fn lazy_e_cache_miss_calls_fetcher_then_writes_through_then_error_panics() {
        // Mirror of the Security/Portfolio lazy_e tests. Two sub-assertions
        // in one test to avoid the global-fetcher-slot race.
        use std::panic;

        let _serialize = FETCHER_TEST_LOCK.lock().expect("test lock poisoned");

        // ---- Sub-assertion 1: happy path ----
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(1_700_000_120);
        let resolved = full_txn(uuid, as_of.clone(), "FROM-FETCHER");
        let calls = Arc::new(AtomicUsize::new(0));
        let calls_inner = calls.clone();
        set_transaction_fetcher(Arc::new(move |_uuid, _as_of| {
            calls_inner.fetch_add(1, Ordering::SeqCst);
            Ok(resolved.clone())
        }));

        let wrapper = TransactionWrapper::new(link_txn(uuid, as_of.clone()));
        assert_eq!(wrapper.trade_name(), "FROM-FETCHER");
        assert_eq!(calls.load(Ordering::SeqCst), 1);

        let cached = link_cache::transaction().get(uuid, Some(&as_of));
        assert!(cached.is_some(), "fetcher must write-through to LinkCache");

        let wrapper2 = TransactionWrapper::new(link_txn(uuid, as_of.clone()));
        assert_eq!(wrapper2.trade_name(), "FROM-FETCHER");
        assert_eq!(
            calls.load(Ordering::SeqCst),
            1,
            "second read must hit cache, not refetch"
        );

        // ---- Sub-assertion 2: error path ----
        set_transaction_fetcher(Arc::new(|uuid, _as_of| {
            Err(LinkResolverError::NotFound {
                uuid,
                as_of_bucket: "latest".to_string(),
            })
        }));
        let err_uuid = Uuid::new_v4();
        let wrapper_err = TransactionWrapper::new(link_txn(err_uuid, make_as_of(1_700_000_130)));
        let panic_result = panic::catch_unwind(panic::AssertUnwindSafe(|| {
            let _ = wrapper_err.trade_name();
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

        clear_transaction_fetcher();
        link_cache::transaction().evict(uuid);
        link_cache::transaction().evict(err_uuid);
    }

    /// 16 threads concurrently call accessor on link-mode wrappers sharing
    /// a UUID. Same contract as the Portfolio race test.
    #[test]
    fn race_concurrent_accessor_reads_on_shared_uuid() {
        use std::thread;

        let _serialize = FETCHER_TEST_LOCK.lock().expect("test lock poisoned");

        let uuid = Uuid::new_v4();
        let as_of = make_as_of(1_700_000_210);
        let resolved = full_txn(uuid, as_of.clone(), "RACE-RESOLVED-TRADE");

        set_transaction_fetcher(Arc::new(move |_uuid, _as_of| Ok(resolved.clone())));
        link_cache::transaction().evict(uuid);

        let link = link_txn(uuid, as_of.clone());
        let threads_count = 16;
        let handles: Vec<_> = (0..threads_count)
            .map(|_| {
                let link_clone = link.clone();
                thread::spawn(move || {
                    let w = TransactionWrapper::new(link_clone);
                    w.trade_name().to_string()
                })
            })
            .collect();
        let mut seen_resolved = 0;
        for h in handles {
            let name = h.join().expect("thread panicked");
            if name == "RACE-RESOLVED-TRADE" {
                seen_resolved += 1;
            }
        }
        assert_eq!(seen_resolved, threads_count);
        let cached = link_cache::transaction().get(uuid, Some(&as_of));
        assert!(cached.is_some());
        assert_eq!(cached.unwrap().trade_name, "RACE-RESOLVED-TRADE");

        clear_transaction_fetcher();
        link_cache::transaction().evict(uuid);
    }

    // ---------- LM-253: nested Price defaults ----------
    // Case names match Java TransactionPriceDefaultsTest, Python
    // test_transaction_price_defaults.py and JS transaction_price_defaults.test.ts.

    use crate::fintekkers::models::price::PriceProto;
    use prost::Message;

    const AS_OF_RULE: &str =
        "price.as_of defaults to the transaction's as_of (transaction.py / Price.create)";

    fn txn_as_of() -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp { seconds: 1_718_461_800, nanos: 0 }),
            time_zone: "America/New_York".to_string(),
        }
    }

    fn price_as_of() -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp { seconds: 1_718_377_200, nanos: 0 }),
            time_zone: "Europe/London".to_string(),
        }
    }

    fn price(uuid: Option<UuidProto>, as_of: Option<LocalTimestampProto>) -> PriceProto {
        PriceProto {
            uuid,
            as_of,
            ..Default::default()
        }
    }

    fn txn_with_price(price: PriceProto, with_txn_as_of: bool) -> TransactionProto {
        TransactionProto {
            uuid: Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() }),
            as_of: if with_txn_as_of { Some(txn_as_of()) } else { None },
            price: Some(price),
            ..Default::default()
        }
    }

    fn price_of(txn: &TransactionWrapper) -> &PriceProto {
        txn.as_ref().price.as_ref().unwrap()
    }

    fn price_uuid_bytes(txn: &TransactionWrapper) -> Vec<u8> {
        price_of(txn).uuid.as_ref().map(|u| u.raw_uuid.clone()).unwrap_or_default()
    }

    #[test]
    fn missing_price_uuid_is_filled() {
        let txn = TransactionWrapper::new(txn_with_price(price(None, Some(price_as_of())), true));
        assert_eq!(price_uuid_bytes(&txn).len(), 16);
    }

    #[test]
    fn empty_raw_uuid_is_treated_as_missing() {
        let empty = Some(UuidProto { raw_uuid: vec![] });
        let txn = TransactionWrapper::new(txn_with_price(price(empty, Some(price_as_of())), true));
        assert_eq!(price_uuid_bytes(&txn).len(), 16);
    }

    #[test]
    fn price_uuid_is_assigned_once() {
        let txn = TransactionWrapper::new(txn_with_price(price(None, Some(price_as_of())), true));
        assert_eq!(price_uuid_bytes(&txn), price_uuid_bytes(&txn));
        assert_eq!(price_uuid_bytes(&txn).len(), 16);
        assert_eq!(txn.as_ref().encode_to_vec(), txn.as_ref().encode_to_vec());
    }

    #[test]
    fn round_trip_keeps_price_uuid() {
        let first = TransactionWrapper::new(txn_with_price(price(None, Some(price_as_of())), true));
        let decoded = TransactionProto::decode(first.as_ref().encode_to_vec().as_slice()).unwrap();
        let second = TransactionWrapper::new(decoded);
        assert_eq!(price_uuid_bytes(&second).len(), 16);
        assert_eq!(price_uuid_bytes(&second), price_uuid_bytes(&first));
    }

    #[test]
    fn existing_price_uuid_is_kept() {
        let existing = Uuid::new_v4().as_bytes().to_vec();
        let p = price(Some(UuidProto { raw_uuid: existing.clone() }), Some(price_as_of()));
        let txn = TransactionWrapper::new(txn_with_price(p, true));
        assert_eq!(price_uuid_bytes(&txn), existing);
    }

    #[test]
    fn missing_price_as_of_defaults_to_transaction_as_of() {
        let txn = TransactionWrapper::new(txn_with_price(price(None, None), true));
        assert_eq!(price_of(&txn).as_of, Some(txn_as_of()), "{}", AS_OF_RULE);
        assert_eq!(price_of(&txn).as_of, txn.as_ref().as_of, "{}", AS_OF_RULE);
    }

    #[test]
    fn existing_price_as_of_is_kept() {
        let txn = TransactionWrapper::new(txn_with_price(price(None, Some(price_as_of())), true));
        assert_eq!(price_of(&txn).as_of, Some(price_as_of()));
    }

    #[test]
    fn no_as_of_anywhere_leaves_price_as_of_unset() {
        let txn = TransactionWrapper::new(txn_with_price(price(None, None), false));
        assert!(price_of(&txn).as_of.is_none());
        assert_eq!(price_uuid_bytes(&txn).len(), 16);
    }

    #[test]
    fn try_as_of_unset_is_validation_error() {
        let txn = TransactionWrapper::new(txn_with_price(price(None, None), false));
        let err = txn.try_as_of().unwrap_err();
        assert!(matches!(err, Error::Validation(_)), "expected Error::Validation, got {:?}", err);
        assert_eq!(err.violations()[0].field, "transaction.as_of");
    }

    #[test]
    fn link_price_passes_through_unchanged() {
        let link = PriceProto { is_link: true, ..Default::default() };
        let txn = TransactionWrapper::new(txn_with_price(link.clone(), true));
        assert_eq!(price_of(&txn), &link);
    }

    // ---------- LM-276: nested Security defaults ----------
    // Case names match Java TransactionSecurityDefaultsTest, Python
    // test_transaction_security_defaults.py and JS
    // transaction_security_defaults.test.ts.

    fn currency(uuid: Option<UuidProto>) -> SecurityProto {
        SecurityProto {
            as_of: Some(txn_as_of()),
            uuid,
            product_type: crate::fintekkers::models::security::ProductTypeProto::Currency as i32,
            asset_class: "Cash".to_string(),
            issuer_name: "US Dollar".to_string(),
            ..Default::default()
        }
    }

    fn bond(uuid: Option<UuidProto>, settlement_currency: Option<SecurityProto>) -> SecurityProto {
        SecurityProto {
            as_of: Some(txn_as_of()),
            uuid,
            product_type: crate::fintekkers::models::security::ProductTypeProto::CorpBond as i32,
            asset_class: "Fixed Income".to_string(),
            issuer_name: "ACME Corp".to_string(),
            settlement_currency: settlement_currency.map(Box::new),
            ..Default::default()
        }
    }

    fn txn_with_security(security: SecurityProto) -> TransactionProto {
        TransactionProto {
            uuid: Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() }),
            as_of: Some(txn_as_of()),
            security: Some(security),
            ..Default::default()
        }
    }

    fn security_of(txn: &TransactionWrapper) -> &SecurityProto {
        txn.as_ref().security.as_ref().unwrap()
    }

    fn currency_of(txn: &TransactionWrapper) -> &SecurityProto {
        security_of(txn).settlement_currency.as_deref().unwrap()
    }

    #[test]
    fn missing_security_uuid_is_filled_and_stable() {
        let txn = TransactionWrapper::new(txn_with_security(bond(None, Some(currency(None)))));

        let first = txn.security().unwrap().uuid_wrapper().as_uuid();
        assert_eq!(txn.security().unwrap().uuid_wrapper().as_uuid(), first);
        assert_eq!(txn.security().unwrap().uuid_wrapper().as_uuid(), first);
        assert_eq!(security_of(&txn).uuid.as_ref().unwrap().raw_uuid, first.as_bytes().to_vec());
    }

    #[test]
    fn missing_settlement_currency_uuid_is_filled_and_stable() {
        let txn = TransactionWrapper::new(txn_with_security(bond(None, Some(currency(None)))));

        let currency_id = || {
            let security = txn.security().unwrap();
            let currency = security.proto.settlement_currency.as_deref().unwrap().clone();
            SecurityWrapper::new(currency).uuid_wrapper().as_uuid()
        };
        let first = currency_id();
        assert_eq!(currency_id(), first);
        assert_eq!(currency_id(), first);
        assert_eq!(currency_of(&txn).uuid.as_ref().unwrap().raw_uuid.len(), 16);
    }

    #[test]
    fn existing_security_uuid_is_kept() {
        let security_id = UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() };
        let currency_id = UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() };
        let input = txn_with_security(bond(Some(security_id.clone()), Some(currency(Some(currency_id.clone())))));
        let txn = TransactionWrapper::new(input.clone());

        assert_eq!(security_of(&txn).uuid, Some(security_id));
        assert_eq!(currency_of(&txn).uuid, Some(currency_id));
        assert_eq!(txn.as_ref(), &input);
    }

    #[test]
    fn link_security_gets_no_uuid() {
        let link = SecurityProto {
            is_link: true,
            as_of: Some(txn_as_of()),
            settlement_currency: Some(Box::new(currency(None))),
            ..Default::default()
        };
        let txn = TransactionWrapper::new(txn_with_security(link.clone()));

        assert_eq!(security_of(&txn), &link);
        assert!(security_of(&txn).uuid.is_none());
        assert!(currency_of(&txn).uuid.is_none());
    }

    #[test]
    fn link_settlement_currency_gets_no_uuid() {
        let link_currency = SecurityProto { is_link: true, ..Default::default() };
        let txn = TransactionWrapper::new(txn_with_security(bond(None, Some(link_currency))));

        assert_eq!(security_of(&txn).uuid.as_ref().unwrap().raw_uuid.len(), 16);
        assert!(currency_of(&txn).is_link);
        assert!(currency_of(&txn).uuid.is_none());
    }
}
