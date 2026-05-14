//! Tests for the `Issuance` wrapper.
//!
//! Construct an `IssuanceProto` with all 8 wrapped fields set, wrap it,
//! and verify each typed accessor returns the expected value.

use ledger_models::fintekkers::models::security::bond::{AuctionTypeProto, IssuanceProto};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::wrappers::models::issuance::Issuance;

use chrono::NaiveDate;
use rust_decimal_macros::dec;

fn decimal(value: &str) -> DecimalValueProto {
    DecimalValueProto {
        arbitrary_precision_value: value.to_string(),
    }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn populated_issuance() -> IssuanceProto {
    IssuanceProto {
        auction_announcement_date: Some(date(2024, 1, 5)),
        auction_issue_date: Some(date(2024, 1, 15)),
        post_auction_outstanding_quantity: Some(decimal("100000000")),
        auction_offering_amount: Some(decimal("50000000")),
        auction_type: AuctionTypeProto::SinglePrice as i32,
        price_for_single_price_auction: Some(decimal("99.875")),
        total_accepted: Some(decimal("45000000")),
        mature_security_amount: Some(decimal("44500000")),
        ..Default::default()
    }
}

#[test]
fn issuance_accessors_return_typed_values() {
    let wrapped = Issuance::new(populated_issuance());

    assert_eq!(wrapped.issue_date(), Some(NaiveDate::from_ymd_opt(2024, 1, 15).unwrap()));
    assert_eq!(
        wrapped.announcement_date(),
        Some(NaiveDate::from_ymd_opt(2024, 1, 5).unwrap())
    );
    assert_eq!(wrapped.original_face_value(), Some(dec!(50000000)));
    assert_eq!(wrapped.total_accepted(), Some(dec!(45000000)));
    assert_eq!(wrapped.post_auction_outstanding_quantity(), Some(dec!(100000000)));
    assert_eq!(wrapped.mature_security_amount(), Some(dec!(44500000)));
    assert_eq!(wrapped.price_for_single_price_auction(), Some(dec!(99.875)));
    assert_eq!(wrapped.auction_type(), AuctionTypeProto::SinglePrice);
}

#[test]
fn issuance_accessors_return_none_on_missing_fields() {
    let wrapped = Issuance::new(IssuanceProto::default());

    assert!(wrapped.issue_date().is_none());
    assert!(wrapped.announcement_date().is_none());
    assert!(wrapped.original_face_value().is_none());
    assert!(wrapped.total_accepted().is_none());
    assert!(wrapped.post_auction_outstanding_quantity().is_none());
    assert!(wrapped.mature_security_amount().is_none());
    assert!(wrapped.price_for_single_price_auction().is_none());
    assert_eq!(wrapped.auction_type(), AuctionTypeProto::UnknownAuctionType);
}

#[test]
fn issuance_proto_accessor_returns_underlying() {
    let proto = populated_issuance();
    let wrapped = Issuance::new(proto.clone());
    assert_eq!(wrapped.proto(), &proto);
}
