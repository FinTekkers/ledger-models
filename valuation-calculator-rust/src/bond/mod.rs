pub mod cashflows;
pub mod accrued_interest;
pub mod pricing;
pub mod ytm_solver;
pub mod current_yield;
pub mod duration;
pub mod convexity;
pub mod dv01;
pub mod market_value;
pub mod frn;
pub mod zspread;
pub mod spread;

use crate::date::Date;
use crate::daycount::DayCountConvention;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CouponType {
    Fixed,
    Zero,
    Floating { spread: f64 },  // spread over reference rate in decimal (e.g., 0.005 = 50bps)
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
    pub ex_dividend_days: u32,
}

#[derive(Debug, Clone)]
pub struct Cashflow {
    pub date: Date,
    pub amount: f64,
    pub period_fraction: f64,
}
