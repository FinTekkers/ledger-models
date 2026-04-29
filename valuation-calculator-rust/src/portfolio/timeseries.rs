//! Time series portfolio valuation engine.
//!
//! Values a fixed portfolio across multiple dates, each with its own
//! market data snapshot. Computes portfolio-level aggregates and
//! optional daily P&L attribution.

use crate::date::Date;
use crate::dispatch::ProductInput;
use super::market_data::MarketDataSnapshot;
use super::batch::{self, PositionInput, PositionResult, find_measure};
use super::daily_pnl::{self, DailyPnl};

/// Portfolio valuation results for a single date.
#[derive(Debug, Clone)]
pub struct DatedResult {
    pub date: Date,
    pub position_results: Vec<PositionResult>,
    pub total_mv: f64,
    pub total_dv01: f64,
    pub weighted_duration: f64,
}

/// Complete time series valuation output.
#[derive(Debug, Clone)]
pub struct TimeSeriesResult {
    pub dated_results: Vec<DatedResult>,
    pub daily_pnl: Vec<DailyPnl>,
}

/// Run portfolio valuation across multiple dates.
///
/// The portfolio (positions) is fixed; market data changes per date.
/// Market data series must be provided as `(Date, MarketDataSnapshot)` tuples,
/// ideally sorted chronologically.
///
/// If `compute_daily_pnl` is true, daily P&L attribution is computed
/// between consecutive dates.
pub fn valuate_timeseries(
    positions: &[PositionInput],
    market_data_series: &[(Date, MarketDataSnapshot)],
    compute_pnl: bool,
) -> TimeSeriesResult {
    if market_data_series.is_empty() {
        return TimeSeriesResult {
            dated_results: Vec::new(),
            daily_pnl: Vec::new(),
        };
    }

    let mut dated_results: Vec<DatedResult> = Vec::with_capacity(market_data_series.len());

    for (date, md) in market_data_series {
        // Update settlement dates in positions to match the valuation date
        let dated_positions: Vec<PositionInput> = positions.iter()
            .map(|p| {
                let mut dp = p.clone();
                update_settlement(&mut dp.product, *date);
                dp
            })
            .collect();

        let results = batch::valuate_portfolio(&dated_positions, md);

        // Compute portfolio aggregates
        let total_mv: f64 = results.iter()
            .filter_map(|r| find_measure(&r.measures, "PositionMarketValue"))
            .sum();

        let total_dv01: f64 = results.iter()
            .filter_map(|r| {
                let dv01 = find_measure(&r.measures, "DV01")?;
                let qty = find_measure(&r.measures, "Quantity")?;
                Some(dv01 * qty / 100.0)
            })
            .sum();

        let dur_mv_sum: f64 = results.iter()
            .filter_map(|r| {
                let dur = find_measure(&r.measures, "ModifiedDuration")
                    .or_else(|| find_measure(&r.measures, "EffectiveDuration"))?;
                let mv = find_measure(&r.measures, "PositionMarketValue")?;
                Some(dur * mv)
            })
            .sum();
        let weighted_duration = if total_mv.abs() > 0.01 {
            dur_mv_sum / total_mv
        } else {
            0.0
        };

        dated_results.push(DatedResult {
            date: *date,
            position_results: results,
            total_mv,
            total_dv01,
            weighted_duration,
        });
    }

    // Compute daily P&L between consecutive dates
    let mut daily_pnl_results = Vec::new();
    if compute_pnl && dated_results.len() >= 2 {
        for window in dated_results.windows(2) {
            let prev = &window[0];
            let curr = &window[1];

            let pnl = daily_pnl::compute_daily_pnl(
                prev.date,
                curr.date,
                prev.total_mv,
                curr.total_mv,
                &prev.position_results,
            );
            daily_pnl_results.push(pnl);
        }
    }

    TimeSeriesResult {
        dated_results,
        daily_pnl: daily_pnl_results,
    }
}

/// Update settlement date in a product input to match the valuation date.
fn update_settlement(product: &mut ProductInput, date: Date) {
    match product {
        ProductInput::Bond(ref mut b) => { b.settlement = date; }
        ProductInput::CallableBond(ref mut c) => { c.settlement = date; }
        ProductInput::Tips(ref mut t) => { t.settlement = date; }
        ProductInput::Mbs(ref mut m) => { m.settlement = date; }
        ProductInput::Muni(ref mut m) => { m.settlement = date; }
        ProductInput::AmortizingBond(ref mut a) => { a.settlement = date; }
        ProductInput::MoneyMarket(ref mut mm) => { mm.settlement = date; }
        _ => {} // Swaps, repos, etc. have start/end dates, not settlement
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

    fn curve_at(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(ref_date, vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0], vec![rate; 6]).unwrap()
    }

    fn make_bond_position(id: &str, settlement: Date) -> PositionInput {
        PositionInput {
            position_id: id.to_string(),
            product: ProductInput::Bond(BondInput {
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
            }),
            quantity: 1_000_000.0,
            cost_basis: Some(100.0),
            benchmark_curve_name: Some("UST".to_string()),
        }
    }

    fn make_swap_position(id: &str, ref_date: Date, curve: YieldCurve) -> PositionInput {
        PositionInput {
            position_id: id.to_string(),
            product: ProductInput::Swap(SwapInput {
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
            }),
            quantity: 1.0,
            cost_basis: None,
            benchmark_curve_name: Some("UST".to_string()),
        }
    }

    fn build_market_data_series(dates_rates: &[(Date, f64)]) -> Vec<(Date, MarketDataSnapshot)> {
        dates_rates.iter().map(|&(date, rate)| {
            let mut md = MarketDataSnapshot::new(date);
            md.add_curve("UST", curve_at(date, rate));
            (date, md)
        }).collect()
    }

    // ── 3-date series ──

    #[test]
    fn three_date_series() {
        let d1 = d(2025, 6, 1);
        let d2 = d(2025, 6, 15);
        let d3 = d(2025, 7, 1);

        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[
            (d1, 0.045),
            (d2, 0.045),
            (d3, 0.045),
        ]);

        let result = valuate_timeseries(&positions, &md_series, false);
        assert_eq!(result.dated_results.len(), 3);
        assert_eq!(result.daily_pnl.len(), 0); // P&L not requested

        // Each date should have results
        for dr in &result.dated_results {
            assert_eq!(dr.position_results.len(), 1);
            assert!(dr.total_mv != 0.0, "MV should be non-zero");
        }
    }

    // ── Daily P&L: total_pnl = MV_t1 - MV_t0 ──

    #[test]
    fn daily_pnl_total_equals_mv_diff() {
        let d1 = d(2025, 6, 1);
        let d2 = d(2025, 6, 2);

        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[
            (d1, 0.045),
            (d2, 0.045),
        ]);

        let result = valuate_timeseries(&positions, &md_series, true);
        assert_eq!(result.daily_pnl.len(), 1);

        let pnl = &result.daily_pnl[0];
        let mv0 = result.dated_results[0].total_mv;
        let mv1 = result.dated_results[1].total_mv;
        let expected_pnl = mv1 - mv0;
        assert!((pnl.total_pnl - expected_pnl).abs() < 1e-6,
            "total_pnl ({}) should equal MV diff ({})", pnl.total_pnl, expected_pnl);
    }

    // ── P&L decomposition: carry + curve_shift ~ total_pnl ──

    #[test]
    fn pnl_decomposition_consistency() {
        let d1 = d(2025, 6, 1);
        let d2 = d(2025, 6, 2);

        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[
            (d1, 0.045),
            (d2, 0.050), // rates rose
        ]);

        let result = valuate_timeseries(&positions, &md_series, true);
        let pnl = &result.daily_pnl[0];

        let sum = pnl.carry + pnl.curve_shift + pnl.residual;
        assert!((sum - pnl.total_pnl).abs() < 1e-6,
            "carry ({}) + curve_shift ({}) + residual ({}) should equal total_pnl ({})",
            pnl.carry, pnl.curve_shift, pnl.residual, pnl.total_pnl);
    }

    // ── Rising rates: bond MV should decrease ──

    #[test]
    fn rising_rates_bond_mv_decreases() {
        let d1 = d(2025, 6, 1);
        let d2 = d(2025, 6, 15);
        let d3 = d(2025, 7, 1);

        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[
            (d1, 0.04),
            (d2, 0.05),
            (d3, 0.06), // rates rising
        ]);

        let result = valuate_timeseries(&positions, &md_series, true);

        // Check MV trend: should generally decrease with rising rates
        // (small carry may offset very slightly, but with 100bp+ moves it should be clear)
        let mv0 = result.dated_results[0].total_mv;
        let mv2 = result.dated_results[2].total_mv;
        assert!(mv2 < mv0,
            "Bond MV should decrease with rising rates: mv0={}, mv2={}", mv0, mv2);
    }

    // ── Falling rates: bond MV should increase ──

    #[test]
    fn falling_rates_bond_mv_increases() {
        let d1 = d(2025, 6, 1);
        let d2 = d(2025, 6, 15);
        let d3 = d(2025, 7, 1);

        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[
            (d1, 0.06),
            (d2, 0.05),
            (d3, 0.04), // rates falling
        ]);

        let result = valuate_timeseries(&positions, &md_series, true);

        let mv0 = result.dated_results[0].total_mv;
        let mv2 = result.dated_results[2].total_mv;
        assert!(mv2 > mv0,
            "Bond MV should increase with falling rates: mv0={}, mv2={}", mv0, mv2);
    }

    // ── Aggregates change with rates ──

    #[test]
    fn aggregates_change_with_rates() {
        let d1 = d(2025, 6, 1);
        let d2 = d(2025, 7, 1);

        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[
            (d1, 0.04),
            (d2, 0.06), // significant rate change
        ]);

        let result = valuate_timeseries(&positions, &md_series, false);

        let dur0 = result.dated_results[0].weighted_duration;
        let dur1 = result.dated_results[1].weighted_duration;
        // Duration and DV01 should change (not necessarily monotonically, but should differ)
        // For a 10Y bond going from 4% to 6%, duration should decrease slightly
        assert!(dur0 > 0.0, "Duration should be positive: {}", dur0);
        assert!(dur1 > 0.0, "Duration should be positive: {}", dur1);
        // With higher rates, duration decreases
        assert!(dur1 < dur0,
            "Duration should decrease with rising rates: dur0={}, dur1={}", dur0, dur1);
    }

    // ── Empty market data series ──

    #[test]
    fn empty_market_data_series() {
        let positions = vec![make_bond_position("B1", d(2025, 6, 1))];
        let result = valuate_timeseries(&positions, &[], false);
        assert!(result.dated_results.is_empty());
        assert!(result.daily_pnl.is_empty());
    }

    // ── Single date: no daily P&L ──

    #[test]
    fn single_date_no_pnl() {
        let d1 = d(2025, 6, 1);
        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[(d1, 0.04)]);

        let result = valuate_timeseries(&positions, &md_series, true);
        assert_eq!(result.dated_results.len(), 1);
        assert!(result.daily_pnl.is_empty(), "No P&L for single date");
    }

    // ── Mixed portfolio time series: bonds + swaps across 5 dates ──

    #[test]
    fn mixed_portfolio_five_dates() {
        let d1 = d(2025, 6, 1);
        let initial_curve = curve_at(d1, 0.04);

        let positions = vec![
            make_bond_position("B1", d1),
            make_bond_position("B2", d1),
            make_swap_position("S1", d1, initial_curve),
        ];

        let dates_rates = vec![
            (d1, 0.040),
            (d(2025, 6, 8), 0.042),
            (d(2025, 6, 15), 0.038),
            (d(2025, 6, 22), 0.041),
            (d(2025, 6, 29), 0.045),
        ];

        let md_series = build_market_data_series(&dates_rates);

        let result = valuate_timeseries(&positions, &md_series, true);

        // 5 dates
        assert_eq!(result.dated_results.len(), 5);

        // 4 daily P&L entries
        assert_eq!(result.daily_pnl.len(), 4);

        // Each date should have 3 position results
        for dr in &result.dated_results {
            assert_eq!(dr.position_results.len(), 3,
                "Each date should have 3 positions");
        }

        // Total MV should be non-zero at each date
        for dr in &result.dated_results {
            assert!(dr.total_mv.abs() > 100.0,
                "Total MV should be substantial, got {}", dr.total_mv);
        }

        // P&L decomposition should be consistent at each step
        for pnl in &result.daily_pnl {
            let sum = pnl.carry + pnl.curve_shift + pnl.residual;
            assert!((sum - pnl.total_pnl).abs() < 1e-6,
                "P&L decomposition should sum to total: {} vs {}", sum, pnl.total_pnl);
        }
    }

    // ── DV01 computation in portfolio aggregates ──

    #[test]
    fn portfolio_dv01_computed() {
        let d1 = d(2025, 6, 1);
        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[(d1, 0.04)]);

        let result = valuate_timeseries(&positions, &md_series, false);
        let dr = &result.dated_results[0];

        assert!(dr.total_dv01 > 0.0,
            "Portfolio DV01 should be positive for a bond position: {}", dr.total_dv01);
    }

    // ── Weighted duration is reasonable ──

    #[test]
    fn weighted_duration_reasonable() {
        let d1 = d(2025, 6, 1);
        let positions = vec![make_bond_position("B1", d1)];

        let md_series = build_market_data_series(&[(d1, 0.04)]);

        let result = valuate_timeseries(&positions, &md_series, false);
        let dur = result.dated_results[0].weighted_duration;

        // A 10Y 5% coupon bond should have duration around 7-8 years at 4% yield
        assert!(dur > 5.0 && dur < 10.0,
            "Duration of 10Y bond should be ~7-8 years, got {}", dur);
    }
}
