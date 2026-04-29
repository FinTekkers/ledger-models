use crate::date::Date;
use super::MoneyMarketSpec;

/// Price from discount rate (the way T-Bills are quoted at auction).
/// price = face * (1 - discount_rate * days/360)
pub fn price_from_discount_rate(spec: &MoneyMarketSpec, settlement: Date, discount_rate: f64) -> f64 {
    let days = spec.maturity_date.days_since(&settlement) as f64;
    spec.face_value * (1.0 - discount_rate * days / 360.0)
}

/// Price from money market yield (add-on yield, Act/360).
/// price = face / (1 + mm_yield * days/360)
pub fn price_from_mm_yield(spec: &MoneyMarketSpec, settlement: Date, mm_yield: f64) -> f64 {
    let days = spec.maturity_date.days_since(&settlement) as f64;
    spec.face_value / (1.0 + mm_yield * days / 360.0)
}

/// Holding period return (simple, not annualized).
/// HPR = (face - price) / price
pub fn holding_period_return(price: f64, face: f64) -> f64 {
    (face - price) / price
}

/// Dollar discount: face - price
pub fn dollar_discount(price: f64, face: f64) -> f64 {
    face - price
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::date::Date;
    use crate::daycount::DayCountConvention;
    use crate::money_market::{MoneyMarketSpec, MoneyMarketType};

    fn tbill_spec(face: f64, issue: Date, maturity: Date) -> MoneyMarketSpec {
        MoneyMarketSpec {
            face_value: face,
            issue_date: issue,
            maturity_date: maturity,
            instrument_type: MoneyMarketType::TBill,
            day_count: DayCountConvention::Actual360,
        }
    }

    #[test]
    fn test_price_from_discount_rate() {
        // 5% discount rate, 90 days, face=100
        // price = 100 * (1 - 0.05 * 90/360) = 100 * (1 - 0.0125) = 98.75
        let spec = tbill_spec(
            100.0,
            Date::new(2025, 1, 1),
            Date::new(2025, 4, 1), // 90 days from settlement
        );
        let settlement = Date::new(2025, 1, 1);
        let price = price_from_discount_rate(&spec, settlement, 0.05);
        assert!((price - 98.75).abs() < 1e-10);
    }

    #[test]
    fn test_price_from_mm_yield_roundtrip() {
        // First compute price from discount rate, then convert to mm yield,
        // then verify price_from_mm_yield gives the same price.
        let spec = tbill_spec(
            100.0,
            Date::new(2025, 1, 1),
            Date::new(2025, 4, 1),
        );
        let settlement = Date::new(2025, 1, 1);
        let dr = 0.05;
        let price = price_from_discount_rate(&spec, settlement, dr);
        let days = 90;
        let mm = crate::money_market::quotes::discount_to_mm_yield(dr, days);
        let price2 = price_from_mm_yield(&spec, settlement, mm);
        assert!((price - price2).abs() < 1e-10);
    }

    #[test]
    fn test_holding_period_return() {
        // Buy at 98.75, receive 100
        // HPR = (100 - 98.75) / 98.75 = 1.25 / 98.75 = 0.012658...
        let hpr = holding_period_return(98.75, 100.0);
        assert!((hpr - 0.012658227848101266).abs() < 1e-10);
    }

    #[test]
    fn test_dollar_discount() {
        // 100 - 98.75 = 1.25
        let dd = dollar_discount(98.75, 100.0);
        assert!((dd - 1.25).abs() < 1e-10);
    }
}
