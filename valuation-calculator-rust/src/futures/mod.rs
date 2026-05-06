use crate::date::Date;

pub mod conversion_factor;
pub mod pricing;
pub mod convexity_adjustment;

/// A standardized bond futures contract (e.g., US Treasury bond/note futures).
#[derive(Debug, Clone)]
pub struct FuturesContract {
    /// Notional amount per contract (e.g., 100_000 for T-bond futures).
    pub contract_size: f64,
    /// Last trading date of the contract.
    pub expiry_date: Date,
    /// First delivery date of the contract.
    pub delivery_date: Date,
    /// Minimum price increment (e.g., 1/32 = 0.03125 for T-bond futures).
    pub tick_size: f64,
    /// Dollar value per tick (e.g., 31.25 for T-bond futures).
    pub tick_value: f64,
}
