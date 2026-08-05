use crate::curve::YieldCurve;
use crate::date::Date;
use crate::error::BondError;
use super::{BondSpec, Cashflow, CouponType};
use super::cashflows;

const MAX_ITER: u32 = 100;
const TOLERANCE: f64 = 1e-12;

/// Generate projected cashflows for an FRN using forward rates from a curve.
/// Each coupon = (forward_rate + spread) * face_value / freq
pub fn generate_projected_cashflows(
    bond: &BondSpec,
    settlement: Date,
    projection_curve: &YieldCurve,
) -> Vec<Cashflow> {
    let spread = match bond.coupon_type {
        CouponType::Floating { spread } => spread,
        _ => 0.0,
    };

    let coupon_dates = cashflows::generate_coupon_dates(bond);
    let (prev_coupon, next_coupon) = cashflows::prev_and_next_coupon(&coupon_dates, settlement);

    let remaining: Vec<Date> = coupon_dates
        .iter()
        .copied()
        .filter(|&d| d > settlement)
        .collect();

    let w = bond.day_count.accrual_fraction(settlement, next_coupon, prev_coupon, next_coupon);

    // Build a list of (period_start, period_end) for each remaining cashflow.
    // We need period starts to compute forward rates.
    let mut period_starts: Vec<Date> = Vec::new();
    for &cf_date in &remaining {
        // Find the period start for this cashflow date.
        // It's the coupon date just before cf_date.
        let mut ps = bond.dated_date;
        for window in coupon_dates.windows(2) {
            if window[1] == cf_date {
                ps = window[0];
                break;
            }
        }
        period_starts.push(ps);
    }

    remaining
        .iter()
        .enumerate()
        .map(|(i, &date)| {
            let period_start = period_starts[i];
            let period_end = date;

            let t_start = projection_curve.time_from_reference(period_start);
            let t_end = projection_curve.time_from_reference(period_end);
            let dt = t_end - t_start;

            // Get continuously compounded forward rate for this period
            let cc_forward = projection_curve.forward_rate(t_start, t_end);

            // Convert to simple rate matching the period length:
            // simple_rate = (exp(cc_rate * dt) - 1) / dt
            let simple_rate = if dt.abs() > 1e-15 {
                ((cc_forward * dt).exp() - 1.0) / dt
            } else {
                cc_forward
            };

            let coupon_amount = (simple_rate + spread) * bond.face_value / bond.coupon_freq as f64;

            let mut amount = coupon_amount;
            if date == bond.maturity_date {
                amount += bond.face_value;
            }

            // Compute period_fraction the same way as in cashflows::generate
            let period_fraction = w + i as f64;

            Cashflow {
                date,
                amount,
                period_fraction,
            }
        })
        .collect()
}

/// Price an FRN by discounting projected cashflows off a discount curve.
/// Optionally with a discount margin (DM) spread.
pub fn frn_dirty_price(
    bond: &BondSpec,
    settlement: Date,
    projection_curve: &YieldCurve,
    discount_curve: &YieldCurve,
    discount_margin: f64,
) -> f64 {
    let cashflows = generate_projected_cashflows(bond, settlement, projection_curve);

    cashflows
        .iter()
        .map(|cf| {
            let t = discount_curve.time_from_reference(cf.date);
            let r = discount_curve.zero_rate(t);
            let df = (-(r + discount_margin) * t).exp();
            cf.amount * df
        })
        .sum()
}

/// Compute accrued interest for an FRN using the current period's projected rate.
pub fn frn_accrued_interest(
    bond: &BondSpec,
    settlement: Date,
    projection_curve: &YieldCurve,
) -> f64 {
    let spread = match bond.coupon_type {
        CouponType::Floating { spread } => spread,
        _ => return 0.0,
    };

    let coupon_dates = cashflows::generate_coupon_dates(bond);
    let (prev_coupon, next_coupon) = cashflows::prev_and_next_coupon(&coupon_dates, settlement);

    if settlement == prev_coupon {
        return 0.0;
    }

    // Get forward rate for the current period
    let t_start = projection_curve.time_from_reference(prev_coupon);
    let t_end = projection_curve.time_from_reference(next_coupon);
    let dt = t_end - t_start;

    let cc_forward = projection_curve.forward_rate(t_start, t_end);
    let simple_rate = if dt.abs() > 1e-15 {
        ((cc_forward * dt).exp() - 1.0) / dt
    } else {
        cc_forward
    };

    let coupon_payment = (simple_rate + spread) * bond.face_value / bond.coupon_freq as f64;
    let frac = bond.day_count.accrual_fraction(prev_coupon, settlement, prev_coupon, next_coupon);

    coupon_payment * frac
}

/// Solve for the discount margin: the constant spread over the discount curve
/// that makes the FRN PV equal to the market dirty price.
/// Uses Newton-Raphson.
pub fn solve_discount_margin(
    bond: &BondSpec,
    market_clean_price: f64,
    settlement: Date,
    projection_curve: &YieldCurve,
    discount_curve: &YieldCurve,
) -> Result<f64, BondError> {
    if settlement >= bond.maturity_date {
        return Err(BondError::MaturedBond);
    }

    let ai = frn_accrued_interest(bond, settlement, projection_curve);
    let dirty_target = market_clean_price + ai;

    let cashflows = generate_projected_cashflows(bond, settlement, projection_curve);
    if cashflows.is_empty() {
        return Err(BondError::MaturedBond);
    }

    // Precompute times and zero rates for each cashflow
    let cf_data: Vec<(f64, f64, f64)> = cashflows
        .iter()
        .map(|cf| {
            let t = discount_curve.time_from_reference(cf.date);
            let r = discount_curve.zero_rate(t);
            (cf.amount, t, r)
        })
        .collect();

    let mut dm = 0.0; // initial guess

    for iter in 0..MAX_ITER {
        let mut pv = 0.0_f64;
        let mut dpv_ddm = 0.0_f64;

        for &(amount, t, r) in &cf_data {
            let exponent = -(r + dm) * t;
            let df = exponent.exp();
            pv += amount * df;
            // d(pv)/d(dm) = amount * (-t) * exp(-(r + dm) * t)
            dpv_ddm += amount * (-t) * df;
        }

        let f_val = pv - dirty_target;

        if f_val.abs() < TOLERANCE {
            return Ok(dm);
        }

        if dpv_ddm.abs() < 1e-15 {
            return Err(BondError::ConvergenceFailure {
                iterations: iter,
                last_price_error: f_val,
            });
        }

        dm -= f_val / dpv_ddm;
    }

    Err(BondError::ConvergenceFailure {
        iterations: MAX_ITER,
        last_price_error: 0.0,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn frn_bond(spread: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: 0.0,
            coupon_freq: 4, // quarterly
            coupon_type: CouponType::Floating { spread },
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::Actual365Fixed,
            ex_dividend_days: 0,
        }
    }

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    fn upward_sloping_curve(ref_date: Date) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
            vec![0.02, 0.025, 0.03, 0.035, 0.04, 0.045],
        )
        .unwrap()
    }

    // ---- FRN at par on a flat curve with zero spread ----

    #[test]
    fn frn_flat_curve_zero_spread_prices_near_par() {
        // On a flat curve with zero spread, an FRN should price at approximately par.
        // The forward rates equal the zero rate on a flat curve, so coupons perfectly
        // offset discounting.
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.0, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);

        let price = frn_dirty_price(&bond, ref_date, &curve, &curve, 0.0);
        assert!(
            (price - 100.0).abs() < 0.05,
            "FRN with zero spread on flat curve should price near par, got {}",
            price
        );
    }

    // ---- FRN with positive spread on flat curve: above par ----

    #[test]
    fn frn_positive_spread_flat_curve_above_par() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.005, ref_date, d(2027, 6, 15)); // 50bps spread
        let curve = flat_curve(ref_date, 0.05);

        let price = frn_dirty_price(&bond, ref_date, &curve, &curve, 0.0);
        assert!(
            price > 100.0,
            "FRN with positive spread on flat curve should price above par, got {}",
            price
        );
    }

    // ---- Discount margin round-trip ----

    #[test]
    fn discount_margin_round_trip() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.003, ref_date, d(2028, 6, 15)); // 30bps spread
        let curve = flat_curve(ref_date, 0.04);

        // Price the FRN with a known DM
        let known_dm = 0.002; // 20bps discount margin
        let dirty = frn_dirty_price(&bond, ref_date, &curve, &curve, known_dm);
        let ai = frn_accrued_interest(&bond, ref_date, &curve);
        let clean = dirty - ai;

        // Solve for DM from the clean price
        let solved_dm =
            solve_discount_margin(&bond, clean, ref_date, &curve, &curve).unwrap();

        assert!(
            (solved_dm - known_dm).abs() < 1e-8,
            "DM round-trip: known={}, solved={}",
            known_dm,
            solved_dm
        );

        // Re-price with solved DM should match
        let repriced = frn_dirty_price(&bond, ref_date, &curve, &curve, solved_dm);
        assert!(
            (repriced - dirty).abs() < 1e-8,
            "Re-priced dirty={}, original dirty={}",
            repriced,
            dirty
        );
    }

    // ---- Projected cashflow amounts should equal forward + spread ----

    #[test]
    fn projected_cashflows_equal_forward_plus_spread() {
        let ref_date = d(2025, 6, 15);
        let spread = 0.005;
        let bond = frn_bond(spread, ref_date, d(2026, 6, 15)); // 1 year, quarterly
        let rate = 0.04;
        let curve = flat_curve(ref_date, rate);

        let cfs = generate_projected_cashflows(&bond, ref_date, &curve);

        // On a flat curve, forward rates equal the zero rate.
        // The simple rate for a period of length dt:
        // simple = (exp(rate * dt) - 1) / dt
        // And coupon = (simple + spread) * face / freq
        for (i, cf) in cfs.iter().enumerate() {
            let coupon_dates = cashflows::generate_coupon_dates(&bond);
            let period_start = coupon_dates[i]; // first remaining starts from dated_date
            let period_end = coupon_dates[i + 1];

            let t_start = curve.time_from_reference(period_start);
            let t_end = curve.time_from_reference(period_end);
            let dt = t_end - t_start;

            let cc_fwd = curve.forward_rate(t_start, t_end);
            let simple_rate = ((cc_fwd * dt).exp() - 1.0) / dt;
            let expected_coupon = (simple_rate + spread) * 100.0 / 4.0;

            let expected_amount = if cf.date == bond.maturity_date {
                expected_coupon + 100.0
            } else {
                expected_coupon
            };

            assert!(
                (cf.amount - expected_amount).abs() < 1e-8,
                "CF[{}] amount={}, expected={}",
                i,
                cf.amount,
                expected_amount
            );
        }
    }

    // ---- Accrued interest for partial period ----

    #[test]
    fn frn_accrued_interest_partial_period() {
        let ref_date = d(2025, 6, 15);
        let spread = 0.002;
        let bond = frn_bond(spread, ref_date, d(2027, 6, 15));
        let rate = 0.04;
        let curve = flat_curve(ref_date, rate);

        // Settle partway through first period
        let settle = d(2025, 8, 15);
        let ai = frn_accrued_interest(&bond, settle, &curve);

        assert!(
            ai > 0.0,
            "FRN accrued interest should be positive mid-period, got {}",
            ai
        );

        // On coupon date, AI should be zero
        let ai_on_coupon = frn_accrued_interest(&bond, ref_date, &curve);
        assert!(
            ai_on_coupon.abs() < 1e-15,
            "FRN AI on coupon date should be zero, got {}",
            ai_on_coupon
        );
    }

    // ---- Upward sloping curve ----

    #[test]
    fn frn_upward_sloping_curve() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.003, ref_date, d(2028, 6, 15));
        let curve = upward_sloping_curve(ref_date);

        let cfs = generate_projected_cashflows(&bond, ref_date, &curve);

        // On an upward-sloping curve, later coupons should generally have higher
        // forward rates and thus higher coupon amounts
        let first_coupon = cfs[0].amount;
        let last_coupon_amount = if cfs.last().unwrap().date == bond.maturity_date {
            // Last CF includes principal
            cfs.last().unwrap().amount - bond.face_value
        } else {
            cfs.last().unwrap().amount
        };
        assert!(
            last_coupon_amount > first_coupon,
            "On upward sloping curve, later coupons should be larger: first={}, last={}",
            first_coupon,
            last_coupon_amount
        );

        // Price should still be computable
        let price = frn_dirty_price(&bond, ref_date, &curve, &curve, 0.0);
        assert!(
            price > 50.0 && price < 200.0,
            "FRN price on sloping curve should be reasonable: {}",
            price
        );
    }

    // ---- FRN on flat curve with DM=0 and zero spread prices near par ----

    #[test]
    fn frn_dm_zero_zero_spread_near_par() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.0, ref_date, d(2030, 6, 15)); // 5 year
        let rate = 0.03;
        let curve = flat_curve(ref_date, rate);

        let price = frn_dirty_price(&bond, ref_date, &curve, &curve, 0.0);
        assert!(
            (price - 100.0).abs() < 0.1,
            "FRN zero spread, DM=0, flat curve should be near par: {}",
            price
        );
    }

    // ---- Semiannual FRN ----

    #[test]
    fn frn_semiannual() {
        let ref_date = d(2025, 6, 15);
        let bond = BondSpec {
            coupon_rate: 0.0,
            coupon_freq: 2,
            coupon_type: CouponType::Floating { spread: 0.004 },
            face_value: 100.0,
            dated_date: ref_date,
            maturity_date: d(2027, 6, 15),
            day_count: DayCountConvention::Actual365Fixed,
            ex_dividend_days: 0,
        };
        let curve = flat_curve(ref_date, 0.05);

        let cfs = generate_projected_cashflows(&bond, ref_date, &curve);
        assert_eq!(cfs.len(), 4, "2Y semiannual FRN should have 4 cashflows");

        // Last CF should include principal
        assert!(
            cfs.last().unwrap().amount > 100.0,
            "Last CF should include principal"
        );

        let price = frn_dirty_price(&bond, ref_date, &curve, &curve, 0.0);
        assert!(
            price > 100.0,
            "Positive spread should price above par: {}",
            price
        );
    }

    // ---- DM solve with non-flat curve ----

    #[test]
    fn dm_solve_upward_sloping() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.002, ref_date, d(2027, 6, 15));
        let curve = upward_sloping_curve(ref_date);

        let known_dm = 0.005;
        let dirty = frn_dirty_price(&bond, ref_date, &curve, &curve, known_dm);
        let ai = frn_accrued_interest(&bond, ref_date, &curve);
        let clean = dirty - ai;

        let solved =
            solve_discount_margin(&bond, clean, ref_date, &curve, &curve).unwrap();
        assert!(
            (solved - known_dm).abs() < 1e-8,
            "Upward sloping DM solve: known={}, solved={}",
            known_dm,
            solved
        );
    }

    // ---- Negative DM solve ----

    #[test]
    fn dm_solve_negative() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.005, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.04);

        // Use a negative DM (FRN trading rich)
        let known_dm = -0.003;
        let dirty = frn_dirty_price(&bond, ref_date, &curve, &curve, known_dm);
        let ai = frn_accrued_interest(&bond, ref_date, &curve);
        let clean = dirty - ai;

        let solved =
            solve_discount_margin(&bond, clean, ref_date, &curve, &curve).unwrap();
        assert!(
            (solved - known_dm).abs() < 1e-8,
            "Negative DM solve: known={}, solved={}",
            known_dm,
            solved
        );
    }

    // ---- Matured bond error ----

    #[test]
    fn solve_dm_matured_bond() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.003, d(2024, 6, 15), d(2025, 1, 15)); // already matured
        let curve = flat_curve(ref_date, 0.04);

        let result = solve_discount_margin(&bond, 100.0, ref_date, &curve, &curve);
        assert!(
            matches!(result, Err(BondError::MaturedBond)),
            "Should return MaturedBond error for matured FRN"
        );
    }

    // ---- Settlement between coupon dates ----

    #[test]
    fn frn_settlement_between_dates() {
        let ref_date = d(2025, 1, 15);
        let bond = frn_bond(0.003, ref_date, d(2027, 1, 15));
        let curve = flat_curve(ref_date, 0.04);

        let settle = d(2025, 5, 15); // mid-period

        let cfs = generate_projected_cashflows(&bond, settle, &curve);
        assert!(
            !cfs.is_empty(),
            "Should have remaining cashflows after settlement"
        );

        // All cashflows should be after settlement
        for cf in &cfs {
            assert!(
                cf.date > settle,
                "Cashflow date {} should be after settlement {}",
                cf.date,
                settle
            );
        }

        // Price should be reasonable
        let price = frn_dirty_price(&bond, settle, &curve, &curve, 0.0);
        assert!(
            price > 50.0 && price < 200.0,
            "Mid-period price should be reasonable: {}",
            price
        );

        // DM round-trip with mid-period settlement
        let known_dm = 0.001;
        let dirty = frn_dirty_price(&bond, settle, &curve, &curve, known_dm);
        let ai = frn_accrued_interest(&bond, settle, &curve);
        let clean = dirty - ai;
        let solved = solve_discount_margin(&bond, clean, settle, &curve, &curve).unwrap();
        assert!(
            (solved - known_dm).abs() < 1e-8,
            "Mid-period DM round-trip: known={}, solved={}",
            known_dm,
            solved
        );
    }

    // ---- Different projection and discount curves ----

    #[test]
    fn frn_different_projection_and_discount_curves() {
        let ref_date = d(2025, 6, 15);
        let bond = frn_bond(0.002, ref_date, d(2027, 6, 15));

        let projection = flat_curve(ref_date, 0.04);
        let discount = flat_curve(ref_date, 0.05);

        let price = frn_dirty_price(&bond, ref_date, &projection, &discount, 0.0);
        assert!(
            price > 50.0 && price < 200.0,
            "Price with different curves should be reasonable: {}",
            price
        );

        // With higher discount rate, FRN should be worth less
        let price_same = frn_dirty_price(&bond, ref_date, &projection, &projection, 0.0);
        assert!(
            price < price_same,
            "Higher discount rate should give lower price: {} vs {}",
            price,
            price_same
        );
    }
}
