pub fn market_value(clean_price: f64, quantity: f64) -> f64 {
    clean_price / 100.0 * quantity
}

pub fn profit_loss(market_val: f64, cost_basis: f64, quantity: f64) -> f64 {
    market_val - cost_basis / 100.0 * quantity
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn par_bond() { assert!((market_value(100.0, 10000.0) - 10000.0).abs() < 1e-10); }

    #[test]
    fn discount_bond() { assert!((market_value(95.0, 20000.0) - 19000.0).abs() < 1e-10); }
}
