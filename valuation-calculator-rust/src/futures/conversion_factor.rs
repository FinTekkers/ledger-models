//! CBOT conversion factor for Treasury bond/note futures.
//!
//! The conversion factor (CF) normalizes the price of a specific deliverable
//! bond to the futures contract standard. It is the clean price per $1 of face
//! value if the bond were priced to yield exactly 6% (the CBOT standard yield),
//! with the bond's remaining life rounded down to the nearest whole quarter.

use crate::bond::BondSpec;
use crate::date::Date;

/// Calculate the CBOT conversion factor for a Treasury bond/note future.
///
/// The CF is the clean price of the bond (per $1 face) if it were yielding
/// exactly 6% (the futures contract standard yield), with maturity/coupon
/// rounded down to the nearest whole quarter (3-month increment).
///
/// # Formula (CBOT standard)
///
/// Let `c` = annual coupon rate, `r` = 0.03 (semiannual 6% yield),
/// `n` = number of whole semiannual periods after rounding, and
/// `z` = remaining months after rounding modulo 6 (either 0 or 3).
///
/// When `z == 0` (settlement falls on a coupon date):
///   CF = (c/2) * [1 - (1+r)^(-n)] / r + (1+r)^(-n)
///
/// When `z == 3` (settlement falls 3 months into a semiannual period):
///   CF = (1+r)^(-1/2) * { (c/2) * [1 - (1+r)^(-n)] / r + (1+r)^(-n) + c/2 } - c/4
///
/// The subtraction of `c/4` removes the accrued interest for 3 months
/// (half of a semiannual period).
pub fn conversion_factor(bond: &BondSpec, delivery_date: Date) -> f64 {
    let standard_yield = 0.06;
    let freq = 2.0; // semiannual compounding
    let r = standard_yield / freq; // 0.03

    // Compute months from delivery to maturity
    let months_to_maturity = months_between(delivery_date, bond.maturity_date);

    // Round down to nearest quarter (3-month increment)
    let rounded_months = (months_to_maturity / 3) * 3;
    if rounded_months == 0 {
        // Bond matures too soon for meaningful CF; return 1.0 (par)
        return 1.0;
    }

    let n_periods = rounded_months / 6; // whole semiannual periods
    let z = rounded_months % 6; // 0 or 3

    let coupon_per_period = bond.coupon_rate / freq;

    if z == 0 {
        // Settlement on a coupon date boundary
        let discount = (1.0 + r).powi(-(n_periods as i32));
        let annuity = coupon_per_period * (1.0 - discount) / r;
        annuity + discount
    } else {
        // Settlement 3 months into a semiannual period
        let discount = (1.0 + r).powi(-(n_periods as i32));
        let annuity = coupon_per_period * (1.0 - discount) / r;
        let full_price = annuity + discount + coupon_per_period;
        let accrued = coupon_per_period * 0.5; // 3/6 of a semiannual coupon
        (1.0 + r).powf(-0.5) * full_price - accrued
    }
}

/// Compute the number of whole months between two dates.
///
/// Returns 0 if `from` is on or after `to`.
fn months_between(from: Date, to: Date) -> u32 {
    if from >= to {
        return 0;
    }
    let year_diff = to.year - from.year;
    let month_diff = to.month as i32 - from.month as i32;
    let total = year_diff * 12 + month_diff;

    // If the day hasn't been reached yet in the final month, subtract one
    if to.day < from.day {
        if total > 0 {
            (total - 1) as u32
        } else {
            0
        }
    } else {
        total.max(0) as u32
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::{BondSpec, CouponType};
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn make_bond(coupon_rate: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        }
    }

    #[test]
    fn par_bond_at_6_percent_cf_approx_one() {
        // A 6% coupon bond should have CF very close to 1.0
        let bond = make_bond(0.06, d(2025, 6, 15), d(2035, 6, 15));
        let delivery = d(2025, 9, 1);
        let cf = conversion_factor(&bond, delivery);
        assert!(
            (cf - 1.0).abs() < 0.01,
            "6% bond CF should be ~1.0, got {}",
            cf
        );
    }

    #[test]
    fn high_coupon_bond_cf_greater_than_one() {
        // An 8% coupon bond priced at 6% yield should be worth more than par
        let bond = make_bond(0.08, d(2025, 3, 15), d(2045, 3, 15));
        let delivery = d(2025, 9, 1);
        let cf = conversion_factor(&bond, delivery);
        assert!(
            cf > 1.0,
            "8% bond CF should be > 1.0, got {}",
            cf
        );
    }

    #[test]
    fn low_coupon_bond_cf_less_than_one() {
        // A 2% coupon bond priced at 6% yield should be worth less than par
        let bond = make_bond(0.02, d(2025, 3, 15), d(2045, 3, 15));
        let delivery = d(2025, 9, 1);
        let cf = conversion_factor(&bond, delivery);
        assert!(
            cf < 1.0,
            "2% bond CF should be < 1.0, got {}",
            cf
        );
    }

    #[test]
    fn zero_coupon_cf_is_discount_factor() {
        // A zero coupon bond should have CF = discount factor at 6%
        // CF = (1.03)^(-n) for z=0, or adjusted for z=3
        let bond = make_bond(0.0, d(2025, 3, 15), d(2035, 3, 15));
        let delivery = d(2025, 3, 15);
        let cf = conversion_factor(&bond, delivery);

        // 10 years = 120 months, rounded = 120, n_periods = 20, z = 0
        let expected = 1.0 / (1.03_f64).powi(20);
        assert!(
            (cf - expected).abs() < 1e-10,
            "Zero coupon CF={}, expected discount factor={}",
            cf,
            expected
        );
    }

    #[test]
    fn cf_increases_with_coupon() {
        let delivery = d(2025, 9, 1);
        let cf_2 = conversion_factor(
            &make_bond(0.02, d(2025, 3, 15), d(2045, 3, 15)),
            delivery,
        );
        let cf_4 = conversion_factor(
            &make_bond(0.04, d(2025, 3, 15), d(2045, 3, 15)),
            delivery,
        );
        let cf_8 = conversion_factor(
            &make_bond(0.08, d(2025, 3, 15), d(2045, 3, 15)),
            delivery,
        );
        assert!(
            cf_2 < cf_4 && cf_4 < cf_8,
            "CF should increase with coupon: cf_2={}, cf_4={}, cf_8={}",
            cf_2,
            cf_4,
            cf_8
        );
    }

    #[test]
    fn cf_with_z_equals_3() {
        // Delivery date such that months_to_maturity mod 6 == 3
        // Bond matures June 15, delivery March 15 => 3 months => rounded 3, z=3, n=0
        // Use a longer bond to get z=3 more meaningfully
        let bond = make_bond(0.05, d(2025, 3, 15), d(2035, 6, 15));
        let delivery = d(2025, 3, 15);
        let cf = conversion_factor(&bond, delivery);

        // 10 years 3 months = 123 months, rounded = 123/3*3 = 123, z = 123%6 = 3
        // n = 123/6 = 20
        assert!(
            cf > 0.5 && cf < 1.5,
            "CF with z=3 should be reasonable, got {}",
            cf
        );
    }

    #[test]
    fn months_between_basic() {
        assert_eq!(months_between(d(2025, 1, 1), d(2025, 7, 1)), 6);
        assert_eq!(months_between(d(2025, 1, 15), d(2025, 7, 15)), 6);
        assert_eq!(months_between(d(2025, 1, 15), d(2025, 7, 14)), 5);
        assert_eq!(months_between(d(2025, 1, 1), d(2035, 1, 1)), 120);
        assert_eq!(months_between(d(2025, 6, 1), d(2025, 6, 1)), 0);
    }
}
