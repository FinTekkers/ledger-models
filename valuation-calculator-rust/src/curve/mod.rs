//! Yield curve / term structure module.
//!
//! Provides a `YieldCurve` type for discount factor, zero rate, and
//! forward rate calculations. Inspired by QuantLib's `YieldTermStructure`.

mod error;
pub mod interpolation;

pub use error::CurveError;

use crate::date::Date;
use interpolation::log_linear_discount_interp;

/// A yield curve defined by tenors (time in years) and continuously
/// compounded zero rates.
#[derive(Debug, Clone, PartialEq)]
pub struct YieldCurve {
    reference_date: Date,
    tenors: Vec<f64>,
    zero_rates: Vec<f64>,
}

impl YieldCurve {
    /// Construct a yield curve from tenors and continuously compounded zero rates.
    ///
    /// # Errors
    /// - `CurveError::EmptyInputs` if either vector is empty.
    /// - `CurveError::MismatchedLengths` if vectors differ in length.
    /// - `CurveError::UnsortedTenors` if tenors are not strictly ascending.
    /// - `CurveError::InvalidTenor` if any tenor is negative.
    pub fn new(
        reference_date: Date,
        tenors: Vec<f64>,
        zero_rates: Vec<f64>,
    ) -> Result<Self, CurveError> {
        if tenors.is_empty() || zero_rates.is_empty() {
            return Err(CurveError::EmptyInputs);
        }
        if tenors.len() != zero_rates.len() {
            return Err(CurveError::MismatchedLengths {
                tenors: tenors.len(),
                rates: zero_rates.len(),
            });
        }
        for i in 0..tenors.len() {
            if tenors[i] < 0.0 {
                return Err(CurveError::InvalidTenor(format!(
                    "tenor[{}] = {} is negative",
                    i, tenors[i]
                )));
            }
        }
        for i in 1..tenors.len() {
            if tenors[i] <= tenors[i - 1] {
                return Err(CurveError::UnsortedTenors);
            }
        }

        Ok(YieldCurve {
            reference_date,
            tenors,
            zero_rates,
        })
    }

    /// Bootstrap zero rates from par coupon rates.
    ///
    /// Given par rates (annual coupon rates for bonds priced at par) at
    /// various tenors, this method strips out zero rates using the standard
    /// bootstrapping algorithm.
    ///
    /// `freq` is the coupon frequency per year (e.g. 2 for semiannual).
    ///
    /// # Algorithm
    /// For each par rate, a par bond pays `c/freq` each period and
    /// `1 + c/freq` at maturity, with a clean price of 1 (par = 100%).
    /// We solve for the zero rate at each tenor sequentially using
    /// previously bootstrapped discount factors.
    pub fn from_par_rates(
        reference_date: Date,
        tenors: Vec<f64>,
        par_rates: Vec<f64>,
        freq: u32,
    ) -> Result<Self, CurveError> {
        if tenors.is_empty() || par_rates.is_empty() {
            return Err(CurveError::EmptyInputs);
        }
        if tenors.len() != par_rates.len() {
            return Err(CurveError::MismatchedLengths {
                tenors: tenors.len(),
                rates: par_rates.len(),
            });
        }
        for i in 0..tenors.len() {
            if tenors[i] < 0.0 {
                return Err(CurveError::InvalidTenor(format!(
                    "tenor[{}] = {} is negative",
                    i, tenors[i]
                )));
            }
        }
        for i in 1..tenors.len() {
            if tenors[i] <= tenors[i - 1] {
                return Err(CurveError::UnsortedTenors);
            }
        }

        let f = freq as f64;
        let dt = 1.0 / f; // period length in years

        // We'll bootstrap discount factors at each tenor, then convert to
        // continuously compounded zero rates.
        let mut bootstrapped_tenors: Vec<f64> = Vec::new();
        let mut bootstrapped_zeros: Vec<f64> = Vec::new();

        for idx in 0..tenors.len() {
            let par_rate = par_rates[idx];
            let maturity = tenors[idx];
            let coupon_per_period = par_rate / f;

            // Number of coupon periods (must be whole number for clean bootstrap)
            let n_periods = (maturity * f).round() as usize;
            if n_periods == 0 {
                // For very short tenors: par rate = zero rate (approximately)
                // DF = 1 / (1 + c) for a single period at maturity
                // => -r * t = ln(DF)
                let df = 1.0 / (1.0 + coupon_per_period);
                let zero = -df.ln() / maturity;
                bootstrapped_tenors.push(maturity);
                bootstrapped_zeros.push(zero);
                continue;
            }

            // Sum of discount factors for all coupon periods before maturity
            let mut pv_coupons = 0.0;
            for k in 1..n_periods {
                let t_k = k as f64 * dt;
                // Get discount factor at t_k using already-bootstrapped curve
                let df_k = if bootstrapped_tenors.is_empty() {
                    // No curve yet; should not happen if tenors start at dt
                    1.0
                } else {
                    let r_k =
                        log_linear_discount_interp(t_k, &bootstrapped_tenors, &bootstrapped_zeros);
                    (-r_k * t_k).exp()
                };
                pv_coupons += coupon_per_period * df_k;
            }

            // At maturity: DF_n * (1 + coupon_per_period) + pv_coupons = 1 (par)
            // => DF_n = (1 - pv_coupons) / (1 + coupon_per_period)
            let df_n = (1.0 - pv_coupons) / (1.0 + coupon_per_period);

            // Convert to continuously compounded zero rate: DF = exp(-r*t)
            // r = -ln(DF) / t
            let zero = -df_n.ln() / maturity;

            bootstrapped_tenors.push(maturity);
            bootstrapped_zeros.push(zero);
        }

        YieldCurve::new(reference_date, bootstrapped_tenors, bootstrapped_zeros)
    }

    /// Returns the continuously compounded zero rate at time `t` (in years).
    ///
    /// Uses log-linear interpolation on discount factors between knot points,
    /// with flat extrapolation beyond the curve boundaries.
    pub fn zero_rate(&self, t: f64) -> f64 {
        log_linear_discount_interp(t, &self.tenors, &self.zero_rates)
    }

    /// Returns the discount factor at time `t` (in years): `exp(-r(t) * t)`.
    pub fn discount_factor(&self, t: f64) -> f64 {
        if t.abs() < 1e-15 {
            return 1.0;
        }
        let r = self.zero_rate(t);
        (-r * t).exp()
    }

    /// Returns the continuously compounded forward rate between `t1` and `t2`.
    ///
    /// Calculated as `(r2*t2 - r1*t1) / (t2 - t1)`.
    ///
    /// If `t1` and `t2` are equal (or very close), returns the instantaneous
    /// forward rate approximation at that point.
    pub fn forward_rate(&self, t1: f64, t2: f64) -> f64 {
        let dt = t2 - t1;
        if dt.abs() < 1e-12 {
            // Instantaneous forward: use a small bump
            let eps = 1e-6;
            let r1 = self.zero_rate(t1);
            let r2 = self.zero_rate(t1 + eps);
            return (r2 * (t1 + eps) - r1 * t1) / eps;
        }

        let r1 = self.zero_rate(t1);
        let r2 = self.zero_rate(t2);
        (r2 * t2 - r1 * t1) / dt
    }

    /// Returns the time in years from the reference date to the given date.
    ///
    /// Uses Act/365 Fixed convention: `days_since / 365.0`.
    pub fn time_from_reference(&self, date: Date) -> f64 {
        date.days_since(&self.reference_date) as f64 / 365.0
    }

    /// Returns the reference date of the curve.
    pub fn reference_date(&self) -> Date {
        self.reference_date
    }

    /// Returns a slice of the tenor knot points.
    pub fn tenors(&self) -> &[f64] {
        &self.tenors
    }

    /// Returns a slice of the zero rate knot points.
    pub fn zero_rates(&self) -> &[f64] {
        &self.zero_rates
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::date::Date;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    // ── Construction validation ─────────────────────────────────────

    #[test]
    fn new_empty_inputs() {
        let result = YieldCurve::new(d(2025, 1, 1), vec![], vec![]);
        assert_eq!(result, Err(CurveError::EmptyInputs));
    }

    #[test]
    fn new_mismatched_lengths() {
        let result = YieldCurve::new(d(2025, 1, 1), vec![1.0, 2.0], vec![0.05]);
        assert_eq!(
            result,
            Err(CurveError::MismatchedLengths {
                tenors: 2,
                rates: 1
            })
        );
    }

    #[test]
    fn new_unsorted_tenors() {
        let result = YieldCurve::new(d(2025, 1, 1), vec![2.0, 1.0], vec![0.05, 0.04]);
        assert_eq!(result, Err(CurveError::UnsortedTenors));
    }

    #[test]
    fn new_duplicate_tenors() {
        let result = YieldCurve::new(d(2025, 1, 1), vec![1.0, 1.0], vec![0.05, 0.04]);
        assert_eq!(result, Err(CurveError::UnsortedTenors));
    }

    #[test]
    fn new_negative_tenor() {
        let result = YieldCurve::new(d(2025, 1, 1), vec![-0.5, 1.0], vec![0.05, 0.04]);
        assert!(matches!(result, Err(CurveError::InvalidTenor(_))));
    }

    #[test]
    fn new_valid_curve() {
        let result = YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 5.0, 10.0],
            vec![0.03, 0.035, 0.04, 0.045, 0.05],
        );
        assert!(result.is_ok());
    }

    // ── Flat curve consistency ──────────────────────────────────────

    #[test]
    fn flat_curve_discount_factors() {
        let rate = 0.05;
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 2.0, 5.0, 10.0],
            vec![rate; 4],
        )
        .unwrap();

        for &t in &[0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 15.0] {
            let df = curve.discount_factor(t);
            let expected = (-rate * t).exp();
            assert!(
                (df - expected).abs() < 1e-12,
                "t={}, df={}, expected={}",
                t,
                df,
                expected
            );
        }
    }

    #[test]
    fn flat_curve_zero_rates() {
        let rate = 0.05;
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 2.0, 5.0, 10.0],
            vec![rate; 4],
        )
        .unwrap();

        for &t in &[0.5, 1.0, 3.0, 7.0, 15.0] {
            let r = curve.zero_rate(t);
            assert!(
                (r - rate).abs() < 1e-12,
                "t={}, zero_rate={}, expected={}",
                t,
                r,
                rate
            );
        }
    }

    #[test]
    fn flat_curve_forward_rates() {
        let rate = 0.05;
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 2.0, 5.0, 10.0],
            vec![rate; 4],
        )
        .unwrap();

        let fwd = curve.forward_rate(1.0, 5.0);
        assert!(
            (fwd - rate).abs() < 1e-10,
            "flat forward={}, expected={}",
            fwd,
            rate
        );
    }

    // ── Upward sloping curve ────────────────────────────────────────

    #[test]
    fn upward_sloping_forward_above_zero() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 2.0, 5.0, 10.0],
            vec![0.03, 0.035, 0.04, 0.045],
        )
        .unwrap();

        // For an upward-sloping curve, the forward rate between t1 and t2
        // should be above the zero rate at t2 (the curve is rising).
        let fwd_1_5 = curve.forward_rate(1.0, 5.0);
        let zero_5 = curve.zero_rate(5.0);
        assert!(
            fwd_1_5 > zero_5,
            "forward(1,5)={} should be > zero(5)={}",
            fwd_1_5,
            zero_5
        );

        let fwd_2_10 = curve.forward_rate(2.0, 10.0);
        let zero_10 = curve.zero_rate(10.0);
        assert!(
            fwd_2_10 > zero_10,
            "forward(2,10)={} should be > zero(10)={}",
            fwd_2_10,
            zero_10
        );
    }

    // ── Discount factor at t=0 ─────────────────────────────────────

    #[test]
    fn discount_factor_at_zero() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 5.0, 10.0],
            vec![0.03, 0.04, 0.05],
        )
        .unwrap();

        let df = curve.discount_factor(0.0);
        assert!(
            (df - 1.0).abs() < 1e-12,
            "DF(0) should be 1.0, got {}",
            df
        );
    }

    // ── Forward rate consistency ────────────────────────────────────

    #[test]
    fn forward_rate_consistency_with_discount_factors() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 2.0, 5.0, 10.0],
            vec![0.03, 0.035, 0.04, 0.045],
        )
        .unwrap();

        let t1 = 2.0;
        let t2 = 5.0;
        let df1 = curve.discount_factor(t1);
        let df2 = curve.discount_factor(t2);
        let fwd = curve.forward_rate(t1, t2);

        // df1 / df2 = exp(f * (t2 - t1))
        let ratio = df1 / df2;
        let expected = (fwd * (t2 - t1)).exp();
        assert!(
            (ratio - expected).abs() < 1e-10,
            "DF({})/DF({}) = {}, exp(f*(t2-t1)) = {}",
            t1,
            t2,
            ratio,
            expected
        );
    }

    #[test]
    fn forward_rate_consistency_multiple_segments() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 3.0, 5.0],
            vec![0.02, 0.025, 0.03, 0.035, 0.04],
        )
        .unwrap();

        // Check for several pairs
        let pairs = [(0.5, 1.0), (1.0, 3.0), (2.0, 5.0), (0.5, 5.0)];
        for &(t1, t2) in &pairs {
            let df1 = curve.discount_factor(t1);
            let df2 = curve.discount_factor(t2);
            let fwd = curve.forward_rate(t1, t2);
            let ratio = df1 / df2;
            let expected = (fwd * (t2 - t1)).exp();
            assert!(
                (ratio - expected).abs() < 1e-10,
                "t1={}, t2={}: DF ratio={}, exp(f*dt)={}",
                t1,
                t2,
                ratio,
                expected
            );
        }
    }

    // ── Round-trip: DF = exp(-r*t) ──────────────────────────────────

    #[test]
    fn round_trip_df_zero_rate() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04],
        )
        .unwrap();

        for &t in &[0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0, 40.0]
        {
            let r = curve.zero_rate(t);
            let df = curve.discount_factor(t);
            let expected_df = (-r * t).exp();
            assert!(
                (df - expected_df).abs() < 1e-12,
                "t={}: DF={}, exp(-r*t)={}",
                t,
                df,
                expected_df
            );
        }
    }

    // ── Interpolation at knot points ────────────────────────────────

    #[test]
    fn zero_rate_at_knot_points() {
        let tenors = vec![1.0, 2.0, 5.0, 10.0];
        let rates = vec![0.03, 0.035, 0.04, 0.045];
        let curve = YieldCurve::new(d(2025, 1, 1), tenors.clone(), rates.clone()).unwrap();

        for i in 0..tenors.len() {
            let r = curve.zero_rate(tenors[i]);
            assert!(
                (r - rates[i]).abs() < 1e-12,
                "at tenor={}, rate={}, expected={}",
                tenors[i],
                r,
                rates[i]
            );
        }
    }

    // ── Extrapolation: flat beyond boundaries ───────────────────────

    #[test]
    fn extrapolation_flat_short_end() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 5.0, 10.0],
            vec![0.03, 0.04, 0.05],
        )
        .unwrap();

        let r_short = curve.zero_rate(0.1);
        assert!(
            (r_short - 0.03).abs() < 1e-12,
            "short extrapolation={}, expected=0.03",
            r_short
        );
    }

    #[test]
    fn extrapolation_flat_long_end() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![1.0, 5.0, 10.0],
            vec![0.03, 0.04, 0.05],
        )
        .unwrap();

        let r_long = curve.zero_rate(30.0);
        assert!(
            (r_long - 0.05).abs() < 1e-12,
            "long extrapolation={}, expected=0.05",
            r_long
        );
    }

    // ── time_from_reference ─────────────────────────────────────────

    #[test]
    fn time_from_reference_basic() {
        let ref_date = d(2025, 1, 1);
        let curve = YieldCurve::new(ref_date, vec![1.0], vec![0.05]).unwrap();

        let future = d(2026, 1, 1);
        let t = curve.time_from_reference(future);
        assert!(
            (t - 365.0 / 365.0).abs() < 1e-10,
            "t={}, expected=1.0",
            t
        );

        let t0 = curve.time_from_reference(ref_date);
        assert!(t0.abs() < 1e-15, "time to self should be 0, got {}", t0);
    }

    // ── Bootstrap from par rates ────────────────────────────────────

    #[test]
    fn bootstrap_flat_par_curve() {
        // If all par rates are the same, zero rates should also all be the same
        // (for a flat curve, par rate == zero rate in the continuous sense is only
        // approximately true, but we can at least verify that repricing works).
        let rate = 0.05;
        let tenors = vec![0.5, 1.0, 1.5, 2.0];
        let par_rates = vec![rate; 4];
        let curve =
            YieldCurve::from_par_rates(d(2025, 1, 1), tenors.clone(), par_rates, 2).unwrap();

        // Verify that pricing a par bond at each tenor gives price ~= 1.0 (= 100%)
        for &maturity in &tenors {
            let n_periods = (maturity * 2.0).round() as usize;
            let coupon = rate / 2.0;
            let mut pv = 0.0;
            for k in 1..=n_periods {
                let t = k as f64 * 0.5;
                let df = curve.discount_factor(t);
                if k < n_periods {
                    pv += coupon * df;
                } else {
                    pv += (1.0 + coupon) * df;
                }
            }
            assert!(
                (pv - 1.0).abs() < 1e-10,
                "par bond at maturity={} priced at {}, expected 1.0",
                maturity,
                pv
            );
        }
    }

    #[test]
    fn bootstrap_upward_sloping() {
        let tenors = vec![0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
        let par_rates = vec![0.02, 0.025, 0.03, 0.035, 0.04, 0.045];
        let curve =
            YieldCurve::from_par_rates(d(2025, 1, 1), tenors.clone(), par_rates.clone(), 2)
                .unwrap();

        // Verify each par bond re-prices to par
        for (idx, &maturity) in tenors.iter().enumerate() {
            let n_periods = (maturity * 2.0).round() as usize;
            let coupon = par_rates[idx] / 2.0;
            let mut pv = 0.0;
            for k in 1..=n_periods {
                let t = k as f64 * 0.5;
                let df = curve.discount_factor(t);
                if k < n_periods {
                    pv += coupon * df;
                } else {
                    pv += (1.0 + coupon) * df;
                }
            }
            assert!(
                (pv - 1.0).abs() < 1e-8,
                "par bond at maturity={} with rate={} priced at {}, expected 1.0",
                maturity,
                par_rates[idx],
                pv
            );
        }
    }

    #[test]
    fn bootstrap_validation_errors() {
        assert_eq!(
            YieldCurve::from_par_rates(d(2025, 1, 1), vec![], vec![], 2),
            Err(CurveError::EmptyInputs)
        );
        assert_eq!(
            YieldCurve::from_par_rates(d(2025, 1, 1), vec![1.0], vec![0.05, 0.06], 2),
            Err(CurveError::MismatchedLengths {
                tenors: 1,
                rates: 2
            })
        );
        assert_eq!(
            YieldCurve::from_par_rates(d(2025, 1, 1), vec![2.0, 1.0], vec![0.05, 0.04], 2),
            Err(CurveError::UnsortedTenors)
        );
    }

    #[test]
    fn bootstrap_annual_frequency() {
        let tenors = vec![1.0, 2.0, 3.0];
        let par_rates = vec![0.03, 0.04, 0.05];
        let curve =
            YieldCurve::from_par_rates(d(2025, 1, 1), tenors.clone(), par_rates.clone(), 1)
                .unwrap();

        // Verify each par bond re-prices to par with annual coupons
        for (idx, &maturity) in tenors.iter().enumerate() {
            let n_periods = maturity.round() as usize;
            let coupon = par_rates[idx]; // annual coupon = par rate / 1
            let mut pv = 0.0;
            for k in 1..=n_periods {
                let t = k as f64;
                let df = curve.discount_factor(t);
                if k < n_periods {
                    pv += coupon * df;
                } else {
                    pv += (1.0 + coupon) * df;
                }
            }
            assert!(
                (pv - 1.0).abs() < 1e-8,
                "annual par bond at maturity={} priced at {}",
                maturity,
                pv
            );
        }
    }

    // ── CurveError Display ──────────────────────────────────────────

    #[test]
    fn error_display() {
        assert_eq!(
            format!("{}", CurveError::EmptyInputs),
            "Tenor and rate inputs must not be empty"
        );
        assert_eq!(
            format!(
                "{}",
                CurveError::MismatchedLengths {
                    tenors: 3,
                    rates: 2
                }
            ),
            "Mismatched lengths: 3 tenors vs 2 rates"
        );
        assert_eq!(
            format!("{}", CurveError::UnsortedTenors),
            "Tenors must be in strictly ascending order"
        );
        let err = CurveError::InvalidTenor("negative".to_string());
        assert!(format!("{}", err).contains("negative"));
    }
}
