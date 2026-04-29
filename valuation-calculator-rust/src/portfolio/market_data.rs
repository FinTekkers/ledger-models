use std::collections::HashMap;
use crate::curve::YieldCurve;
use crate::date::Date;

/// A snapshot of market data at a single valuation date.
///
/// Contains yield curves, FX rates, and inflation indices
/// needed to price a portfolio of instruments.
#[derive(Debug, Clone)]
pub struct MarketDataSnapshot {
    pub valuation_date: Date,
    pub curves: HashMap<String, YieldCurve>,
    pub fx_rates: HashMap<String, f64>,
    pub inflation: HashMap<String, f64>,
}

impl MarketDataSnapshot {
    /// Create an empty snapshot for the given valuation date.
    pub fn new(valuation_date: Date) -> Self {
        MarketDataSnapshot {
            valuation_date,
            curves: HashMap::new(),
            fx_rates: HashMap::new(),
            inflation: HashMap::new(),
        }
    }

    /// Add a named yield curve.
    pub fn add_curve(&mut self, name: &str, curve: YieldCurve) {
        self.curves.insert(name.to_string(), curve);
    }

    /// Look up a yield curve by name.
    pub fn get_curve(&self, name: &str) -> Option<&YieldCurve> {
        self.curves.get(name)
    }

    /// Add an FX rate for a currency pair (e.g. "EURUSD").
    pub fn add_fx_rate(&mut self, pair: &str, rate: f64) {
        self.fx_rates.insert(pair.to_string(), rate);
    }

    /// Look up an FX rate by currency pair.
    pub fn get_fx_rate(&self, pair: &str) -> Option<f64> {
        self.fx_rates.get(pair).copied()
    }

    /// Add an inflation index value (e.g. "CPI-U").
    pub fn add_inflation(&mut self, index: &str, value: f64) {
        self.inflation.insert(index.to_string(), value);
    }

    /// Look up an inflation index value.
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

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(ref_date, vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0], vec![rate; 6]).unwrap()
    }

    #[test]
    fn add_get_curve_round_trip() {
        let date = d(2025, 6, 15);
        let mut md = MarketDataSnapshot::new(date);
        let curve = flat_curve(date, 0.04);
        md.add_curve("UST", curve.clone());

        let retrieved = md.get_curve("UST").unwrap();
        assert_eq!(retrieved.tenors(), curve.tenors());
        assert_eq!(retrieved.zero_rates(), curve.zero_rates());
    }

    #[test]
    fn missing_curve_returns_none() {
        let md = MarketDataSnapshot::new(d(2025, 6, 15));
        assert!(md.get_curve("NonExistent").is_none());
    }

    #[test]
    fn add_get_fx_rate() {
        let mut md = MarketDataSnapshot::new(d(2025, 6, 15));
        md.add_fx_rate("EURUSD", 1.08);
        assert_eq!(md.get_fx_rate("EURUSD"), Some(1.08));
        assert_eq!(md.get_fx_rate("GBPUSD"), None);
    }

    #[test]
    fn add_get_inflation() {
        let mut md = MarketDataSnapshot::new(d(2025, 6, 15));
        md.add_inflation("CPI-U", 303.5);
        assert_eq!(md.get_inflation("CPI-U"), Some(303.5));
        assert_eq!(md.get_inflation("HICP"), None);
    }

    #[test]
    fn overwrite_curve() {
        let date = d(2025, 6, 15);
        let mut md = MarketDataSnapshot::new(date);
        md.add_curve("UST", flat_curve(date, 0.03));
        md.add_curve("UST", flat_curve(date, 0.05));

        let retrieved = md.get_curve("UST").unwrap();
        // Should have the second curve's rates
        assert!((retrieved.zero_rate(1.0) - 0.05).abs() < 1e-12);
    }
}
