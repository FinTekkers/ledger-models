/// Linear interpolation with flat extrapolation beyond boundaries.
///
/// Given sorted knot points `(xs[i], ys[i])`, returns the linearly
/// interpolated value at `x`. If `x` is outside the range of `xs`,
/// the nearest boundary value is returned (flat extrapolation).
///
/// # Panics
/// Panics if `xs` and `ys` have different lengths or are empty.
pub fn linear_interp(x: f64, xs: &[f64], ys: &[f64]) -> f64 {
    assert_eq!(xs.len(), ys.len());
    assert!(!xs.is_empty());

    let n = xs.len();

    // Flat extrapolation below
    if x <= xs[0] {
        return ys[0];
    }
    // Flat extrapolation above
    if x >= xs[n - 1] {
        return ys[n - 1];
    }

    // Binary search for the interval
    let mut lo = 0;
    let mut hi = n - 1;
    while hi - lo > 1 {
        let mid = (lo + hi) / 2;
        if xs[mid] <= x {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    let t = (x - xs[lo]) / (xs[hi] - xs[lo]);
    ys[lo] + t * (ys[hi] - ys[lo])
}

/// Log-linear interpolation on discount factors.
///
/// This interpolates `ln(DF)` linearly, which is equivalent to
/// interpolating `zero_rate * t` linearly between knot points.
/// Flat extrapolation on the zero rate beyond the boundaries.
///
/// Returns the continuously compounded zero rate at time `t`.
pub fn log_linear_discount_interp(t: f64, tenors: &[f64], zero_rates: &[f64]) -> f64 {
    assert_eq!(tenors.len(), zero_rates.len());
    assert!(!tenors.is_empty());

    let n = tenors.len();

    // Flat extrapolation on zero rate beyond boundaries
    if t <= tenors[0] {
        return zero_rates[0];
    }
    if t >= tenors[n - 1] {
        return zero_rates[n - 1];
    }

    // Build r*t values (negative log of discount factor)
    // ln(DF_i) = -r_i * t_i, so we interpolate r*t linearly.
    let mut lo = 0;
    let mut hi = n - 1;
    while hi - lo > 1 {
        let mid = (lo + hi) / 2;
        if tenors[mid] <= t {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    let rt_lo = zero_rates[lo] * tenors[lo];
    let rt_hi = zero_rates[hi] * tenors[hi];

    let frac = (t - tenors[lo]) / (tenors[hi] - tenors[lo]);
    let rt = rt_lo + frac * (rt_hi - rt_lo);

    // r(t) = rt / t
    if t.abs() < 1e-15 {
        zero_rates[0]
    } else {
        rt / t
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn linear_interp_at_knots() {
        let xs = vec![1.0, 2.0, 3.0];
        let ys = vec![10.0, 20.0, 30.0];
        assert!((linear_interp(1.0, &xs, &ys) - 10.0).abs() < 1e-12);
        assert!((linear_interp(2.0, &xs, &ys) - 20.0).abs() < 1e-12);
        assert!((linear_interp(3.0, &xs, &ys) - 30.0).abs() < 1e-12);
    }

    #[test]
    fn linear_interp_midpoints() {
        let xs = vec![1.0, 3.0];
        let ys = vec![10.0, 30.0];
        assert!((linear_interp(2.0, &xs, &ys) - 20.0).abs() < 1e-12);
    }

    #[test]
    fn linear_interp_flat_extrapolation() {
        let xs = vec![1.0, 2.0, 3.0];
        let ys = vec![10.0, 20.0, 30.0];
        assert!((linear_interp(0.0, &xs, &ys) - 10.0).abs() < 1e-12);
        assert!((linear_interp(-5.0, &xs, &ys) - 10.0).abs() < 1e-12);
        assert!((linear_interp(5.0, &xs, &ys) - 30.0).abs() < 1e-12);
        assert!((linear_interp(100.0, &xs, &ys) - 30.0).abs() < 1e-12);
    }

    #[test]
    fn log_linear_at_knots() {
        let tenors = vec![1.0, 2.0, 5.0];
        let rates = vec![0.03, 0.04, 0.05];
        assert!((log_linear_discount_interp(1.0, &tenors, &rates) - 0.03).abs() < 1e-12);
        assert!((log_linear_discount_interp(2.0, &tenors, &rates) - 0.04).abs() < 1e-12);
        assert!((log_linear_discount_interp(5.0, &tenors, &rates) - 0.05).abs() < 1e-12);
    }

    #[test]
    fn log_linear_flat_extrapolation() {
        let tenors = vec![1.0, 5.0];
        let rates = vec![0.03, 0.05];
        assert!((log_linear_discount_interp(0.5, &tenors, &rates) - 0.03).abs() < 1e-12);
        assert!((log_linear_discount_interp(10.0, &tenors, &rates) - 0.05).abs() < 1e-12);
    }

    #[test]
    fn log_linear_midpoint() {
        // At t=3, between (1, 0.03) and (5, 0.05):
        // rt_lo = 0.03 * 1 = 0.03, rt_hi = 0.05 * 5 = 0.25
        // frac = (3 - 1) / (5 - 1) = 0.5
        // rt = 0.03 + 0.5 * (0.25 - 0.03) = 0.03 + 0.11 = 0.14
        // r = 0.14 / 3 = 0.04666...
        let tenors = vec![1.0, 5.0];
        let rates = vec![0.03, 0.05];
        let r = log_linear_discount_interp(3.0, &tenors, &rates);
        assert!((r - 0.14 / 3.0).abs() < 1e-12, "r={}", r);
    }
}
