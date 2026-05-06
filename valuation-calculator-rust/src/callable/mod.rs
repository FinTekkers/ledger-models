use crate::bond::BondSpec;
use crate::date::Date;

pub mod yield_to_call;
pub mod yield_to_worst;
pub mod oas;

/// Specification for a callable and/or puttable bond.
///
/// A callable bond gives the issuer the right to redeem early at specified prices.
/// A puttable bond gives the investor the right to sell back at specified prices.
/// A bond may have both call and put schedules.
#[derive(Debug, Clone)]
pub struct CallableSpec {
    pub bond: BondSpec,
    pub call_schedule: Vec<CallDate>,
    pub put_schedule: Vec<PutDate>,
}

/// A single call date with the price the issuer pays to redeem.
#[derive(Debug, Clone)]
pub struct CallDate {
    /// The date on which the issuer may call the bond.
    pub date: Date,
    /// The price the issuer pays to redeem, as a percentage of par (e.g., 103.0).
    pub call_price: f64,
}

/// A single put date with the price the investor receives.
#[derive(Debug, Clone)]
pub struct PutDate {
    /// The date on which the investor may put the bond back to the issuer.
    pub date: Date,
    /// The price the investor receives, as a percentage of par (e.g., 100.0).
    pub put_price: f64,
}
