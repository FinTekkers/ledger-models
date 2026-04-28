use crate::curve::YieldCurve;
use crate::date::{Date, add_months, is_end_of_month, days_in_month};
use super::{LoanSpec, AmortizationType};

/// A single loan cashflow containing interest and principal components.
#[derive(Debug, Clone)]
pub struct LoanCashflow {
    /// Payment date.
    pub date: Date,
    /// Interest component of the payment.
    pub interest: f64,
    /// Principal component of the payment.
    pub principal: f64,
    /// Outstanding principal remaining after this payment.
    pub outstanding_after: f64,
    /// Total payment (interest + principal).
    pub total: f64,
}

/// Generate payment dates for a loan, backward from maturity (same logic as
/// bond coupon date generation in `bond/cashflows.rs`).
pub fn generate_payment_dates(loan: &LoanSpec) -> Vec<Date> {
    let months_per_period = 12 / loan.payment_freq as i32;
    let eom = is_end_of_month(&loan.maturity_date);
    let mut dates = Vec::new();
    let mut date = loan.maturity_date;

    loop {
        dates.push(date);
        date = add_months(&date, -months_per_period);
        if eom {
            let max_day = days_in_month(date.year, date.month);
            date = Date::new(date.year, date.month, max_day);
        }
        if date <= loan.dated_date {
            if date < loan.dated_date {
                dates.push(loan.dated_date);
            } else {
                dates.push(date);
            }
            break;
        }
    }

    dates.reverse();
    dates
}

/// Generate projected cashflows for a loan using forward rates from a projection curve.
///
/// For a bullet loan: interest-only payments each period, full principal at maturity.
/// For an amortizing loan: interest on the outstanding balance + scheduled principal.
///
/// Interest = (forward_rate + spread) * outstanding_balance * day_count_fraction
pub fn generate_loan_cashflows(
    loan: &LoanSpec,
    settlement: Date,
    projection_curve: &YieldCurve,
) -> Vec<LoanCashflow> {
    let payment_dates = generate_payment_dates(loan);

    // Determine remaining payment dates after settlement
    let remaining: Vec<Date> = payment_dates
        .iter()
        .copied()
        .filter(|&d| d > settlement)
        .collect();

    if remaining.is_empty() {
        return Vec::new();
    }

    // Build period start dates for each remaining payment.
    // For each remaining payment date, find the previous date in the schedule.
    let mut period_starts: Vec<Date> = Vec::new();
    for &cf_date in &remaining {
        let mut ps = loan.dated_date;
        for window in payment_dates.windows(2) {
            if window[1] == cf_date {
                ps = window[0];
                break;
            }
        }
        period_starts.push(ps);
    }

    // Build a map of amortization date -> principal fraction for quick lookup
    let amort_schedule: Vec<(Date, f64)> = match &loan.amortization {
        AmortizationType::Bullet => Vec::new(),
        AmortizationType::Scheduled(entries) => {
            entries.iter().map(|e| (e.date, e.principal_fraction)).collect()
        }
    };

    let mut outstanding = loan.face_value;
    let mut cashflows = Vec::new();

    // For settlement between dates, we need to adjust the outstanding balance
    // to account for any amortization that has already occurred before settlement.
    // Walk through all payment dates <= settlement and apply amortization.
    for &pd in &payment_dates {
        if pd > settlement {
            break;
        }
        if let AmortizationType::Scheduled(ref entries) = loan.amortization {
            for entry in entries {
                if entry.date == pd {
                    outstanding -= entry.principal_fraction * loan.face_value;
                    if outstanding < 0.0 {
                        outstanding = 0.0;
                    }
                }
            }
        }
    }

    for (i, &date) in remaining.iter().enumerate() {
        let period_start = period_starts[i];
        let period_end = date;

        // Compute forward rate for this period
        let t_start = projection_curve.time_from_reference(period_start);
        let t_end = projection_curve.time_from_reference(period_end);
        let dt = t_end - t_start;

        let cc_forward = projection_curve.forward_rate(t_start, t_end);

        // Convert continuously compounded forward rate to simple rate
        let simple_rate = if dt.abs() > 1e-15 {
            ((cc_forward * dt).exp() - 1.0) / dt
        } else {
            cc_forward
        };

        // Day count fraction for interest calculation (Act/360 typical)
        let dcf = loan.day_count.accrual_fraction(
            period_start,
            period_end,
            period_start,
            period_end,
        );

        // Interest on outstanding balance
        let interest = (simple_rate + loan.spread) * outstanding * dcf;

        // Principal component
        let principal = if date == loan.maturity_date {
            // At maturity, repay all remaining principal
            outstanding
        } else {
            // Check for scheduled amortization on this date
            let mut sched_principal = 0.0;
            for &(amort_date, fraction) in &amort_schedule {
                if amort_date == date {
                    sched_principal = fraction * loan.face_value;
                    break;
                }
            }
            sched_principal
        };

        outstanding -= principal;
        if outstanding < 1e-12 {
            outstanding = 0.0;
        }

        cashflows.push(LoanCashflow {
            date,
            interest,
            principal,
            outstanding_after: outstanding,
            total: interest + principal,
        });
    }

    cashflows
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;

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
        // 1% principal repaid each quarter (so 4% per year)
        let payment_dates = generate_payment_dates(&LoanSpec {
            face_value: 1_000_000.0,
            spread,
            payment_freq: 4,
            day_count: DayCountConvention::Actual360,
            dated_date: dated,
            maturity_date: maturity,
            amortization: AmortizationType::Bullet,
        });

        let entries: Vec<super::super::AmortizationEntry> = payment_dates
            .iter()
            .skip(1) // skip dated_date
            .filter(|&&pd| pd < maturity) // don't include maturity (remaining principal returned then)
            .map(|&pd| super::super::AmortizationEntry {
                date: pd,
                principal_fraction: 0.01, // 1% per quarter
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

    // ---- Payment date generation ----

    #[test]
    fn payment_dates_quarterly_2y() {
        let loan = bullet_loan(0.025, d(2025, 6, 15), d(2027, 6, 15));
        let dates = generate_payment_dates(&loan);
        assert_eq!(dates.first(), Some(&d(2025, 6, 15)));
        assert_eq!(dates.last(), Some(&d(2027, 6, 15)));
        assert_eq!(dates.len(), 9); // dated_date + 8 quarterly periods
    }

    // ---- Bullet loan: only interest + final principal ----

    #[test]
    fn bullet_loan_interest_only_plus_final_principal() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);

        let cfs = generate_loan_cashflows(&loan, ref_date, &curve);
        assert_eq!(cfs.len(), 8, "2Y quarterly = 8 cashflows");

        // All but last should have zero principal
        for cf in &cfs[..7] {
            assert!(
                cf.principal.abs() < 1e-10,
                "Bullet: non-final period should have no principal, got {}",
                cf.principal
            );
            assert!(
                cf.interest > 0.0,
                "Interest should be positive"
            );
        }

        // Last cashflow should include full principal
        let last = cfs.last().unwrap();
        assert!(
            (last.principal - 1_000_000.0).abs() < 1e-6,
            "Bullet: final principal should be face value, got {}",
            last.principal
        );
        assert!(
            last.outstanding_after.abs() < 1e-10,
            "Outstanding should be zero after final payment"
        );
    }

    // ---- Amortizing loan: declining balance and interest ----

    #[test]
    fn amortizing_loan_declining_balance() {
        let ref_date = d(2025, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);

        let cfs = generate_loan_cashflows(&loan, ref_date, &curve);
        assert_eq!(cfs.len(), 8);

        // Interest should decline over time (because balance declines)
        for i in 1..cfs.len() - 1 {
            assert!(
                cfs[i].interest <= cfs[i - 1].interest + 1e-6,
                "Interest should decline: cf[{}]={} > cf[{}]={}",
                i, cfs[i].interest, i - 1, cfs[i - 1].interest
            );
        }

        // Outstanding should decline
        let mut prev_outstanding = 1_000_000.0;
        for cf in &cfs {
            assert!(
                cf.outstanding_after < prev_outstanding + 1e-6,
                "Outstanding should decline"
            );
            prev_outstanding = cf.outstanding_after;
        }

        // Final outstanding should be zero
        assert!(
            cfs.last().unwrap().outstanding_after.abs() < 1e-10,
            "Final outstanding should be zero"
        );
    }

    // ---- Total principal cashflows sum to face value ----

    #[test]
    fn total_principal_sums_to_face_value() {
        let ref_date = d(2025, 6, 15);

        // Test bullet
        let bullet = bullet_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);
        let cfs = generate_loan_cashflows(&bullet, ref_date, &curve);
        let total_principal: f64 = cfs.iter().map(|cf| cf.principal).sum();
        assert!(
            (total_principal - 1_000_000.0).abs() < 1e-6,
            "Bullet total principal={}, expected=1000000",
            total_principal
        );

        // Test amortizing
        let amort = amortizing_loan(0.025, ref_date, d(2027, 6, 15));
        let cfs = generate_loan_cashflows(&amort, ref_date, &curve);
        let total_principal: f64 = cfs.iter().map(|cf| cf.principal).sum();
        assert!(
            (total_principal - 1_000_000.0).abs() < 1e-6,
            "Amortizing total principal={}, expected=1000000",
            total_principal
        );
    }

    // ---- Outstanding balance tracks correctly ----

    #[test]
    fn outstanding_balance_consistency() {
        let ref_date = d(2025, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);

        let cfs = generate_loan_cashflows(&loan, ref_date, &curve);

        let mut balance = 1_000_000.0;
        for cf in &cfs {
            balance -= cf.principal;
            assert!(
                (cf.outstanding_after - balance).abs() < 1e-6,
                "Outstanding mismatch: cf={}, computed={}",
                cf.outstanding_after,
                balance
            );
        }
    }

    // ---- Cashflows total = interest + principal ----

    #[test]
    fn total_equals_interest_plus_principal() {
        let ref_date = d(2025, 6, 15);
        let loan = amortizing_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);

        let cfs = generate_loan_cashflows(&loan, ref_date, &curve);
        for cf in &cfs {
            assert!(
                (cf.total - (cf.interest + cf.principal)).abs() < 1e-10,
                "total={} != interest({}) + principal({})",
                cf.total,
                cf.interest,
                cf.principal
            );
        }
    }

    // ---- Settlement between dates: fewer cashflows returned ----

    #[test]
    fn settlement_between_dates() {
        let ref_date = d(2025, 6, 15);
        let loan = bullet_loan(0.025, ref_date, d(2027, 6, 15));
        let curve = flat_curve(ref_date, 0.05);

        let settle = d(2025, 10, 1); // between Q2 and Q3 2025
        let cfs = generate_loan_cashflows(&loan, settle, &curve);

        // All cashflows after settlement
        for cf in &cfs {
            assert!(cf.date > settle, "Cashflow date {} should be after settlement {}", cf.date, settle);
        }

        assert!(cfs.len() < 8, "Should have fewer cashflows after settlement");
    }
}
