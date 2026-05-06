/// Discount rate (bank discount yield): how T-Bills are quoted at auction.
/// dr = (face - price) / face * (360 / days)
pub fn discount_rate(price: f64, face: f64, days: u32) -> f64 {
    (face - price) / face * (360.0 / days as f64)
}

/// Money market yield (CD-equivalent yield): add-on yield on Act/360 basis.
/// mm = (face - price) / price * (360 / days)
/// Note: mm > dr always (denominator is price < face)
pub fn money_market_yield(price: f64, face: f64, days: u32) -> f64 {
    (face - price) / price * (360.0 / days as f64)
}

/// Bond-equivalent yield (BEY): annualized yield on Act/365 basis, semiannual compounding.
///
/// For <= 182 days:
///   BEY = (face - price) / price * (365 / days)
///
/// For > 182 days (crosses a semiannual boundary):
///   Solve the quadratic:
///   BEY = [-2*days/365 + 2*sqrt((days/365)^2 + (2*days/365 - 1)*(face/price - 1))] / (2*days/365 - 1)
pub fn bond_equivalent_yield(price: f64, face: f64, days: u32) -> f64 {
    let d = days as f64;
    if d <= 182.0 {
        (face - price) / price * (365.0 / d)
    } else {
        let t = d / 365.0;
        let term1 = -t;
        let term2_inner = t * t + (2.0 * t - 1.0) * (face / price - 1.0);
        if term2_inner < 0.0 {
            return 0.0;
        }
        let term2 = term2_inner.sqrt();
        let denom = 2.0 * t - 1.0;
        if denom.abs() < 1e-15 {
            return (face / price - 1.0) / t;
        }
        2.0 * (term1 + term2) / denom
    }
}

/// Convert discount rate to money market yield.
/// mm = dr * 360 / (360 - dr * days)
pub fn discount_to_mm_yield(discount_rate: f64, days: u32) -> f64 {
    let d = days as f64;
    let denom = 360.0 - discount_rate * d;
    if denom <= 0.0 {
        return f64::INFINITY;
    }
    discount_rate * 360.0 / denom
}

/// Convert discount rate to bond-equivalent yield.
pub fn discount_to_bey(discount_rate: f64, days: u32) -> f64 {
    let price = 1.0 - discount_rate * days as f64 / 360.0;
    bond_equivalent_yield(price, 1.0, days)
}

/// Convert money market yield to discount rate.
/// dr = mm * 360 / (360 + mm * days)
pub fn mm_yield_to_discount(mm_yield: f64, days: u32) -> f64 {
    let d = days as f64;
    mm_yield * 360.0 / (360.0 + mm_yield * d)
}

/// True yield (effective annual yield, 365-day basis with compounding).
/// EAY = (face/price)^(365/days) - 1
pub fn effective_annual_yield(price: f64, face: f64, days: u32) -> f64 {
    let d = days as f64;
    (face / price).powf(365.0 / d) - 1.0
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- Basic T-Bill example: face=100, price=98.75, 90 days ---

    #[test]
    fn test_discount_rate() {
        // dr = (100 - 98.75) / 100 * (360 / 90) = 0.0125 * 4 = 0.05
        let dr = discount_rate(98.75, 100.0, 90);
        assert!((dr - 0.05).abs() < 1e-10);
    }

    #[test]
    fn test_mm_yield_greater_than_dr() {
        let dr = discount_rate(98.75, 100.0, 90);
        let mm = money_market_yield(98.75, 100.0, 90);
        assert!(mm > dr, "MM yield ({}) should be > discount rate ({})", mm, dr);
    }

    #[test]
    fn test_bey_greater_than_mm() {
        let mm = money_market_yield(98.75, 100.0, 90);
        let bey = bond_equivalent_yield(98.75, 100.0, 90);
        assert!(bey > mm, "BEY ({}) should be > MM yield ({})", bey, mm);
    }

    #[test]
    fn test_bey_short_term() {
        // BEY for <= 182 days: (100 - 98.75) / 98.75 * (365 / 90)
        let bey = bond_equivalent_yield(98.75, 100.0, 90);
        let expected = 1.25 / 98.75 * (365.0 / 90.0);
        assert!((bey - expected).abs() < 1e-10);
    }

    #[test]
    fn test_bey_long_term_quadratic() {
        // 26-week bill (182+ days), e.g. 200 days, discount rate 5%
        let days: u32 = 200;
        let dr = 0.05;
        let price = 100.0 * (1.0 - dr * days as f64 / 360.0);
        let bey = bond_equivalent_yield(price, 100.0, days);

        // BEY should be positive and reasonable
        assert!(bey > 0.0, "BEY should be positive");
        assert!(bey < 0.10, "BEY should be reasonable (< 10%)");

        // BEY should be higher than the simple (short-term) formula would give
        let simple_bey = (100.0 - price) / price * (365.0 / days as f64);
        // For long-term bills, the quadratic BEY accounts for compounding
        // and should be close to but slightly different from the simple formula
        assert!((bey - simple_bey).abs() < 0.01);
    }

    #[test]
    fn test_conversion_roundtrip_dr_mm() {
        // dr -> mm -> dr
        let dr_orig = 0.05;
        let days = 90;
        let mm = discount_to_mm_yield(dr_orig, days);
        let dr_back = mm_yield_to_discount(mm, days);
        assert!((dr_orig - dr_back).abs() < 1e-10);
    }

    #[test]
    fn test_conversion_roundtrip_mm_dr() {
        // mm -> dr -> mm
        let mm_orig = 0.0512;
        let days = 91;
        let dr = mm_yield_to_discount(mm_orig, days);
        let mm_back = discount_to_mm_yield(dr, days);
        assert!((mm_orig - mm_back).abs() < 1e-10);
    }

    #[test]
    fn test_discount_to_bey_consistency() {
        // discount_to_bey should give the same result as computing price then BEY
        let dr = 0.05;
        let days: u32 = 90;
        let bey_via_conversion = discount_to_bey(dr, days);

        let price = 100.0 * (1.0 - dr * days as f64 / 360.0);
        let bey_via_price = bond_equivalent_yield(price, 100.0, days);

        assert!((bey_via_conversion - bey_via_price).abs() < 1e-10);
    }

    #[test]
    fn test_effective_annual_yield() {
        // EAY = (100/98.75)^(365/90) - 1
        let eay = effective_annual_yield(98.75, 100.0, 90);
        let expected = (100.0_f64 / 98.75).powf(365.0 / 90.0) - 1.0;
        assert!((eay - expected).abs() < 1e-10);
    }

    #[test]
    fn test_yield_ordering() {
        // For any discount instrument: EAY > BEY > MM > DR
        let price = 98.75;
        let face = 100.0;
        let days = 90;

        let dr = discount_rate(price, face, days);
        let mm = money_market_yield(price, face, days);
        let bey = bond_equivalent_yield(price, face, days);
        let eay = effective_annual_yield(price, face, days);

        assert!(
            eay > bey && bey > mm && mm > dr,
            "Expected EAY ({}) > BEY ({}) > MM ({}) > DR ({})",
            eay, bey, mm, dr
        );
    }

    #[test]
    fn test_edge_case_1_day_bill() {
        // 1-day bill: extreme short term
        let face = 100.0;
        let dr = 0.05;
        let days: u32 = 1;
        let price = face * (1.0 - dr * days as f64 / 360.0);

        let dr_calc = discount_rate(price, face, days);
        assert!((dr_calc - dr).abs() < 1e-10);

        let mm = money_market_yield(price, face, days);
        assert!(mm > dr);

        let bey = bond_equivalent_yield(price, face, days);
        assert!(bey > mm);
    }

    #[test]
    fn test_edge_case_364_day_bill() {
        // 364-day bill (longest T-Bill tenor)
        let face = 100.0;
        let dr = 0.05;
        let days: u32 = 364;
        let price = face * (1.0 - dr * days as f64 / 360.0);

        let dr_calc = discount_rate(price, face, days);
        assert!((dr_calc - dr).abs() < 1e-10);

        // Should use quadratic formula since days > 182
        let bey = bond_equivalent_yield(price, face, days);
        assert!(bey > 0.0);

        // Yield ordering still holds
        let mm = money_market_yield(price, face, days);
        let eay = effective_annual_yield(price, face, days);
        assert!(
            eay > bey && bey > mm && mm > dr,
            "Ordering failed for 364-day: EAY ({}) > BEY ({}) > MM ({}) > DR ({})",
            eay, bey, mm, dr
        );
    }

    #[test]
    fn test_known_13_week_tbill() {
        // 13-week (91 days), discount rate 5.25%
        let face = 100.0;
        let days: u32 = 91;
        let dr = 0.0525;
        let price = face * (1.0 - dr * days as f64 / 360.0);

        // Verify price
        let expected_price = 100.0 * (1.0 - 0.0525 * 91.0 / 360.0);
        assert!((price - expected_price).abs() < 1e-10);

        // Verify discount rate round-trip
        let dr_calc = discount_rate(price, face, days);
        assert!((dr_calc - dr).abs() < 1e-10);

        // Verify all yields are computed and ordered correctly
        let mm = money_market_yield(price, face, days);
        let bey = bond_equivalent_yield(price, face, days);
        let eay = effective_annual_yield(price, face, days);

        assert!(mm > dr, "MM ({}) > DR ({})", mm, dr);
        assert!(bey > mm, "BEY ({}) > MM ({})", bey, mm);
        assert!(eay > bey, "EAY ({}) > BEY ({})", eay, bey);

        // Verify mm via conversion formula
        let mm_via_conv = discount_to_mm_yield(dr, days);
        assert!((mm - mm_via_conv).abs() < 1e-10);
    }

    #[test]
    fn test_commercial_paper_same_math() {
        // Commercial paper uses the same pricing math as T-Bills.
        // Verify by computing with CP instrument type.
        use crate::date::Date;
        use crate::daycount::DayCountConvention;
        use crate::money_market::{MoneyMarketSpec, MoneyMarketType};
        use crate::money_market::pricing;

        let cp = MoneyMarketSpec {
            face_value: 1_000_000.0,
            issue_date: Date::new(2025, 1, 15),
            maturity_date: Date::new(2025, 4, 15),
            instrument_type: MoneyMarketType::CommercialPaper,
            day_count: DayCountConvention::Actual360,
        };
        let settlement = Date::new(2025, 1, 15);
        let days = cp.maturity_date.days_since(&settlement) as u32;

        let dr = 0.055; // 5.5% discount rate
        let price = pricing::price_from_discount_rate(&cp, settlement, dr);
        let expected = 1_000_000.0 * (1.0 - 0.055 * days as f64 / 360.0);
        assert!((price - expected).abs() < 1e-6);

        // Verify yield ordering still holds for CP
        let dr_calc = discount_rate(price, cp.face_value, days);
        let mm = money_market_yield(price, cp.face_value, days);
        let bey = bond_equivalent_yield(price, cp.face_value, days);
        let eay = effective_annual_yield(price, cp.face_value, days);

        assert!((dr_calc - dr).abs() < 1e-10);
        assert!(eay > bey && bey > mm && mm > dr_calc);
    }

    #[test]
    fn test_discount_to_mm_yield_extreme() {
        // When dr * days >= 360, price would be zero or negative
        // denom = 360 - dr * days <= 0 => return INFINITY
        let mm = discount_to_mm_yield(1.0, 360);
        assert!(mm.is_infinite());
    }

    #[test]
    fn test_bey_quadratic_negative_inner() {
        // Edge case: if term2_inner < 0, return 0
        // This would require face/price < 1, i.e. price > face (premium)
        // which is non-physical for discount instruments but we handle it gracefully
        let bey = bond_equivalent_yield(110.0, 100.0, 200);
        assert_eq!(bey, 0.0);
    }
}
