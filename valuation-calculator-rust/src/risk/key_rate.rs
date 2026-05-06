use crate::bond::BondSpec;
use crate::bond::zspread;
use crate::curve::YieldCurve;
use crate::date::Date;

/// Result of key rate duration analysis
#[derive(Debug, Clone)]
pub struct KeyRateDurationResult {
    pub tenors: Vec<f64>,          // the key rate tenors (e.g., [1, 2, 5, 10, 30])
    pub krd: Vec<f64>,             // key rate duration at each tenor
    pub krdv01: Vec<f64>,          // key rate DV01 (dollar) at each tenor
    pub total_duration: f64,       // sum of KRDs ~ effective duration
    pub total_dv01: f64,           // sum of KRDv01 ~ DV01
}

/// Compute key rate durations for a bond priced off a yield curve.
///
/// Method: for each key rate tenor, bump that single point on the curve
/// by 1bp using a triangular bump profile (affects neighboring tenors
/// linearly, zero impact beyond adjacent key rates).
///
/// Parameters:
/// - bond: the bond specification
/// - settlement: settlement date
/// - curve: the benchmark yield curve
/// - zspread_val: the Z-spread (can be 0 for on-the-run Treasuries)
/// - key_tenors: the tenors to compute KRD at (e.g., [0.5, 1, 2, 3, 5, 7, 10, 20, 30])
pub fn key_rate_durations(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread_val: f64,
    key_tenors: &[f64],
) -> KeyRateDurationResult {
    let base_price = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread_val);
    let bump = 0.0001; // 1bp

    let curve_tenors = curve.tenors().to_vec();
    let curve_rates = curve.zero_rates().to_vec();

    let mut krds = Vec::with_capacity(key_tenors.len());
    let mut krdv01s = Vec::with_capacity(key_tenors.len());

    for &key_tenor in key_tenors {
        // Create bumped curve: bump only the key_tenor point using triangular profile
        let bumped_rates = apply_triangular_bump(
            &curve_tenors, &curve_rates, key_tenors, key_tenor, bump,
        );

        let bumped_curve = YieldCurve::new(
            curve.reference_date(),
            curve_tenors.clone(),
            bumped_rates,
        ).unwrap();

        let bumped_price = zspread::dirty_price_with_zspread(bond, settlement, &bumped_curve, zspread_val);

        // KRD = -(dP/P) / dy for this key rate
        let krd = -(bumped_price - base_price) / (bump * base_price);
        let krdv01 = -(bumped_price - base_price); // absolute dollar change per 1bp

        krds.push(krd);
        krdv01s.push(krdv01);
    }

    KeyRateDurationResult {
        tenors: key_tenors.to_vec(),
        krd: krds.clone(),
        krdv01: krdv01s.clone(),
        total_duration: krds.iter().sum(),
        total_dv01: krdv01s.iter().sum(),
    }
}

/// Apply a triangular bump profile to a single key rate.
///
/// The bump is 1bp at the key_tenor, linearly declining to 0 at the
/// adjacent key rate tenors, and 0 beyond. This ensures the bumps
/// across all key rates sum to a parallel shift.
///
/// For the curve rates at each tenor, the bump weight is:
///   - 1.0 at the key_tenor
///   - Linear interpolation between key_tenor and adjacent key tenors
///   - 0.0 at or beyond adjacent key tenors
fn apply_triangular_bump(
    curve_tenors: &[f64],
    curve_rates: &[f64],
    key_tenors: &[f64],
    key_tenor: f64,
    bump: f64,
) -> Vec<f64> {
    // Find the key_tenor's position among key_tenors
    let key_idx = key_tenors.iter().position(|&t| (t - key_tenor).abs() < 1e-10).unwrap();

    let left_key = if key_idx > 0 { key_tenors[key_idx - 1] } else { 0.0 };
    let right_key = if key_idx < key_tenors.len() - 1 { key_tenors[key_idx + 1] } else { f64::MAX };

    curve_tenors.iter().zip(curve_rates.iter()).map(|(&t, &r)| {
        let weight = if (t - key_tenor).abs() < 1e-10 {
            1.0
        } else if t > left_key && t < key_tenor {
            (t - left_key) / (key_tenor - left_key)
        } else if t > key_tenor && t < right_key {
            (right_key - t) / (right_key - key_tenor)
        } else {
            0.0
        };
        r + bump * weight
    }).collect()
}

/// Compute key rate durations using standard tenors for a given market.
///
/// US Treasury standard: [0.5, 1, 2, 3, 5, 7, 10, 20, 30]
pub fn us_treasury_krd(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread_val: f64,
) -> KeyRateDurationResult {
    let tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];
    key_rate_durations(bond, settlement, curve, zspread_val, &tenors)
}

/// Verify the KRD decomposition: sum of KRDs should approximately
/// equal the parallel-shift effective duration.
pub fn parallel_shift_duration(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread_val: f64,
) -> f64 {
    let bump = 0.0001;
    let base_price = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread_val);

    let bumped_rates: Vec<f64> = curve.zero_rates().iter().map(|r| r + bump).collect();
    let bumped_curve = YieldCurve::new(
        curve.reference_date(),
        curve.tenors().to_vec(),
        bumped_rates,
    ).unwrap();

    let bumped_price = zspread::dirty_price_with_zspread(bond, settlement, &bumped_curve, zspread_val);
    -(bumped_price - base_price) / (bump * base_price)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn ust_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        }
    }

    fn zero_coupon_bond(dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: 0.0,
            coupon_freq: 2,
            coupon_type: CouponType::Zero,
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        }
    }

    fn us_treasury_curve(ref_date: Date) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048],
        ).unwrap()
    }

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![rate; 9],
        ).unwrap()
    }

    // ---- Sum of KRDs approximately equals parallel-shift duration ----

    #[test]
    fn sum_of_krds_approx_parallel_shift_duration() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);
        let parallel = parallel_shift_duration(&bond, settle, &curve, 0.0);

        let diff = (result.total_duration - parallel).abs();
        assert!(
            diff < 0.05,
            "Sum of KRDs ({}) should approximate parallel duration ({}), diff={}",
            result.total_duration, parallel, diff
        );
    }

    // ---- Short bond (2Y): KRD concentrated at short tenors ----

    #[test]
    fn short_bond_krd_concentrated_at_short_tenors() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.04, settle, d(2027, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);

        // Short tenors (0.5, 1.0, 2.0) should have most of the KRD
        let short_krd: f64 = result.krd[0..3].iter().sum();
        let long_krd: f64 = result.krd[4..].iter().sum();

        assert!(
            short_krd > long_krd,
            "Short bond: short tenor KRD ({}) should exceed long tenor KRD ({})",
            short_krd, long_krd
        );

        // Long tenors should be near zero
        for i in 4..result.krd.len() {
            assert!(
                result.krd[i].abs() < 0.01,
                "KRD at tenor {} should be near zero for 2Y bond, got {}",
                key_tenors[i], result.krd[i]
            );
        }
    }

    // ---- Long bond (30Y): KRD spread across tenors, concentrated near maturity ----

    #[test]
    fn long_bond_krd_concentrated_near_maturity() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2055, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);

        // The 30Y key rate should have the largest KRD
        let max_idx = result.krd.iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .unwrap().0;

        assert_eq!(
            max_idx, 8,
            "30Y bond should have max KRD at 30Y tenor (index 8), got index {}",
            max_idx
        );
    }

    // ---- 10Y bond: most KRD at 10Y tenor ----

    #[test]
    fn ten_year_bond_krd_at_10y_tenor() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.045, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);

        // The 10Y key rate (index 6) should have the largest KRD
        let max_idx = result.krd.iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .unwrap().0;

        assert_eq!(
            max_idx, 6,
            "10Y bond should have max KRD at 10Y tenor (index 6), got index {} (tenor {})",
            max_idx, key_tenors[max_idx]
        );
    }

    // ---- Zero-coupon bond: all KRD at the maturity tenor ----

    #[test]
    fn zero_coupon_bond_krd_at_maturity() {
        let settle = d(2025, 5, 15);
        let bond = zero_coupon_bond(settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);

        // For a zero-coupon bond maturing at ~10Y, all duration should be at 10Y tenor
        let max_idx = result.krd.iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
            .unwrap().0;

        assert_eq!(
            max_idx, 6,
            "Zero-coupon 10Y bond should have max KRD at 10Y tenor, got index {} (tenor {})",
            max_idx, key_tenors[max_idx]
        );

        // Most of the KRD should be at the 10Y point
        let krd_10y = result.krd[6];
        assert!(
            krd_10y / result.total_duration > 0.8,
            "Zero-coupon bond should have >80% of KRD at maturity tenor, got {}%",
            krd_10y / result.total_duration * 100.0
        );
    }

    // ---- Triangular bump profile: weights sum to 1.0 at key tenor, 0 beyond neighbors ----

    #[test]
    fn triangular_bump_weights() {
        let curve_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];
        let curve_rates = vec![0.04; 9];
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];
        let bump = 0.0001;

        // At the key tenor itself, the rate should be bumped by exactly 1bp
        let bumped = apply_triangular_bump(&curve_tenors, &curve_rates, &key_tenors, 5.0, bump);

        // At tenor 5.0 (index 4), rate should be 0.04 + 0.0001 = 0.0401
        assert!(
            (bumped[4] - 0.0401).abs() < 1e-10,
            "Rate at bumped tenor should be 0.0401, got {}",
            bumped[4]
        );

        // At adjacent key tenors (3.0 and 7.0), rate should be unchanged
        assert!(
            (bumped[3] - 0.04).abs() < 1e-10,
            "Rate at left neighbor should be unchanged, got {}",
            bumped[3]
        );
        assert!(
            (bumped[5] - 0.04).abs() < 1e-10,
            "Rate at right neighbor should be unchanged, got {}",
            bumped[5]
        );

        // At far tenors, rate should be unchanged
        assert!(
            (bumped[0] - 0.04).abs() < 1e-10,
            "Rate at far tenor should be unchanged, got {}",
            bumped[0]
        );
        assert!(
            (bumped[8] - 0.04).abs() < 1e-10,
            "Rate at far tenor should be unchanged, got {}",
            bumped[8]
        );
    }

    #[test]
    fn triangular_bumps_sum_to_parallel_shift() {
        // If we sum all triangular bumps, we should get a parallel shift
        let curve_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];
        let curve_rates = vec![0.04; 9];
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];
        let bump = 0.0001;

        let mut total_bumps = vec![0.0_f64; curve_tenors.len()];

        for &kt in &key_tenors {
            let bumped = apply_triangular_bump(&curve_tenors, &curve_rates, &key_tenors, kt, bump);
            for (i, (&b, &r)) in bumped.iter().zip(curve_rates.iter()).enumerate() {
                total_bumps[i] += b - r;
            }
        }

        // Each curve tenor should have received exactly 1bp total bump
        for (i, &tb) in total_bumps.iter().enumerate() {
            assert!(
                (tb - bump).abs() < 1e-12,
                "Total bump at tenor {} should be {}, got {}",
                curve_tenors[i], bump, tb
            );
        }
    }

    // ---- All KRDs non-negative for standard bullet bonds ----

    #[test]
    fn all_krds_non_negative_for_bullet_bond() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);

        for (i, &krd) in result.krd.iter().enumerate() {
            assert!(
                krd >= -1e-10,
                "KRD at tenor {} should be non-negative, got {}",
                key_tenors[i], krd
            );
        }
    }

    // ---- KRDv01 * 10000 approximately equals KRD * price ----

    #[test]
    fn krdv01_krd_price_relationship() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);
        let base_price = zspread::dirty_price_with_zspread(&bond, settle, &curve, 0.0);

        // KRDv01 = KRD * price * bump = KRD * price * 0.0001
        // So KRDv01 * 10000 = KRD * price
        for i in 0..key_tenors.len() {
            let expected = result.krd[i] * base_price * 0.0001;
            let diff = (result.krdv01[i] - expected).abs();
            assert!(
                diff < 1e-10,
                "KRDv01[{}] ({}) should equal KRD * price * 0.0001 ({}), diff={}",
                i, result.krdv01[i], expected, diff
            );
        }
    }

    // ---- Flat curve: KRDs consistent with known duration ----

    #[test]
    fn flat_curve_krds_consistent_with_duration() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let rate = 0.04;
        let curve = flat_curve(settle, rate);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);
        let parallel = parallel_shift_duration(&bond, settle, &curve, 0.0);

        // On a flat curve, the sum should closely match the parallel duration
        let diff = (result.total_duration - parallel).abs();
        assert!(
            diff < 0.01,
            "Flat curve: sum of KRDs ({}) should closely match parallel duration ({}), diff={}",
            result.total_duration, parallel, diff
        );

        // Parallel duration for a 10Y 5% bond at 4% should be roughly 8 years
        assert!(
            parallel > 6.0 && parallel < 12.0,
            "Parallel duration should be reasonable, got {}",
            parallel
        );
    }

    // ---- US Treasury standard tenors function ----

    #[test]
    fn us_treasury_krd_standard_tenors() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.045, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let result = us_treasury_krd(&bond, settle, &curve, 0.0);

        assert_eq!(result.tenors, vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0]);
        assert_eq!(result.krd.len(), 9);
        assert_eq!(result.krdv01.len(), 9);
        assert!(result.total_duration > 0.0, "Total duration should be positive");
        assert!(result.total_dv01 > 0.0, "Total DV01 should be positive");
    }

    // ---- With non-zero Z-spread ----

    #[test]
    fn krd_with_nonzero_zspread() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];
        let zspread_val = 0.005; // 50bps

        let result = key_rate_durations(&bond, settle, &curve, zspread_val, &key_tenors);
        let parallel = parallel_shift_duration(&bond, settle, &curve, zspread_val);

        // Sum of KRDs should still approximate parallel duration
        let diff = (result.total_duration - parallel).abs();
        assert!(
            diff < 0.05,
            "With Z-spread: sum of KRDs ({}) should approximate parallel duration ({}), diff={}",
            result.total_duration, parallel, diff
        );

        // All KRDs should remain non-negative
        for (i, &krd) in result.krd.iter().enumerate() {
            assert!(
                krd >= -1e-10,
                "With Z-spread: KRD at tenor {} should be non-negative, got {}",
                key_tenors[i], krd
            );
        }
    }

    // ---- Sum of KRDs check for short bond ----

    #[test]
    fn sum_of_krds_for_short_bond() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.04, settle, d(2027, 5, 15));
        let curve = us_treasury_curve(settle);
        let key_tenors = vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0];

        let result = key_rate_durations(&bond, settle, &curve, 0.0, &key_tenors);
        let parallel = parallel_shift_duration(&bond, settle, &curve, 0.0);

        let diff = (result.total_duration - parallel).abs();
        assert!(
            diff < 0.05,
            "Short bond: sum of KRDs ({}) should approximate parallel duration ({}), diff={}",
            result.total_duration, parallel, diff
        );

        // Total duration of 2Y bond should be roughly 1.9 years
        assert!(
            result.total_duration > 1.0 && result.total_duration < 3.0,
            "2Y bond total duration should be ~1.9, got {}",
            result.total_duration
        );
    }
}
