//! Performance-regression guard for TransactionWrapper lazy-hydrate
//! (pre-warmed cache hit). Mirrors LazyHydratePerfGuard.java.
//!
//! Baseline (release, Mac Mini M-series): ~0.82 µs/op at N=10000 in steady
//! state. Default ceiling = baseline + 15% headroom = 0.94 µs/op.
//!
//! Debug builds skip the strict assertion (Rust debug is unoptimized and
//! 10–50× slower than release). Run with:
//!
//!   cargo test --release --test lazy_hydrate_perf_guard -- --nocapture
//!
//! Override via env var LAZY_HYDRATE_PERF_CEILING_US for slow CI hardware.

use ledger_models::fintekkers::models::portfolio::PortfolioProto;
use ledger_models::fintekkers::models::transaction::TransactionProto;
use ledger_models::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use ledger_models::fintekkers::wrappers::models::transaction::TransactionWrapper;
use ledger_models::fintekkers::wrappers::util::link_cache;
use prost_types::Timestamp;
use std::time::Instant;
use uuid::Uuid;

const N: usize = 10_000;
const DEFAULT_CEILING_US: f64 = 0.94; // 0.82 * 1.15

fn read_ceiling_us() -> f64 {
    match std::env::var("LAZY_HYDRATE_PERF_CEILING_US")
        .ok()
        .and_then(|s| s.parse::<f64>().ok())
    {
        Some(v) => v,
        None => DEFAULT_CEILING_US,
    }
}

fn make_as_of() -> LocalTimestampProto {
    LocalTimestampProto {
        timestamp: Some(Timestamp {
            seconds: 1_700_000_000,
            nanos: 0,
        }),
        time_zone: "UTC".to_string(),
    }
}

fn run_once() -> f64 {
    let as_of = make_as_of();

    let mut txn_uuids: Vec<Uuid> = Vec::with_capacity(N);
    let mut port_uuids: Vec<Uuid> = Vec::with_capacity(N);
    let mut links: Vec<TransactionProto> = Vec::with_capacity(N);

    for _ in 0..N {
        let txn_uuid = Uuid::new_v4();
        let port_uuid = Uuid::new_v4();
        txn_uuids.push(txn_uuid);
        port_uuids.push(port_uuid);

        let resolved_port = PortfolioProto {
            uuid: Some(UuidProto {
                raw_uuid: port_uuid.as_bytes().to_vec(),
            }),
            as_of: Some(as_of.clone()),
            is_link: false,
            portfolio_name: format!("P-{}", &port_uuid.to_string()[..8]),
            ..Default::default()
        };
        let resolved = TransactionProto {
            uuid: Some(UuidProto {
                raw_uuid: txn_uuid.as_bytes().to_vec(),
            }),
            as_of: Some(as_of.clone()),
            is_link: false,
            trade_name: format!("T-{}", &txn_uuid.to_string()[..8]),
            portfolio: Some(resolved_port.clone()),
            ..Default::default()
        };
        link_cache::transaction().put(txn_uuid, resolved, Some(as_of.clone()));
        link_cache::portfolio().put(port_uuid, resolved_port, Some(as_of.clone()));

        links.push(TransactionProto {
            uuid: Some(UuidProto {
                raw_uuid: txn_uuid.as_bytes().to_vec(),
            }),
            as_of: Some(as_of.clone()),
            is_link: true,
            ..Default::default()
        });
    }

    let t0 = Instant::now();
    let mut sink = 0usize;
    for link in &links {
        let w = TransactionWrapper::new(link.clone());
        if !w.trade_name().is_empty() {
            sink += 1;
        }
    }
    let elapsed = t0.elapsed();
    assert_eq!(sink, N);

    for u in &txn_uuids {
        link_cache::transaction().evict(*u);
    }
    for u in &port_uuids {
        link_cache::portfolio().evict(*u);
    }

    elapsed.as_nanos() as f64 / N as f64 / 1_000.0
}

#[test]
fn per_op_stays_within_15pct_of_baseline_at_n_10000() {
    let ceiling_us = read_ceiling_us();

    // Warmup
    run_once();
    let per_op_us = run_once();

    let mode = if cfg!(debug_assertions) { "debug" } else { "release" };
    println!(
        "LazyHydratePerfGuard (rust/{}): N={}  per_op={:.2} us  ceiling={:.2} us",
        mode, N, per_op_us, ceiling_us
    );

    if cfg!(debug_assertions) {
        // Debug builds are unoptimized — log only. Use --release for the
        // real assertion.
        eprintln!(
            "(debug build — strict perf check skipped; re-run with --release)"
        );
        return;
    }

    assert!(
        per_op_us <= ceiling_us,
        "Transaction lazy-hydrate per-op ({:.2} us) exceeded ceiling ({:.2} us). \
         Either a regression or noisy hardware; override via \
         LAZY_HYDRATE_PERF_CEILING_US env var if running on slow CI.",
        per_op_us,
        ceiling_us
    );
}
