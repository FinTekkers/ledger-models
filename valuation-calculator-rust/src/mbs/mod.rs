use crate::date::Date;

pub mod prepayment;
pub mod cashflows;
pub mod pricing;

#[derive(Debug, Clone)]
pub struct MbsSpec {
    pub original_balance: f64,       // original pool balance
    pub current_balance: f64,        // current outstanding balance
    pub pass_through_rate: f64,      // coupon passed to investors (net of servicing)
    pub wac: f64,                    // weighted average coupon of underlying mortgages
    pub wam: u32,                    // weighted average maturity in months
    pub age: u32,                    // current age of the pool in months (seasoning)
    pub settlement: Date,
    pub factor: f64,                 // pool factor = current_balance / original_balance
}
