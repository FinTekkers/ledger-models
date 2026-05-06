use crate::date::Date;
use crate::error::BondError;
use super::TipsSpec;

const MAX_ITER: u32 = 100;
const PRICE_TOL: f64 = 1e-12;
const YIELD_TOL: f64 = 1e-14;

/// Price a TIPS given a real yield.
/// Discount the inflation-adjusted cashflows at the real yield.
/// Returns the real dirty price (as a dollar amount, not percentage of adjusted face).
pub fn real_dirty_price(
    tips: &TipsSpec,
    real_yield: f64,
    settlement: Date,
    current_cpi: f64,
) -> f64 {
    let cfs = super::cashflows::generate_tips_cashflows(tips, settlement, current_cpi);
    let freq = tips.bond.coupon_freq as f64;
    let r = 1.0 + real_yield / freq;

    cfs.iter()
        .map(|cf| cf.amount / r.powf(cf.period_fraction))
        .sum()
}

/// Solve for the real yield given a market price.
/// The market price is the REAL clean price (what you actually pay per $100 original face).
/// Newton-Raphson, same pattern as ytm_solver.
pub fn solve_real_yield(
    tips: &TipsSpec,
    market_real_clean_price: f64,
    settlement: Date,
    current_cpi: f64,
) -> Result<f64, BondError> {
    if settlement >= tips.bond.maturity_date {
        return Err(BondError::MaturedBond);
    }

    let cfs = super::cashflows::generate_tips_cashflows(tips, settlement, current_cpi);
    if cfs.is_empty() {
        return Err(BondError::MaturedBond);
    }

    let ai = tips_accrued_interest(tips, settlement, current_cpi);
    let dirty_target = market_real_clean_price + ai;

    let freq = tips.bond.coupon_freq as f64;
    let n_periods = cfs.len() as f64;
    let ratio = super::index_ratio::index_ratio(current_cpi, tips.base_cpi);
    let adj_principal = tips.bond.face_value * ratio;
    let annual_coupon = tips.bond.coupon_rate * adj_principal;

    let initial_guess = if dirty_target > 0.0 && n_periods > 0.0 {
        let floored_principal = tips.bond.face_value * ratio.max(1.0);
        let approx = (annual_coupon / freq + (floored_principal - dirty_target) / n_periods)
            / ((floored_principal + dirty_target) / 2.0)
            * freq;
        approx.clamp(-0.05, 1.0)
    } else {
        0.05
    };

    // Newton-Raphson
    let mut y = initial_guess;

    for iter in 0..MAX_ITER {
        let mut pv = 0.0_f64;
        let mut dpv = 0.0_f64;

        for cf in &cfs {
            let r = 1.0 + y / freq;
            let disc = r.powf(cf.period_fraction);
            pv += cf.amount / disc;
            dpv -= cf.amount * cf.period_fraction / (freq * disc * r);
        }

        let f_val = pv - dirty_target;
        if f_val.abs() < PRICE_TOL {
            return Ok(y);
        }

        if dpv.abs() < 1e-15 {
            return Err(BondError::ConvergenceFailure { iterations: iter, last_price_error: f_val });
        }

        let dy = f_val / dpv;
        y -= dy;

        if y <= -freq {
            y = -freq + 1e-8;
        }

        if dy.abs() < YIELD_TOL {
            return Ok(y);
        }
    }

    Err(BondError::ConvergenceFailure { iterations: MAX_ITER, last_price_error: 0.0 })
}

/// Breakeven inflation rate: the inflation rate at which a TIPS and a nominal
/// Treasury of the same maturity give equal returns.
/// BEI ~ nominal_yield - real_yield
/// (Fisher equation approximation)
pub fn breakeven_inflation(nominal_yield: f64, real_yield: f64) -> f64 {
    nominal_yield - real_yield
}

/// More precise breakeven using the Fisher equation:
/// (1 + nominal) = (1 + real) * (1 + inflation)
/// => inflation = (1 + nominal) / (1 + real) - 1
pub fn breakeven_inflation_exact(nominal_yield: f64, real_yield: f64) -> f64 {
    (1.0 + nominal_yield) / (1.0 + real_yield) - 1.0
}

/// Accrued interest on a TIPS: same as bond AI but on adjusted principal
pub fn tips_accrued_interest(
    tips: &TipsSpec,
    settlement: Date,
    current_cpi: f64,
) -> f64 {
    let ratio = super::index_ratio::index_ratio(current_cpi, tips.base_cpi);
    let base_ai = crate::bond::accrued_interest::accrued_interest(&tips.bond, settlement);
    base_ai * ratio
}

/// Duration of a TIPS (real duration, sensitivity to real yield changes)
pub fn tips_duration(
    tips: &TipsSpec,
    real_yield: f64,
    settlement: Date,
    current_cpi: f64,
) -> f64 {
    // Numerical bump
    let bump = 0.0001;
    let p0 = real_dirty_price(tips, real_yield, settlement, current_cpi);
    let p_up = real_dirty_price(tips, real_yield + bump, settlement, current_cpi);
    let p_down = real_dirty_price(tips, real_yield - bump, settlement, current_cpi);
    -(p_up - p_down) / (2.0 * bump * p0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::{BondSpec, CouponType};
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn make_tips(coupon: f64, dated: Date, maturity: Date, base_cpi: f64) -> TipsSpec {
        TipsSpec {
            bond: BondSpec {
                coupon_rate: coupon,
                coupon_freq: 2,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: dated,
                maturity_date: maturity,
                day_count: DayCountConvention::ActualActualICMA,
                ex_dividend_days: 0,
            },
            base_cpi,
            base_cpi_date: dated,
        }
    }

    #[test]
    fn real_dirty_price_at_par() {
        // On a coupon date, when real_yield = coupon_rate and ratio = 1.0,
        // price should equal face_value (par)
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let dp = real_dirty_price(&tips, 0.02, d(2025, 5, 15), 100.0);
        assert!((dp - 100.0).abs() < 1e-8, "dirty_price={}", dp);
    }

    #[test]
    fn real_dirty_price_with_inflation() {
        // With 3% inflation, ratio = 1.03, all cashflows scale by 1.03
        // So price should be approximately face * ratio when yield = coupon
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let dp = real_dirty_price(&tips, 0.02, d(2025, 5, 15), 103.0);
        // adj_principal = 103, coupon = 0.02*103/2 = 1.03
        // This should price at ~103 when discounted at 2% real yield
        assert!((dp - 103.0).abs() < 1e-6, "dirty_price={}", dp);
    }

    #[test]
    fn real_yield_round_trip() {
        let tips = make_tips(0.015, d(2025, 5, 15), d(2035, 5, 15), 256.394);
        let settle = d(2025, 5, 15);
        let current_cpi = 264.084; // ~3% inflation
        let target_yield = 0.02;

        let dp = real_dirty_price(&tips, target_yield, settle, current_cpi);
        let ai = tips_accrued_interest(&tips, settle, current_cpi);
        let cp = dp - ai;

        let solved = solve_real_yield(&tips, cp, settle, current_cpi).unwrap();
        assert!((solved - target_yield).abs() < 1e-10,
            "target={}, solved={}", target_yield, solved);
    }

    #[test]
    fn real_yield_round_trip_between_coupon_dates() {
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let settle = d(2025, 8, 20);
        let current_cpi = 105.0;
        let target_yield = 0.025;

        let dp = real_dirty_price(&tips, target_yield, settle, current_cpi);
        let ai = tips_accrued_interest(&tips, settle, current_cpi);
        let cp = dp - ai;

        let solved = solve_real_yield(&tips, cp, settle, current_cpi).unwrap();
        assert!((solved - target_yield).abs() < 1e-10,
            "target={}, solved={}", target_yield, solved);
    }

    #[test]
    fn breakeven_inflation_approximate() {
        // nominal 5%, real 2% -> BEI ~ 3%
        let bei = breakeven_inflation(0.05, 0.02);
        assert!((bei - 0.03).abs() < 1e-12, "BEI={}", bei);
    }

    #[test]
    fn breakeven_inflation_exact_fisher() {
        // (1.05) / (1.02) - 1 = 0.02941176...
        let bei = breakeven_inflation_exact(0.05, 0.02);
        let expected = (1.05 / 1.02) - 1.0;
        assert!((bei - expected).abs() < 1e-12, "BEI_exact={}", bei);
        assert!((bei - 0.02941176470588235).abs() < 1e-12);
    }

    #[test]
    fn breakeven_approximate_vs_exact() {
        let approx = breakeven_inflation(0.05, 0.02);
        let exact = breakeven_inflation_exact(0.05, 0.02);
        // Approximate should be ~3%, exact should be ~2.94%
        assert!((approx - 0.03).abs() < 1e-12);
        assert!(exact < approx, "Exact BEI should be less than approximate");
        assert!((exact - 0.02941176470588235).abs() < 1e-12);
    }

    #[test]
    fn tips_accrued_interest_scales_with_ratio() {
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let settle = d(2025, 8, 20);

        // With no inflation (ratio = 1.0)
        let ai_no_inflation = tips_accrued_interest(&tips, settle, 100.0);
        let base_ai = crate::bond::accrued_interest::accrued_interest(&tips.bond, settle);
        assert!((ai_no_inflation - base_ai).abs() < 1e-12);

        // With 5% inflation (ratio = 1.05)
        let ai_with_inflation = tips_accrued_interest(&tips, settle, 105.0);
        assert!((ai_with_inflation - base_ai * 1.05).abs() < 1e-12,
            "ai_inflation={}, expected={}", ai_with_inflation, base_ai * 1.05);
    }

    #[test]
    fn tips_accrued_interest_zero_on_coupon_date() {
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let ai = tips_accrued_interest(&tips, d(2025, 5, 15), 103.0);
        assert!(ai.abs() < 1e-15);
    }

    #[test]
    fn tips_duration_positive_and_reasonable() {
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let dur = tips_duration(&tips, 0.02, d(2025, 5, 15), 103.0);
        // 10-year bond with 2% coupon should have duration between 7 and 10
        assert!(dur > 7.0 && dur < 10.0, "duration={}", dur);
    }

    #[test]
    fn tips_duration_increases_with_maturity() {
        let tips_5y = make_tips(0.02, d(2025, 5, 15), d(2030, 5, 15), 100.0);
        let tips_30y = make_tips(0.02, d(2025, 5, 15), d(2055, 5, 15), 100.0);
        let dur_5y = tips_duration(&tips_5y, 0.02, d(2025, 5, 15), 103.0);
        let dur_30y = tips_duration(&tips_30y, 0.02, d(2025, 5, 15), 103.0);
        assert!(dur_30y > dur_5y, "30y dur={} should > 5y dur={}", dur_30y, dur_5y);
    }

    #[test]
    fn zero_inflation_tips_matches_nominal_bond() {
        // With ratio = 1.0, TIPS dirty price should match nominal bond dirty price
        let tips = make_tips(0.05, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let tips_dp = real_dirty_price(&tips, 0.05, d(2025, 5, 15), 100.0);
        let bond_dp = crate::bond::pricing::dirty_price_from_yield(&tips.bond, 0.05, d(2025, 5, 15));
        assert!((tips_dp - bond_dp).abs() < 1e-8,
            "tips_dp={}, bond_dp={}", tips_dp, bond_dp);
    }

    #[test]
    fn matured_tips_returns_error() {
        let tips = make_tips(0.02, d(2020, 5, 15), d(2025, 5, 15), 100.0);
        assert!(matches!(
            solve_real_yield(&tips, 100.0, d(2025, 6, 1), 103.0),
            Err(BondError::MaturedBond)
        ));
    }

    #[test]
    fn maturity_cashflow_includes_deflation_floored_principal() {
        // Deflation scenario: CPI = 95, base = 100
        let tips = make_tips(0.02, d(2025, 5, 15), d(2027, 5, 15), 100.0);
        let cfs = super::super::cashflows::generate_tips_cashflows(&tips, d(2025, 5, 15), 95.0);

        let last = cfs.last().unwrap();
        // Maturity cashflow: coupon on raw principal + floored principal
        // coupon = 0.02 * 95 / 2 = 0.95
        // floored principal = 100 (not 95)
        // total = 100.95
        assert!((last.amount - 100.95).abs() < 1e-12, "maturity cf={}", last.amount);
    }

    #[test]
    fn real_yield_round_trip_multiple_scenarios() {
        let scenarios = vec![
            (0.005, 250.0, 257.5, 0.01),  // Low coupon, ~3% inflation
            (0.02, 100.0, 110.0, 0.025),   // 10% inflation
            (0.0125, 300.0, 309.0, 0.015), // ~3% inflation
        ];

        for (coupon, base_cpi, current_cpi, target_yield) in scenarios {
            let tips = make_tips(coupon, d(2025, 5, 15), d(2035, 5, 15), base_cpi);
            let settle = d(2025, 5, 15);

            let dp = real_dirty_price(&tips, target_yield, settle, current_cpi);
            let ai = tips_accrued_interest(&tips, settle, current_cpi);
            let cp = dp - ai;

            let solved = solve_real_yield(&tips, cp, settle, current_cpi).unwrap();
            assert!((solved - target_yield).abs() < 1e-10,
                "coupon={}, target={}, solved={}", coupon, target_yield, solved);
        }
    }
}
