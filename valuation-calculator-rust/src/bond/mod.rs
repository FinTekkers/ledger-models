pub mod cashflows;
pub mod accrued_interest;
pub mod pricing;
pub mod ytm_solver;
pub mod current_yield;
pub mod duration;
pub mod convexity;
pub mod dv01;
pub mod market_value;

use crate::date::Date;
use crate::daycount::DayCountConvention;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CouponType {
    Fixed,
    Zero,
}

#[derive(Debug, Clone)]
pub struct BondSpec {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub coupon_type: CouponType,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub day_count: DayCountConvention,
}

#[derive(Debug, Clone)]
pub struct Cashflow {
    pub date: Date,
    pub amount: f64,
    pub period_fraction: f64,
}
