//! LinkCache — process-wide cache of resolved proto bodies backing link-mode
//! wrappers. Rust mirror of `common.util.LinkCache` (Java) and the same
//! singletons in Python / TypeScript. See `docs/adr/lazy-link-hydration.md`.
//!
//! Read semantics ([`LinkCache::get`]):
//!
//! - `requested_as_of == None` ("latest acceptable") — cache hit allowed;
//!   subject to `ttl_for_latest` to bound cross-process staleness this
//!   process can't observe. Past TTL ⇒ miss.
//! - `requested_as_of == Some(_)` (bitemporal-precise) — cache hit only
//!   when the cached entry's as_of equals the requested. No TTL — history
//!   doesn't change, so a past vintage cached arbitrarily long is fine.
//!
//! Write semantics ([`LinkCache::put`]): newest-vintage wins. An
//! older-vintage put does not evict a newer cached entry.
//!
//! Later Portfolio can likely be 1 day, security 1 day, transaction 1 minute,
//! price 30 seconds — once per-entity TTLs are wired up, the shared singletons
//! below should be constructed with those values.

use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::SecurityProto;
use crate::fintekkers::models::transaction::TransactionProto;
use crate::fintekkers::models::util::LocalTimestampProto;

pub const DEFAULT_TTL_FOR_LATEST: Duration = Duration::from_secs(600);

#[derive(Debug, Clone)]
struct CacheEntry<V> {
    value: Arc<V>,
    as_of: Option<LocalTimestampProto>,
    cached_at: Instant,
}

/// Process-wide cache mapping entity UUID → resolved proto. Generic over
/// the proto type so each entity has its own singleton.
pub struct LinkCache<V> {
    map: Mutex<HashMap<Uuid, CacheEntry<V>>>,
    ttl_for_latest: Duration,
}

impl<V> LinkCache<V> {
    pub fn new(ttl_for_latest: Duration) -> Self {
        Self {
            map: Mutex::new(HashMap::new()),
            ttl_for_latest,
        }
    }

    pub fn get(
        &self,
        uuid: Uuid,
        requested_as_of: Option<&LocalTimestampProto>,
    ) -> Option<Arc<V>> {
        let map = self.map.lock().unwrap();
        let entry = map.get(&uuid)?;
        match requested_as_of {
            None => {
                if entry.cached_at.elapsed() > self.ttl_for_latest {
                    None
                } else {
                    Some(entry.value.clone())
                }
            }
            Some(req) => {
                let cached = entry.as_of.as_ref()?;
                if same_local_timestamp(cached, req) {
                    Some(entry.value.clone())
                } else {
                    None
                }
            }
        }
    }

    /// Newest-wins write: if a cached entry for `uuid` already has an `as_of`
    /// strictly after the incoming one, the write is ignored.
    pub fn put(&self, uuid: Uuid, value: V, as_of: Option<LocalTimestampProto>) {
        let mut map = self.map.lock().unwrap();
        if let Some(existing) = map.get(&uuid) {
            if let (Some(e), Some(incoming)) = (existing.as_of.as_ref(), as_of.as_ref()) {
                if is_strictly_after(e, incoming) {
                    return;
                }
            }
        }
        map.insert(
            uuid,
            CacheEntry {
                value: Arc::new(value),
                as_of,
                cached_at: Instant::now(),
            },
        );
    }

    pub fn evict(&self, uuid: Uuid) {
        self.map.lock().unwrap().remove(&uuid);
    }

    pub fn clear(&self) {
        self.map.lock().unwrap().clear();
    }

    pub fn size(&self) -> usize {
        self.map.lock().unwrap().len()
    }
}

fn same_local_timestamp(a: &LocalTimestampProto, b: &LocalTimestampProto) -> bool {
    let a_ts = a.timestamp.as_ref();
    let b_ts = b.timestamp.as_ref();
    match (a_ts, b_ts) {
        (Some(at), Some(bt)) => at.seconds == bt.seconds && at.nanos == bt.nanos,
        _ => false,
    }
}

fn is_strictly_after(a: &LocalTimestampProto, b: &LocalTimestampProto) -> bool {
    let a_ts = a.timestamp.as_ref();
    let b_ts = b.timestamp.as_ref();
    match (a_ts, b_ts) {
        (Some(at), Some(bt)) => {
            if at.seconds != bt.seconds {
                at.seconds > bt.seconds
            } else {
                at.nanos > bt.nanos
            }
        }
        _ => false,
    }
}

// ---- Shared singletons -----------------------------------------------------

pub fn security() -> &'static LinkCache<SecurityProto> {
    static C: OnceLock<LinkCache<SecurityProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::new(DEFAULT_TTL_FOR_LATEST))
}

pub fn portfolio() -> &'static LinkCache<PortfolioProto> {
    static C: OnceLock<LinkCache<PortfolioProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::new(DEFAULT_TTL_FOR_LATEST))
}

pub fn price() -> &'static LinkCache<PriceProto> {
    static C: OnceLock<LinkCache<PriceProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::new(DEFAULT_TTL_FOR_LATEST))
}

pub fn transaction() -> &'static LinkCache<TransactionProto> {
    static C: OnceLock<LinkCache<TransactionProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::new(DEFAULT_TTL_FOR_LATEST))
}

// ---- Tests -----------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use prost_types::Timestamp;

    fn make_as_of(seconds_offset: i64) -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp {
                seconds: 1_700_000_000 + seconds_offset,
                nanos: 0,
            }),
            time_zone: "UTC".into(),
        }
    }

    fn make_proto(issuer: &str) -> SecurityProto {
        SecurityProto {
            issuer_name: issuer.into(),
            ..Default::default()
        }
    }

    // ---- A. Basic get/put ----

    #[test]
    fn get_on_empty_cache_returns_none() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        assert!(cache.get(Uuid::new_v4(), Some(&make_as_of(0))).is_none());
    }

    #[test]
    fn put_then_get_with_matching_as_of_returns_value() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(0);
        cache.put(uuid, make_proto("ACME"), Some(as_of.clone()));
        let hit = cache.get(uuid, Some(&as_of)).expect("expected hit");
        assert_eq!(hit.issuer_name, "ACME");
    }

    #[test]
    fn get_with_different_as_of_returns_none() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        let uuid = Uuid::new_v4();
        cache.put(uuid, make_proto("v1"), Some(make_as_of(0)));
        assert!(cache.get(uuid, Some(&make_as_of(10))).is_none());
    }

    // ---- B. Null asOf semantics ----

    #[test]
    fn null_as_of_within_ttl_returns_value() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(Duration::from_secs(60));
        let uuid = Uuid::new_v4();
        cache.put(uuid, make_proto("v1"), Some(make_as_of(0)));
        assert!(cache.get(uuid, None).is_some());
    }

    #[test]
    fn null_as_of_past_ttl_returns_none() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(Duration::from_millis(50));
        let uuid = Uuid::new_v4();
        cache.put(uuid, make_proto("v1"), Some(make_as_of(0)));
        std::thread::sleep(Duration::from_millis(100));
        assert!(cache.get(uuid, None).is_none());
    }

    #[test]
    fn non_null_as_of_is_not_subject_to_ttl() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(Duration::from_millis(50));
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(0);
        cache.put(uuid, make_proto("v1"), Some(as_of.clone()));
        std::thread::sleep(Duration::from_millis(100));
        assert!(cache.get(uuid, Some(&as_of)).is_some());
    }

    // ---- C. Newest-wins merge ----

    #[test]
    fn put_with_older_as_of_does_not_overwrite_newer() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        let uuid = Uuid::new_v4();
        cache.put(uuid, make_proto("newer"), Some(make_as_of(100)));
        cache.put(uuid, make_proto("older"), Some(make_as_of(50)));
        let newer = cache.get(uuid, Some(&make_as_of(100))).expect("expected newer");
        assert_eq!(newer.issuer_name, "newer");
        assert!(cache.get(uuid, Some(&make_as_of(50))).is_none());
    }

    #[test]
    fn put_with_newer_as_of_replaces_older() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        let uuid = Uuid::new_v4();
        cache.put(uuid, make_proto("older"), Some(make_as_of(50)));
        cache.put(uuid, make_proto("newer"), Some(make_as_of(100)));
        let v = cache.get(uuid, Some(&make_as_of(100))).expect("expected newer");
        assert_eq!(v.issuer_name, "newer");
    }

    // ---- D. Evict & clear ----

    #[test]
    fn evict_removes_entry() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(0);
        cache.put(uuid, make_proto("v1"), Some(as_of.clone()));
        cache.evict(uuid);
        assert!(cache.get(uuid, Some(&as_of)).is_none());
    }

    #[test]
    fn clear_empties_cache() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(DEFAULT_TTL_FOR_LATEST);
        cache.put(Uuid::new_v4(), make_proto("a"), Some(make_as_of(0)));
        cache.put(Uuid::new_v4(), make_proto("b"), Some(make_as_of(0)));
        cache.clear();
        assert_eq!(cache.size(), 0);
    }

    // ---- E. Singleton isolation ----

    #[test]
    fn singletons_have_independent_state() {
        let uuid = Uuid::new_v4();
        security().put(uuid, make_proto("sec"), Some(make_as_of(0)));
        assert!(portfolio().get(uuid, Some(&make_as_of(0))).is_none());
        assert!(price().get(uuid, Some(&make_as_of(0))).is_none());
        assert!(transaction().get(uuid, Some(&make_as_of(0))).is_none());
        security().evict(uuid);
    }
}
