use std::collections::HashMap;
use crate::curve::YieldCurve;
use crate::date::Date;

#[derive(Debug, Clone)]
pub struct MarketDataSnapshot {
    pub valuation_date: Date,
    pub curves: HashMap<String, YieldCurve>,
    pub fx_rates: HashMap<String, f64>,
    pub inflation: HashMap<String, f64>,
}

impl MarketDataSnapshot {
    pub fn new(valuation_date: Date) -> Self {
        MarketDataSnapshot {
            valuation_date,
            curves: HashMap::new(),
            fx_rates: HashMap::new(),
            inflation: HashMap::new(),
        }
    }

    pub fn add_curve(&mut self, name: &str, curve: YieldCurve) {
        self.curves.insert(name.to_string(), curve);
    }

    pub fn add_fx_rate(&mut self, pair: &str, rate: f64) {
        self.fx_rates.insert(pair.to_string(), rate);
    }

    pub fn add_inflation(&mut self, index: &str, value: f64) {
        self.inflation.insert(index.to_string(), value);
    }

    pub fn get_curve(&self, name: &str) -> Option<&YieldCurve> {
        self.curves.get(name)
    }

    pub fn get_fx_rate(&self, pair: &str) -> Option<f64> {
        self.fx_rates.get(pair).copied()
    }

    pub fn get_inflation(&self, index: &str) -> Option<f64> {
        self.inflation.get(index).copied()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn flat_curve(rate: f64) -> YieldCurve {
        YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    #[test]
    fn add_and_get_curve_round_trip() {
        let mut snap = MarketDataSnapshot::new(d(2025, 6, 15));
        let curve = flat_curve(0.04);
        snap.add_curve("USD_TREASURY", curve.clone());

        let retrieved = snap.get_curve("USD_TREASURY").unwrap();
        assert_eq!(retrieved.zero_rate(1.0), curve.zero_rate(1.0));
    }

    #[test]
    fn add_multiple_curves() {
        let mut snap = MarketDataSnapshot::new(d(2025, 6, 15));
        snap.add_curve("USD_TREASURY", flat_curve(0.04));
        snap.add_curve("USD_SOFR", flat_curve(0.045));
        snap.add_curve("EUR_BUND", flat_curve(0.025));

        assert!(snap.get_curve("USD_TREASURY").is_some());
        assert!(snap.get_curve("USD_SOFR").is_some());
        assert!(snap.get_curve("EUR_BUND").is_some());
        // Different rates
        assert!(
            (snap.get_curve("USD_TREASURY").unwrap().zero_rate(1.0) - 0.04).abs() < 1e-12
        );
        assert!(
            (snap.get_curve("USD_SOFR").unwrap().zero_rate(1.0) - 0.045).abs() < 1e-12
        );
    }

    #[test]
    fn missing_curve_returns_none() {
        let snap = MarketDataSnapshot::new(d(2025, 6, 15));
        assert!(snap.get_curve("NONEXISTENT").is_none());
    }

    #[test]
    fn add_and_get_fx_rate_round_trip() {
        let mut snap = MarketDataSnapshot::new(d(2025, 6, 15));
        snap.add_fx_rate("EUR/USD", 1.0850);
        snap.add_fx_rate("GBP/USD", 1.2700);

        assert!((snap.get_fx_rate("EUR/USD").unwrap() - 1.0850).abs() < 1e-12);
        assert!((snap.get_fx_rate("GBP/USD").unwrap() - 1.2700).abs() < 1e-12);
    }

    #[test]
    fn missing_fx_rate_returns_none() {
        let snap = MarketDataSnapshot::new(d(2025, 6, 15));
        assert!(snap.get_fx_rate("JPY/USD").is_none());
    }

    #[test]
    fn add_and_get_inflation_round_trip() {
        let mut snap = MarketDataSnapshot::new(d(2025, 6, 15));
        snap.add_inflation("CPI_U", 315.6);

        assert!((snap.get_inflation("CPI_U").unwrap() - 315.6).abs() < 1e-12);
    }

    #[test]
    fn missing_inflation_returns_none() {
        let snap = MarketDataSnapshot::new(d(2025, 6, 15));
        assert!(snap.get_inflation("CPI_U").is_none());
    }

    #[test]
    fn overwrite_curve_replaces_old() {
        let mut snap = MarketDataSnapshot::new(d(2025, 6, 15));
        snap.add_curve("USD_TREASURY", flat_curve(0.04));
        snap.add_curve("USD_TREASURY", flat_curve(0.05));

        let rate = snap.get_curve("USD_TREASURY").unwrap().zero_rate(1.0);
        assert!((rate - 0.05).abs() < 1e-12);
    }

    #[test]
    fn valuation_date_stored() {
        let snap = MarketDataSnapshot::new(d(2025, 3, 15));
        assert_eq!(snap.valuation_date, d(2025, 3, 15));
    }
}
