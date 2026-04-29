use crate::date::Date;
use crate::daycount::DayCountConvention;

pub mod cashflows;
pub mod pricing;

#[derive(Debug, Clone)]
pub struct AmortizingBondSpec {
    pub coupon_rate: f64,
    pub coupon_freq: u32,          // payments per year
    pub face_value: f64,           // original face value
    pub dated_date: Date,
    pub maturity_date: Date,
    pub day_count: DayCountConvention,
    pub schedule: SinkingSchedule,
}

#[derive(Debug, Clone)]
pub enum SinkingSchedule {
    /// Level principal: equal principal payments each period
    LevelPrincipal,

    /// Level payment: equal total (P+I) payments (like a mortgage)
    LevelPayment,

    /// Custom schedule: specific amounts on specific dates
    Custom(Vec<SinkingEntry>),

    /// Pro-rata: a fixed percentage of original face per period
    ProRata(f64), // fraction per period (e.g., 0.05 = 5% per period)
}

#[derive(Debug, Clone)]
pub struct SinkingEntry {
    pub date: Date,
    pub principal_amount: f64, // dollar amount of principal retired
}
