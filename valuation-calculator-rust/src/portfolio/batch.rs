use crate::dispatch::{self, ProductInput};
use super::market_data::MarketDataSnapshot;

#[derive(Debug, Clone)]
pub struct PositionInput {
    pub position_id: String,
    pub product: ProductInput,
    pub quantity: f64,
    pub cost_basis: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct PositionResult {
    pub position_id: String,
    pub measures: Vec<(String, f64)>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct PortfolioResult {
    pub position_results: Vec<PositionResult>,
    pub total: usize,
    pub succeeded: usize,
    pub failed: usize,
}

/// Value an entire portfolio against a market data snapshot.
/// Each position is valued independently using the shared market data.
pub fn valuate_portfolio(
    positions: &[PositionInput],
    market_data: &MarketDataSnapshot,
) -> PortfolioResult {
    let mut results = Vec::with_capacity(positions.len());
    let mut succeeded = 0;
    let mut failed = 0;

    for pos in positions {
        let val_result = dispatch::dispatch_valuation(&pos.product, market_data.valuation_date);

        // Collect position-level measures from the valuation
        let mut measures = Vec::new();
        for (name, value) in &val_result.measures {
            measures.push((name.clone(), *value));
        }

        // Add position-level measures
        measures.push(("Quantity".to_string(), pos.quantity));
        if let Some(cb) = pos.cost_basis {
            measures.push(("CostBasis".to_string(), cb));
        }

        // Compute position market value if we have a price
        if let Some((_, price)) = val_result
            .measures
            .iter()
            .find(|(k, _)| k == "CleanPrice" || k == "Price")
        {
            let mv = price / 100.0 * pos.quantity;
            measures.push(("PositionMarketValue".to_string(), mv));

            if let Some(cb) = pos.cost_basis {
                let cost_mv = cb / 100.0 * pos.quantity;
                measures.push(("PositionPnL".to_string(), mv - cost_mv));
            }
        }

        if val_result.errors.is_empty() {
            succeeded += 1;
        } else {
            failed += 1;
        }

        results.push(PositionResult {
            position_id: pos.position_id.clone(),
            measures,
            errors: val_result.errors,
        });
    }

    PortfolioResult {
        total: positions.len(),
        succeeded,
        failed,
        position_results: results,
    }
}

/// Resolve curve references: replace curve name references in product inputs
/// with actual curves from the market data snapshot.
/// This is the key optimization -- curves are looked up once from the snapshot
/// rather than passed with each position.
pub fn resolve_curve_refs(
    product: &ProductInput,
    benchmark_name: Option<&str>,
    _discount_name: Option<&str>,
    _projection_name: Option<&str>,
    market_data: &MarketDataSnapshot,
) -> ProductInput {
    let mut resolved = product.clone();

    match &mut resolved {
        ProductInput::Bond(ref mut b) => {
            if b.benchmark_curve.is_none() {
                if let Some(name) = benchmark_name {
                    b.benchmark_curve = market_data.get_curve(name).cloned();
                }
            }
        }
        ProductInput::Swap(ref mut s) => {
            if let Some(name) = _projection_name.or(benchmark_name) {
                if let Some(curve) = market_data.get_curve(name) {
                    s.projection_curve = curve.clone();
                }
            }
            if let Some(name) = _discount_name.or(benchmark_name) {
                if let Some(curve) = market_data.get_curve(name) {
                    s.discount_curve = curve.clone();
                }
            }
        }
        // MBS, MoneyMarket, and Repo don't use named curve references
        _ => {}
    }

    resolved
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::curve::YieldCurve;
    use crate::date::Date;
    use crate::dispatch::*;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn flat_curve(rate: f64) -> YieldCurve {
        YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    fn sample_bond(price: f64) -> ProductInput {
        ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            clean_price: price,
            settlement: d(2025, 1, 1),
            benchmark_curve: Some(flat_curve(0.04)),
            z_spread: 0.0,
        })
    }

    fn sample_swap() -> ProductInput {
        let curve = flat_curve(0.04);
        ProductInput::Swap(SwapInput {
            notional: 1_000_000.0,
            fixed_rate: 0.04,
            fixed_freq: 2,
            float_freq: 4,
            float_spread: 0.0,
            start_date: d(2025, 1, 1),
            maturity_date: d(2030, 1, 1),
            pay_fixed: true,
            projection_curve: curve.clone(),
            discount_curve: curve,
        })
    }

    fn sample_mbs() -> ProductInput {
        ProductInput::Mbs(MbsInput {
            original_balance: 1_000_000.0,
            current_balance: 950_000.0,
            pass_through_rate: 0.05,
            wac: 0.055,
            wam: 348,
            age: 12,
            market_price: 98.0,
            psa_speed: 150.0,
            settlement: d(2025, 6, 1),
        })
    }

    fn sample_money_market() -> ProductInput {
        ProductInput::MoneyMarket(MoneyMarketInput {
            face_value: 100.0,
            issue_date: d(2025, 1, 1),
            maturity_date: d(2025, 4, 1),
            market_price: 98.75,
            settlement: d(2025, 1, 1),
            is_discount: true,
        })
    }

    fn sample_repo() -> ProductInput {
        ProductInput::Repo(RepoInput {
            collateral_dirty_price: 101.5,
            collateral_face: 1_000_000.0,
            haircut: 0.02,
            repo_rate: 0.05,
            start_date: d(2025, 1, 1),
            end_date: d(2025, 2, 1),
        })
    }

    fn sample_market_data() -> MarketDataSnapshot {
        let mut md = MarketDataSnapshot::new(d(2025, 1, 1));
        md.add_curve("USD_TREASURY", flat_curve(0.04));
        md.add_curve("USD_SOFR", flat_curve(0.045));
        md.add_fx_rate("EUR/USD", 1.085);
        md
    }

    // ─── Mixed portfolio ────────────────────────────────────────────

    #[test]
    fn mixed_portfolio_all_valued() {
        let md = sample_market_data();
        let positions = vec![
            PositionInput {
                position_id: "BOND_1".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: Some(99.0),
            },
            PositionInput {
                position_id: "BOND_2".into(),
                product: sample_bond(98.0),
                quantity: 500_000.0,
                cost_basis: Some(97.0),
            },
            PositionInput {
                position_id: "BOND_3".into(),
                product: sample_bond(102.0),
                quantity: 2_000_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "SWAP_1".into(),
                product: sample_swap(),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "MBS_1".into(),
                product: sample_mbs(),
                quantity: 500_000.0,
                cost_basis: Some(99.0),
            },
            PositionInput {
                position_id: "MM_1".into(),
                product: sample_money_market(),
                quantity: 100_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "REPO_1".into(),
                product: sample_repo(),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        assert_eq!(result.total, 7);
        assert_eq!(result.position_results.len(), 7);
        // All bonds + swap + money market + repo should succeed; MBS may also succeed
        assert!(result.succeeded >= 6);

        // Verify position IDs correlate
        assert_eq!(result.position_results[0].position_id, "BOND_1");
        assert_eq!(result.position_results[3].position_id, "SWAP_1");
        assert_eq!(result.position_results[4].position_id, "MBS_1");
        assert_eq!(result.position_results[5].position_id, "MM_1");
        assert_eq!(result.position_results[6].position_id, "REPO_1");
    }

    // ─── Shared market data ─────────────────────────────────────────

    #[test]
    fn shared_market_data_multiple_bonds_same_curve() {
        let md = sample_market_data();

        // Three bonds all referencing the same curve from market data
        let bond_no_curve = ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            clean_price: 100.0,
            settlement: d(2025, 1, 1),
            benchmark_curve: None,
            z_spread: 0.0,
        });

        // Resolve curves from snapshot for each
        let resolved1 = resolve_curve_refs(
            &bond_no_curve, Some("USD_TREASURY"), None, None, &md,
        );
        let resolved2 = resolve_curve_refs(
            &bond_no_curve, Some("USD_TREASURY"), None, None, &md,
        );

        // Both should now have the curve
        match (&resolved1, &resolved2) {
            (ProductInput::Bond(b1), ProductInput::Bond(b2)) => {
                assert!(b1.benchmark_curve.is_some());
                assert!(b2.benchmark_curve.is_some());
            }
            _ => panic!("Expected Bond variants"),
        }
    }

    // ─── Curve resolution ───────────────────────────────────────────

    #[test]
    fn resolve_curve_refs_populates_bond_curve() {
        let md = sample_market_data();
        let bond = ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            clean_price: 100.0,
            settlement: d(2025, 1, 1),
            benchmark_curve: None,
            z_spread: 0.0,
        });

        let resolved = resolve_curve_refs(&bond, Some("USD_TREASURY"), None, None, &md);
        match &resolved {
            ProductInput::Bond(b) => {
                assert!(b.benchmark_curve.is_some());
                let curve = b.benchmark_curve.as_ref().unwrap();
                assert!((curve.zero_rate(1.0) - 0.04).abs() < 1e-12);
            }
            _ => panic!("Expected Bond"),
        }
    }

    #[test]
    fn resolve_curve_refs_does_not_overwrite_existing() {
        let md = sample_market_data();
        let bond = ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            clean_price: 100.0,
            settlement: d(2025, 1, 1),
            benchmark_curve: Some(flat_curve(0.06)), // already set
            z_spread: 0.0,
        });

        let resolved = resolve_curve_refs(&bond, Some("USD_TREASURY"), None, None, &md);
        match &resolved {
            ProductInput::Bond(b) => {
                // Should keep original 6% curve, not replace with 4% from snapshot
                let curve = b.benchmark_curve.as_ref().unwrap();
                assert!((curve.zero_rate(1.0) - 0.06).abs() < 1e-12);
            }
            _ => panic!("Expected Bond"),
        }
    }

    #[test]
    fn resolve_curve_refs_swap_projection_and_discount() {
        let md = sample_market_data();
        let curve = flat_curve(0.03); // placeholder
        let swap = ProductInput::Swap(SwapInput {
            notional: 1_000_000.0,
            fixed_rate: 0.04,
            fixed_freq: 2,
            float_freq: 4,
            float_spread: 0.0,
            start_date: d(2025, 1, 1),
            maturity_date: d(2030, 1, 1),
            pay_fixed: true,
            projection_curve: curve.clone(),
            discount_curve: curve,
        });

        let resolved = resolve_curve_refs(
            &swap, None, Some("USD_TREASURY"), Some("USD_SOFR"), &md,
        );
        match &resolved {
            ProductInput::Swap(s) => {
                // projection should be USD_SOFR (4.5%)
                assert!((s.projection_curve.zero_rate(1.0) - 0.045).abs() < 1e-12);
                // discount should be USD_TREASURY (4%)
                assert!((s.discount_curve.zero_rate(1.0) - 0.04).abs() < 1e-12);
            }
            _ => panic!("Expected Swap"),
        }
    }

    #[test]
    fn resolve_curve_refs_missing_curve_name_leaves_unchanged() {
        let md = sample_market_data();
        let bond = ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            clean_price: 100.0,
            settlement: d(2025, 1, 1),
            benchmark_curve: None,
            z_spread: 0.0,
        });

        // Reference a curve that doesn't exist in the snapshot
        let resolved = resolve_curve_refs(&bond, Some("NONEXISTENT"), None, None, &md);
        match &resolved {
            ProductInput::Bond(b) => {
                assert!(b.benchmark_curve.is_none());
            }
            _ => panic!("Expected Bond"),
        }
    }

    // ─── Position sizing ────────────────────────────────────────────

    #[test]
    fn position_market_value_equals_price_times_quantity() {
        let md = sample_market_data();
        let positions = vec![PositionInput {
            position_id: "BOND_MV".into(),
            product: sample_bond(95.0), // price = 95
            quantity: 1_000_000.0,
            cost_basis: None,
        }];

        let result = valuate_portfolio(&positions, &md);
        let pos = &result.position_results[0];
        let mv = pos.measures.iter().find(|(k, _)| k == "PositionMarketValue").unwrap().1;
        // MV = 95/100 * 1_000_000 = 950_000
        assert!((mv - 950_000.0).abs() < 1.0);
    }

    // ─── P&L ────────────────────────────────────────────────────────

    #[test]
    fn pnl_computed_correctly() {
        let md = sample_market_data();
        let positions = vec![PositionInput {
            position_id: "BOND_PNL".into(),
            product: sample_bond(102.0),
            quantity: 1_000_000.0,
            cost_basis: Some(99.0),
        }];

        let result = valuate_portfolio(&positions, &md);
        let pos = &result.position_results[0];
        let pnl = pos.measures.iter().find(|(k, _)| k == "PositionPnL").unwrap().1;
        // PnL = (102/100 * 1M) - (99/100 * 1M) = 1_020_000 - 990_000 = 30_000
        assert!((pnl - 30_000.0).abs() < 1.0);
    }

    #[test]
    fn no_pnl_without_cost_basis() {
        let md = sample_market_data();
        let positions = vec![PositionInput {
            position_id: "BOND_NO_CB".into(),
            product: sample_bond(102.0),
            quantity: 1_000_000.0,
            cost_basis: None,
        }];

        let result = valuate_portfolio(&positions, &md);
        let pos = &result.position_results[0];
        assert!(pos.measures.iter().find(|(k, _)| k == "PositionPnL").is_none());
        assert!(pos.measures.iter().find(|(k, _)| k == "CostBasis").is_none());
    }

    // ─── Error handling ─────────────────────────────────────────────

    #[test]
    fn one_bad_position_does_not_kill_batch() {
        let md = sample_market_data();

        // A bond with price 0 may cause YTM solver to fail
        let bad_bond = ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2025, 1, 1), // maturity = settlement => edge case
            clean_price: 0.01,
            settlement: d(2025, 1, 1),
            benchmark_curve: None,
            z_spread: 0.0,
        });

        let positions = vec![
            PositionInput {
                position_id: "GOOD".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "BAD".into(),
                product: bad_bond,
                quantity: 100_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "GOOD2".into(),
                product: sample_bond(98.0),
                quantity: 500_000.0,
                cost_basis: None,
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        assert_eq!(result.total, 3);
        assert_eq!(result.position_results.len(), 3);
        // Good bonds should still succeed
        assert!(result.succeeded >= 2);
        // Position IDs are all present
        assert_eq!(result.position_results[0].position_id, "GOOD");
        assert_eq!(result.position_results[1].position_id, "BAD");
        assert_eq!(result.position_results[2].position_id, "GOOD2");
    }

    // ─── Empty portfolio ────────────────────────────────────────────

    #[test]
    fn empty_portfolio_returns_empty_results() {
        let md = sample_market_data();
        let result = valuate_portfolio(&[], &md);
        assert_eq!(result.total, 0);
        assert_eq!(result.succeeded, 0);
        assert_eq!(result.failed, 0);
        assert!(result.position_results.is_empty());
    }

    // ─── Large batch ────────────────────────────────────────────────

    #[test]
    fn large_batch_100_positions() {
        let md = sample_market_data();
        let positions: Vec<PositionInput> = (0..100)
            .map(|i| PositionInput {
                position_id: format!("POS_{}", i),
                product: sample_bond(99.0 + (i % 5) as f64),
                quantity: 100_000.0 * (1 + i % 10) as f64,
                cost_basis: Some(98.0),
            })
            .collect();

        let result = valuate_portfolio(&positions, &md);
        assert_eq!(result.total, 100);
        assert_eq!(result.position_results.len(), 100);
        assert_eq!(result.succeeded, 100);
        assert_eq!(result.failed, 0);

        // Verify all position IDs unique
        let ids: Vec<&str> = result.position_results.iter().map(|r| r.position_id.as_str()).collect();
        for i in 0..100 {
            assert_eq!(ids[i], format!("POS_{}", i));
        }
    }

    // ─── Quantity measure always present ─────────────────────────────

    #[test]
    fn quantity_measure_always_present() {
        let md = sample_market_data();
        let positions = vec![
            PositionInput {
                position_id: "B1".into(),
                product: sample_bond(100.0),
                quantity: 500_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "S1".into(),
                product: sample_swap(),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        for pos_result in &result.position_results {
            let qty = pos_result.measures.iter().find(|(k, _)| k == "Quantity");
            assert!(qty.is_some(), "Quantity missing for {}", pos_result.position_id);
        }
    }
}
