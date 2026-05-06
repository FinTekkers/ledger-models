pub mod tax_equivalent;

use crate::bond::BondSpec;
use crate::callable::CallDate;

/// Specification for a municipal bond.
///
/// Munis mechanically price like other bonds — the unique analytics are
/// tax-related. Most munis are callable, so the spec includes a call schedule
/// that can be fed into the callable module for yield-to-worst analysis.
#[derive(Debug, Clone)]
pub struct MuniSpec {
    pub bond: BondSpec,
    pub call_schedule: Vec<CallDate>, // most munis are callable
    pub is_amt_subject: bool,         // subject to Alternative Minimum Tax?
    pub state: Option<String>,        // state of issuance (for state tax exemption)
}

/// Marginal tax rates for an investor, used to compute tax-equivalent yield
/// and other muni-specific analytics.
#[derive(Debug, Clone)]
pub struct TaxRates {
    pub federal_rate: f64,      // marginal federal tax rate (e.g., 0.37)
    pub state_rate: f64,        // marginal state tax rate (e.g., 0.09)
    pub local_rate: f64,        // marginal local/city tax rate (e.g., 0.038)
    pub agi_surcharge: f64,     // ACA surcharge on investment income (0.038)
    pub state_deductible: bool, // can state taxes be deducted from federal?
}

impl TaxRates {
    /// Common presets

    /// Top federal rate only (no state/local).
    pub fn top_federal() -> Self {
        TaxRates {
            federal_rate: 0.37,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.038,
            state_deductible: false,
        }
    }

    /// Top combined rate for a New York City resident.
    pub fn new_york_top() -> Self {
        TaxRates {
            federal_rate: 0.37,
            state_rate: 0.109,  // NY state + city combined approx
            local_rate: 0.038,
            agi_surcharge: 0.038,
            state_deductible: false, // SALT cap makes this effectively false
        }
    }

    /// Top combined rate for a California resident.
    pub fn california_top() -> Self {
        TaxRates {
            federal_rate: 0.37,
            state_rate: 0.133,
            local_rate: 0.0,
            agi_surcharge: 0.038,
            state_deductible: false,
        }
    }
}
