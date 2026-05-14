//! Typed wrapper around an Agency-MBS-shaped `SecurityProto`.
//!
//! Agency MBS pass-throughs carry shared bond fields on `bond_details` plus
//! MBS-specific extras (pool number, agency, WAC, WAM, pass-through rate,
//! current factor, original face, current UPB, PSA speed) on `mbs_extension`.
//! This wrapper exposes the MBS-specific accessors and a builder
//! (`from_pricer_inputs`) that produces a fully-populated `SecurityProto`
//! for the pricer.

use chrono::{Datelike, NaiveDate};
use rust_decimal::Decimal;

use crate::fintekkers::models::security::bond::AgencyProto;
use crate::fintekkers::models::security::{
    BondDetailsProto, CouponFrequencyProto, CouponTypeProto, MbsExtensionProto, ProductTypeProto,
    SecurityProto,
};
use crate::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;

pub struct MortgageBackedSecurity {
    pub proto: SecurityProto,
}

impl MortgageBackedSecurity {
    pub fn from_proto(proto: SecurityProto) -> Result<Self, Error> {
        let pt = ProductTypeProto::from_i32(proto.product_type)
            .unwrap_or(ProductTypeProto::ProductTypeUnknown);
        if pt == ProductTypeProto::MortgageBacked {
            Ok(MortgageBackedSecurity { proto })
        } else {
            Err(Error::NotABondSecurity)
        }
    }

    pub fn pool_number(&self) -> &str {
        self.proto
            .mbs_extension
            .as_ref()
            .map(|m| m.pool_number.as_str())
            .unwrap_or("")
    }

    pub fn agency(&self) -> AgencyProto {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| AgencyProto::from_i32(m.agency))
            .unwrap_or(AgencyProto::AgencyUnknown)
    }

    pub fn wac(&self) -> Option<Decimal> {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| m.wac.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn wam(&self) -> i32 {
        self.proto
            .mbs_extension
            .as_ref()
            .map(|m| m.wam)
            .unwrap_or(0)
    }

    pub fn pass_through_rate(&self) -> Option<Decimal> {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| m.pass_through_rate.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn current_factor(&self) -> Option<Decimal> {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| m.current_factor.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn original_face_value(&self) -> Option<Decimal> {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| m.original_face_value.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn current_upb(&self) -> Option<Decimal> {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| m.current_upb.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn psa_speed(&self) -> Option<Decimal> {
        self.proto
            .mbs_extension
            .as_ref()
            .and_then(|m| m.psa_speed.as_ref())
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: CouponTypeProto,
        coupon_frequency: CouponFrequencyProto,
        issue_date: NaiveDate,
        maturity_date: NaiveDate,
        pool_number: String,
        agency: AgencyProto,
        wac: Decimal,
        wam: i32,
        pass_through_rate: Decimal,
        current_factor: Decimal,
        original_face_value: Decimal,
        current_upb: Decimal,
        psa_speed: Decimal,
    ) -> SecurityProto {
        SecurityProto {
            product_type: ProductTypeProto::MortgageBacked as i32,
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
            mbs_extension: Some(MbsExtensionProto {
                pool_number,
                agency: agency as i32,
                wac: Some(decimal_proto(wac)),
                wam,
                pass_through_rate: Some(decimal_proto(pass_through_rate)),
                current_factor: Some(decimal_proto(current_factor)),
                original_face_value: Some(decimal_proto(original_face_value)),
                current_upb: Some(decimal_proto(current_upb)),
                psa_speed: Some(decimal_proto(psa_speed)),
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
