use super::MbsSpec;
use super::prepayment;

#[derive(Debug, Clone)]
pub struct MbsCashflow {
    pub month: u32,
    pub scheduled_principal: f64,
    pub prepayment: f64,
    pub total_principal: f64,
    pub interest: f64,
    pub total_cashflow: f64,
    pub ending_balance: f64,
}

/// Generate monthly cashflows for an MBS given a prepayment assumption.
///
/// For each month:
/// 1. Interest = beginning_balance * pass_through_rate / 12
/// 2. Scheduled principal = standard amortization payment - interest
///    (using the remaining term and mortgage rate)
/// 3. Prepayment = SMM * (beginning_balance - scheduled_principal)
/// 4. Total principal = scheduled + prepayment
/// 5. Ending balance = beginning - total principal
pub fn generate_mbs_cashflows(
    spec: &MbsSpec,
    psa_speed: f64,
) -> Vec<MbsCashflow> {
    let mut balance = spec.current_balance;
    let monthly_rate = spec.wac / 12.0; // use WAC for scheduled amortization
    let pass_rate = spec.pass_through_rate / 12.0;
    let mut cashflows = Vec::new();

    for month_offset in 1..=spec.wam {
        let pool_month = spec.age + month_offset; // total age of pool

        // Interest to investor (at pass-through rate)
        let interest = balance * pass_rate;

        // Scheduled principal (standard level-payment amortization)
        let remaining_months = spec.wam - month_offset + 1;
        let scheduled_payment = if monthly_rate > 0.0 && remaining_months > 0 {
            balance * monthly_rate
                / (1.0 - (1.0 + monthly_rate).powi(-(remaining_months as i32)))
        } else {
            balance / remaining_months as f64
        };
        let scheduled_principal = (scheduled_payment - balance * monthly_rate).max(0.0);

        // Prepayment
        let smm = prepayment::psa_smm(pool_month, psa_speed);
        let prepay = smm * (balance - scheduled_principal);

        let total_principal = (scheduled_principal + prepay).min(balance); // can't pay more than balance

        let ending = (balance - total_principal).max(0.0);

        cashflows.push(MbsCashflow {
            month: pool_month,
            scheduled_principal,
            prepayment: prepay.min(balance - scheduled_principal),
            total_principal,
            interest,
            total_cashflow: interest + total_principal,
            ending_balance: ending,
        });

        balance = ending;
        if balance < 0.01 {
            break;
        } // pool paid off
    }

    cashflows
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::date::Date;

    fn test_spec() -> MbsSpec {
        MbsSpec {
            original_balance: 1_000_000.0,
            current_balance: 1_000_000.0,
            pass_through_rate: 0.055, // 5.5%
            wac: 0.06,                // 6% gross coupon
            wam: 360,                 // 30 years
            age: 0,                   // brand new pool
            settlement: Date::new(2025, 1, 15),
            factor: 1.0,
        }
    }

    #[test]
    fn zero_prepayment_total_principal_equals_balance() {
        // 0 PSA: no prepayment, total principal over life = original balance
        let spec = test_spec();
        let cfs = generate_mbs_cashflows(&spec, 0.0);

        let total_principal: f64 = cfs.iter().map(|cf| cf.total_principal).sum();
        assert!(
            (total_principal - spec.current_balance).abs() < 0.01,
            "Total principal {:.2} should equal original balance {:.2}",
            total_principal,
            spec.current_balance
        );
    }

    #[test]
    fn zero_prepayment_runs_full_term() {
        // 0 PSA: cashflows should run for full WAM
        let spec = test_spec();
        let cfs = generate_mbs_cashflows(&spec, 0.0);
        assert_eq!(cfs.len(), 360, "Should have 360 monthly cashflows");
    }

    #[test]
    fn psa_100_pool_pays_off_faster() {
        // 100 PSA: pool pays off faster, ending balance hits 0 sooner
        let spec = test_spec();
        let cfs_0 = generate_mbs_cashflows(&spec, 0.0);
        let cfs_100 = generate_mbs_cashflows(&spec, 100.0);
        assert!(
            cfs_100.len() < cfs_0.len(),
            "100 PSA ({} months) should pay off faster than 0 PSA ({} months)",
            cfs_100.len(),
            cfs_0.len()
        );
    }

    #[test]
    fn balance_never_negative() {
        let spec = test_spec();
        for &speed in &[0.0, 100.0, 200.0, 400.0] {
            let cfs = generate_mbs_cashflows(&spec, speed);
            for cf in &cfs {
                assert!(
                    cf.ending_balance >= -0.01,
                    "Negative balance {:.4} at month {} with {} PSA",
                    cf.ending_balance,
                    cf.month,
                    speed
                );
            }
        }
    }

    #[test]
    fn balance_progression_correct() {
        // Each month: ending = beginning - total_principal
        let spec = test_spec();
        let cfs = generate_mbs_cashflows(&spec, 150.0);
        let mut balance = spec.current_balance;
        for cf in &cfs {
            let expected_ending = (balance - cf.total_principal).max(0.0);
            assert!(
                (cf.ending_balance - expected_ending).abs() < 0.01,
                "Balance mismatch at month {}: expected {:.2}, got {:.2}",
                cf.month,
                expected_ending,
                cf.ending_balance
            );
            balance = cf.ending_balance;
        }
    }

    #[test]
    fn interest_declines_as_balance_declines() {
        let spec = test_spec();
        let cfs = generate_mbs_cashflows(&spec, 100.0);
        // Interest should generally decline (monotonically for non-zero prepayment)
        for i in 1..cfs.len() {
            assert!(
                cfs[i].interest <= cfs[i - 1].interest + 1e-6,
                "Interest increased from month {} ({:.2}) to month {} ({:.2})",
                cfs[i - 1].month,
                cfs[i - 1].interest,
                cfs[i].month,
                cfs[i].interest
            );
        }
    }

    #[test]
    fn total_cashflow_equals_interest_plus_principal() {
        let spec = test_spec();
        let cfs = generate_mbs_cashflows(&spec, 100.0);
        for cf in &cfs {
            assert!(
                (cf.total_cashflow - (cf.interest + cf.total_principal)).abs() < 1e-6,
                "total_cashflow {:.4} != interest {:.4} + total_principal {:.4} at month {}",
                cf.total_cashflow,
                cf.interest,
                cf.total_principal,
                cf.month
            );
        }
    }

    #[test]
    fn prepayment_is_zero_at_0_psa() {
        let spec = test_spec();
        let cfs = generate_mbs_cashflows(&spec, 0.0);
        for cf in &cfs {
            assert!(
                cf.prepayment.abs() < 1e-6,
                "Prepayment should be 0 at 0 PSA, got {:.6} at month {}",
                cf.prepayment,
                cf.month
            );
        }
    }

    #[test]
    fn higher_psa_more_total_principal_early() {
        // Higher PSA should cause more principal to be returned earlier
        let spec = test_spec();
        let cfs_100 = generate_mbs_cashflows(&spec, 100.0);
        let cfs_300 = generate_mbs_cashflows(&spec, 300.0);

        // Compare total principal in first 60 months
        let princ_100: f64 = cfs_100.iter().take(60).map(|cf| cf.total_principal).sum();
        let princ_300: f64 = cfs_300.iter().take(60).map(|cf| cf.total_principal).sum();
        assert!(
            princ_300 > princ_100,
            "300 PSA ({:.0}) should return more principal early than 100 PSA ({:.0})",
            princ_300,
            princ_100
        );
    }

    #[test]
    fn seasoned_pool() {
        // A seasoned pool (age > 0) should start with pool_month > age
        let mut spec = test_spec();
        spec.age = 60;
        spec.wam = 300; // 25 years remaining
        spec.current_balance = 800_000.0;
        spec.factor = 0.8;

        let cfs = generate_mbs_cashflows(&spec, 100.0);
        assert_eq!(cfs[0].month, 61, "First cashflow month should be age+1");

        let total_principal: f64 = cfs.iter().map(|cf| cf.total_principal).sum();
        assert!(
            (total_principal - spec.current_balance).abs() < 1.0,
            "Total principal {:.2} should equal current balance {:.2}",
            total_principal,
            spec.current_balance
        );
    }
}
