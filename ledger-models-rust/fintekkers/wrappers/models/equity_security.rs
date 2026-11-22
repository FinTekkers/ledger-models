//! Typed wrapper around an equity-shaped `SecurityProto`.
//!
//! Acceptance is registry-driven: any product_type that descends from "STOCK"
//! in hierarchy.json (COMMON_STOCK, PREFERRED_STOCK, ADR, ETF, ...) is
//! considered equity-shaped. Equity fields are read from
//! `non_bond_details.EquityDetails`. See docs/adr/equity_shares_outstanding.md.

use rust_decimal::Decimal;

use crate::fintekkers::models::security::security_proto::NonBondDetails;
use crate::fintekkers::models::security::{ProductTypeProto, SecurityProto};
use crate::fintekkers::wrappers::models::product_hierarchy;
use crate::fintekkers::wrappers::models::utils::decimal::is_unset_decimal;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;

pub struct EquitySecurity {
    pub proto: SecurityProto,
}

impl EquitySecurity {
    pub fn from_proto(proto: SecurityProto) -> Result<Self, Error> {
        let pt = ProductTypeProto::from_i32(proto.product_type)
            .unwrap_or(ProductTypeProto::ProductTypeUnknown);
        let name = pt.as_str_name();
        if product_hierarchy::is_descendant_of(name, "STOCK") {
            Ok(EquitySecurity { proto })
        } else {
            Err(Error::NotABondSecurity)
        }
    }

    /// Whole-number count of shares outstanding at this version's as_of.
    /// `None` means unknown (no equity_details, field absent or an empty
    /// decimal), never zero.
    pub fn shares_outstanding(&self) -> Option<Decimal> {
        match self.proto.non_bond_details.as_ref() {
            Some(NonBondDetails::EquityDetails(eq)) => eq
                .shares_outstanding
                .as_ref()
                .filter(|d| !is_unset_decimal(d))
                .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok()),
            _ => None,
        }
    }
}
