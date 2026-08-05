use crate::date::Date;
use super::{BondSpec, CouponType};
use super::cashflows;

pub fn accrued_interest(bond: &BondSpec, settlement: Date) -> f64 {
    match bond.coupon_type {
        CouponType::Zero => return 0.0,
        CouponType::Floating { .. } => {
            // For FRNs without a projection curve, return 0.0.
            // Use frn::frn_accrued_interest for curve-based accrued interest.
            return 0.0;
        }
        CouponType::Fixed => {}
    }

    let coupon_dates = cashflows::generate_coupon_dates(bond);
    let (prev_coupon, next_coupon) = cashflows::prev_and_next_coupon(&coupon_dates, settlement);

    if settlement == prev_coupon {
        return 0.0;
    }

    let coupon_payment = bond.coupon_rate * bond.face_value / bond.coupon_freq as f64;

    if cashflows::is_ex_dividend(bond, settlement, next_coupon) {
        let frac = bond.day_count.accrual_fraction(settlement, next_coupon, prev_coupon, next_coupon);
        return -coupon_payment * frac;
    }

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
            day_count: DayCountConvention::ActualActualICMA, ex_dividend_days: 0,
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
            day_count: DayCountConvention::ActualActualICMA, ex_dividend_days: 0,
        };
        assert!((accrued_interest(&bond, d(2025, 8, 20))).abs() < 1e-15);
    }

    #[test]
    fn day_before_next_coupon() {
        let ai = accrued_interest(&ust_bond(), d(2025, 11, 14));
        let expected = 2.5 * 183.0 / 184.0;
        assert!((ai - expected).abs() < 1e-10);
    }

    // ── Euro bond (annual coupon) tests ─────────────────────────────

    fn euro_bond() -> BondSpec {
        BondSpec {
            coupon_rate: 0.025,
            coupon_freq: 1,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: d(2024, 7, 4),
            maturity_date: d(2034, 7, 4),
            day_count: DayCountConvention::ActualActualICMA, ex_dividend_days: 0,
        }
    }

    #[test]
    fn euro_zero_on_coupon_date() {
        assert!((accrued_interest(&euro_bond(), d(2025, 7, 4))).abs() < 1e-15);
    }

    #[test]
    fn euro_accrued_mid_period() {
        // Annual coupon = 2.5% × 100 = 2.50
        // Settle 2025-01-04, last coupon 2024-07-04, next 2025-07-04
        // days accrued = 184, days in period = 365 or 366
        let ai = accrued_interest(&euro_bond(), d(2025, 1, 4));
        let last = d(2024, 7, 4);
        let next = d(2025, 7, 4);
        let settle = d(2025, 1, 4);
        let expected = 2.5 * (settle.days_since(&last) as f64) / (next.days_since(&last) as f64);
        assert!((ai - expected).abs() < 1e-10, "Euro AI={}, expected={}", ai, expected);
    }

    #[test]
    fn euro_full_annual_coupon() {
        // Annual coupon is larger than semiannual
        let ai_euro = accrued_interest(&euro_bond(), d(2025, 1, 4));
        // Semiannual with same rate would accrue half the coupon over half the period
        assert!(ai_euro > 1.0, "Annual AI should be meaningful: {}", ai_euro);
    }

    // ── UK Gilt (ex-dividend) tests ─────────────────────────────────

    fn gilt() -> BondSpec {
        BondSpec {
            coupon_rate: 0.04, coupon_freq: 2, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: d(2025, 1, 22), maturity_date: d(2035, 1, 22),
            day_count: DayCountConvention::ActualActualICMA, ex_dividend_days: 7,
        }
    }

    #[test]
    fn gilt_normal_accrued() {
        let ai = accrued_interest(&gilt(), d(2025, 4, 1));
        assert!(ai > 0.0, "Normal Gilt AI should be positive: {}", ai);
    }

    #[test]
    fn gilt_ex_div_negative_accrued() {
        let ai = accrued_interest(&gilt(), d(2025, 7, 17));
        assert!(ai < 0.0, "Ex-div Gilt AI should be negative: {}", ai);
    }

    #[test]
    fn gilt_ex_div_ai_magnitude() {
        let settle = d(2025, 7, 17);
        let ai = accrued_interest(&gilt(), settle);
        let next = d(2025, 7, 22);
        let prev = d(2025, 1, 22);
        let days_remaining = next.days_since(&settle) as f64;
        let days_in_period = next.days_since(&prev) as f64;
        let expected = -(2.0 * days_remaining / days_in_period);
        assert!((ai - expected).abs() < 1e-10, "AI={}, expected={}", ai, expected);
    }

    // ── JGB (Act/365) tests ─────────────────────────────────────────

    fn jgb_bond() -> BondSpec {
        BondSpec {
            coupon_rate: 0.005, coupon_freq: 2, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: d(2025, 3, 20), maturity_date: d(2035, 3, 20),
            day_count: DayCountConvention::Actual365Fixed, ex_dividend_days: 0,
        }
    }

    #[test]
    fn jgb_accrued_uses_act365() {
        let ai = accrued_interest(&jgb_bond(), d(2025, 6, 20));
        let days = d(2025, 6, 20).days_since(&d(2025, 3, 20)) as f64;
        let expected = 0.25 * days / 365.0;
        assert!((ai - expected).abs() < 1e-10, "JGB AI={}, expected={}", ai, expected);
    }

    #[test]
    fn jgb_zero_on_coupon_date() {
        assert!((accrued_interest(&jgb_bond(), d(2025, 3, 20))).abs() < 1e-15);
    }
}
