use super::batch::PositionResult;

#[derive(Debug, Clone)]
pub struct PortfolioAggregates {
    pub total_market_value: f64,
    pub total_pnl: f64,
    pub total_dv01: f64,
    pub weighted_duration: f64, // MV-weighted modified duration
    pub weighted_yield: f64,   // MV-weighted yield
    pub position_count: usize,
}

/// Compute portfolio-level aggregates from position results.
///
/// - Total MV: sum of PositionMarketValue
/// - Total DV01: sum of (DV01 x quantity / 100)
/// - Weighted duration: sum(duration_i x MV_i) / sum(MV_i)
/// - Weighted yield: sum(yield_i x MV_i) / sum(MV_i)
pub fn aggregate(results: &[PositionResult]) -> PortfolioAggregates {
    let mut total_mv = 0.0;
    let mut total_pnl = 0.0;
    let mut total_dv01 = 0.0;
    let mut weighted_dur_sum = 0.0;
    let mut weighted_yield_sum = 0.0;
    let mut mv_sum_for_weighting = 0.0;

    for r in results {
        let mv = get_measure(r, "PositionMarketValue").unwrap_or(0.0);
        let pnl = get_measure(r, "PositionPnL").unwrap_or(0.0);
        let quantity = get_measure(r, "Quantity").unwrap_or(0.0);

        total_mv += mv;
        total_pnl += pnl;

        // DV01 from dispatch is per $100 face; scale by position size
        if let Some(dv01) = get_measure(r, "DV01") {
            total_dv01 += dv01 * quantity / 100.0;
        }

        // MV-weighted duration
        if let Some(dur) = get_measure(r, "ModifiedDuration")
            .or_else(|| get_measure(r, "EffectiveDuration"))
            .or_else(|| get_measure(r, "SpreadDuration"))
        {
            if mv.abs() > 0.01 {
                weighted_dur_sum += dur * mv;
                mv_sum_for_weighting += mv;
            }
        }

        // MV-weighted yield
        if let Some(y) = get_measure(r, "YieldToMaturity")
            .or_else(|| get_measure(r, "Yield"))
        {
            if mv.abs() > 0.01 {
                weighted_yield_sum += y * mv;
            }
        }
    }

    let weighted_duration = if mv_sum_for_weighting.abs() > 0.01 {
        weighted_dur_sum / mv_sum_for_weighting
    } else {
        0.0
    };

    let weighted_yield = if mv_sum_for_weighting.abs() > 0.01 {
        weighted_yield_sum / mv_sum_for_weighting
    } else {
        0.0
    };

    PortfolioAggregates {
        total_market_value: total_mv,
        total_pnl,
        total_dv01,
        weighted_duration,
        weighted_yield,
        position_count: results.len(),
    }
}

fn get_measure(result: &PositionResult, name: &str) -> Option<f64> {
    result
        .measures
        .iter()
        .find(|(k, _)| k == name)
        .map(|(_, v)| *v)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::curve::YieldCurve;
    use crate::date::Date;
    use crate::dispatch::*;
    use crate::portfolio::batch::{valuate_portfolio, PositionInput};
    use crate::portfolio::market_data::MarketDataSnapshot;

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

    fn sample_market_data() -> MarketDataSnapshot {
        let mut md = MarketDataSnapshot::new(d(2025, 1, 1));
        md.add_curve("USD_TREASURY", flat_curve(0.04));
        md
    }

    // ─── Total MV ───────────────────────────────────────────────────

    #[test]
    fn total_mv_is_sum_of_position_mvs() {
        let md = sample_market_data();
        let positions = vec![
            PositionInput {
                position_id: "B1".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: Some(99.0),
            },
            PositionInput {
                position_id: "B2".into(),
                product: sample_bond(98.0),
                quantity: 500_000.0,
                cost_basis: Some(97.0),
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        let agg = aggregate(&result.position_results);

        // B1 MV = 100/100 * 1M = 1_000_000
        // B2 MV = 98/100 * 500K = 490_000
        // Total = 1_490_000
        assert!((agg.total_market_value - 1_490_000.0).abs() < 1.0);
        assert_eq!(agg.position_count, 2);
    }

    // ─── Total DV01 ─────────────────────────────────────────────────

    #[test]
    fn total_dv01_is_sum_of_scaled_dv01s() {
        let md = sample_market_data();
        let positions = vec![
            PositionInput {
                position_id: "B1".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "B2".into(),
                product: sample_bond(100.0),
                quantity: 2_000_000.0,
                cost_basis: None,
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        let agg = aggregate(&result.position_results);

        // DV01 should be > 0 for bonds with duration
        assert!(agg.total_dv01 > 0.0);

        // B2 has 2x quantity of B1, so B2's contribution to total DV01
        // should be 2x B1's contribution
        let r1_dv01 = get_measure(&result.position_results[0], "DV01").unwrap();
        let r1_qty = get_measure(&result.position_results[0], "Quantity").unwrap();
        let r2_dv01 = get_measure(&result.position_results[1], "DV01").unwrap();
        let r2_qty = get_measure(&result.position_results[1], "Quantity").unwrap();

        let expected_total = r1_dv01 * r1_qty / 100.0 + r2_dv01 * r2_qty / 100.0;
        assert!((agg.total_dv01 - expected_total).abs() < 0.01);
    }

    // ─── Weighted duration ──────────────────────────────────────────

    #[test]
    fn weighted_duration_is_mv_weighted_average() {
        let md = sample_market_data();

        // Two bonds with different prices (hence different weights)
        let positions = vec![
            PositionInput {
                position_id: "B1".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
            PositionInput {
                position_id: "B2".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        let agg = aggregate(&result.position_results);

        // With equal quantities and prices, weighted duration = individual duration
        let dur1 = get_measure(&result.position_results[0], "ModifiedDuration").unwrap();
        assert!((agg.weighted_duration - dur1).abs() < 0.01);
    }

    // ─── Mixed products ─────────────────────────────────────────────

    #[test]
    fn mixed_products_bonds_and_swaps() {
        let md = sample_market_data();
        let positions = vec![
            PositionInput {
                position_id: "BOND".into(),
                product: sample_bond(100.0),
                quantity: 1_000_000.0,
                cost_basis: Some(99.0),
            },
            PositionInput {
                position_id: "SWAP".into(),
                product: sample_swap(),
                quantity: 1_000_000.0,
                cost_basis: None,
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        let agg = aggregate(&result.position_results);

        // Bond contributes MV, swap does not contribute PositionMarketValue
        // (swap NPV is tracked differently)
        assert!(agg.total_market_value > 0.0);
        assert_eq!(agg.position_count, 2);
    }

    // ─── Empty results ──────────────────────────────────────────────

    #[test]
    fn aggregate_empty_results() {
        let agg = aggregate(&[]);
        assert_eq!(agg.total_market_value, 0.0);
        assert_eq!(agg.total_pnl, 0.0);
        assert_eq!(agg.total_dv01, 0.0);
        assert_eq!(agg.weighted_duration, 0.0);
        assert_eq!(agg.weighted_yield, 0.0);
        assert_eq!(agg.position_count, 0);
    }

    // ─── Total P&L ──────────────────────────────────────────────────

    #[test]
    fn total_pnl_sums_across_positions() {
        let md = sample_market_data();
        let positions = vec![
            PositionInput {
                position_id: "B1".into(),
                product: sample_bond(102.0),
                quantity: 1_000_000.0,
                cost_basis: Some(99.0),
            },
            PositionInput {
                position_id: "B2".into(),
                product: sample_bond(97.0),
                quantity: 500_000.0,
                cost_basis: Some(100.0),
            },
        ];

        let result = valuate_portfolio(&positions, &md);
        let agg = aggregate(&result.position_results);

        // B1 PnL = (102/100 * 1M) - (99/100 * 1M) = 30,000
        // B2 PnL = (97/100 * 500K) - (100/100 * 500K) = -15,000
        // Total = 15,000
        assert!((agg.total_pnl - 15_000.0).abs() < 1.0);
    }

    // ─── Weighted yield ─────────────────────────────────────────────

    #[test]
    fn weighted_yield_computed_for_bonds() {
        let md = sample_market_data();
        let positions = vec![PositionInput {
            position_id: "B1".into(),
            product: sample_bond(100.0),
            quantity: 1_000_000.0,
            cost_basis: None,
        }];

        let result = valuate_portfolio(&positions, &md);
        let agg = aggregate(&result.position_results);

        // A par bond (price=100, coupon=5%) should have YTM ~= 5%
        assert!(agg.weighted_yield > 0.04);
        assert!(agg.weighted_yield < 0.06);
    }
}
