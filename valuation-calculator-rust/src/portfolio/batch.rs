//! Batch portfolio valuation: price a set of positions against a single
//! market data snapshot, producing per-position results and portfolio-level
//! aggregates.

use crate::dispatch::{self, ProductInput};
use super::market_data::MarketDataSnapshot;

/// A single position in a portfolio, combining a product definition
/// with quantity and optional cost basis.
#[derive(Debug, Clone)]
pub struct PositionInput {
    pub position_id: String,
    pub product: ProductInput,
    pub quantity: f64,
    pub cost_basis: Option<f64>,
    pub benchmark_curve_name: Option<String>,
}

/// Valuation results for a single position.
#[derive(Debug, Clone)]
pub struct PositionResult {
    pub position_id: String,
    pub measures: Vec<(String, f64)>,
    pub errors: Vec<String>,
}

/// Value all positions in a portfolio against the given market data.
///
/// For each position:
/// 1. Resolve named curve references from market data
/// 2. Run the dispatch valuation for the product
/// 3. Compute position-level measures (MV, P&L)
pub fn valuate_portfolio(
    positions: &[PositionInput],
    market_data: &MarketDataSnapshot,
) -> Vec<PositionResult> {
    positions.iter().map(|pos| {
        // Resolve curve references from market data
        let mut product = pos.product.clone();
        if let Some(ref name) = pos.benchmark_curve_name {
            resolve_curve(&mut product, name, market_data);
        }

        let result = dispatch::dispatch_valuation(&product, market_data.valuation_date);

        let mut measures = result.measures;
        measures.push(("Quantity".to_string(), pos.quantity));

        // Compute position-level MV
        if let Some(price) = find_measure(&measures, "CleanPrice")
            .or_else(|| find_measure(&measures, "Price"))
        {
            let mv = price / 100.0 * pos.quantity;
            measures.push(("PositionMarketValue".to_string(), mv));
            if let Some(cb) = pos.cost_basis {
                measures.push(("PositionPnL".to_string(), mv - cb / 100.0 * pos.quantity));
            }
        }

        // For products that produce NPV (swaps, etc.), use that as market value
        if find_measure(&measures, "PositionMarketValue").is_none() {
            if let Some(npv) = find_measure(&measures, "NPV") {
                measures.push(("PositionMarketValue".to_string(), npv * pos.quantity));
            }
        }

        // For repos, use LoanAmount as position market value
        if find_measure(&measures, "PositionMarketValue").is_none() {
            if let Some(loan) = find_measure(&measures, "LoanAmount") {
                measures.push(("PositionMarketValue".to_string(), loan));
            }
        }

        PositionResult {
            position_id: pos.position_id.clone(),
            measures,
            errors: result.errors,
        }
    }).collect()
}

/// Find a named measure in a list.
pub fn find_measure(measures: &[(String, f64)], name: &str) -> Option<f64> {
    measures.iter().find(|(k, _)| k == name).map(|(_, v)| *v)
}

/// Resolve a named curve reference from market data into the product input.
fn resolve_curve(product: &mut ProductInput, curve_name: &str, market_data: &MarketDataSnapshot) {
    if let Some(curve) = market_data.get_curve(curve_name) {
        match product {
            ProductInput::Bond(ref mut b) => {
                b.benchmark_curve = Some(curve.clone());
            }
            ProductInput::CallableBond(ref mut c) => {
                c.benchmark_curve = Some(curve.clone());
            }
            ProductInput::Swap(ref mut s) => {
                s.projection_curve = curve.clone();
                s.discount_curve = curve.clone();
            }
            ProductInput::Frn(ref mut f) => {
                f.projection_curve = curve.clone();
                f.discount_curve = curve.clone();
            }
            ProductInput::Loan(ref mut l) => {
                l.projection_curve = curve.clone();
                l.discount_curve = curve.clone();
            }
            ProductInput::Scenario(ref mut s) => {
                s.benchmark_curve = curve.clone();
            }
            ProductInput::KeyRateDuration(ref mut k) => {
                k.benchmark_curve = curve.clone();
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::date::Date;
    use crate::curve::YieldCurve;
    use crate::dispatch::*;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(ref_date, vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0], vec![rate; 6]).unwrap()
    }

    fn make_bond_input(settlement: Date) -> ProductInput {
        ProductInput::Bond(BondInput {
            coupon_rate: 0.05,
            coupon_freq: 2,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            clean_price: 100.0,
            settlement,
            day_count: DayCountConvention::ActualActualICMA,
            benchmark_curve: None,
            z_spread: 0.0,
        })
    }

    fn make_swap_input(ref_date: Date, curve: YieldCurve) -> ProductInput {
        ProductInput::Swap(SwapInput {
            notional: 1_000_000.0,
            fixed_rate: 0.04,
            fixed_freq: 2,
            float_freq: 4,
            float_spread: 0.0,
            start_date: ref_date,
            maturity_date: Date::new(ref_date.year + 5, ref_date.month, ref_date.day),
            pay_fixed: true,
            projection_curve: curve.clone(),
            discount_curve: curve,
        })
    }

    fn make_repo_input() -> ProductInput {
        ProductInput::Repo(RepoInput {
            collateral_dirty_price: 101.5,
            collateral_face: 1_000_000.0,
            haircut: 0.02,
            repo_rate: 0.05,
            start_date: d(2025, 1, 1),
            end_date: d(2025, 2, 1),
        })
    }

    // ── Mixed portfolio: bonds + swaps + repos ──

    #[test]
    fn mixed_portfolio_valuation() {
        let ref_date = d(2025, 1, 1);
        let curve = flat_curve(ref_date, 0.04);
        let mut md = MarketDataSnapshot::new(ref_date);
        md.add_curve("UST", curve.clone());

        let positions = vec![
            PositionInput {
                position_id: "BOND-001".to_string(),
                product: make_bond_input(ref_date),
                quantity: 1_000_000.0,
                cost_basis: Some(99.0),
                benchmark_curve_name: Some("UST".to_string()),
            },
            PositionInput {
                position_id: "SWAP-001".to_string(),
                product: make_swap_input(ref_date, curve.clone()),
                quantity: 1.0,
                cost_basis: None,
                benchmark_curve_name: None,
            },
            PositionInput {
                position_id: "REPO-001".to_string(),
                product: make_repo_input(),
                quantity: 1.0,
                cost_basis: None,
                benchmark_curve_name: None,
            },
        ];

        let results = valuate_portfolio(&positions, &md);
        assert_eq!(results.len(), 3);

        // Bond should have position MV
        let bond_result = &results[0];
        assert_eq!(bond_result.position_id, "BOND-001");
        let bond_mv = find_measure(&bond_result.measures, "PositionMarketValue");
        assert!(bond_mv.is_some(), "Bond should have PositionMarketValue");
        assert!(bond_mv.unwrap() > 0.0);

        // Swap should have NPV-based MV
        let swap_result = &results[1];
        assert_eq!(swap_result.position_id, "SWAP-001");
        let swap_mv = find_measure(&swap_result.measures, "PositionMarketValue");
        assert!(swap_mv.is_some(), "Swap should have PositionMarketValue");

        // Repo should have LoanAmount-based MV
        let repo_result = &results[2];
        assert_eq!(repo_result.position_id, "REPO-001");
        let repo_mv = find_measure(&repo_result.measures, "PositionMarketValue");
        assert!(repo_mv.is_some(), "Repo should have PositionMarketValue");
    }

    // ── Position MV computed correctly ──

    #[test]
    fn position_mv_computation() {
        let ref_date = d(2025, 1, 1);
        let md = MarketDataSnapshot::new(ref_date);

        let positions = vec![
            PositionInput {
                position_id: "BOND-001".to_string(),
                product: make_bond_input(ref_date),
                quantity: 1_000_000.0,
                cost_basis: None,
                benchmark_curve_name: None,
            },
        ];

        let results = valuate_portfolio(&positions, &md);
        let mv = find_measure(&results[0].measures, "PositionMarketValue").unwrap();
        // At par price (100), MV = 100/100 * 1,000,000 = 1,000,000
        assert!((mv - 1_000_000.0).abs() < 1.0, "MV should be ~1M, got {}", mv);
    }

    // ── Position P&L computed correctly ──

    #[test]
    fn position_pnl_computation() {
        let ref_date = d(2025, 1, 1);
        let md = MarketDataSnapshot::new(ref_date);

        let positions = vec![
            PositionInput {
                position_id: "BOND-001".to_string(),
                product: make_bond_input(ref_date),
                quantity: 1_000_000.0,
                cost_basis: Some(99.0), // bought at 99
                benchmark_curve_name: None,
            },
        ];

        let results = valuate_portfolio(&positions, &md);
        let pnl = find_measure(&results[0].measures, "PositionPnL").unwrap();
        // MV = 100/100 * 1M = 1,000,000; Cost = 99/100 * 1M = 990,000; P&L = 10,000
        assert!((pnl - 10_000.0).abs() < 1.0, "P&L should be ~10K, got {}", pnl);
    }

    // ── Curve resolution from market data ──

    #[test]
    fn curve_resolution() {
        let ref_date = d(2025, 1, 1);
        let mut md = MarketDataSnapshot::new(ref_date);
        md.add_curve("UST", flat_curve(ref_date, 0.04));

        let positions = vec![
            PositionInput {
                position_id: "BOND-001".to_string(),
                product: make_bond_input(ref_date),
                quantity: 1_000_000.0,
                cost_basis: None,
                benchmark_curve_name: Some("UST".to_string()),
            },
        ];

        let results = valuate_portfolio(&positions, &md);
        // With benchmark curve resolved, Z-spread should be computed
        let zspread = find_measure(&results[0].measures, "ZSpread");
        assert!(zspread.is_some(), "Z-spread should be computed when benchmark curve is resolved");
    }

    // ── Error in one position doesn't break others ──

    #[test]
    fn error_isolation() {
        let ref_date = d(2025, 6, 1);
        let md = MarketDataSnapshot::new(ref_date);

        let positions = vec![
            // Matured bond: should produce errors
            PositionInput {
                position_id: "BAD-001".to_string(),
                product: ProductInput::Bond(BondInput {
                    coupon_rate: 0.05,
                    coupon_freq: 2,
                    face_value: 100.0,
                    dated_date: d(2020, 1, 1),
                    maturity_date: d(2025, 1, 1), // already matured
                    clean_price: 100.0,
                    settlement: ref_date,
                    day_count: DayCountConvention::ActualActualICMA,
                    benchmark_curve: None,
                    z_spread: 0.0,
                }),
                quantity: 100_000.0,
                cost_basis: None,
                benchmark_curve_name: None,
            },
            // Good bond: should succeed
            PositionInput {
                position_id: "GOOD-001".to_string(),
                product: make_bond_input(ref_date),
                quantity: 100_000.0,
                cost_basis: None,
                benchmark_curve_name: None,
            },
        ];

        let results = valuate_portfolio(&positions, &md);
        assert_eq!(results.len(), 2);

        // Bad bond has errors
        assert!(!results[0].errors.is_empty(), "Matured bond should have errors");

        // Good bond should still succeed
        assert!(results[1].errors.is_empty(), "Good bond should not have errors: {:?}", results[1].errors);
        let mv = find_measure(&results[1].measures, "PositionMarketValue");
        assert!(mv.is_some(), "Good bond should still produce MV");
    }
}
