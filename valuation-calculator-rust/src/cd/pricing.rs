use crate::date::Date;
use crate::error::BondError;
use super::{CdSpec, CdType};

/// Maturity value of an add-on CD
/// = face_value * (1 + rate * day_count_fraction)
pub fn maturity_value(cd: &CdSpec) -> f64 {
    match cd.cd_type {
        CdType::AddOn => {
            let frac = cd.day_count.accrual_fraction(
                cd.issue_date, cd.maturity_date,
                cd.issue_date, cd.maturity_date,
            );
            cd.face_value * (1.0 + cd.coupon_rate * frac)
        }
        CdType::Discount => cd.face_value,
    }
}

/// Market value of a CD at a given settlement date and market yield
///
/// For add-on CD:
///   PV = maturity_value / (1 + market_yield * remaining_fraction)
///   where remaining_fraction = Act/360 from settlement to maturity
///
/// For discount CD:
///   PV = face_value * (1 - market_yield * remaining_fraction)
pub fn present_value(cd: &CdSpec, settlement: Date, market_yield: f64) -> f64 {
    let remaining_frac = cd.day_count.accrual_fraction(
        settlement, cd.maturity_date,
        settlement, cd.maturity_date,
    );

    match cd.cd_type {
        CdType::AddOn => {
            let mv = maturity_value(cd);
            mv / (1.0 + market_yield * remaining_frac)
        }
        CdType::Discount => {
            cd.face_value * (1.0 - market_yield * remaining_frac)
        }
    }
}

/// Discount yield: annualized return on a discount basis
/// = (face - price) / face * (360 / days_to_maturity)
pub fn discount_yield(cd: &CdSpec, settlement: Date, market_price: f64) -> f64 {
    let days = cd.maturity_date.days_since(&settlement) as f64;
    if days <= 0.0 { return 0.0; }
    (cd.face_value - market_price) / cd.face_value * (360.0 / days)
}

/// Bond-equivalent yield (BEY): converts money market yield to semiannual bond-equivalent
///
/// For instruments with <= 182 days to maturity:
///   BEY = (face - price) / price * (365 / days)
///
/// For instruments with > 182 days:
///   Uses the quadratic formula to solve for the semiannual yield
///   that equates the present value (semiannual compounding) to the price
pub fn bond_equivalent_yield(cd: &CdSpec, settlement: Date, market_price: f64) -> f64 {
    let days = cd.maturity_date.days_since(&settlement) as f64;
    if days <= 0.0 { return 0.0; }

    if days <= 182.0 {
        // Simple: (face/price - 1) * 365/days
        let mv = match cd.cd_type {
            CdType::AddOn => maturity_value(cd),
            CdType::Discount => cd.face_value,
        };
        (mv / market_price - 1.0) * (365.0 / days)
    } else {
        // Quadratic formula for semiannual BEY when > 182 days
        let mv = match cd.cd_type {
            CdType::AddOn => maturity_value(cd),
            CdType::Discount => cd.face_value,
        };
        let t = days / 365.0;
        // Newton-Raphson to find y such that mv / (1 + y*t) = price
        // Simple money market yield first, then adjust
        let mm_yield = (mv / market_price - 1.0) / t;
        // For BEY approximation: 2 * ((1 + mm_yield * t)^(1/(2*t)) - 1)
        let bey = 2.0 * ((1.0 + mm_yield * t).powf(1.0 / (2.0 * t)) - 1.0);
        bey
    }
}

/// Accrued interest on a CD at a given settlement date
/// = face_value * coupon_rate * accrual_fraction(issue, settlement)
pub fn accrued_interest(cd: &CdSpec, settlement: Date) -> f64 {
    if settlement <= cd.issue_date { return 0.0; }
    if settlement >= cd.maturity_date {
        return maturity_value(cd) - cd.face_value;
    }
    let frac = cd.day_count.accrual_fraction(
        cd.issue_date, settlement,
        cd.issue_date, cd.maturity_date,
    );
    cd.face_value * cd.coupon_rate * frac
}

/// Solve for the market yield that gives a target price
pub fn solve_yield(cd: &CdSpec, settlement: Date, target_price: f64) -> Result<f64, BondError> {
    let days = cd.maturity_date.days_since(&settlement) as f64;
    if days <= 0.0 {
        return Err(BondError::MaturedBond);
    }

    let remaining_frac = cd.day_count.accrual_fraction(
        settlement, cd.maturity_date,
        settlement, cd.maturity_date,
    );

    match cd.cd_type {
        CdType::AddOn => {
            let mv = maturity_value(cd);
            // target_price = mv / (1 + y * frac)
            // y = (mv/target_price - 1) / frac
            if remaining_frac == 0.0 {
                return Err(BondError::InvalidInput("zero remaining fraction".to_string()));
            }
            Ok((mv / target_price - 1.0) / remaining_frac)
        }
        CdType::Discount => {
            // target_price = face * (1 - y * frac)
            // y = (1 - target_price/face) / frac
            if remaining_frac == 0.0 {
                return Err(BondError::InvalidInput("zero remaining fraction".to_string()));
            }
            Ok((1.0 - target_price / cd.face_value) / remaining_frac)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    /// Helper: build an add-on CD
    fn addon_cd(face: f64, rate: f64, issue: Date, maturity: Date) -> CdSpec {
        CdSpec {
            face_value: face,
            coupon_rate: rate,
            day_count: DayCountConvention::Actual360,
            issue_date: issue,
            maturity_date: maturity,
            cd_type: CdType::AddOn,
        }
    }

    /// Helper: build a discount CD
    fn discount_cd(face: f64, rate: f64, issue: Date, maturity: Date) -> CdSpec {
        CdSpec {
            face_value: face,
            coupon_rate: rate,
            day_count: DayCountConvention::Actual360,
            issue_date: issue,
            maturity_date: maturity,
            cd_type: CdType::Discount,
        }
    }

    // ---------------------------------------------------------------
    // Add-on CD maturity value: face * (1 + r * t)
    // ---------------------------------------------------------------
    #[test]
    fn addon_maturity_value() {
        // 180-day CD, 5% coupon, $1M face
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let days = cd.maturity_date.days_since(&cd.issue_date) as f64;
        let expected = 1_000_000.0 * (1.0 + 0.05 * days / 360.0);
        let mv = maturity_value(&cd);
        assert!((mv - expected).abs() < 0.01,
            "maturity_value = {}, expected = {}", mv, expected);
    }

    // ---------------------------------------------------------------
    // Add-on CD present value at par rate: PV = face when
    // market_yield = coupon_rate and settlement = issue date
    // ---------------------------------------------------------------
    #[test]
    fn addon_pv_at_par_rate() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let pv = present_value(&cd, cd.issue_date, cd.coupon_rate);
        assert!((pv - 1_000_000.0).abs() < 0.01,
            "PV at par rate should equal face; got {}", pv);
    }

    // ---------------------------------------------------------------
    // Add-on CD yield round-trip: solve_yield(PV(cd, settle, y)) ~ y
    // ---------------------------------------------------------------
    #[test]
    fn addon_yield_round_trip() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let settle = d(2025, 3, 15); // 60 days after issue
        let target_yield = 0.045;
        let price = present_value(&cd, settle, target_yield);
        let solved = solve_yield(&cd, settle, price).unwrap();
        assert!((solved - target_yield).abs() < 1e-10,
            "round-trip yield = {}, expected = {}", solved, target_yield);
    }

    // ---------------------------------------------------------------
    // Discount CD: price < face, discount yield is positive
    // ---------------------------------------------------------------
    #[test]
    fn discount_cd_price_below_face() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 4, 15));
        let settle = d(2025, 1, 15);
        let price = present_value(&cd, settle, 0.05);
        assert!(price < cd.face_value,
            "discount CD price ({}) should be < face ({})", price, cd.face_value);
        let dy = discount_yield(&cd, settle, price);
        assert!(dy > 0.0, "discount yield should be positive; got {}", dy);
    }

    // ---------------------------------------------------------------
    // Discount yield: known example
    // face=1M, price=985k, 90 days => dy = (1M-985k)/1M * 360/90
    // ---------------------------------------------------------------
    #[test]
    fn discount_yield_known_example() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 4, 15));
        let settle = d(2025, 1, 15);
        let days = cd.maturity_date.days_since(&settle) as f64;
        let price = 985_000.0;
        let dy = discount_yield(&cd, settle, price);
        let expected = (1_000_000.0 - 985_000.0) / 1_000_000.0 * (360.0 / days);
        assert!((dy - expected).abs() < 1e-10,
            "discount yield = {}, expected = {}", dy, expected);
    }

    // ---------------------------------------------------------------
    // Bond-equivalent yield > discount yield (always, for same instrument)
    // ---------------------------------------------------------------
    #[test]
    fn bey_exceeds_discount_yield() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 4, 15));
        let settle = d(2025, 1, 15);
        let price = 985_000.0;
        let dy = discount_yield(&cd, settle, price);
        let bey = bond_equivalent_yield(&cd, settle, price);
        assert!(bey > dy,
            "BEY ({}) should exceed discount yield ({})", bey, dy);
    }

    // ---------------------------------------------------------------
    // Accrued interest: zero at issue, increases linearly, full at maturity
    // ---------------------------------------------------------------
    #[test]
    fn accrued_interest_at_issue_is_zero() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let ai = accrued_interest(&cd, cd.issue_date);
        assert!(ai.abs() < 1e-10,
            "accrued interest at issue should be 0; got {}", ai);
    }

    #[test]
    fn accrued_interest_before_issue_is_zero() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let ai = accrued_interest(&cd, d(2025, 1, 10));
        assert!(ai.abs() < 1e-10,
            "accrued interest before issue should be 0; got {}", ai);
    }

    #[test]
    fn accrued_interest_increases_linearly() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let ai_30 = accrued_interest(&cd, d(2025, 2, 14));
        let ai_60 = accrued_interest(&cd, d(2025, 3, 16));
        // Accrued interest should grow roughly proportional to elapsed days
        assert!(ai_60 > ai_30,
            "AI at 60 days ({}) should exceed AI at 30 days ({})", ai_60, ai_30);
        // Check the 30-day AI against the formula directly
        let days_30 = d(2025, 2, 14).days_since(&cd.issue_date) as f64;
        let expected_30 = 1_000_000.0 * 0.05 * days_30 / 360.0;
        assert!((ai_30 - expected_30).abs() < 0.01,
            "AI at 30 days = {}, expected = {}", ai_30, expected_30);
    }

    #[test]
    fn accrued_interest_full_at_maturity() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let ai_at_maturity = accrued_interest(&cd, cd.maturity_date);
        let expected = maturity_value(&cd) - cd.face_value;
        assert!((ai_at_maturity - expected).abs() < 0.01,
            "AI at maturity = {}, expected = {}", ai_at_maturity, expected);
    }

    // ---------------------------------------------------------------
    // Matured CD: solve_yield returns error
    // ---------------------------------------------------------------
    #[test]
    fn solve_yield_matured_cd_returns_error() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let result = solve_yield(&cd, d(2025, 8, 1), 1_000_000.0);
        assert!(result.is_err(), "solve_yield on matured CD should return error");
        assert_eq!(result.unwrap_err(), BondError::MaturedBond);
    }

    // ---------------------------------------------------------------
    // Short-term CD (30 days): verify correct Act/360 fraction
    // ---------------------------------------------------------------
    #[test]
    fn short_term_cd_30_days() {
        let issue = d(2025, 6, 1);
        let maturity = d(2025, 7, 1);
        let cd = addon_cd(100_000.0, 0.04, issue, maturity);
        let days = maturity.days_since(&issue) as f64;
        assert_eq!(days, 30.0, "June has 30 days");
        let frac = days / 360.0;
        let expected_mv = 100_000.0 * (1.0 + 0.04 * frac);
        let mv = maturity_value(&cd);
        assert!((mv - expected_mv).abs() < 0.01,
            "30-day CD maturity value = {}, expected = {}", mv, expected_mv);
        // Verify PV at par rate equals face
        let pv = present_value(&cd, issue, 0.04);
        assert!((pv - 100_000.0).abs() < 0.01,
            "30-day CD PV at par = {}", pv);
    }

    // ---------------------------------------------------------------
    // 1-year CD: verify Act/360 gives fraction > 1.0 (365/360)
    // ---------------------------------------------------------------
    #[test]
    fn one_year_cd_act360_fraction_gt_one() {
        let issue = d(2025, 1, 1);
        let maturity = d(2026, 1, 1);
        let cd = addon_cd(1_000_000.0, 0.05, issue, maturity);
        let days = maturity.days_since(&issue) as f64;
        assert_eq!(days, 365.0, "non-leap year has 365 days");
        let frac = days / 360.0;
        assert!(frac > 1.0,
            "Act/360 fraction for a full year should be > 1.0; got {}", frac);
        // Maturity value should reflect the >1.0 fraction
        let expected_mv = 1_000_000.0 * (1.0 + 0.05 * 365.0 / 360.0);
        let mv = maturity_value(&cd);
        assert!((mv - expected_mv).abs() < 0.01,
            "1-year CD maturity value = {}, expected = {}", mv, expected_mv);
    }

    // ---------------------------------------------------------------
    // Discount CD maturity value is always face
    // ---------------------------------------------------------------
    #[test]
    fn discount_cd_maturity_value_is_face() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 7, 14));
        let mv = maturity_value(&cd);
        assert!((mv - 1_000_000.0).abs() < 1e-10,
            "discount CD maturity value should equal face; got {}", mv);
    }

    // ---------------------------------------------------------------
    // Discount CD yield round-trip
    // ---------------------------------------------------------------
    #[test]
    fn discount_yield_round_trip() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 4, 15));
        let settle = d(2025, 1, 15);
        let target_yield = 0.05;
        let price = present_value(&cd, settle, target_yield);
        let solved = solve_yield(&cd, settle, price).unwrap();
        assert!((solved - target_yield).abs() < 1e-10,
            "discount round-trip yield = {}, expected = {}", solved, target_yield);
    }

    // ---------------------------------------------------------------
    // BEY for long-dated instrument (> 182 days)
    // ---------------------------------------------------------------
    #[test]
    fn bey_long_dated_positive() {
        // 270-day discount CD
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 10, 12));
        let settle = d(2025, 1, 15);
        let price = 965_000.0;
        let bey = bond_equivalent_yield(&cd, settle, price);
        assert!(bey > 0.0, "BEY should be positive; got {}", bey);
        // BEY should exceed discount yield for the same price
        let dy = discount_yield(&cd, settle, price);
        assert!(bey > dy, "BEY ({}) should exceed DY ({})", bey, dy);
    }

    // ---------------------------------------------------------------
    // BEY at maturity returns 0
    // ---------------------------------------------------------------
    #[test]
    fn bey_at_maturity_returns_zero() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 4, 15));
        let bey = bond_equivalent_yield(&cd, d(2025, 4, 15), 1_000_000.0);
        assert!(bey.abs() < 1e-10, "BEY at maturity should be 0; got {}", bey);
    }

    // ---------------------------------------------------------------
    // Discount yield at maturity returns 0
    // ---------------------------------------------------------------
    #[test]
    fn discount_yield_at_maturity_returns_zero() {
        let cd = discount_cd(1_000_000.0, 0.0, d(2025, 1, 15), d(2025, 4, 15));
        let dy = discount_yield(&cd, d(2025, 4, 15), 1_000_000.0);
        assert!(dy.abs() < 1e-10, "DY at maturity should be 0; got {}", dy);
    }

    // ---------------------------------------------------------------
    // Add-on CD with higher market yield => lower PV
    // ---------------------------------------------------------------
    #[test]
    fn addon_higher_yield_lower_price() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let settle = d(2025, 3, 15);
        let pv_low = present_value(&cd, settle, 0.03);
        let pv_high = present_value(&cd, settle, 0.07);
        assert!(pv_high < pv_low,
            "higher yield ({}) should give lower PV ({} vs {})", 0.07, pv_high, pv_low);
    }

    // ---------------------------------------------------------------
    // Solve yield at settlement == maturity returns MaturedBond error
    // ---------------------------------------------------------------
    #[test]
    fn solve_yield_at_maturity_returns_error() {
        let cd = addon_cd(1_000_000.0, 0.05, d(2025, 1, 15), d(2025, 7, 14));
        let result = solve_yield(&cd, d(2025, 7, 14), 1_000_000.0);
        // days_since returns 0, which triggers MaturedBond
        assert!(result.is_err());
    }
}
