//! Typed wrapper around an FRN-shaped `SecurityProto`.
//!
//! FRNs carry shared bond fields on `bond_details` plus FRN-specific extras
//! (spread over the reference rate, reference rate index, reset frequency)
//! on `frn_extension`.

use chrono::{Datelike, NaiveDate};
use rust_decimal::Decimal;

use crate::fintekkers::models::security::index::IndexTypeProto;
use crate::fintekkers::models::security::{
    BondDetailsProto, CouponFrequencyProto, CouponTypeProto, FrnExtensionProto,
    ProductTypeProto, SecurityProto,
};
use crate::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;

pub struct FloatingRateNote {
    pub proto: SecurityProto,
}

impl FloatingRateNote {
    pub fn from_proto(proto: SecurityProto) -> Result<Self, Error> {
        let pt = ProductTypeProto::from_i32(proto.product_type)
            .unwrap_or(ProductTypeProto::ProductTypeUnknown);
        if pt == ProductTypeProto::TreasuryFrn {
            Ok(FloatingRateNote { proto })
        } else {
            Err(Error::NotABondSecurity)
        }
    }

    pub fn spread(&self) -> Option<Decimal> {
        self.proto
            .frn_extension
            .as_ref()
            .and_then(|f| f.spread.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn reference_rate_index(&self) -> IndexTypeProto {
        self.proto
            .frn_extension
            .as_ref()
            .and_then(|f| IndexTypeProto::from_i32(f.reference_rate_index))
            .unwrap_or(IndexTypeProto::UnknownIndexType)
    }

    pub fn reset_frequency(&self) -> CouponFrequencyProto {
        self.proto
            .frn_extension
            .as_ref()
            .and_then(|f| CouponFrequencyProto::from_i32(f.reset_frequency))
            .unwrap_or(CouponFrequencyProto::UnknownCouponFrequency)
    }

    pub fn from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: CouponTypeProto,
        coupon_frequency: CouponFrequencyProto,
        issue_date: NaiveDate,
        maturity_date: NaiveDate,
        spread: Decimal,
        reference_rate_index: IndexTypeProto,
        reset_frequency: CouponFrequencyProto,
    ) -> SecurityProto {
        SecurityProto {
            product_type: ProductTypeProto::TreasuryFrn as i32,
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
            frn_extension: Some(FrnExtensionProto {
                spread: Some(decimal_proto(spread)),
                reference_rate_index: reference_rate_index as i32,
                reset_frequency: reset_frequency as i32,
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
