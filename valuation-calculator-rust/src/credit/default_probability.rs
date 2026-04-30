/// Cumulative probability of default from a credit spread.
/// Assumes constant hazard rate model:
///   PD(t) = 1 - exp(-h*t)
///   where h = spread / (1 - recovery_rate) (approximate hazard rate)
pub fn cumulative_pd_from_spread(spread: f64, recovery_rate: f64, years: f64) -> f64 {
    if recovery_rate >= 1.0 { return 0.0; }
    let hazard = spread / (1.0 - recovery_rate);
    1.0 - (-hazard * years).exp()
}

/// Annualized probability of default (marginal, for one year)
pub fn annual_pd_from_spread(spread: f64, recovery_rate: f64) -> f64 {
    cumulative_pd_from_spread(spread, recovery_rate, 1.0)
}

/// Implied hazard rate from a credit spread
pub fn hazard_rate(spread: f64, recovery_rate: f64) -> f64 {
    if recovery_rate >= 1.0 { return 0.0; }
    spread / (1.0 - recovery_rate)
}

/// Survival probability: probability of NOT defaulting by time t
pub fn survival_probability(spread: f64, recovery_rate: f64, years: f64) -> f64 {
    1.0 - cumulative_pd_from_spread(spread, recovery_rate, years)
}

/// Marginal default probability: probability of defaulting in year n
/// given survival to year n-1
pub fn marginal_pd(spread: f64, recovery_rate: f64, year: u32) -> f64 {
    let surv_prev = survival_probability(spread, recovery_rate, (year - 1) as f64);
    let surv_curr = survival_probability(spread, recovery_rate, year as f64);
    if surv_prev == 0.0 { return 0.0; }
    (surv_prev - surv_curr) / surv_prev
}

/// Credit spread implied by a default probability and recovery rate
/// spread = -ln(1 - PD) / t × (1 - R)
pub fn spread_from_pd(pd: f64, recovery_rate: f64, years: f64) -> f64 {
    if pd >= 1.0 || years == 0.0 { return f64::INFINITY; }
    let hazard = -(1.0 - pd).ln() / years;
    hazard * (1.0 - recovery_rate)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pd_100bp_40pct_recovery() {
        // 100bp spread = 0.01, 40% recovery
        let pd = cumulative_pd_from_spread(0.01, 0.40, 1.0);
        // hazard = 0.01 / 0.60 ≈ 0.01667, PD ≈ 1 - exp(-0.01667) ≈ 0.01653
        assert!((pd - 0.01653).abs() < 0.001, "PD(1Y) was {}", pd);
    }

    #[test]
    fn higher_spread_higher_pd() {
        let pd_low = cumulative_pd_from_spread(0.005, 0.40, 1.0);
        let pd_high = cumulative_pd_from_spread(0.02, 0.40, 1.0);
        assert!(pd_high > pd_low);
    }

    #[test]
    fn pd_at_zero_years_is_zero() {
        let pd = cumulative_pd_from_spread(0.01, 0.40, 0.0);
        assert!((pd - 0.0).abs() < 1e-12);
    }

    #[test]
    fn pd_at_infinity_approaches_one() {
        let pd = cumulative_pd_from_spread(0.01, 0.40, 10000.0);
        assert!((pd - 1.0).abs() < 1e-6, "PD at large t was {}", pd);
    }

    #[test]
    fn survival_plus_pd_equals_one() {
        let spread = 0.02;
        let recovery = 0.35;
        let years = 5.0;
        let pd = cumulative_pd_from_spread(spread, recovery, years);
        let surv = survival_probability(spread, recovery, years);
        assert!((pd + surv - 1.0).abs() < 1e-12);
    }

    #[test]
    fn spread_round_trip() {
        let spread = 0.015;
        let recovery = 0.40;
        let years = 3.0;
        let pd = cumulative_pd_from_spread(spread, recovery, years);
        let implied_spread = spread_from_pd(pd, recovery, years);
        assert!((implied_spread - spread).abs() < 1e-12, "round-trip spread was {}", implied_spread);
    }

    #[test]
    fn marginal_pd_decreases_constant_hazard() {
        // Under constant hazard rate, the conditional marginal PD is constant
        // but the unconditional marginal (surv_prev - surv_curr) decreases.
        // Our marginal_pd is conditional, so it should be constant.
        let spread = 0.02;
        let recovery = 0.40;
        let m1 = marginal_pd(spread, recovery, 1);
        let m5 = marginal_pd(spread, recovery, 5);
        let m10 = marginal_pd(spread, recovery, 10);
        // Under constant hazard, conditional marginal PD should be roughly equal
        assert!((m1 - m5).abs() < 1e-10, "m1={} m5={}", m1, m5);
        assert!((m5 - m10).abs() < 1e-10, "m5={} m10={}", m5, m10);
    }

    #[test]
    fn hazard_rate_basic() {
        let h = hazard_rate(0.01, 0.40);
        assert!((h - 0.01 / 0.60).abs() < 1e-12);
    }

    #[test]
    fn recovery_rate_one_returns_zero() {
        assert_eq!(cumulative_pd_from_spread(0.01, 1.0, 5.0), 0.0);
        assert_eq!(hazard_rate(0.01, 1.0), 0.0);
    }

    #[test]
    fn annual_pd_equals_cumulative_1y() {
        let spread = 0.02;
        let recovery = 0.35;
        let annual = annual_pd_from_spread(spread, recovery);
        let cumulative_1y = cumulative_pd_from_spread(spread, recovery, 1.0);
        assert!((annual - cumulative_1y).abs() < 1e-12);
    }
}
