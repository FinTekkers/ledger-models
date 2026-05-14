//! Typed wrapper around a TIPS-shaped `SecurityProto`.
//!
//! TIPS securities carry shared bond fields on `bond_details` plus
//! TIPS-specific extras (base CPI, index date, inflation index type) on
//! `tips_extension`. This wrapper exposes the TIPS-specific accessors and
//! a builder (`from_pricer_inputs`) that produces a fully-populated
//! `SecurityProto` for the pricer.

use chrono::{Datelike, NaiveDate};
use rust_decimal::Decimal;

use crate::fintekkers::models::security::index::IndexTypeProto;
use crate::fintekkers::models::security::{
    BondDetailsProto, CouponFrequencyProto, CouponTypeProto, ProductTypeProto, SecurityProto,
    TipsExtensionProto,
};
use crate::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;

pub struct TIPSBond {
    pub proto: SecurityProto,
}

impl TIPSBond {
    pub fn from_proto(proto: SecurityProto) -> Result<Self, Error> {
        let pt = ProductTypeProto::from_i32(proto.product_type)
            .unwrap_or(ProductTypeProto::ProductTypeUnknown);
        if pt == ProductTypeProto::Tips {
            Ok(TIPSBond { proto })
        } else {
            Err(Error::NotABondSecurity)
        }
    }

    pub fn base_cpi(&self) -> Option<Decimal> {
        self.proto
            .tips_extension
            .as_ref()
            .and_then(|t| t.base_cpi.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn index_date(&self) -> Option<NaiveDate> {
        self.proto
            .tips_extension
            .as_ref()
            .and_then(|t| t.index_date.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_date(d).ok())
    }

    pub fn inflation_index_type(&self) -> IndexTypeProto {
        self.proto
            .tips_extension
            .as_ref()
            .and_then(|t| IndexTypeProto::from_i32(t.inflation_index_type))
            .unwrap_or(IndexTypeProto::UnknownIndexType)
    }

    pub fn from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: CouponTypeProto,
        coupon_frequency: CouponFrequencyProto,
        issue_date: NaiveDate,
        maturity_date: NaiveDate,
        base_cpi: Decimal,
        index_date: NaiveDate,
        inflation_index_type: IndexTypeProto,
    ) -> SecurityProto {
        SecurityProto {
            product_type: ProductTypeProto::Tips as i32,
            bond_details: Some(BondDetailsProto {
                coupon_rate: Some(decimal_proto(coupon_rate)),
                coupon_type: coupon_type as i32,
                coupon_frequency: coupon_frequency as i32,
                face_value: Some(decimal_proto(face_value)),
                issue_date: Some(date_proto(issue_date)),
                dated_date: None,
                maturity_date: Some(date_proto(maturity_date)),
                issuance_info: vec![],
            }),
            tips_extension: Some(TipsExtensionProto {
                base_cpi: Some(decimal_proto(base_cpi)),
                index_date: Some(date_proto(index_date)),
                inflation_index_type: inflation_index_type as i32,
            }),
            ..Default::default()
        }
    }
}

fn decimal_proto(d: Decimal) -> DecimalValueProto {
    DecimalValueProto {
        arbitrary_precision_value: d.to_string(),
    }
}

fn date_proto(d: NaiveDate) -> LocalDateProto {
    LocalDateProto {
        year: d.year() as u32,
        month: d.month(),
        day: d.day(),
    }
}
