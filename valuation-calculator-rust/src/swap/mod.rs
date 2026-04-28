use crate::date::Date;
use crate::daycount::DayCountConvention;

pub mod cashflows;
pub mod pricing;

/// Specification for a vanilla interest rate swap.
#[derive(Debug, Clone)]
pub struct SwapSpec {
    /// Notional principal amount.
    pub notional: f64,
    /// Annual fixed rate (decimal, e.g. 0.05 for 5%).
    pub fixed_rate: f64,
    /// Fixed-leg payment frequency (payments per year, typically 2 for USD).
    pub fixed_freq: u32,
    /// Day count convention for the fixed leg (typically 30/360 for USD).
    pub fixed_day_count: DayCountConvention,
    /// Floating-leg payment frequency (payments per year, typically 4 for SOFR).
    pub float_freq: u32,
    /// Day count convention for the floating leg (typically Act/360 for USD).
    pub float_day_count: DayCountConvention,
    /// Effective (start) date of the swap.
    pub start_date: Date,
    /// Maturity date of the swap.
    pub maturity_date: Date,
    /// Spread over the reference rate on the floating leg (usually 0).
    pub float_spread: f64,
}

/// Direction of the swap from our perspective.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SwapDirection {
    /// Pay fixed rate, receive floating rate.
    PayFixed,
    /// Receive fixed rate, pay floating rate.
    ReceiveFixed,
}
