/// Single Monthly Mortality (SMM): the fraction of the outstanding
/// balance that prepays in a given month.
///
/// SMM represents the probability that a dollar of mortgage balance
/// will prepay in a given month.
pub fn smm_from_cpr(cpr: f64) -> f64 {
    // SMM = 1 - (1 - CPR)^(1/12)
    1.0 - (1.0 - cpr).powf(1.0 / 12.0)
}

/// Conditional Prepayment Rate (CPR): annualized prepayment rate.
/// CPR = 1 - (1 - SMM)^12
pub fn cpr_from_smm(smm: f64) -> f64 {
    1.0 - (1.0 - smm).powi(12)
}

/// PSA (Public Securities Association) standard prepayment model.
/// 100% PSA assumes CPR ramps linearly from 0% to 6% over the first
/// 30 months (0.2% per month), then stays flat at 6%.
///
/// At speed `psa_speed`:
///   If month <= 30: CPR = (month / 30) * 0.06 * (psa_speed / 100)
///   If month > 30:  CPR = 0.06 * (psa_speed / 100)
///
/// 100 PSA = standard. 200 PSA = 2x speed. 50 PSA = 0.5x speed.
pub fn psa_cpr(month: u32, psa_speed: f64) -> f64 {
    let base_cpr = if month <= 30 {
        (month as f64 / 30.0) * 0.06
    } else {
        0.06
    };
    base_cpr * psa_speed / 100.0
}

/// PSA SMM for a given month
pub fn psa_smm(month: u32, psa_speed: f64) -> f64 {
    smm_from_cpr(psa_cpr(month, psa_speed))
}

/// Constant prepayment model: fixed CPR for all months
pub fn constant_cpr_smm(cpr: f64) -> f64 {
    smm_from_cpr(cpr)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn psa_100_month_15() {
        // 100 PSA at month 15: CPR = 15/30 * 6% = 3%
        let cpr = psa_cpr(15, 100.0);
        assert!((cpr - 0.03).abs() < 1e-10, "Expected CPR=0.03, got {}", cpr);
    }

    #[test]
    fn psa_100_month_30_and_beyond() {
        // 100 PSA at month 30+: CPR = 6%
        let cpr_30 = psa_cpr(30, 100.0);
        assert!((cpr_30 - 0.06).abs() < 1e-10, "Expected CPR=0.06 at month 30, got {}", cpr_30);

        let cpr_60 = psa_cpr(60, 100.0);
        assert!((cpr_60 - 0.06).abs() < 1e-10, "Expected CPR=0.06 at month 60, got {}", cpr_60);

        let cpr_360 = psa_cpr(360, 100.0);
        assert!((cpr_360 - 0.06).abs() < 1e-10, "Expected CPR=0.06 at month 360, got {}", cpr_360);
    }

    #[test]
    fn psa_200_month_30_plus() {
        // 200 PSA at month 30+: CPR = 12%
        let cpr = psa_cpr(30, 200.0);
        assert!((cpr - 0.12).abs() < 1e-10, "Expected CPR=0.12, got {}", cpr);

        let cpr_60 = psa_cpr(60, 200.0);
        assert!((cpr_60 - 0.12).abs() < 1e-10, "Expected CPR=0.12, got {}", cpr_60);
    }

    #[test]
    fn psa_0_no_prepayment() {
        // 0 PSA: CPR = 0 (no prepayment)
        for month in [1, 15, 30, 60, 180, 360] {
            let cpr = psa_cpr(month, 0.0);
            assert!((cpr).abs() < 1e-15, "Expected CPR=0 at month {}, got {}", month, cpr);
        }
    }

    #[test]
    fn smm_cpr_round_trip() {
        // cpr_from_smm(smm_from_cpr(x)) should approximately equal x
        for &cpr in &[0.01, 0.03, 0.06, 0.10, 0.15, 0.25] {
            let smm = smm_from_cpr(cpr);
            let recovered = cpr_from_smm(smm);
            assert!(
                (recovered - cpr).abs() < 1e-12,
                "Round-trip failed for CPR={}: got {}",
                cpr,
                recovered
            );
        }
    }

    #[test]
    fn smm_from_cpr_boundary() {
        // SMM(0) = 0
        assert!((smm_from_cpr(0.0)).abs() < 1e-15);
        // SMM(1) = 1 (100% prepay in a year -> 100% each month)
        assert!((smm_from_cpr(1.0) - 1.0).abs() < 1e-15);
    }

    #[test]
    fn cpr_from_smm_boundary() {
        assert!((cpr_from_smm(0.0)).abs() < 1e-15);
        assert!((cpr_from_smm(1.0) - 1.0).abs() < 1e-15);
    }

    #[test]
    fn psa_smm_consistent_with_psa_cpr() {
        for &(month, speed) in &[(15, 100.0), (30, 100.0), (45, 200.0), (5, 50.0)] {
            let cpr = psa_cpr(month, speed);
            let smm_direct = psa_smm(month, speed);
            let smm_from_cpr_val = smm_from_cpr(cpr);
            assert!(
                (smm_direct - smm_from_cpr_val).abs() < 1e-15,
                "psa_smm and smm_from_cpr(psa_cpr) differ at month={}, speed={}",
                month,
                speed
            );
        }
    }

    #[test]
    fn constant_cpr_smm_matches_smm_from_cpr() {
        let cpr = 0.08;
        assert!((constant_cpr_smm(cpr) - smm_from_cpr(cpr)).abs() < 1e-15);
    }

    #[test]
    fn psa_month_1() {
        // Month 1 at 100 PSA: CPR = 1/30 * 0.06 = 0.002
        let cpr = psa_cpr(1, 100.0);
        assert!((cpr - 0.002).abs() < 1e-10, "Expected CPR=0.002, got {}", cpr);
    }
}
