use crate::date::Date;

pub mod pricing;

#[derive(Debug, Clone)]
pub struct RepoSpec {
    pub collateral_dirty_price: f64,  // dirty price of collateral (% of par)
    pub collateral_face: f64,         // face value of collateral
    pub haircut: f64,                 // margin/haircut as decimal (e.g., 0.02 = 2%)
    pub repo_rate: f64,              // annualized repo rate, decimal
    pub start_date: Date,
    pub end_date: Date,              // term end (or next business day for overnight)
    pub repo_type: RepoType,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RepoType {
    Overnight,
    Term,       // fixed term (1 week, 1 month, etc.)
    Open,       // rolling, can be terminated daily
}
