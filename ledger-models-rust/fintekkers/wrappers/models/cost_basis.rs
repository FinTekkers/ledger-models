use rust_decimal::{Decimal, RoundingStrategy};

/// Decimal places of the result. Same in Java, Python and JS; see
/// docs/adr/measure_semantics_and_purchase_price.md.
const SCALE: u32 = 12;

/// Quantity-weighted mean price of the buys in `fills`. Sells never change it.
///
/// Each fill is `(directed_quantity, price)`. A buy has directed_quantity > 0;
/// sells, short sales and zero-quantity fills are skipped. The result is
/// sum(quantity * price) / sum(quantity) over the buys, rounded to 12 decimal
/// places half-even with trailing zeros removed. Returns `None` when there are
/// no buys; it never divides by zero.
///
/// Not the same as Java's `TaxLotSummary.getAverageCostBasis`, which nets sells.
pub fn weighted_average_purchase_price(fills: &[(Decimal, Decimal)]) -> Option<Decimal> {
    let (quantity, total_cost) = fills
        .iter()
        .filter(|(directed_quantity, _)| *directed_quantity > Decimal::ZERO)
        .fold((Decimal::ZERO, Decimal::ZERO), |(quantity, total_cost), (directed_quantity, price)| {
            (quantity + directed_quantity, total_cost + directed_quantity * price)
        });

    if quantity.is_zero() {
        return None;
    }

    Some(
        (total_cost / quantity)
            .round_dp_with_strategy(SCALE, RoundingStrategy::MidpointNearestEven)
            .normalize(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn sells_do_not_change_the_buys_only_average() {
        let fills = [(dec!(100), dec!(10)), (dec!(100), dec!(20)), (dec!(-50), dec!(25))];

        let result = weighted_average_purchase_price(&fills).unwrap();

        assert_eq!(result, dec!(15));
        assert_eq!(result.to_string(), "15");
    }

    #[test]
    fn no_buys_returns_none() {
        assert_eq!(weighted_average_purchase_price(&[(dec!(-50), dec!(25))]), None);
    }

    #[test]
    fn repeating_result_rounds_to_12_places_half_even() {
        let fills = [(dec!(1), dec!(1)), (dec!(2), dec!(2))];

        let result = weighted_average_purchase_price(&fills).unwrap();

        assert_eq!(result.to_string(), "1.666666666667");
    }
}
