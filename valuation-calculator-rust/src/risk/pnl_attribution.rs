use crate::bond::BondSpec;
use crate::curve::YieldCurve;
use crate::date::Date;

/// P&L attribution result: decompose total P&L into components
#[derive(Debug, Clone)]
pub struct PnlAttribution {
    pub total_pnl: f64,
    pub carry: f64,         // income from holding (coupon accrual)
    pub rolldown: f64,      // P&L from aging along the curve (if curve is unchanged)
    pub curve_shift: f64,   // P&L from curve movement
    pub spread_change: f64, // P&L from spread change
    pub residual: f64,      // unexplained (convexity, cross-gamma, etc.)
}

/// Attribute P&L between two dates for a bond position.
///
/// Parameters:
/// - bond: the bond
/// - settle_t0, settle_t1: start and end settlement dates
/// - curve_t0: yield curve at t0
/// - curve_t1: yield curve at t1
/// - zspread_t0, zspread_t1: Z-spreads at each date
/// - face_amount: position size (face value held)
pub fn attribute_pnl(
    bond: &BondSpec,
    settle_t0: Date,
    settle_t1: Date,
    curve_t0: &YieldCurve,
    curve_t1: &YieldCurve,
    zspread_t0: f64,
    zspread_t1: f64,
    face_amount: f64,
) -> PnlAttribution {
    let price_t0 =
        crate::bond::zspread::dirty_price_with_zspread(bond, settle_t0, curve_t0, zspread_t0);
    let price_t1 =
        crate::bond::zspread::dirty_price_with_zspread(bond, settle_t1, curve_t1, zspread_t1);

    let total_pnl = (price_t1 - price_t0) / 100.0 * face_amount;

    // 1. Carry: coupon income earned over the period
    //    Simplified: carry = annual_coupon * day_fraction
    let days = settle_t1.days_since(&settle_t0) as f64;
    let carry = bond.coupon_rate * bond.face_value * days / 365.0 / 100.0 * face_amount;

    // 2. Rolldown: price change from aging on unchanged curve
    //    Price the bond at t1 settlement but on t0 curve with t0 spread
    let price_rolldown =
        crate::bond::zspread::dirty_price_with_zspread(bond, settle_t1, curve_t0, zspread_t0);
    let rolldown = (price_rolldown - price_t0) / 100.0 * face_amount - carry;

    // 3. Curve shift: price change from curve movement (holding spread constant)
    let price_curve_shift =
        crate::bond::zspread::dirty_price_with_zspread(bond, settle_t1, curve_t1, zspread_t0);
    let curve_shift = (price_curve_shift - price_rolldown) / 100.0 * face_amount;

    // 4. Spread change: price change from spread movement
    let spread_change = (price_t1 - price_curve_shift) / 100.0 * face_amount;

    // 5. Residual: unexplained portion
    let residual = total_pnl - carry - rolldown - curve_shift - spread_change;

    PnlAttribution {
        total_pnl,
        carry,
        rolldown,
        curve_shift,
        spread_change,
        residual,
    }
}

/// Duration-based P&L estimate: quick approximation using duration and convexity
pub fn duration_based_pnl(
    modified_duration: f64,
    convexity: f64,
    price: f64,
    yield_change: f64, // in decimal (e.g., 0.01 = 100bp)
    face_amount: f64,
) -> f64 {
    let pnl_pct =
        -modified_duration * yield_change + 0.5 * convexity * yield_change * yield_change;
    pnl_pct * price / 100.0 * face_amount
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::curve::YieldCurve;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn ust_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        }
    }

    fn us_treasury_curve(ref_date: Date) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048],
        )
        .unwrap()
    }

    fn shifted_curve(ref_date: Date, shift: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![
                0.04 + shift,
                0.041 + shift,
                0.042 + shift,
                0.043 + shift,
                0.044 + shift,
                0.045 + shift,
                0.046 + shift,
                0.047 + shift,
                0.048 + shift,
            ],
        )
        .unwrap()
    }

    // ---- Components sum to total ----

    #[test]
    fn components_sum_to_total() {
        let settle_t0 = d(2025, 5, 15);
        let settle_t1 = d(2025, 8, 15);
        let bond = ust_bond(0.05, settle_t0, d(2035, 5, 15));
        let curve_t0 = us_treasury_curve(settle_t0);
        let curve_t1 = shifted_curve(settle_t1, 0.005); // rates up 50bp
        let face = 1_000_000.0;

        let result = attribute_pnl(
            &bond, settle_t0, settle_t1, &curve_t0, &curve_t1, 0.001, 0.002, face,
        );

        let sum = result.carry + result.rolldown + result.curve_shift + result.spread_change + result.residual;
        assert!(
            (sum - result.total_pnl).abs() < 1e-8,
            "Components sum ({}) should equal total P&L ({}), diff={}",
            sum,
            result.total_pnl,
            (sum - result.total_pnl).abs()
        );
    }

    // ---- Unchanged curve and spread: P&L = carry + rolldown only ----

    #[test]
    fn unchanged_curve_pnl_is_carry_plus_rolldown() {
        let settle_t0 = d(2025, 5, 15);
        let settle_t1 = d(2025, 8, 15);
        let bond = ust_bond(0.05, settle_t0, d(2035, 5, 15));
        let curve = us_treasury_curve(settle_t0);
        let face = 1_000_000.0;

        let result = attribute_pnl(
            &bond, settle_t0, settle_t1, &curve, &curve, 0.001, 0.001, face,
        );

        // Curve shift and spread change should be approximately zero
        assert!(
            result.curve_shift.abs() < 1e-6,
            "Curve shift should be ~0 when curve unchanged: {}",
            result.curve_shift
        );
        assert!(
            result.spread_change.abs() < 1e-6,
            "Spread change should be ~0 when spread unchanged: {}",
            result.spread_change
        );

        // Total should be just carry + rolldown (+ residual which is tiny)
        let carry_rolldown = result.carry + result.rolldown;
        assert!(
            (carry_rolldown - result.total_pnl).abs() < 1e-4,
            "Total P&L ({}) should approximately equal carry+rolldown ({})",
            result.total_pnl,
            carry_rolldown
        );
    }

    // ---- Pure curve shift: carry and rolldown are isolated ----

    #[test]
    fn pure_curve_shift_isolates_curve_component() {
        let settle_t0 = d(2025, 5, 15);
        let settle_t1 = d(2025, 5, 16); // Just 1 day later to minimize carry/rolldown
        let bond = ust_bond(0.05, settle_t0, d(2035, 5, 15));
        let curve_t0 = us_treasury_curve(settle_t0);
        let curve_t1 = shifted_curve(settle_t1, 0.01); // 100bp shift
        let face = 1_000_000.0;

        let result = attribute_pnl(
            &bond, settle_t0, settle_t1, &curve_t0, &curve_t1, 0.0, 0.0, face,
        );

        // Curve shift should be the dominant component
        assert!(
            result.curve_shift.abs() > result.carry.abs(),
            "Curve shift ({}) should dominate carry ({}) for large rate move",
            result.curve_shift,
            result.carry
        );

        // Curve shift should be negative (rates went up)
        assert!(
            result.curve_shift < 0.0,
            "Curve shift should be negative when rates rise: {}",
            result.curve_shift
        );
    }

    // ---- Pure spread widening: only spread_change is non-zero (approximately) ----

    #[test]
    fn pure_spread_widening() {
        let settle_t0 = d(2025, 5, 15);
        let settle_t1 = d(2025, 5, 16); // Just 1 day later
        let bond = ust_bond(0.05, settle_t0, d(2035, 5, 15));
        // Same curve at both dates (just different reference date)
        let curve_t0 = us_treasury_curve(settle_t0);
        let curve_t1 = us_treasury_curve(settle_t1);
        let face = 1_000_000.0;

        let result = attribute_pnl(
            &bond,
            settle_t0,
            settle_t1,
            &curve_t0,
            &curve_t1,
            0.001,
            0.003, // spread widens by 20bp
            face,
        );

        // Spread change should be the dominant component
        assert!(
            result.spread_change.abs() > result.carry.abs(),
            "Spread change ({}) should dominate carry ({}) for spread widening",
            result.spread_change,
            result.carry
        );

        // Spread widening => lower price => negative P&L
        assert!(
            result.spread_change < 0.0,
            "Spread widening should produce negative P&L: {}",
            result.spread_change
        );
    }

    // ---- Duration-based P&L: approximately equals full-reval P&L for small yield changes ----

    #[test]
    fn duration_based_pnl_approx_full_reval_small_change() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let ytm = 0.05;
        let dy = 0.001; // 10bp -- small change
        let face = 1_000_000.0;

        let price_base = crate::bond::pricing::dirty_price_from_yield(&bond, ytm, settle);
        let price_shocked =
            crate::bond::pricing::dirty_price_from_yield(&bond, ytm + dy, settle);
        let full_reval_pnl = (price_shocked - price_base) / 100.0 * face;

        let mod_dur = crate::bond::duration::modified_duration(&bond, ytm, settle);
        let conv = crate::bond::convexity::convexity(&bond, ytm, settle);

        let approx_pnl = duration_based_pnl(mod_dur, conv, price_base, dy, face);

        let error_pct = ((approx_pnl - full_reval_pnl) / full_reval_pnl).abs();
        assert!(
            error_pct < 0.01,
            "Duration-based P&L should be within 1% of full reval for small changes: \
             approx={}, full_reval={}, error={}%",
            approx_pnl,
            full_reval_pnl,
            error_pct * 100.0
        );
    }

    // ---- Duration-based P&L: convexity term matters for large changes ----

    #[test]
    fn duration_based_pnl_convexity_matters_for_large_changes() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let ytm = 0.05;
        let dy = 0.02; // 200bp -- large change
        let face = 1_000_000.0;

        let price_base = crate::bond::pricing::dirty_price_from_yield(&bond, ytm, settle);
        let price_shocked =
            crate::bond::pricing::dirty_price_from_yield(&bond, ytm + dy, settle);
        let full_reval_pnl = (price_shocked - price_base) / 100.0 * face;

        let mod_dur = crate::bond::duration::modified_duration(&bond, ytm, settle);
        let conv = crate::bond::convexity::convexity(&bond, ytm, settle);

        // Duration-only estimate (no convexity)
        let duration_only_pnl = duration_based_pnl(mod_dur, 0.0, price_base, dy, face);

        // Duration + convexity estimate
        let dur_conv_pnl = duration_based_pnl(mod_dur, conv, price_base, dy, face);

        // Duration + convexity should be closer to full reval than duration-only
        let error_dur_only = (duration_only_pnl - full_reval_pnl).abs();
        let error_dur_conv = (dur_conv_pnl - full_reval_pnl).abs();

        assert!(
            error_dur_conv < error_dur_only,
            "Duration+convexity error ({}) should be less than duration-only error ({})",
            error_dur_conv,
            error_dur_only
        );
    }

    // ---- Carry is positive for coupon-bearing bonds ----

    #[test]
    fn carry_positive_for_coupon_bond() {
        let settle_t0 = d(2025, 5, 15);
        let settle_t1 = d(2025, 8, 15);
        let bond = ust_bond(0.05, settle_t0, d(2035, 5, 15));
        let curve = us_treasury_curve(settle_t0);
        let face = 1_000_000.0;

        let result = attribute_pnl(
            &bond, settle_t0, settle_t1, &curve, &curve, 0.0, 0.0, face,
        );

        assert!(
            result.carry > 0.0,
            "Carry should be positive for coupon-bearing bond: {}",
            result.carry
        );

        // Carry over ~3 months for 5% coupon on $1M face should be approximately
        // 0.05 * 1_000_000 * 92/365 = ~$12,602
        let expected_carry = 0.05 * 100.0 * (92.0 / 365.0) / 100.0 * face;
        assert!(
            (result.carry - expected_carry).abs() < 100.0,
            "Carry ({}) should be close to expected ({})",
            result.carry,
            expected_carry
        );
    }

    // ---- Components sum with large face amount ----

    #[test]
    fn components_sum_large_face_amount() {
        let settle_t0 = d(2025, 5, 15);
        let settle_t1 = d(2025, 11, 15);
        let bond = ust_bond(0.05, settle_t0, d(2035, 5, 15));
        let curve_t0 = us_treasury_curve(settle_t0);
        let curve_t1 = shifted_curve(settle_t1, -0.005); // rates down 50bp
        let face = 10_000_000.0;

        let result = attribute_pnl(
            &bond, settle_t0, settle_t1, &curve_t0, &curve_t1, 0.002, 0.001, face,
        );

        let sum = result.carry + result.rolldown + result.curve_shift + result.spread_change + result.residual;
        assert!(
            (sum - result.total_pnl).abs() < 1e-6,
            "Components sum ({}) should equal total P&L ({}) for large face",
            sum,
            result.total_pnl
        );

        // Rates went down => curve shift should be positive
        assert!(
            result.curve_shift > 0.0,
            "Curve shift should be positive when rates fall: {}",
            result.curve_shift
        );

        // Spread tightened => positive P&L from spread
        assert!(
            result.spread_change > 0.0,
            "Spread tightening should produce positive P&L: {}",
            result.spread_change
        );
    }

    // ---- Duration-based P&L sign is correct ----

    #[test]
    fn duration_based_pnl_sign() {
        let mod_dur = 8.0;
        let conv = 80.0;
        let price = 100.0;
        let face = 1_000_000.0;

        // Rates up => negative P&L
        let pnl_up = duration_based_pnl(mod_dur, conv, price, 0.01, face);
        assert!(
            pnl_up < 0.0,
            "Duration-based P&L should be negative for rate increase: {}",
            pnl_up
        );

        // Rates down => positive P&L
        let pnl_down = duration_based_pnl(mod_dur, conv, price, -0.01, face);
        assert!(
            pnl_down > 0.0,
            "Duration-based P&L should be positive for rate decrease: {}",
            pnl_down
        );

        // Zero change => zero P&L
        let pnl_zero = duration_based_pnl(mod_dur, conv, price, 0.0, face);
        assert!(
            pnl_zero.abs() < 1e-12,
            "Duration-based P&L should be zero for no change: {}",
            pnl_zero
        );
    }
}
