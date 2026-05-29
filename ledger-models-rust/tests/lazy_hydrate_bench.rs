//! End-to-end perf bench for TransactionWrapper lazy hydration.
//!
//! Run: `cargo test --release --test lazy_hydrate_bench bench_transaction_lazy_hydrate -- --nocapture`
//! (release mode + --nocapture to see stdout).
//!
//! Same shape as the Java/Python/TS benches — pre-warm LinkCache.TRANSACTION
//! and LinkCache.PORTFOLIO with N resolved protos, then construct N
//! TransactionWrapper instances from link-mode protos and read accessors.

use ledger_models::fintekkers::models::portfolio::PortfolioProto;
use ledger_models::fintekkers::models::transaction::TransactionProto;
use ledger_models::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use ledger_models::fintekkers::wrappers::models::transaction::TransactionWrapper;
use ledger_models::fintekkers::wrappers::util::link_cache;
use prost_types::Timestamp;
use std::time::Instant;
use uuid::Uuid;

const SIZES: &[usize] = &[10, 100, 1_000, 10_000];

fn make_as_of() -> LocalTimestampProto {
    LocalTimestampProto {
        timestamp: Some(Timestamp {
            seconds: 1_700_000_000,
            nanos: 0,
        }),
        time_zone: "UTC".to_string(),
    }
}

fn run_bench(n: usize) {
    let as_of = make_as_of();

    let mut txn_uuids: Vec<Uuid> = Vec::with_capacity(n);
    let mut port_uuids: Vec<Uuid> = Vec::with_capacity(n);
    let mut links: Vec<TransactionProto> = Vec::with_capacity(n);

    for _ in 0..n {
        let txn_uuid = Uuid::new_v4();
        let port_uuid = Uuid::new_v4();
        txn_uuids.push(txn_uuid);
        port_uuids.push(port_uuid);

        let resolved_portfolio = PortfolioProto {
            uuid: Some(UuidProto {
                raw_uuid: port_uuid.as_bytes().to_vec(),
            }),
            as_of: Some(as_of.clone()),
            is_link: false,
            portfolio_name: format!("P-{}", &port_uuid.to_string()[0..8]),
            ..Default::default()
        };
        let resolved_txn = TransactionProto {
            uuid: Some(UuidProto {
                raw_uuid: txn_uuid.as_bytes().to_vec(),
            }),
            as_of: Some(as_of.clone()),
            is_link: false,
            trade_name: format!("T-{}", &txn_uuid.to_string()[0..8]),
            portfolio: Some(resolved_portfolio.clone()),
            ..Default::default()
        };
        link_cache::transaction().put(txn_uuid, resolved_txn, Some(as_of.clone()));
        link_cache::portfolio().put(port_uuid, resolved_portfolio, Some(as_of.clone()));

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
        if w.portfolio().is_some() {
            sink += 1;
        }
    }
    let elapsed = t0.elapsed();
    let per_op_us = elapsed.as_nanos() as f64 / n as f64 / 1_000.0;

    println!(
        "N={:>6}  elapsed={:>9.2} ms  per_op={:>8.2} us  reads={}",
        n,
        elapsed.as_secs_f64() * 1000.0,
        per_op_us,
        sink
    );

    for u in &txn_uuids {
        link_cache::transaction().evict(*u);
    }
    for u in &port_uuids {
        link_cache::portfolio().evict(*u);
    }
}

#[test]
fn bench_transaction_lazy_hydrate() {
    println!("# rust bench: lazy-hydrate Transaction via pre-warmed LinkCache");
    for n in SIZES {
        run_bench(*n);
    }
}
