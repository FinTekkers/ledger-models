use crate::bond::BondSpec;
use crate::date::Date;

pub mod index_ratio;
pub mod cashflows;
pub mod pricing;

#[derive(Debug, Clone)]
pub struct TipsSpec {
    pub bond: BondSpec,           // underlying bond (coupon_rate is the REAL coupon)
    pub base_cpi: f64,            // reference CPI at issuance (e.g., 256.394)
    pub base_cpi_date: Date,      // date the base CPI was observed
}
