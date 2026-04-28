use crate::curve::YieldCurve;
use crate::date::{Date, add_months};
use super::SwapSpec;

/// A single swap cashflow showing both legs and the net.
#[derive(Debug, Clone)]
pub struct SwapCashflow {
    /// Payment date.
    pub date: Date,
    /// Fixed-leg payment amount.
    pub fixed_amount: f64,
    /// Floating-leg payment amount.
    pub float_amount: f64,
    /// Net amount from the pay-fixed perspective (fixed - float).
    pub net_amount: f64,
}

/// Generate payment dates for a swap leg, working backward from maturity
/// (like bond coupons). The start date is NOT included; only payment dates
/// (coupon dates) are returned.
pub fn generate_payment_dates(start: Date, maturity: Date, freq: u32) -> Vec<Date> {
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

/// Generate fixed-leg cashflows: notional x fixed_rate x day_count_fraction
/// for each period.
///
/// Returns a vector of (payment_date, cashflow_amount) pairs.
pub fn fixed_leg_cashflows(swap: &SwapSpec) -> Vec<(Date, f64)> {
    let dates = generate_payment_dates(swap.start_date, swap.maturity_date, swap.fixed_freq);
    let months_per_period = 12 / swap.fixed_freq as i32;
    let mut result = Vec::with_capacity(dates.len());

    for &pay_date in &dates {
        let period_start = add_months(&pay_date, -months_per_period);
        let period_start = if period_start < swap.start_date {
            swap.start_date
        } else {
            period_start
        };

        let dcf = swap.fixed_day_count.accrual_fraction(
            period_start,
            pay_date,
            period_start,
            pay_date,
        );
        let amount = swap.notional * swap.fixed_rate * dcf;
        result.push((pay_date, amount));
    }

    result
}

/// Generate projected floating-leg cashflows using forward rates from the
/// projection curve.
///
/// Each period: notional x (forward_rate + spread) x day_count_fraction.
/// The forward rate from the curve is continuously compounded and is
/// converted to simple compounding for the cashflow calculation.
///
/// Returns a vector of (payment_date, cashflow_amount) pairs.
pub fn float_leg_cashflows(swap: &SwapSpec, projection_curve: &YieldCurve) -> Vec<(Date, f64)> {
    let dates = generate_payment_dates(swap.start_date, swap.maturity_date, swap.float_freq);
    let months_per_period = 12 / swap.float_freq as i32;
    let mut result = Vec::with_capacity(dates.len());

    for &pay_date in &dates {
        let period_start = add_months(&pay_date, -months_per_period);
        let period_start = if period_start < swap.start_date {
            swap.start_date
        } else {
            period_start
        };

        let dcf = swap.float_day_count.accrual_fraction(
            period_start,
            pay_date,
            period_start,
            pay_date,
        );

        // Get time in years for forward rate calculation
        let t1 = projection_curve.time_from_reference(period_start);
        let t2 = projection_curve.time_from_reference(pay_date);
        let dt = t2 - t1;

        // Get continuously compounded forward rate from the curve
        let cc_fwd = projection_curve.forward_rate(t1, t2);

        // Convert to simple rate: simple = (exp(cc * dt) - 1) / dt
        let simple_fwd = if dt.abs() < 1e-12 {
            cc_fwd
        } else {
            ((cc_fwd * dt).exp() - 1.0) / dt
        };

        let amount = swap.notional * (simple_fwd + swap.float_spread) * dcf;
        result.push((pay_date, amount));
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::curve::YieldCurve;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    #[test]
    fn payment_dates_semiannual() {
        let dates = generate_payment_dates(d(2025, 1, 15), d(2027, 1, 15), 2);
        assert_eq!(dates.len(), 4);
        assert_eq!(dates[0], d(2025, 7, 15));
        assert_eq!(dates[1], d(2026, 1, 15));
        assert_eq!(dates[2], d(2026, 7, 15));
        assert_eq!(dates[3], d(2027, 1, 15));
    }

    #[test]
    fn payment_dates_quarterly() {
        let dates = generate_payment_dates(d(2025, 1, 15), d(2026, 1, 15), 4);
        assert_eq!(dates.len(), 4);
        assert_eq!(dates[0], d(2025, 4, 15));
        assert_eq!(dates[1], d(2025, 7, 15));
        assert_eq!(dates[2], d(2025, 10, 15));
        assert_eq!(dates[3], d(2026, 1, 15));
    }

    #[test]
    fn payment_dates_annual() {
        let dates = generate_payment_dates(d(2025, 1, 15), d(2028, 1, 15), 1);
        assert_eq!(dates.len(), 3);
        assert_eq!(dates[0], d(2026, 1, 15));
        assert_eq!(dates[1], d(2027, 1, 15));
        assert_eq!(dates[2], d(2028, 1, 15));
    }

    #[test]
    fn fixed_leg_cashflows_basic() {
        let swap = SwapSpec {
            notional: 1_000_000.0,
            fixed_rate: 0.05,
            fixed_freq: 2,
            fixed_day_count: DayCountConvention::Thirty360US,
            float_freq: 4,
            float_day_count: DayCountConvention::Actual360,
            start_date: d(2025, 1, 15),
            maturity_date: d(2027, 1, 15),
            float_spread: 0.0,
        };
        let cfs = fixed_leg_cashflows(&swap);
        assert_eq!(cfs.len(), 4);
        // Each semiannual payment: 1M * 0.05 * 0.5 = 25,000
        for (_, amount) in &cfs {
            assert!(
                (*amount - 25_000.0).abs() < 1.0,
                "expected ~25000, got {}",
                amount
            );
        }
    }

    #[test]
    fn float_leg_cashflows_flat_curve() {
        let swap = SwapSpec {
            notional: 1_000_000.0,
            fixed_rate: 0.05,
            fixed_freq: 2,
            fixed_day_count: DayCountConvention::Thirty360US,
            float_freq: 4,
            float_day_count: DayCountConvention::Actual360,
            start_date: d(2025, 1, 15),
            maturity_date: d(2027, 1, 15),
            float_spread: 0.0,
        };

        let rate = 0.05;
        let curve = YieldCurve::new(
            d(2025, 1, 15),
            vec![0.25, 0.5, 1.0, 2.0, 5.0],
            vec![rate; 5],
        )
        .unwrap();

        let cfs = float_leg_cashflows(&swap, &curve);
        assert_eq!(cfs.len(), 8); // 4 per year, 2 years

        // On a flat curve, forward rate = zero rate, so each quarterly payment
        // should be approximately notional * rate * dcf
        for (_, amount) in &cfs {
            // Act/360 for ~91 days: dcf ~ 91/360 ~ 0.2528
            // amount ~ 1M * 0.05 * 0.2528 ~ 12,639
            assert!(
                *amount > 10_000.0 && *amount < 15_000.0,
                "float amount {} out of range",
                amount
            );
        }
    }
}
