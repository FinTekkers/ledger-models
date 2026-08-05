use crate::date::Date;
use super::BondSpec;
use super::{duration, pricing};

pub fn dv01(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    let mod_dur = duration::modified_duration(bond, ytm, settlement);
    let dp = pricing::dirty_price_from_yield(bond, ytm, settlement);
    mod_dur * dp * 0.0001
}

pub fn dv01_numerical(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    let bump = 0.0001;
    let p_down = pricing::dirty_price_from_yield(bond, ytm - bump, settlement);
    let p_up = pricing::dirty_price_from_yield(bond, ytm + bump, settlement);
    (p_down - p_up) / 2.0
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
    fn positive() { assert!(dv01(&ust_bond(0.05, d(2035, 5, 15)), 0.05, d(2025, 5, 15)) > 0.0); }

    #[test]
    fn analytical_matches_numerical() {
        let bond = ust_bond(0.05, d(2035, 5, 15));
        let a = dv01(&bond, 0.05, d(2025, 5, 15));
        let n = dv01_numerical(&bond, 0.05, d(2025, 5, 15));
        assert!((a - n).abs() < 0.001, "analytical={}, numerical={}", a, n);
    }

    #[test]
    fn longer_bond_higher_dv01() {
        let d5 = dv01(&ust_bond(0.05, d(2030, 5, 15)), 0.05, d(2025, 5, 15));
        let d30 = dv01(&ust_bond(0.05, d(2055, 5, 15)), 0.05, d(2025, 5, 15));
        assert!(d30 > d5);
    }
}
