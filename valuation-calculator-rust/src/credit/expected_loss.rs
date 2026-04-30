/// Expected loss: PD × LGD × EAD
/// - PD: probability of default
/// - LGD: loss given default = 1 - recovery_rate
/// - EAD: exposure at default (typically face value or market value)
pub fn expected_loss(pd: f64, recovery_rate: f64, exposure: f64) -> f64 {
    pd * (1.0 - recovery_rate) * exposure
}

/// Unexpected loss (simplified): based on PD volatility
/// UL = exposure × LGD × sqrt(PD × (1 - PD))
pub fn unexpected_loss(pd: f64, recovery_rate: f64, exposure: f64) -> f64 {
    let lgd = 1.0 - recovery_rate;
    exposure * lgd * (pd * (1.0 - pd)).sqrt()
}

/// Credit VaR (simplified, single-name):
/// The loss at a given confidence level, assuming normal distribution.
/// CVaR(α) ≈ EL + z_α × UL
/// where z_α is the normal quantile (e.g., 2.326 for 99%)
pub fn credit_var(pd: f64, recovery_rate: f64, exposure: f64, confidence_z: f64) -> f64 {
    let el = expected_loss(pd, recovery_rate, exposure);
    let ul = unexpected_loss(pd, recovery_rate, exposure);
    el + confidence_z * ul
}

/// Risk-adjusted return: yield minus expected loss rate
/// Useful for comparing bonds with different credit quality
pub fn risk_adjusted_yield(yield_rate: f64, annual_pd: f64, recovery_rate: f64) -> f64 {
    let annual_el_rate = annual_pd * (1.0 - recovery_rate);
    yield_rate - annual_el_rate
}

/// Credit spread decomposition: break spread into expected loss and risk premium
/// spread ≈ expected_loss_component + risk_premium
/// EL component = PD × LGD (annualized)
/// Risk premium = spread - EL component
pub fn spread_decomposition(spread: f64, annual_pd: f64, recovery_rate: f64) -> (f64, f64) {
    let el_component = annual_pd * (1.0 - recovery_rate);
    let risk_premium = spread - el_component;
    (el_component, risk_premium)
}

/// Rating-based default probabilities (Moody's historical averages, approximate)
pub fn rating_pd(rating: &str) -> Option<f64> {
    match rating {
        "Aaa" | "AAA" => Some(0.0001),
        "Aa" | "AA" => Some(0.0006),
        "A" => Some(0.0013),
        "Baa" | "BBB" => Some(0.0040),
        "Ba" | "BB" => Some(0.0140),
        "B" => Some(0.0450),
        "Caa" | "CCC" => Some(0.1350),
        "Ca" | "CC" => Some(0.2500),
        "C" => Some(0.3500),
        _ => None,
    }
}

/// Standard recovery rates by seniority
pub fn recovery_rate_by_seniority(seniority: &str) -> Option<f64> {
    match seniority {
        "senior_secured" => Some(0.53),
        "senior_unsecured" => Some(0.37),
        "subordinated" => Some(0.24),
        "junior_subordinated" => Some(0.17),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_expected_loss() {
        // PD=5%, LGD=60% (recovery=40%), exposure=1_000_000
        let el = expected_loss(0.05, 0.40, 1_000_000.0);
        assert!((el - 30_000.0).abs() < 1e-6, "EL was {}", el);
    }

    #[test]
    fn zero_pd_zero_el() {
        let el = expected_loss(0.0, 0.40, 1_000_000.0);
        assert!((el - 0.0).abs() < 1e-12);
    }

    #[test]
    fn full_recovery_zero_el() {
        let el = expected_loss(0.05, 1.0, 1_000_000.0);
        assert!((el - 0.0).abs() < 1e-12);
    }

    #[test]
    fn ul_positive_for_valid_pd() {
        let ul = unexpected_loss(0.05, 0.40, 1_000_000.0);
        assert!(ul > 0.0, "UL should be positive, was {}", ul);
    }

    #[test]
    fn credit_var_exceeds_el() {
        let pd = 0.05;
        let recovery = 0.40;
        let exposure = 1_000_000.0;
        let el = expected_loss(pd, recovery, exposure);
        let cvar = credit_var(pd, recovery, exposure, 2.326); // 99% confidence
        assert!(cvar > el, "CVaR {} should exceed EL {}", cvar, el);
    }

    #[test]
    fn risk_adjusted_yield_less_than_nominal() {
        let nominal = 0.06;
        let pd = 0.02;
        let recovery = 0.40;
        let ray = risk_adjusted_yield(nominal, pd, recovery);
        assert!(ray < nominal, "Risk-adjusted {} should be < nominal {}", ray, nominal);
    }

    #[test]
    fn spread_decomposition_sums_to_spread() {
        let spread = 0.02;
        let pd = 0.01;
        let recovery = 0.40;
        let (el_comp, risk_prem) = spread_decomposition(spread, pd, recovery);
        assert!((el_comp + risk_prem - spread).abs() < 1e-12,
            "EL {} + RP {} should equal spread {}", el_comp, risk_prem, spread);
    }

    #[test]
    fn rating_pds_monotonically_increasing() {
        let ratings = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];
        let pds: Vec<f64> = ratings.iter().map(|r| rating_pd(r).unwrap()).collect();
        for i in 1..pds.len() {
            assert!(pds[i] > pds[i - 1],
                "PD for {} ({}) should exceed PD for {} ({})",
                ratings[i], pds[i], ratings[i - 1], pds[i - 1]);
        }
    }

    #[test]
    fn unknown_rating_returns_none() {
        assert!(rating_pd("XYZ").is_none());
    }

    #[test]
    fn seniority_recovery_rates() {
        let sr = recovery_rate_by_seniority("senior_secured").unwrap();
        let su = recovery_rate_by_seniority("senior_unsecured").unwrap();
        let sub = recovery_rate_by_seniority("subordinated").unwrap();
        let js = recovery_rate_by_seniority("junior_subordinated").unwrap();
        assert!(sr > su && su > sub && sub > js);
    }

    #[test]
    fn unknown_seniority_returns_none() {
        assert!(recovery_rate_by_seniority("unknown").is_none());
    }
}
