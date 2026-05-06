use crate::date::Date;
use crate::daycount::DayCountConvention;

pub mod pricing;

#[derive(Debug, Clone)]
pub struct CdSpec {
    pub face_value: f64,
    pub coupon_rate: f64,         // annual rate, decimal (e.g., 0.05 = 5%)
    pub day_count: DayCountConvention,  // typically Actual360
    pub issue_date: Date,
    pub maturity_date: Date,
    pub cd_type: CdType,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CdType {
    AddOn,     // pay face, receive face + interest
    Discount,  // pay less than face, receive face (T-bill style)
}
