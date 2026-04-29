use crate::curve::YieldCurve;
use crate::date::{Date, add_months};
use super::XccySwapSpec;

/// Generate payment dates for a swap leg, working backward from maturity.
/// The start date is NOT included; only payment dates are returned.
fn generate_payment_dates(start: Date, maturity: Date, freq: u32) -> Vec<Date> {
    let months_per_period = 12 / freq as i32;
    let mut dates = Vec::new();
    let mut date = maturity;

    loop {
        dates.push(date);
        date = add_months(&date, -months_per_period);
        if date <= start {
            break;
        }
    }

    dates.reverse();
    dates
}

/// Present value of the domestic leg in domestic currency units.
///
/// Discounts all fixed coupon payments on the domestic leg using the
/// domestic yield curve. If notional exchange is enabled, includes the
/// notional repayment at maturity minus the initial notional outflow.
pub fn domestic_leg_pv(
    spec: &XccySwapSpec,
    domestic_curve: &YieldCurve,
) -> f64 {
    let dates = generate_payment_dates(spec.start_date, spec.maturity_date, spec.domestic_freq);
    let months_per_period = 12 / spec.domestic_freq as i32;
    let mut pv = 0.0;

    for (i, &date) in dates.iter().enumerate() {
        let t = domestic_curve.time_from_reference(date);
        let df = domestic_curve.discount_factor(t);

        // Compute day count fraction for this period
        let prev = if i == 0 {
            let candidate = add_months(&date, -months_per_period);
            if candidate < spec.start_date {
                spec.start_date
            } else {
                candidate
            }
        } else {
            dates[i - 1]
        };
        let dcf = spec.domestic_day_count.accrual_fraction(prev, date, prev, date);

        let coupon = spec.domestic_notional * spec.domestic_fixed_rate * dcf;
        pv += coupon * df;
    }

    // Notional exchange: receive notional back at maturity, pay it at start
    if spec.exchange_notional {
        let t_mat = domestic_curve.time_from_reference(spec.maturity_date);
        pv += spec.domestic_notional * domestic_curve.discount_factor(t_mat);
        // Subtract initial notional exchange (PV of notional at t=0 is just notional)
        pv -= spec.domestic_notional;
    }

    pv
}

/// Present value of the foreign leg in foreign currency units.
///
/// Discounts all fixed coupon payments (including the basis spread) on the
/// foreign leg using the foreign yield curve. If notional exchange is
/// enabled, includes the notional repayment at maturity minus the initial
/// notional outflow.
pub fn foreign_leg_pv(
    spec: &XccySwapSpec,
    foreign_curve: &YieldCurve,
) -> f64 {
    let dates = generate_payment_dates(spec.start_date, spec.maturity_date, spec.foreign_freq);
    let months_per_period = 12 / spec.foreign_freq as i32;
    let mut pv = 0.0;

    for (i, &date) in dates.iter().enumerate() {
        let t = foreign_curve.time_from_reference(date);
        let df = foreign_curve.discount_factor(t);

        let prev = if i == 0 {
            let candidate = add_months(&date, -months_per_period);
            if candidate < spec.start_date {
                spec.start_date
            } else {
                candidate
            }
        } else {
            dates[i - 1]
        };
        let dcf = spec.foreign_day_count.accrual_fraction(prev, date, prev, date);

        let effective_rate = spec.foreign_fixed_rate + spec.basis_spread;
        let coupon = spec.foreign_notional * effective_rate * dcf;
        pv += coupon * df;
    }

    if spec.exchange_notional {
        let t_mat = foreign_curve.time_from_reference(spec.maturity_date);
        pv += spec.foreign_notional * foreign_curve.discount_factor(t_mat);
        pv -= spec.foreign_notional;
    }

    pv
}

/// Net present value of the XCCY swap from the domestic payer's perspective
/// (pay domestic, receive foreign).
///
/// NPV = foreign_leg_pv * spot_fx - domestic_leg_pv
///
/// where `spot_fx` converts foreign currency to domestic currency units
/// (e.g., 1.10 USD per 1 EUR).
pub fn xccy_npv(
    spec: &XccySwapSpec,
    domestic_curve: &YieldCurve,
    foreign_curve: &YieldCurve,
    spot_fx: f64,
) -> f64 {
    let dom_pv = domestic_leg_pv(spec, domestic_curve);
    let for_pv = foreign_leg_pv(spec, foreign_curve);
    for_pv * spot_fx - dom_pv
}

/// Solve for the cross-currency basis spread that makes NPV = 0.
///
/// The basis spread is added to the foreign leg's fixed rate. Because the
/// foreign leg PV is linear in the basis spread, we can solve analytically:
///
/// ```text
/// for_pv(basis) = for_pv(0) + basis * annuity_foreign
/// NPV = 0  =>  (for_pv(0) + basis * annuity) * spot_fx = dom_pv
/// basis = (dom_pv / spot_fx - for_pv(0)) / annuity
/// ```
pub fn solve_basis_spread(
    spec: &XccySwapSpec,
    domestic_curve: &YieldCurve,
    foreign_curve: &YieldCurve,
    spot_fx: f64,
) -> f64 {
    let dom_pv = domestic_leg_pv(spec, domestic_curve);

    // Compute the foreign annuity: sum of notional * dcf * df for each period
    let dates = generate_payment_dates(spec.start_date, spec.maturity_date, spec.foreign_freq);
    let months_per_period = 12 / spec.foreign_freq as i32;
    let mut annuity = 0.0;
    for (i, &date) in dates.iter().enumerate() {
        let t = foreign_curve.time_from_reference(date);
        let df = foreign_curve.discount_factor(t);
        let prev = if i == 0 {
            let candidate = add_months(&date, -months_per_period);
            if candidate < spec.start_date {
                spec.start_date
            } else {
                candidate
            }
        } else {
            dates[i - 1]
        };
        let dcf = spec.foreign_day_count.accrual_fraction(prev, date, prev, date);
        annuity += spec.foreign_notional * dcf * df;
    }

    // Compute foreign PV with basis_spread = 0
    let mut base_spec = spec.clone();
    base_spec.basis_spread = 0.0;
    let for_pv_base = foreign_leg_pv(&base_spec, foreign_curve);

    if annuity.abs() < 1e-15 {
        return 0.0;
    }
    (dom_pv / spot_fx - for_pv_base) / annuity
}

/// DV01: sensitivity of NPV to a 1bp parallel shift in the domestic curve.
///
/// Bumps all domestic zero rates by +1bp, re-computes NPV, and returns the
/// difference (npv_bumped - npv_base).
pub fn xccy_dv01(
    spec: &XccySwapSpec,
    domestic_curve: &YieldCurve,
    foreign_curve: &YieldCurve,
    spot_fx: f64,
) -> f64 {
    let npv_base = xccy_npv(spec, domestic_curve, foreign_curve, spot_fx);

    let bumped_tenors = domestic_curve.tenors().to_vec();
    let bumped_rates: Vec<f64> = domestic_curve
        .zero_rates()
        .iter()
        .map(|r| r + 0.0001)
        .collect();
    let bumped = YieldCurve::new(
        domestic_curve.reference_date(),
        bumped_tenors,
        bumped_rates,
    )
    .unwrap();

    let npv_bumped = xccy_npv(spec, &bumped, foreign_curve, spot_fx);
    npv_bumped - npv_base
}

/// FX delta: sensitivity of NPV to a change in the spot FX rate.
///
/// Uses central differences with a 1-cent bump:
/// fx_delta = (NPV(fx + 0.01) - NPV(fx - 0.01)) / 0.02
pub fn fx_delta(
    spec: &XccySwapSpec,
    domestic_curve: &YieldCurve,
    foreign_curve: &YieldCurve,
    spot_fx: f64,
) -> f64 {
    let bump = 0.01;
    let npv_up = xccy_npv(spec, domestic_curve, foreign_curve, spot_fx + bump);
    let npv_down = xccy_npv(spec, domestic_curve, foreign_curve, spot_fx - bump);
    (npv_up - npv_down) / (2.0 * bump)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::curve::YieldCurve;
    use crate::date::Date;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![rate; 7],
        )
        .unwrap()
    }

    fn upward_sloping_curve(ref_date: Date) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![0.03, 0.032, 0.035, 0.038, 0.04, 0.042, 0.044, 0.045, 0.047, 0.048],
        )
        .unwrap()
    }

    fn make_xccy_swap(
        dom_rate: f64,
        for_rate: f64,
        start: Date,
        maturity: Date,
    ) -> XccySwapSpec {
        XccySwapSpec {
            domestic_notional: 10_000_000.0,
            foreign_notional: 9_000_000.0,
            domestic_fixed_rate: dom_rate,
            foreign_fixed_rate: for_rate,
            domestic_freq: 2,
            foreign_freq: 2,
            domestic_day_count: DayCountConvention::Thirty360US,
            foreign_day_count: DayCountConvention::Thirty360US,
            start_date: start,
            maturity_date: maturity,
            exchange_notional: true,
            basis_spread: 0.0,
        }
    }

    // ── Symmetric rates + FX: when curves are identical and FX = notional ratio, NPV ~ 0 ──

    #[test]
    fn symmetric_rates_and_fx_npv_near_zero() {
        let ref_date = d(2025, 1, 15);
        let rate = 0.04;
        let curve = flat_curve(ref_date, rate);

        // FX = domestic_notional / foreign_notional = 10M / 9M
        let fx = 10_000_000.0 / 9_000_000.0;
        let spec = make_xccy_swap(rate, rate, ref_date, d(2030, 1, 15));

        let npv = xccy_npv(&spec, &curve, &curve, fx);
        assert!(
            npv.abs() < 1.0,
            "NPV should be ~0 with symmetric rates and FX = notional ratio, got {}",
            npv
        );
    }

    // ── Basis spread solver: solve then verify NPV ~ 0 ──

    #[test]
    fn basis_spread_solver_npv_near_zero() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));
        let basis = solve_basis_spread(&spec, &dom_curve, &for_curve, spot_fx);

        // Build a new spec with the solved basis and verify NPV ~ 0
        let mut spec_with_basis = spec.clone();
        spec_with_basis.basis_spread = basis;
        let npv = xccy_npv(&spec_with_basis, &dom_curve, &for_curve, spot_fx);
        assert!(
            npv.abs() < 1.0,
            "NPV should be ~0 after solving basis spread (basis={}), got {}",
            basis,
            npv
        );
    }

    // ── At-market swap: with correct basis spread, NPV ~ 0 ──

    #[test]
    fn at_market_swap_npv_near_zero() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = upward_sloping_curve(ref_date);
        let for_curve = flat_curve(ref_date, 0.035);
        let spot_fx = 1.10;

        let spec = make_xccy_swap(0.04, 0.03, ref_date, d(2035, 1, 15));
        let basis = solve_basis_spread(&spec, &dom_curve, &for_curve, spot_fx);

        let mut at_market = spec.clone();
        at_market.basis_spread = basis;
        let npv = xccy_npv(&at_market, &dom_curve, &for_curve, spot_fx);
        assert!(
            npv.abs() < 1.0,
            "at-market swap NPV should be ~0, got {} (basis={})",
            npv,
            basis
        );
    }

    // ── FX sensitivity: FX up => foreign leg worth more in domestic terms ──

    #[test]
    fn fx_up_increases_npv() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));

        let npv_base = xccy_npv(&spec, &dom_curve, &for_curve, spot_fx);
        let npv_fx_up = xccy_npv(&spec, &dom_curve, &for_curve, spot_fx + 0.05);

        // Higher spot FX means foreign currency is worth more in domestic
        // terms, so the foreign leg (which we receive) is worth more
        assert!(
            npv_fx_up > npv_base,
            "FX up should increase NPV: base={}, fx_up={}",
            npv_base,
            npv_fx_up
        );
    }

    // ── FX delta ──

    #[test]
    fn fx_delta_positive() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));
        let delta = fx_delta(&spec, &dom_curve, &for_curve, spot_fx);

        // FX delta should be positive (we receive foreign leg)
        assert!(
            delta > 0.0,
            "FX delta should be positive (receive foreign), got {}",
            delta
        );
    }

    // ── DV01: domestic rate up => domestic leg PV changes ──

    #[test]
    fn dv01_domestic_rate_sensitivity() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));
        let dv = xccy_dv01(&spec, &dom_curve, &for_curve, spot_fx);

        // DV01 should be non-zero and have reasonable magnitude
        // NPV = for_pv * fx - dom_pv; bumping domestic curve only affects dom_pv.
        // Higher domestic rates reduce domestic leg PV, which increases NPV
        // (since dom_pv is subtracted). So DV01 > 0 for domestic payer.
        assert!(
            dv > 0.0,
            "DV01 should be positive (domestic rates up reduces dom_pv, increasing NPV), got {}",
            dv
        );

        // For a 5Y swap with 10M notional, DV01 should be in the thousands
        assert!(
            dv.abs() > 100.0 && dv.abs() < 100_000.0,
            "DV01 {} seems unreasonable for a 5Y 10M notional swap",
            dv
        );
    }

    // ── No notional exchange: just coupon flows ──

    #[test]
    fn no_notional_exchange_smaller_pv() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);

        let mut spec_with_exchange = make_xccy_swap(0.04, 0.04, ref_date, d(2030, 1, 15));
        spec_with_exchange.exchange_notional = true;

        let mut spec_no_exchange = spec_with_exchange.clone();
        spec_no_exchange.exchange_notional = false;

        let dom_pv_with = domestic_leg_pv(&spec_with_exchange, &dom_curve);
        let dom_pv_without = domestic_leg_pv(&spec_no_exchange, &dom_curve);

        // Without notional exchange, the PV should be different
        // (just coupon flows, no principal)
        assert!(
            (dom_pv_with - dom_pv_without).abs() > 1.0,
            "notional exchange should affect PV: with={}, without={}",
            dom_pv_with,
            dom_pv_without
        );
    }

    // ── Basis spread effect: positive basis increases foreign leg value ──

    #[test]
    fn positive_basis_increases_foreign_leg() {
        let ref_date = d(2025, 1, 15);
        let for_curve = flat_curve(ref_date, 0.03);

        let spec_no_basis = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));

        let mut spec_with_basis = spec_no_basis.clone();
        spec_with_basis.basis_spread = 0.005; // 50bp basis

        let for_pv_no = foreign_leg_pv(&spec_no_basis, &for_curve);
        let for_pv_with = foreign_leg_pv(&spec_with_basis, &for_curve);

        assert!(
            for_pv_with > for_pv_no,
            "positive basis spread should increase foreign leg PV: no_basis={}, with_basis={}",
            for_pv_no,
            for_pv_with
        );
    }

    // ── Short (1Y) swap: verify reasonable cash flow counts ──

    #[test]
    fn short_swap_1y_cashflow_count() {
        let start = d(2025, 1, 15);
        let maturity = d(2026, 1, 15);

        // Semiannual domestic and foreign legs => 2 payments each
        let dom_dates = generate_payment_dates(start, maturity, 2);
        let for_dates = generate_payment_dates(start, maturity, 2);

        assert_eq!(
            dom_dates.len(),
            2,
            "1Y semiannual swap should have 2 domestic payments, got {}",
            dom_dates.len()
        );
        assert_eq!(
            for_dates.len(),
            2,
            "1Y semiannual swap should have 2 foreign payments, got {}",
            for_dates.len()
        );
    }

    // ── Long (10Y) swap: verify reasonable cash flow counts ──

    #[test]
    fn long_swap_10y_cashflow_count() {
        let start = d(2025, 1, 15);
        let maturity = d(2035, 1, 15);

        // Semiannual => 20 payments
        let dom_dates = generate_payment_dates(start, maturity, 2);
        assert_eq!(
            dom_dates.len(),
            20,
            "10Y semiannual swap should have 20 payments, got {}",
            dom_dates.len()
        );

        // Quarterly => 40 payments
        let for_dates = generate_payment_dates(start, maturity, 4);
        assert_eq!(
            for_dates.len(),
            40,
            "10Y quarterly swap should have 40 payments, got {}",
            for_dates.len()
        );
    }

    // ── Round-trip: solve basis, build swap with it, verify NPV ~ 0 ──

    #[test]
    fn round_trip_solve_and_verify() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0],
            vec![0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047],
        )
        .unwrap();
        let for_curve = YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0],
            vec![0.02, 0.021, 0.022, 0.023, 0.024, 0.025, 0.026, 0.027],
        )
        .unwrap();
        let spot_fx = 1.08;

        let spec = make_xccy_swap(0.045, 0.025, ref_date, d(2032, 1, 15));
        let basis = solve_basis_spread(&spec, &dom_curve, &for_curve, spot_fx);

        let mut spec_at_market = spec.clone();
        spec_at_market.basis_spread = basis;
        let npv = xccy_npv(&spec_at_market, &dom_curve, &for_curve, spot_fx);
        assert!(
            npv.abs() < 1.0,
            "round-trip NPV should be ~0, got {} (basis={})",
            npv,
            basis
        );
    }

    // ── Different frequencies on domestic vs foreign legs ──

    #[test]
    fn different_freq_legs() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let mut spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));
        spec.domestic_freq = 2; // semiannual domestic
        spec.foreign_freq = 4;  // quarterly foreign

        // Should compute without error and produce reasonable results
        let npv = xccy_npv(&spec, &dom_curve, &for_curve, spot_fx);
        assert!(
            npv.abs() < 10_000_000.0,
            "NPV {} seems unreasonable",
            npv
        );

        let basis = solve_basis_spread(&spec, &dom_curve, &for_curve, spot_fx);
        let mut spec_at_market = spec.clone();
        spec_at_market.basis_spread = basis;
        let npv_at_market = xccy_npv(&spec_at_market, &dom_curve, &for_curve, spot_fx);
        assert!(
            npv_at_market.abs() < 1.0,
            "at-market NPV should be ~0 with different freqs, got {} (basis={})",
            npv_at_market,
            basis
        );
    }

    // ── FX delta is approximately the foreign leg PV ──

    #[test]
    fn fx_delta_approximates_foreign_pv() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));
        let delta = fx_delta(&spec, &dom_curve, &for_curve, spot_fx);
        let for_pv = foreign_leg_pv(&spec, &for_curve);

        // FX delta should equal the foreign leg PV
        // because NPV = for_pv * spot_fx - dom_pv, so dNPV/dFX = for_pv
        assert!(
            (delta - for_pv).abs() / for_pv.abs() < 0.01,
            "FX delta ({}) should approximate foreign PV ({})",
            delta,
            for_pv
        );
    }

    // ── No notional exchange: NPV = 0 still solvable ──

    #[test]
    fn no_notional_exchange_basis_solve() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(ref_date, 0.04);
        let for_curve = flat_curve(ref_date, 0.03);
        let spot_fx = 1.10;

        let mut spec = make_xccy_swap(0.04, 0.03, ref_date, d(2030, 1, 15));
        spec.exchange_notional = false;

        let basis = solve_basis_spread(&spec, &dom_curve, &for_curve, spot_fx);

        let mut spec_at_market = spec.clone();
        spec_at_market.basis_spread = basis;
        let npv = xccy_npv(&spec_at_market, &dom_curve, &for_curve, spot_fx);
        assert!(
            npv.abs() < 1.0,
            "no-exchange round-trip NPV should be ~0, got {} (basis={})",
            npv,
            basis
        );
    }
}
