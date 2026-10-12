//! Typed wrapper around `IssuanceProto`.
//!
//! Exposes auction-cycle fields (issue date, announcement date, original face
//! value, total accepted, etc.) as native Rust types (`NaiveDate`, `Decimal`,
//! `AuctionTypeProto`) via `ProtoSerializationUtil`.

use chrono::NaiveDate;
use rust_decimal::Decimal;

use crate::fintekkers::models::security::bond::{AuctionTypeProto, IssuanceProto};
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;

pub struct Issuance {
    pub proto: IssuanceProto,
}

impl Issuance {
    pub fn new(proto: IssuanceProto) -> Self {
        Issuance { proto }
    }

    pub fn proto(&self) -> &IssuanceProto {
        &self.proto
    }

    pub fn issue_date(&self) -> Option<NaiveDate> {
        self.proto
            .auction_issue_date
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_date(d).ok())
    }

    pub fn announcement_date(&self) -> Option<NaiveDate> {
        self.proto
            .auction_announcement_date
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_date(d).ok())
    }

    pub fn original_face_value(&self) -> Option<Decimal> {
        self.proto
            .auction_offering_amount
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn total_accepted(&self) -> Option<Decimal> {
        self.proto
            .total_accepted
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn post_auction_outstanding_quantity(&self) -> Option<Decimal> {
        self.proto
            .post_auction_outstanding_quantity
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn mature_security_amount(&self) -> Option<Decimal> {
        self.proto
            .mature_security_amount
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn price_for_single_price_auction(&self) -> Option<Decimal> {
        self.proto
            .price_for_single_price_auction
            .as_ref()
            .and_then(|d| ProtoSerializationUtil::deserialize_decimal(d).ok())
    }

    pub fn auction_type(&self) -> AuctionTypeProto {
        AuctionTypeProto::from_i32(self.proto.auction_type)
            .unwrap_or(AuctionTypeProto::UnknownAuctionType)
    }
}
