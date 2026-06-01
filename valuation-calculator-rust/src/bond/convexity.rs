use crate::date::Date;
use super::BondSpec;
use super::cashflows;

pub fn convexity(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    let cfs = cashflows::generate(bond, settlement);
    let freq = bond.coupon_freq as f64;
    let r = 1.0 + ytm / freq;

    let mut numerator = 0.0_f64;
    let mut total_pv = 0.0_f64;

    for cf in &cfs {
        let t = cf.period_fraction;
        numerator += t * (t + 1.0) * cf.amount / r.powf(t + 2.0);
        total_pv += cf.amount / r.powf(t);
    }

    if total_pv == 0.0 { return 0.0; }
    numerator / (total_pv * freq * freq)
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
    fn positive() { assert!(convexity(&ust_bond(0.05, d(2035, 5, 15)), 0.05, d(2025, 5, 15)) > 0.0); }

    #[test]
    fn increases_with_maturity() {
        let c5 = convexity(&ust_bond(0.05, d(2030, 5, 15)), 0.05, d(2025, 5, 15));
        let c30 = convexity(&ust_bond(0.05, d(2055, 5, 15)), 0.05, d(2025, 5, 15));
        assert!(c30 > c5);
    }

    #[test]
    fn zero_coupon_convexity() {
        let bond = BondSpec {
            coupon_rate: 0.0, coupon_freq: 2, coupon_type: CouponType::Zero,
            face_value: 100.0, dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        };
        let conv = convexity(&bond, 0.05, d(2025, 5, 15));
        let expected = 10.0 * 10.5 / (1.025 * 1.025);
        assert!((conv - expected).abs() < 0.5, "conv={}, expected≈{}", conv, expected);
    }
}
