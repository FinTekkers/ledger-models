use super::BondSpec;

pub fn current_yield(bond: &BondSpec, market_clean_price: f64) -> f64 {
    let annual_coupon = bond.coupon_rate * bond.face_value;
    if market_clean_price <= 0.0 { return 0.0; }
    annual_coupon / market_clean_price
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::daycount::DayCountConvention;
    use crate::date::Date;

    fn bond(coupon: f64) -> BondSpec {
        BondSpec {
            coupon_rate: coupon, coupon_freq: 2, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: Date::new(2025, 5, 15),
            maturity_date: Date::new(2035, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn par_bond() { assert!((current_yield(&bond(0.05), 100.0) - 0.05).abs() < 1e-15); }

    #[test]
    fn discount_bond() { assert!(current_yield(&bond(0.05), 95.0) > 0.05); }

    #[test]
    fn premium_bond() { assert!(current_yield(&bond(0.05), 110.0) < 0.05); }
}
