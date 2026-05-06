use crate::date::Date;
use crate::daycount::DayCountConvention;

pub mod pricing;
pub mod quotes;

#[derive(Debug, Clone)]
pub struct MoneyMarketSpec {
    pub face_value: f64,
    pub issue_date: Date,
    pub maturity_date: Date,
    pub instrument_type: MoneyMarketType,
    pub day_count: DayCountConvention,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MoneyMarketType {
    TBill,
    CommercialPaper,
    BankersAcceptance,
}
