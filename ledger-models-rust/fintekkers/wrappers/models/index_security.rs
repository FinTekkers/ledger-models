//! Typed wrapper around an index-shaped `SecurityProto`.
//!
//! Acceptance is registry-driven: any product_type that descends from "INDEX"
//! in hierarchy.json (equity indices, rate indices, CDS indices, ...) is
//! considered index-shaped. The index family is read from
//! `non_bond_details.IndexDetails`.

use crate::fintekkers::models::security::index::IndexTypeProto;
use crate::fintekkers::models::security::security_proto::NonBondDetails;
use crate::fintekkers::models::security::{ProductTypeProto, SecurityProto};
use crate::fintekkers::wrappers::models::product_hierarchy;
use crate::fintekkers::wrappers::models::utils::errors::Error;

pub struct IndexSecurity {
    pub proto: SecurityProto,
}

impl IndexSecurity {
    pub fn from_proto(proto: SecurityProto) -> Result<Self, Error> {
        let pt = ProductTypeProto::from_i32(proto.product_type)
            .unwrap_or(ProductTypeProto::ProductTypeUnknown);
        let name = pt.as_str_name();
        if product_hierarchy::is_descendant_of(name, "INDEX") {
            Ok(IndexSecurity { proto })
        } else {
            Err(Error::NotABondSecurity)
        }
    }

    pub fn index_type(&self) -> IndexTypeProto {
        match self.proto.non_bond_details.as_ref() {
            Some(NonBondDetails::IndexDetails(idx)) => IndexTypeProto::from_i32(idx.index_type)
                .unwrap_or(IndexTypeProto::UnknownIndexType),
            _ => IndexTypeProto::UnknownIndexType,
        }
    }
}
