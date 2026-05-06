use crate::curve::YieldCurve;
use crate::date::Date;
use crate::error::BondError;
use super::LoanSpec;
use super::cashflows::generate_loan_cashflows;
#[cfg(test)]
use super::cashflows::generate_payment_dates;
use super::AmortizationType;

const MAX_ITER: u32 = 100;
const TOLERANCE: f64 = 1e-12;

/// Price a loan by discounting projected cashflows at the discount curve + discount margin.
///
/// Returns the dirty price as a percentage of face value (like bond pricing).
pub fn loan_dirty_price(
    loan: &LoanSpec,
    settlement: Date,
    projection_curve: &YieldCurve,
    discount_curve: &YieldCurve,
    discount_margin: f64,
) -> f64 {
    let cashflows = generate_loan_cashflows(loan, settlement, projection_curve);

    let pv: f64 = cashflows
        .iter()
        .map(|cf| {
            let t = discount_curve.time_from_reference(cf.date);
            let r = discount_curve.zero_rate(t);
            let df = (-(r + discount_margin) * t).exp();
            cf.total * df
        })
        .sum();

    // Return as percentage of face value
    pv / loan.face_value * 100.0
}

/// Solve for the discount margin: the constant spread over the discount curve
/// that makes the loan PV equal to the market dirty price.
///
/// `market_clean_price` is expressed as a percentage of face value (e.g., 100.0 = par).
///
/// Uses Newton-Raphson iteration.
pub fn solve_discount_margin(
    loan: &LoanSpec,
    market_clean_price: f64,
    settlement: Date,
    projection_curve: &YieldCurve,
    discount_curve: &YieldCurve,
) -> Result<f64, BondError> {
    if settlement >= loan.maturity_date {
        return Err(BondError::MaturedBond);
    }

    // For loans, clean price ~ dirty price (no accrued interest convention for
    // secondary market pricing — loans trade on a "dirty" basis). We use the
    // clean price directly as the target.
    let dirty_target = market_clean_price / 100.0 * loan.face_value;

    let cashflows = generate_loan_cashflows(loan, settlement, projection_curve);
    if cashflows.is_empty() {
        return Err(BondError::MaturedBond);
    }

    // Precompute times and zero rates
    let cf_data: Vec<(f64, f64, f64)> = cashflows
        .iter()
        .map(|cf| {
            let t = discount_curve.time_from_reference(cf.date);
            let r = discount_curve.zero_rate(t);
            (cf.total, t, r)
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

/// Carrying value: current outstanding principal balance at the given settlement date.
///
/// Returns the outstanding principal as a dollar amount.
pub fn carrying_value(
    loan: &LoanSpec,
    settlement: Date,
) -> f64 {
    if settlement <= loan.dated_date {
        return loan.face_value;
    }
    if settlement >= loan.maturity_date {
        return 0.0;
    }

    match &loan.amortization {
        AmortizationType::Bullet => loan.face_value,
        AmortizationType::Scheduled(entries) => {
            let mut outstanding = loan.face_value;
            for entry in entries {
                if entry.date <= settlement {
                    outstanding -= entry.principal_fraction * loan.face_value;
                }
            }
            if outstanding < 0.0 {
                outstanding = 0.0;
            }
            outstanding
        }
    }
}

/// Weighted average life (WAL): the weighted average time (in years) to
/// principal repayment, weighted by the principal amount of each payment.
///
/// WAL = sum(principal_i * t_i) / total_principal
///
/// For a bullet loan, WAL equals the time to maturity.
/// For an amortizing loan, WAL is less than the time to maturity.
pub fn weighted_average_life(
    loan: &LoanSpec,
    settlement: Date,
) -> f64 {
    // Build principal payments at each date
    let mut principal_payments: Vec<(Date, f64)> = Vec::new();

    match &loan.amortization {
        AmortizationType::Bullet => {
            // All principal at maturity
            principal_payments.push((loan.maturity_date, loan.face_value));
        }
        AmortizationType::Scheduled(entries) => {
            let mut total_scheduled = 0.0;
            for entry in entries {
                if entry.date > settlement {
                    let amount = entry.principal_fraction * loan.face_value;
                    principal_payments.push((entry.date, amount));
                    total_scheduled += amount;
                }
            }
            // Remaining principal at maturity
            // Need to account for amortization that has already occurred
            let mut amort_before = 0.0;
            for entry in entries {
                if entry.date <= settlement {
                    amort_before += entry.principal_fraction * loan.face_value;
                }
            }
            let remaining_at_maturity = loan.face_value - amort_before - total_scheduled;
            if remaining_at_maturity > 1e-10 {
                principal_payments.push((loan.maturity_date, remaining_at_maturity));
            }
        }
    }

    // Filter to only future payments
    let future_payments: Vec<(Date, f64)> = principal_payments
        .into_iter()
        .filter(|(d, _)| *d > settlement)
        .collect();

    if future_payments.is_empty() {
        return 0.0;
    }

    let total_principal: f64 = future_payments.iter().map(|(_, p)| p).sum();
    if total_principal.abs() < 1e-15 {
        return 0.0;
    }

    let weighted_sum: f64 = future_payments
        .iter()
        .map(|(date, principal)| {
            let t = date.days_since(&settlement) as f64 / 365.0;
            principal * t
        })
        .sum();

    weighted_sum / total_principal
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;
    use super::super::AmortizationEntry;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    fn bullet_loan(spread: f64, dated: Date, maturity: Date) -> LoanSpec {
        LoanSpec {
            face_value: 1_000_000.0,
            spread,
            payment_freq: 4,
            day_count: DayCountConvention::Actual360,
            dated_date: dated,
            maturity_date: maturity,
            amortization: AmortizationType::Bullet,
        }
    }

    fn amortizing_loan(spread: f64, dated: Date, maturity: Date) -> LoanSpec {
        let payment_dates = generate_payment_dates(&LoanSpec {
            face_value: 1_000_000.0,
            spread,
            payment_freq: 4,
            day_count: DayCountConvention::Actual360,
            dated_date: dated,
            maturity_date: maturity,
            amortization: AmortizationType::Bullet,
        });

        let entries: Vec<AmortizationEntry> = payment_dates
            .iter()
            .skip(1)
            .filter(|&&pd| pd < maturity)
            .map(|&pd| AmortizationEntry {
                date: pd,
                principal_fraction: 0.01,
            })
            .collect();

        LoanSpec {
            face_value: 1_000_000.0,
            spread,
            payment_freq: 4,
            day_count: DayCountConvention::Actual360,
            dated_date: dated,
            maturity_date: maturity,
            amortization: AmortizationType::Scheduled(entries),
        }
    }

    // ---- Bullet loan on flat curve: price ~par when DM = spread ----

    #[test]
    fn bullet_loan_flat_curve_dm_equals_spread_near_par() {
        let ref_date = d(2025, 6, 15);
        let spread = 0.025; // 250bps
        let loan = bullet_loan(spread, ref_date, d(2027, 6, 15));
        let rate = 0.05;
        let curve = flat_curve(ref_date, rate);

        // When DM = spread and projection curve = discount curve on a flat curve,
        // the loan should price near par.
        // The coupon = (forward + spread), discounted at (zero + DM) = (rate + spread).
        // On a flat curve, forward = rate, so coupon matches discount rate => par.
        let price = loan_dirty_price(&loan, ref_date, &curve, &curve, spread);
        assert!(
            (price - 100.0).abs() < 0.5,
            "Bullet loan with DM=spread on flat curve should be near par, got {}",
            price
        );
    }

    // ---- Amortizing loan priced correctly ----

    #[test]
    fn amortizing_loan_priced_correctly() {
        let ref_date = d(2025, 6, 15);
        let spread = 0.025;
        let loan = amortizing_loan(spread, ref_date, d(2027, 6, 15));
        let rate = 0.05;
        let curve = flat_curve(ref_date, rate);

        let price = loan_dirty_price(&loan, ref_date, &curve, &curve, spread);

        // Price should be reasonable (near par since DM ~ spread)
        assert!(
            price > 90.0 && price < 110.0,
            "Amortizing loan price should be reasonable, got {}",
            price
        );
    }

    // ---- DM round-trip: solve then re-price ----

    #[test]
    fn dm_round_trip_bullet() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2028, 6, 15));
        let curve = flat_curve(ref_date, 0.04);

        let known_dm = 0.003;
        let dirty = loan_dirty_price(&loan, ref_date, &curve, &curve, known_dm);

        let solved_dm = solve_discount_margin(
            &loan, dirty, ref_date, &curve, &curve,
        ).unwrap();

        assert!(
            (solved_dm - known_dm).abs() < 1e-8,
            "DM round-trip: known={}, solved={}",
            known_dm,
            solved_dm
        );

        // Re-price with solved DM should match
        let repriced = loan_dirty_price(&loan, ref_date, &curve, &curve, solved_dm);
        assert!(
            (repriced - dirty).abs() < 1e-8,
            "Re-priced={}, original={}",
            repriced,
            dirty
        );
    }

    #[test]
    fn dm_round_trip_amortizing() {
        let ref_date = d(2025, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, d(2028, 6, 15));
        let curve = flat_curve(ref_date, 0.04);

        let known_dm = 0.005;
        let dirty = loan_dirty_price(&loan, ref_date, &curve, &curve, known_dm);

        let solved_dm = solve_discount_margin(
            &loan, dirty, ref_date, &curve, &curve,
        ).unwrap();

        assert!(
            (solved_dm - known_dm).abs() < 1e-8,
            "Amort DM round-trip: known={}, solved={}",
            known_dm,
            solved_dm
        );
    }

    // ---- Carrying value tests ----

    #[test]
    fn carrying_value_bullet_always_face() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2027, 6, 15));

        // Before dated date
        assert!(
            (carrying_value(&loan, d(2025, 1, 1)) - 1_000_000.0).abs() < 1e-6,
            "Before dated date should be face value"
        );

        // At dated date
        assert!(
            (carrying_value(&loan, ref_date) - 1_000_000.0).abs() < 1e-6,
            "At dated date should be face value"
        );

        // Mid-life
        assert!(
            (carrying_value(&loan, d(2026, 6, 15)) - 1_000_000.0).abs() < 1e-6,
            "Bullet mid-life should be face value"
        );

        // At maturity
        assert!(
            carrying_value(&loan, d(2027, 6, 15)).abs() < 1e-6,
            "At maturity should be zero"
        );
    }

    #[test]
    fn carrying_value_amortizing_declines() {
        let ref_date = d(2025, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, d(2027, 6, 15));

        let cv_start = carrying_value(&loan, ref_date);
        assert!(
            (cv_start - 1_000_000.0).abs() < 1e-6,
            "At start should be face value"
        );

        // After some time, carrying value should be lower
        let cv_mid = carrying_value(&loan, d(2026, 6, 15));
        assert!(
            cv_mid < cv_start,
            "Mid-life carrying value {} should be less than start {}",
            cv_mid,
            cv_start
        );

        // At maturity
        assert!(
            carrying_value(&loan, d(2027, 6, 15)).abs() < 1e-6,
            "At maturity should be zero"
        );
    }

    // ---- Weighted Average Life tests ----

    #[test]
    fn wal_bullet_equals_maturity_time() {
        let ref_date = d(2025, 6, 15);
        let maturity = d(2027, 6, 15);
        let loan = bullet_loan(0.025, ref_date, maturity);

        let wal = weighted_average_life(&loan, ref_date);
        let expected = maturity.days_since(&ref_date) as f64 / 365.0;

        assert!(
            (wal - expected).abs() < 0.01,
            "Bullet WAL={}, expected={}",
            wal,
            expected
        );
    }

    #[test]
    fn wal_amortizing_less_than_maturity() {
        let ref_date = d(2025, 6, 15);
        let maturity = d(2027, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, maturity);

        let wal = weighted_average_life(&loan, ref_date);
        let maturity_time = maturity.days_since(&ref_date) as f64 / 365.0;

        assert!(
            wal < maturity_time,
            "Amortizing WAL ({}) should be less than maturity time ({})",
            wal,
            maturity_time
        );
        assert!(
            wal > 0.0,
            "WAL should be positive, got {}",
            wal
        );
    }

    #[test]
    fn wal_amortizing_decreases_over_time() {
        let ref_date = d(2025, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, d(2028, 6, 15));

        let wal_early = weighted_average_life(&loan, ref_date);
        let wal_later = weighted_average_life(&loan, d(2026, 6, 15));

        assert!(
            wal_later < wal_early,
            "WAL should decrease over time: early={}, later={}",
            wal_early,
            wal_later
        );
    }

    // ---- Matured loan error ----

    #[test]
    fn solve_dm_matured_loan() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, d(2024, 1, 1), d(2025, 1, 1));
        let curve = flat_curve(ref_date, 0.04);

        let result = solve_discount_margin(&loan, 100.0, ref_date, &curve, &curve);
        assert!(
            matches!(result, Err(BondError::MaturedBond)),
            "Should return MaturedBond error for matured loan"
        );
    }

    // ---- Negative DM solve ----

    #[test]
    fn dm_solve_negative() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.04);

        let known_dm = -0.002;
        let dirty = loan_dirty_price(&loan, ref_date, &curve, &curve, known_dm);

        let solved = solve_discount_margin(&loan, dirty, ref_date, &curve, &curve).unwrap();
        assert!(
            (solved - known_dm).abs() < 1e-8,
            "Negative DM solve: known={}, solved={}",
            known_dm,
            solved
        );
    }

    // ---- Settlement between dates ----

    #[test]
    fn dm_round_trip_mid_period() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2028, 6, 15));
        let curve = flat_curve(ref_date, 0.04);

        let settle = d(2026, 2, 1);
        let known_dm = 0.003;
        let dirty = loan_dirty_price(&loan, settle, &curve, &curve, known_dm);

        let solved = solve_discount_margin(&loan, dirty, settle, &curve, &curve).unwrap();
        assert!(
            (solved - known_dm).abs() < 1e-8,
            "Mid-period DM round-trip: known={}, solved={}",
            known_dm,
            solved
        );
    }

    // ---- Higher DM lowers price ----

    #[test]
    fn higher_dm_lowers_price() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.04);

        let price_low_dm = loan_dirty_price(&loan, ref_date, &curve, &curve, 0.001);
        let price_high_dm = loan_dirty_price(&loan, ref_date, &curve, &curve, 0.010);

        assert!(
            price_high_dm < price_low_dm,
            "Higher DM should give lower price: low_dm={}, high_dm={}",
            price_low_dm,
            price_high_dm
        );
    }
}
