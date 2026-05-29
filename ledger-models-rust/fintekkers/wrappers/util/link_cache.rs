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
//! older-vintage put does not evict a newer cached entry. `as_of == None`
//! on put is allowed — represents a "latest at caching time" entry.
//!
//! Eviction: bounded LRU. When `put` causes the map to exceed `max_entries`,
//! the least-recently-used entry is removed. `get` bumps recency.
//!
//! Per-entity singletons are tuned for the access pattern of each entity
//! type (Portfolio + Security change slowly so TTL is 1 day; Price +
//! Transaction change quickly so TTL is short).

use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::SecurityProto;
use crate::fintekkers::models::transaction::TransactionProto;
use crate::fintekkers::models::util::LocalTimestampProto;

pub const DEFAULT_TTL_FOR_LATEST: Duration = Duration::from_secs(600);
pub const DEFAULT_MAX_ENTRIES: usize = 10_000;

#[derive(Debug, Clone)]
struct CacheEntry<V> {
    value: Arc<V>,
    as_of: Option<LocalTimestampProto>,
    cached_at: Instant,
}

struct Inner<V> {
    map: HashMap<Uuid, CacheEntry<V>>,
    // Recency order: front = least recently used, back = most recently used.
    // On get/put hit we move the entry to the back; on overflow we pop_front
    // and drop from the map.
    order: VecDeque<Uuid>,
}

/// Process-wide cache mapping entity UUID → resolved proto. Generic over
/// the proto type so each entity has its own singleton.
pub struct LinkCache<V> {
    inner: Mutex<Inner<V>>,
    ttl_for_latest: Duration,
    max_entries: usize,
}

impl<V> LinkCache<V> {
    pub fn new(ttl_for_latest: Duration) -> Self {
        Self::with_capacity(ttl_for_latest, DEFAULT_MAX_ENTRIES)
    }

    pub fn with_capacity(ttl_for_latest: Duration, max_entries: usize) -> Self {
        assert!(max_entries > 0, "max_entries must be > 0; got {}", max_entries);
        Self {
            inner: Mutex::new(Inner {
                map: HashMap::new(),
                order: VecDeque::new(),
            }),
            ttl_for_latest,
            max_entries,
        }
    }

    pub fn get(
        &self,
        uuid: Uuid,
        requested_as_of: Option<&LocalTimestampProto>,
    ) -> Option<Arc<V>> {
        let mut inner = self.inner.lock().unwrap();
        let entry = inner.map.get(&uuid)?;
        let hit = match requested_as_of {
            None => {
                if entry.cached_at.elapsed() > self.ttl_for_latest {
                    None
                } else {
                    Some(entry.value.clone())
                }
            }
            Some(req) => match entry.as_of.as_ref() {
                Some(cached) if same_local_timestamp(cached, req) => Some(entry.value.clone()),
                _ => None,
            },
        };
        if hit.is_some() {
            // Bump recency.
            if let Some(pos) = inner.order.iter().position(|u| u == &uuid) {
                inner.order.remove(pos);
            }
            inner.order.push_back(uuid);
        }
        hit
    }

    /// Newest-wins write: if a cached entry for `uuid` already has an `as_of`
    /// strictly after the incoming one, the write is ignored (but recency is
    /// still bumped — the caller saw a fresh reference).
    pub fn put(&self, uuid: Uuid, value: V, as_of: Option<LocalTimestampProto>) {
        let mut inner = self.inner.lock().unwrap();
        if let Some(existing) = inner.map.get(&uuid) {
            if let (Some(e), Some(incoming)) = (existing.as_of.as_ref(), as_of.as_ref()) {
                if is_strictly_after(e, incoming) {
                    // Bump recency only.
                    if let Some(pos) = inner.order.iter().position(|u| u == &uuid) {
                        inner.order.remove(pos);
                    }
                    inner.order.push_back(uuid);
                    return;
                }
            }
        }
        let new_entry = CacheEntry {
            value: Arc::new(value),
            as_of,
            cached_at: Instant::now(),
        };
        if inner.map.insert(uuid, new_entry).is_some() {
            // Existing key — remove from order before re-adding.
            if let Some(pos) = inner.order.iter().position(|u| u == &uuid) {
                inner.order.remove(pos);
            }
        }
        inner.order.push_back(uuid);
        while inner.map.len() > self.max_entries {
            if let Some(oldest) = inner.order.pop_front() {
                inner.map.remove(&oldest);
            } else {
                break;
            }
        }
    }

    pub fn evict(&self, uuid: Uuid) {
        let mut inner = self.inner.lock().unwrap();
        inner.map.remove(&uuid);
        if let Some(pos) = inner.order.iter().position(|u| u == &uuid) {
            inner.order.remove(pos);
        }
    }

    pub fn clear(&self) {
        let mut inner = self.inner.lock().unwrap();
        inner.map.clear();
        inner.order.clear();
    }

    pub fn size(&self) -> usize {
        self.inner.lock().unwrap().map.len()
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
//
// Per-entity TTL + cap. Tuned for typical access pattern:
//   Portfolio / Security: 1-day TTL on null-as_of reads (entities change
//       infrequently); large caps because the universe is large.
//   Transaction: 1-minute TTL (high churn).
//   Price: 30-second TTL (very high churn).

pub fn security() -> &'static LinkCache<SecurityProto> {
    static C: OnceLock<LinkCache<SecurityProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::with_capacity(Duration::from_secs(86_400), 100_000))
}

pub fn portfolio() -> &'static LinkCache<PortfolioProto> {
    static C: OnceLock<LinkCache<PortfolioProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::with_capacity(Duration::from_secs(86_400), 10_000))
}

pub fn price() -> &'static LinkCache<PriceProto> {
    static C: OnceLock<LinkCache<PriceProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::with_capacity(Duration::from_secs(30), 200_000))
}

pub fn transaction() -> &'static LinkCache<TransactionProto> {
    static C: OnceLock<LinkCache<TransactionProto>> = OnceLock::new();
    C.get_or_init(|| LinkCache::with_capacity(Duration::from_secs(60), 100_000))
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

    // ---- F. Put with None as_of (post-W4) ----

    #[test]
    fn put_none_as_of_accepts_as_latest_entry() {
        let cache: LinkCache<SecurityProto> = LinkCache::new(Duration::from_secs(60));
        let uuid = Uuid::new_v4();
        cache.put(uuid, make_proto("v1"), None);
        // null-as_of read within TTL: hit.
        assert!(cache.get(uuid, None).is_some());
        // specific-as_of read: miss (cached entry has no as_of to match against).
        assert!(cache.get(uuid, Some(&make_as_of(0))).is_none());
    }

    // ---- G. LRU bound (W4) ----

    #[test]
    fn lru_capacity_evicts_least_recently_used() {
        let cache: LinkCache<SecurityProto> =
            LinkCache::with_capacity(Duration::from_secs(60), 3);
        let u1 = Uuid::new_v4();
        let u2 = Uuid::new_v4();
        let u3 = Uuid::new_v4();
        let u4 = Uuid::new_v4();
        let as_of = make_as_of(0);

        cache.put(u1, make_proto("v1"), Some(as_of.clone()));
        cache.put(u2, make_proto("v2"), Some(as_of.clone()));
        cache.put(u3, make_proto("v3"), Some(as_of.clone()));
        assert_eq!(cache.size(), 3);

        // Touch u1 → MRU.
        assert!(cache.get(u1, Some(&as_of)).is_some());

        // Insert u4 → evicts u2 (LRU).
        cache.put(u4, make_proto("v4"), Some(as_of.clone()));
        assert_eq!(cache.size(), 3);
        assert!(cache.get(u1, Some(&as_of)).is_some());
        assert!(cache.get(u2, Some(&as_of)).is_none(), "u2 should have been evicted (LRU)");
        assert!(cache.get(u3, Some(&as_of)).is_some());
        assert!(cache.get(u4, Some(&as_of)).is_some());
    }

    #[test]
    #[should_panic(expected = "max_entries must be > 0")]
    fn ctor_zero_max_entries_panics() {
        let _: LinkCache<SecurityProto> = LinkCache::with_capacity(Duration::from_secs(60), 0);
    }
}
