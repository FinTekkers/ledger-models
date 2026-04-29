//! Daily P&L attribution between consecutive valuation dates.
//!
//! Decomposes total P&L into:
//! - Carry: income earned from holding the portfolio (coupon/yield accrual)
//! - Curve shift: P&L from changes in the yield curve
//! - Residual: unexplained P&L (rounding, model limitations)

use crate::date::Date;
use super::batch::{PositionResult, find_measure};

/// P&L attribution for a single day (or period between consecutive dates).
#[derive(Debug, Clone)]
pub struct DailyPnl {
    pub from_date: Date,
    pub to_date: Date,
    pub total_pnl: f64,
    pub carry: f64,
    pub curve_shift: f64,
    pub residual: f64,
}

/// Compute daily P&L attribution between two consecutive valuation snapshots.
///
/// The total P&L is decomposed as:
/// - **carry**: yield-based income (YTM x MV x days/365, summed across positions)
/// - **curve_shift**: total_pnl - carry (all remaining P&L attributed to curve moves)
/// - **residual**: 0.0 (simplified; all non-carry goes to curve_shift)
pub fn compute_daily_pnl(
    from_date: Date,
    to_date: Date,
    prev_total_mv: f64,
    curr_total_mv: f64,
    prev_positions: &[PositionResult],
) -> DailyPnl {
    let total_pnl = curr_total_mv - prev_total_mv;

    let days = to_date.days_since(&from_date) as f64;

    // Carry estimate: for each position with a yield, compute
    // carry = yield * MV * days / 365
    let carry: f64 = prev_positions.iter()
        .filter_map(|r| {
            let ytm = find_measure(&r.measures, "YieldToMaturity")?;
            let mv = find_measure(&r.measures, "PositionMarketValue")?;
            Some(ytm * mv * days / 365.0)
        })
        .sum();

    let curve_shift = total_pnl - carry;

    DailyPnl {
        from_date,
        to_date,
        total_pnl,
        carry,
        curve_shift,
        residual: 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    #[test]
    fn pnl_decomposition_sums_to_total() {
        let prev_positions = vec![
            PositionResult {
                position_id: "B1".to_string(),
                measures: vec![
                    ("YieldToMaturity".to_string(), 0.05),
                    ("PositionMarketValue".to_string(), 1_000_000.0),
                ],
                errors: vec![],
            },
        ];

        let pnl = compute_daily_pnl(
            d(2025, 6, 1),
            d(2025, 6, 2),
            1_000_000.0,
            1_000_100.0,
            &prev_positions,
        );

        assert_eq!(pnl.total_pnl, 100.0);
        let sum = pnl.carry + pnl.curve_shift + pnl.residual;
        assert!((sum - pnl.total_pnl).abs() < 1e-10,
            "carry + curve_shift + residual should equal total_pnl");
    }

    #[test]
    fn carry_estimate_positive_for_positive_yield() {
        let prev_positions = vec![
            PositionResult {
                position_id: "B1".to_string(),
                measures: vec![
                    ("YieldToMaturity".to_string(), 0.04),
                    ("PositionMarketValue".to_string(), 10_000_000.0),
                ],
                errors: vec![],
            },
        ];

        let pnl = compute_daily_pnl(
            d(2025, 6, 1),
            d(2025, 6, 2),
            10_000_000.0,
            10_000_000.0,
            &prev_positions,
        );

        assert!(pnl.carry > 0.0, "Carry should be positive for positive yield");
        // 1-day carry at 4% on 10M ~ 10M * 0.04 / 365 ~ $1,095.89
        assert!((pnl.carry - 1095.89).abs() < 1.0,
            "1-day carry should be ~$1,096, got {}", pnl.carry);
    }
}
