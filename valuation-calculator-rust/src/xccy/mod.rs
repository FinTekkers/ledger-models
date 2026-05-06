use crate::date::Date;
use crate::daycount::DayCountConvention;

pub mod pricing;

/// Specification for a cross-currency swap.
///
/// A cross-currency swap exchanges cashflows in two different currencies.
/// The most common type: pay fixed in one currency, receive fixed in another,
/// with notional exchange at start and end.
#[derive(Debug, Clone)]
pub struct XccySwapSpec {
    /// Notional principal in the domestic currency (e.g., 10M USD).
    pub domestic_notional: f64,
    /// Notional principal in the foreign currency (e.g., 9M EUR at initial FX rate).
    pub foreign_notional: f64,
    /// Fixed rate on the domestic leg (decimal, e.g. 0.04 for 4%).
    pub domestic_fixed_rate: f64,
    /// Fixed rate on the foreign leg (decimal, e.g. 0.03 for 3%).
    pub foreign_fixed_rate: f64,
    /// Payment frequency for the domestic leg (payments per year).
    pub domestic_freq: u32,
    /// Payment frequency for the foreign leg (payments per year).
    pub foreign_freq: u32,
    /// Day count convention for the domestic leg.
    pub domestic_day_count: DayCountConvention,
    /// Day count convention for the foreign leg.
    pub foreign_day_count: DayCountConvention,
    /// Effective (start) date of the swap.
    pub start_date: Date,
    /// Maturity date of the swap.
    pub maturity_date: Date,
    /// Whether notionals are exchanged at start and end (true for standard XCCY).
    pub exchange_notional: bool,
    /// Cross-currency basis spread added to the foreign leg's fixed rate.
    pub basis_spread: f64,
}
