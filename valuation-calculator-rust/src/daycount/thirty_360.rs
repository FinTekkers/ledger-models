use crate::date::Date;

/// 30/360 US (Bond Basis / ISDA)
///
/// Also known as "30/360", "Bond Basis", or "30/360 ISDA".
/// Used for US corporate bonds, municipal bonds, and agency bonds.
///
/// Adjustment rules:
///   - If D1 is 31, change D1 to 30
///   - If D2 is 31 AND D1 is 30 or 31, change D2 to 30
///
/// Fraction = (360*(Y2-Y1) + 30*(M2-M1) + (D2-D1)) / 360
pub fn thirty_360_us(d1: Date, d2: Date) -> f64 {
    let y1 = d1.year as i64;
    let y2 = d2.year as i64;
    let m1 = d1.month as i64;
    let m2 = d2.month as i64;

    let mut day1 = d1.day as i64;
    let mut day2 = d2.day as i64;

    // US adjustment rules
    if day1 == 31 {
        day1 = 30;
    }
    if day2 == 31 && (day1 == 30 || day1 == 31) {
        day2 = 30;
    }

    let numerator = 360 * (y2 - y1) + 30 * (m2 - m1) + (day2 - day1);
    numerator as f64 / 360.0
}

/// 30E/360 (Eurobond Basis / ISDA)
///
/// Also known as "30E/360", "Eurobond Basis", or "30/360 ISDA (European)".
/// Used for Eurobond and some European fixed-income markets.
///
/// Adjustment rules:
///   - If D1 is 31, change D1 to 30
///   - If D2 is 31, change D2 to 30
///
/// Fraction = (360*(Y2-Y1) + 30*(M2-M1) + (D2-D1)) / 360
pub fn thirty_360_eu(d1: Date, d2: Date) -> f64 {
    let y1 = d1.year as i64;
    let y2 = d2.year as i64;
    let m1 = d1.month as i64;
    let m2 = d2.month as i64;

    let mut day1 = d1.day as i64;
    let mut day2 = d2.day as i64;

    // European adjustment rules
    if day1 == 31 {
        day1 = 30;
    }
    if day2 == 31 {
        day2 = 30;
    }

    let numerator = 360 * (y2 - y1) + 30 * (m2 - m1) + (day2 - day1);
    numerator as f64 / 360.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    // ── Full year tests ─────────────────────────────────────────────

    #[test]
    fn us_full_year_equals_one() {
        let frac = thirty_360_us(d(2025, 1, 1), d(2026, 1, 1));
        assert!((frac - 1.0).abs() < 1e-15, "US full year = {}", frac);
    }

    #[test]
    fn eu_full_year_equals_one() {
        let frac = thirty_360_eu(d(2025, 1, 1), d(2026, 1, 1));
        assert!((frac - 1.0).abs() < 1e-15, "EU full year = {}", frac);
    }

    // ── Half year tests ─────────────────────────────────────────────

    #[test]
    fn us_half_year() {
        let frac = thirty_360_us(d(2025, 1, 15), d(2025, 7, 15));
        assert!((frac - 0.5).abs() < 1e-15, "US half year = {}", frac);
    }

    #[test]
    fn eu_half_year() {
        let frac = thirty_360_eu(d(2025, 1, 15), d(2025, 7, 15));
        assert!((frac - 0.5).abs() < 1e-15, "EU half year = {}", frac);
    }

    // ── Zero days ───────────────────────────────────────────────────

    #[test]
    fn us_zero_days() {
        let frac = thirty_360_us(d(2025, 5, 15), d(2025, 5, 15));
        assert!(frac.abs() < 1e-15);
    }

    #[test]
    fn eu_zero_days() {
        let frac = thirty_360_eu(d(2025, 5, 15), d(2025, 5, 15));
        assert!(frac.abs() < 1e-15);
    }

    // ── Day 31 adjustment tests ─────────────────────────────────────

    #[test]
    fn us_d1_is_31() {
        // D1=Jan31 -> adjusted to 30. D2=Feb28.
        // 30*(1-1)+(28-30) = -2 days => -2/360
        // But normally Jan31..Feb28 = (30*(2-1) + (28-30))/360 = (30-2)/360 = 28/360
        let frac = thirty_360_us(d(2025, 1, 31), d(2025, 2, 28));
        let expected = (30.0 * (2.0 - 1.0) + (28.0 - 30.0)) / 360.0; // 28/360
        assert!((frac - expected).abs() < 1e-15, "US D1=31: {} vs {}", frac, expected);
    }

    #[test]
    fn us_d2_is_31_and_d1_is_31() {
        // D1=Jan31 adjusted to 30, D2=Mar31 adjusted to 30 (because D1 was 31)
        // (30*(3-1) + (30-30))/360 = 60/360 = 1/6
        let frac = thirty_360_us(d(2025, 1, 31), d(2025, 3, 31));
        let expected = 60.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US D1=31,D2=31: {}", frac);
    }

    #[test]
    fn us_d2_is_31_but_d1_is_not_30_or_31() {
        // D1=Jan15 (no adjustment), D2=Mar31 (NOT adjusted, since D1 != 30 or 31)
        // (30*(3-1) + (31-15))/360 = (60+16)/360 = 76/360
        let frac = thirty_360_us(d(2025, 1, 15), d(2025, 3, 31));
        let expected = (60.0 + 16.0) / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US D2=31,D1=15: {}", frac);
    }

    #[test]
    fn us_d1_is_30_d2_is_31() {
        // D1=Apr30 (not 31, no D1 adjustment), D2=May31 adjusted to 30 (D1 is 30)
        // (30*(5-4) + (30-30))/360 = 30/360
        let frac = thirty_360_us(d(2025, 4, 30), d(2025, 5, 31));
        let expected = 30.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US D1=30,D2=31: {}", frac);
    }

    #[test]
    fn eu_d1_is_31() {
        // D1=Jan31 adjusted to 30, D2=Feb28 not adjusted
        let frac = thirty_360_eu(d(2025, 1, 31), d(2025, 2, 28));
        let expected = (30.0 * (2.0 - 1.0) + (28.0 - 30.0)) / 360.0; // 28/360
        assert!((frac - expected).abs() < 1e-15, "EU D1=31: {}", frac);
    }

    #[test]
    fn eu_d2_is_31() {
        // D1=Jan15, D2=Mar31 adjusted to 30
        // (30*(3-1) + (30-15))/360 = 75/360
        let frac = thirty_360_eu(d(2025, 1, 15), d(2025, 3, 31));
        let expected = 75.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "EU D2=31: {}", frac);
    }

    #[test]
    fn eu_both_31() {
        // D1=Jan31 adjusted to 30, D2=Mar31 adjusted to 30
        // (30*(3-1) + (30-30))/360 = 60/360
        let frac = thirty_360_eu(d(2025, 1, 31), d(2025, 3, 31));
        let expected = 60.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "EU both 31: {}", frac);
    }

    // ── US vs EU divergence ─────────────────────────────────────────
    // The two conventions differ when D2=31 and D1 is NOT 30 or 31.

    #[test]
    fn us_vs_eu_diverge_on_d2_31_d1_not_30() {
        // D1=Jan 15, D2=Mar 31
        // US: D1=15, D2=31 (no D2 adjustment since D1!=30,31)
        //   => (30*2 + (31-15))/360 = 76/360
        // EU: D1=15, D2=30
        //   => (30*2 + (30-15))/360 = 75/360
        let us = thirty_360_us(d(2025, 1, 15), d(2025, 3, 31));
        let eu = thirty_360_eu(d(2025, 1, 15), d(2025, 3, 31));
        assert!((us - 76.0 / 360.0).abs() < 1e-15);
        assert!((eu - 75.0 / 360.0).abs() < 1e-15);
        assert!((us - eu - 1.0 / 360.0).abs() < 1e-15, "Difference should be 1/360");
    }

    #[test]
    fn us_vs_eu_agree_when_no_31() {
        // When neither date is 31, both give the same result
        let us = thirty_360_us(d(2025, 3, 15), d(2025, 9, 15));
        let eu = thirty_360_eu(d(2025, 3, 15), d(2025, 9, 15));
        assert!((us - eu).abs() < 1e-15, "Should agree: US={}, EU={}", us, eu);
    }

    // ── February end-of-month tests ─────────────────────────────────

    #[test]
    fn us_feb28_non_leap_year() {
        // Feb 28 in non-leap year (2025) — not day 31, no adjustments
        let frac = thirty_360_us(d(2025, 1, 1), d(2025, 2, 28));
        // (30*(2-1) + (28-1))/360 = 57/360
        let expected = 57.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US Feb28 non-leap: {}", frac);
    }

    #[test]
    fn eu_feb28_non_leap_year() {
        let frac = thirty_360_eu(d(2025, 1, 1), d(2025, 2, 28));
        let expected = 57.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "EU Feb28 non-leap: {}", frac);
    }

    #[test]
    fn us_feb29_leap_year() {
        // Feb 29, 2024 (leap year) — day is 29, not 31, no adjustments
        let frac = thirty_360_us(d(2024, 1, 1), d(2024, 2, 29));
        // (30*(2-1) + (29-1))/360 = 58/360
        let expected = 58.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US Feb29 leap: {}", frac);
    }

    #[test]
    fn eu_feb29_leap_year() {
        let frac = thirty_360_eu(d(2024, 1, 1), d(2024, 2, 29));
        let expected = 58.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "EU Feb29 leap: {}", frac);
    }

    #[test]
    fn us_feb28_to_mar31() {
        // D1=Feb28 (not 31, no adjust), D2=Mar31 (D1 != 30 or 31, so no D2 adjust)
        // (30*(3-2) + (31-28))/360 = 33/360
        let frac = thirty_360_us(d(2025, 2, 28), d(2025, 3, 31));
        let expected = 33.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US Feb28->Mar31: {}", frac);
    }

    #[test]
    fn eu_feb28_to_mar31() {
        // D1=Feb28 (no adjust), D2=Mar31 adjusted to 30
        // (30*(3-2) + (30-28))/360 = 32/360
        let frac = thirty_360_eu(d(2025, 2, 28), d(2025, 3, 31));
        let expected = 32.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "EU Feb28->Mar31: {}", frac);
    }

    // ── Corporate bond accrual examples ─────────────────────────────

    #[test]
    fn us_corporate_semiannual_full_period() {
        // Typical US corporate: semiannual coupon, 30/360
        // Coupon dates: Jan 15 and Jul 15
        // Full 6-month period = 180/360 = 0.5
        let frac = thirty_360_us(d(2025, 1, 15), d(2025, 7, 15));
        assert!((frac - 0.5).abs() < 1e-15);
    }

    #[test]
    fn us_corporate_partial_accrual() {
        // Last coupon Jan 15, settle Mar 1
        // (30*(3-1) + (1-15))/360 = (60-14)/360 = 46/360
        let frac = thirty_360_us(d(2025, 1, 15), d(2025, 3, 1));
        let expected = 46.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "US partial accrual: {}", frac);
    }

    #[test]
    fn us_corporate_one_month() {
        // Exactly one month = 30/360
        let frac = thirty_360_us(d(2025, 5, 15), d(2025, 6, 15));
        let expected = 30.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15);
    }

    #[test]
    fn us_corporate_one_day() {
        let frac = thirty_360_us(d(2025, 5, 15), d(2025, 5, 16));
        let expected = 1.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15);
    }

    #[test]
    fn eu_one_month() {
        let frac = thirty_360_eu(d(2025, 5, 15), d(2025, 6, 15));
        let expected = 30.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15);
    }

    // ── Cross-year tests ────────────────────────────────────────────

    #[test]
    fn us_cross_year() {
        // Nov 15 to May 15 next year = 180/360 = 0.5
        let frac = thirty_360_us(d(2025, 11, 15), d(2026, 5, 15));
        assert!((frac - 0.5).abs() < 1e-15);
    }

    #[test]
    fn us_two_years() {
        let frac = thirty_360_us(d(2025, 1, 1), d(2027, 1, 1));
        assert!((frac - 2.0).abs() < 1e-15);
    }

    // ── Municipal bond example ──────────────────────────────────────

    #[test]
    fn muni_bond_accrual() {
        // Typical muni: semiannual, 30/360
        // Coupon dates Jun 1 and Dec 1. Settle Aug 15.
        // Days: 30*(8-6) + (15-1) = 74. Fraction = 74/360
        let frac = thirty_360_us(d(2025, 6, 1), d(2025, 8, 15));
        let expected = 74.0 / 360.0;
        assert!((frac - expected).abs() < 1e-15, "Muni accrual: {}", frac);
    }

    // ── Edge: month-end 30 vs 31 ────────────────────────────────────

    #[test]
    fn us_apr30_to_jul31() {
        // D1=Apr30 (not 31, no D1 adjust), D2=Jul31: D1==30, so D2 adjusted to 30
        // (30*(7-4) + (30-30))/360 = 90/360 = 0.25
        let frac = thirty_360_us(d(2025, 4, 30), d(2025, 7, 31));
        assert!((frac - 0.25).abs() < 1e-15, "US Apr30->Jul31: {}", frac);
    }

    #[test]
    fn eu_apr30_to_jul31() {
        // D1=Apr30 (no adjust), D2=Jul31 adjusted to 30
        // Same result as US in this case
        let frac = thirty_360_eu(d(2025, 4, 30), d(2025, 7, 31));
        assert!((frac - 0.25).abs() < 1e-15, "EU Apr30->Jul31: {}", frac);
    }
}
