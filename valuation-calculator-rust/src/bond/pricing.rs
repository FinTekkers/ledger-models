use crate::date::Date;
use super::{BondSpec, Cashflow};
use super::cashflows;

pub fn dirty_price_from_yield(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    let cfs = cashflows::generate(bond, settlement);
    dirty_price_from_cashflows(&cfs, ytm, bond.coupon_freq)
}

pub fn dirty_price_from_cashflows(cfs: &[Cashflow], ytm: f64, freq: u32) -> f64 {
    let n = freq as f64;
    let r = 1.0 + ytm / n;
    cfs.iter()
        .map(|cf| cf.amount / r.powf(cf.period_fraction))
        .sum()
}

pub fn clean_price(bond: &BondSpec, ytm: f64, settlement: Date) -> f64 {
    let dp = dirty_price_from_yield(bond, ytm, settlement);
    let ai = super::accrued_interest::accrued_interest(bond, settlement);
    dp - ai
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn ust_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon, coupon_freq: 2, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: dated, maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn par_bond_on_coupon_date() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let dp = dirty_price_from_yield(&bond, 0.05, d(2025, 5, 15));
        assert!((dp - 100.0).abs() < 1e-8, "dirty_price={}", dp);
    }

    #[test]
    fn discount_bond() {
        let bond = ust_bond(0.04, d(2025, 5, 15), d(2035, 5, 15));
        assert!(dirty_price_from_yield(&bond, 0.05, d(2025, 5, 15)) < 100.0);
    }

    #[test]
    fn premium_bond() {
        let bond = ust_bond(0.06, d(2025, 5, 15), d(2035, 5, 15));
        assert!(dirty_price_from_yield(&bond, 0.05, d(2025, 5, 15)) > 100.0);
    }

    #[test]
    fn zero_coupon_pricing() {
        let bond = BondSpec {
            coupon_rate: 0.0, coupon_freq: 2, coupon_type: CouponType::Zero,
            face_value: 100.0, dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        };
        let dp = dirty_price_from_yield(&bond, 0.05, d(2025, 5, 15));
        let expected = 100.0 / 1.025_f64.powi(20);
        assert!((dp - expected).abs() < 1e-8);
    }

    #[test]
    fn clean_equals_dirty_on_coupon_date() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let cp = clean_price(&bond, 0.05, d(2025, 5, 15));
        let dp = dirty_price_from_yield(&bond, 0.05, d(2025, 5, 15));
        assert!((cp - dp).abs() < 1e-10);
    }

    #[test]
    fn zero_yield_equals_undiscounted_sum() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2027, 5, 15));
        let dp = dirty_price_from_yield(&bond, 0.0, d(2025, 5, 15));
        assert!((dp - 110.0).abs() < 1e-8);
    }

    #[test]
    fn three_way_pv_invariant() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let settle = d(2025, 8, 20);
        let clean = 97.5;

        let ytm = super::super::ytm_solver::solve_ytm(&bond, clean, settle).unwrap();
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let dirty = clean + ai;

        let dp_from_yield = dirty_price_from_yield(&bond, ytm, settle);
        assert!((dp_from_yield - dirty).abs() < 1e-8,
            "dp_from_yield={} vs dirty={}", dp_from_yield, dirty);

        let cfs = super::super::cashflows::generate(&bond, settle);
        let sum_pv: f64 = cfs.iter()
            .map(|cf| cf.amount / (1.0 + ytm / 2.0).powf(cf.period_fraction))
            .sum();
        assert!((sum_pv - dirty).abs() < 1e-8,
            "sum_pv={} vs dirty={}", sum_pv, dirty);
    }

    #[test]
    fn settlement_on_coupon_date_clean_equals_dirty() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let settle = d(2025, 5, 15);
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        assert!(ai.abs() < 1e-15);
        let cp = clean_price(&bond, 0.05, settle);
        let dp = dirty_price_from_yield(&bond, 0.05, settle);
        assert!((cp - dp).abs() < 1e-10);
    }
}
