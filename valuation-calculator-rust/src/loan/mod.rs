use crate::date::Date;
use crate::daycount::DayCountConvention;

pub mod cashflows;
pub mod pricing;

/// Specification for a vanilla bank loan (floating-rate, typically SOFR + spread).
#[derive(Debug, Clone)]
pub struct LoanSpec {
    pub face_value: f64,
    /// Spread over the reference rate, in decimal (e.g., 0.025 = 250bps).
    pub spread: f64,
    /// Number of payments per year (typically 4 for quarterly).
    pub payment_freq: u32,
    /// Day count convention (typically Actual360 for bank loans).
    pub day_count: DayCountConvention,
    /// The dated date (origination / first accrual date).
    pub dated_date: Date,
    /// The maturity date.
    pub maturity_date: Date,
    /// Amortization schedule.
    pub amortization: AmortizationType,
}

/// Amortization type for a loan.
#[derive(Debug, Clone)]
pub enum AmortizationType {
    /// No amortization; full principal repaid at maturity.
    Bullet,
    /// Scheduled principal payments as fractions of the original face value.
    Scheduled(Vec<AmortizationEntry>),
}

/// A single scheduled principal repayment.
#[derive(Debug, Clone)]
pub struct AmortizationEntry {
    /// Date of the principal repayment.
    pub date: Date,
    /// Fraction of the original face value repaid (e.g., 0.01 = 1%).
    pub principal_fraction: f64,
}
