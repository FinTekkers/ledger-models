/// A credit spread term structure: spreads at various tenors
#[derive(Debug, Clone)]
pub struct CreditSpreadCurve {
    pub tenors: Vec<f64>,      // years
    pub spreads: Vec<f64>,     // credit spreads in decimal
    pub recovery_rate: f64,
}

impl CreditSpreadCurve {
    pub fn new(tenors: Vec<f64>, spreads: Vec<f64>, recovery_rate: f64) -> Self {
        CreditSpreadCurve { tenors, spreads, recovery_rate }
    }

    /// Interpolated spread at a given tenor (linear interpolation, flat extrapolation)
    pub fn spread_at(&self, t: f64) -> f64 {
        crate::curve::interpolation::linear_interp(t, &self.tenors, &self.spreads)
    }

    /// Forward credit spread between t1 and t2
    /// Derived from cumulative survival probabilities
    pub fn forward_spread(&self, t1: f64, t2: f64) -> f64 {
        if (t2 - t1).abs() < 1e-10 { return self.spread_at(t1); }
        let s1 = self.spread_at(t1);
        let s2 = self.spread_at(t2);
        (s2 * t2 - s1 * t1) / (t2 - t1)
    }

    /// Cumulative default probability at time t using this spread curve
    pub fn cumulative_pd(&self, t: f64) -> f64 {
        let s = self.spread_at(t);
        super::default_probability::cumulative_pd_from_spread(s, self.recovery_rate, t)
    }

    /// Survival curve: survival probability at each tenor
    pub fn survival_curve(&self) -> Vec<(f64, f64)> {
        self.tenors.iter().map(|&t| {
            (t, 1.0 - self.cumulative_pd(t))
        }).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn flat_curve() -> CreditSpreadCurve {
        CreditSpreadCurve::new(
            vec![1.0, 2.0, 5.0, 10.0],
            vec![0.01, 0.01, 0.01, 0.01],
            0.40,
        )
    }

    fn upward_sloping_curve() -> CreditSpreadCurve {
        CreditSpreadCurve::new(
            vec![1.0, 3.0, 5.0, 10.0],
            vec![0.005, 0.010, 0.015, 0.025],
            0.40,
        )
    }

    #[test]
    fn flat_curve_spread_at_any_tenor() {
        let curve = flat_curve();
        assert!((curve.spread_at(1.0) - 0.01).abs() < 1e-12);
        assert!((curve.spread_at(3.0) - 0.01).abs() < 1e-12);
        assert!((curve.spread_at(7.0) - 0.01).abs() < 1e-12);
    }

    #[test]
    fn upward_sloping_forward_exceeds_spot() {
        let curve = upward_sloping_curve();
        let spot_3y = curve.spread_at(3.0);
        let fwd_3_5 = curve.forward_spread(3.0, 5.0);
        assert!(fwd_3_5 > spot_3y,
            "forward spread {} should exceed spot spread {}", fwd_3_5, spot_3y);
    }

    #[test]
    fn survival_curve_decreasing() {
        let curve = upward_sloping_curve();
        let surv = curve.survival_curve();
        for i in 1..surv.len() {
            assert!(surv[i].1 < surv[i - 1].1,
                "survival at t={} ({}) should be less than at t={} ({})",
                surv[i].0, surv[i].1, surv[i - 1].0, surv[i - 1].1);
        }
    }

    #[test]
    fn cumulative_pd_increasing() {
        let curve = upward_sloping_curve();
        let tenors = &curve.tenors.clone();
        let mut prev_pd = 0.0;
        for &t in tenors {
            let pd = curve.cumulative_pd(t);
            assert!(pd > prev_pd,
                "PD at t={} ({}) should exceed PD at t-prev ({})", t, pd, prev_pd);
            prev_pd = pd;
        }
    }

    #[test]
    fn flat_curve_forward_equals_spot() {
        let curve = flat_curve();
        let fwd = curve.forward_spread(2.0, 5.0);
        assert!((fwd - 0.01).abs() < 1e-12,
            "flat curve forward {} should equal spot 0.01", fwd);
    }
}
