use crate::date::Date;
use super::BondSpec;
use super::cashflows;

pub fn macaulay_duration(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    let cfs = cashflows::generate(bond, settlement);
    let freq = bond.coupon_freq as f64;
    let r = 1.0 + ytm / freq;

    let mut weighted_time = 0.0_f64;
    let mut total_pv = 0.0_f64;

    for cf in &cfs {
        let pv = cf.amount / r.powf(cf.period_fraction);
        let time_years = cf.period_fraction / freq;
        weighted_time += time_years * pv;
        total_pv += pv;
    }

    if total_pv == 0.0 { return 0.0; }
    weighted_time / total_pv
}

pub fn modified_duration(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    macaulay_duration(bond, ytm, settlement) / (1.0 + ytm / bond.coupon_freq as f64)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn ust_bond(coupon: f64, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon, coupon_freq: 2, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: d(2025, 5, 15), maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn zero_coupon_duration_equals_maturity() {
        let bond = BondSpec {
            coupon_rate: 0.0, coupon_freq: 2, coupon_type: CouponType::Zero,
            face_value: 100.0, dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        };
        let mac = macaulay_duration(&bond, 0.05, d(2025, 5, 15));
        assert!((mac - 10.0).abs() < 0.01, "zero-coupon duration={}", mac);
    }

    #[test]
    fn modified_less_than_macaulay() {
        let bond = ust_bond(0.05, d(2035, 5, 15));
        let mac = macaulay_duration(&bond, 0.05, d(2025, 5, 15));
        let modd = modified_duration(&bond, 0.05, d(2025, 5, 15));
        assert!(modd < mac);
        assert!((modd - mac / 1.025).abs() < 1e-10);
    }

    #[test]
    fn duration_increases_with_maturity() {
        let dur_5y = macaulay_duration(&ust_bond(0.05, d(2030, 5, 15)), 0.05, d(2025, 5, 15));
        let dur_30y = macaulay_duration(&ust_bond(0.05, d(2055, 5, 15)), 0.05, d(2025, 5, 15));
        assert!(dur_30y > dur_5y);
    }

    #[test]
    fn duration_decreases_with_coupon() {
        let dur_low = macaulay_duration(&ust_bond(0.02, d(2035, 5, 15)), 0.05, d(2025, 5, 15));
        let dur_high = macaulay_duration(&ust_bond(0.08, d(2035, 5, 15)), 0.05, d(2025, 5, 15));
        assert!(dur_low > dur_high);
    }

    #[test]
    fn short_bond_duration() {
        let mac = macaulay_duration(&ust_bond(0.0425, d(2027, 5, 15)), 0.0425, d(2025, 5, 15));
        assert!(mac > 1.5 && mac < 2.0, "2Y duration={}", mac);
    }

    #[test]
    fn duration_convexity_price_approximation() {
        let bond = ust_bond(0.05, d(2035, 5, 15));
        let settle = d(2025, 5, 15);
        let ytm = 0.05;
        let dy = 0.01;

        let p0 = super::super::pricing::dirty_price_from_yield(&bond, ytm, settle);
        let p_actual = super::super::pricing::dirty_price_from_yield(&bond, ytm + dy, settle);

        let mod_dur = modified_duration(&bond, ytm, settle);
        let conv = super::super::convexity::convexity(&bond, ytm, settle);

        let dp_approx = -mod_dur * p0 * dy + 0.5 * conv * p0 * dy * dy;
        let p_approx = p0 + dp_approx;

        let error_pct = ((p_approx - p_actual) / p_actual).abs();
        assert!(error_pct < 0.001,
            "Duration+convexity approx error {:.4}% (actual={}, approx={})",
            error_pct * 100.0, p_actual, p_approx);
    }

    #[test]
    fn ust_30y_duration_range() {
        let bond = ust_bond(0.04625, d(2055, 5, 15));
        let dur = macaulay_duration(&bond, 0.047, d(2025, 5, 15));
        assert!(dur > 14.0 && dur < 20.0, "30Y duration={}", dur);
    }
}
