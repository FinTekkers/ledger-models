use crate::date::Date;
use super::{BondSpec, CouponType};
use super::cashflows;

pub fn accrued_interest(bond: &BondSpec, settlement: Date) -> f64 {
    if bond.coupon_type == CouponType::Zero {
        return 0.0;
    }

    let coupon_dates = cashflows::generate_coupon_dates(bond);
    let (prev_coupon, next_coupon) = cashflows::prev_and_next_coupon(&coupon_dates, settlement);

    if settlement == prev_coupon {
        return 0.0;
    }

    let coupon_payment = bond.coupon_rate * bond.face_value / bond.coupon_freq as f64;
    let frac = bond.day_count.accrual_fraction(prev_coupon, settlement, prev_coupon, next_coupon);

    coupon_payment * frac
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn ust_bond() -> BondSpec {
        BondSpec {
            coupon_rate: 0.05,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: d(2025, 5, 15),
            maturity_date: d(2035, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn zero_on_coupon_date() {
        assert!((accrued_interest(&ust_bond(), d(2025, 5, 15))).abs() < 1e-15);
    }

    #[test]
    fn example_from_plan() {
        let ai = accrued_interest(&ust_bond(), d(2025, 8, 20));
        let expected = 2.5 * 97.0 / 184.0;
        assert!((ai - expected).abs() < 1e-10, "AI={}, expected={}", ai, expected);
    }

    #[test]
    fn one_day_after_coupon() {
        let ai = accrued_interest(&ust_bond(), d(2025, 5, 16));
        let expected = 2.5 * 1.0 / 184.0;
        assert!((ai - expected).abs() < 1e-10);
    }

    #[test]
    fn zero_coupon_returns_zero() {
        let bond = BondSpec {
            coupon_rate: 0.0, coupon_freq: 2, coupon_type: CouponType::Zero,
            face_value: 100.0, dated_date: d(2025, 5, 15), maturity_date: d(2026, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        };
        assert!((accrued_interest(&bond, d(2025, 8, 20))).abs() < 1e-15);
    }

    #[test]
    fn day_before_next_coupon() {
        let ai = accrued_interest(&ust_bond(), d(2025, 11, 14));
        let expected = 2.5 * 183.0 / 184.0;
        assert!((ai - expected).abs() < 1e-10);
    }
}
