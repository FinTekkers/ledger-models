//! ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.
//!
//! For each type: construct → encode to bytes → decode → verify all fields match.

use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, IdentifierProto, IdentifierTypeProto,
    SecurityProto, SecurityQuantityTypeProto, SecurityTypeProto,
};
use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use prost::Message;

fn decimal(value: &str) -> DecimalValueProto {
    DecimalValueProto {
        arbitrary_precision_value: value.to_string(),
    }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn identifier(id_type: i32, value: &str) -> IdentifierProto {
    IdentifierProto {
        object_class: "Identifier".into(),
        version: "0.0.1".into(),
        identifier_type: id_type,
        identifier_value: value.to_string(),
    }
}

fn roundtrip(original: &SecurityProto) -> SecurityProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    SecurityProto::decode(&buf[..]).expect("decode failed")
}

#[test]
fn bond_security_all_fields_survive_roundtrip() {
    let original = SecurityProto {
        object_class: "Security".into(),
        version: "0.0.1".into(),
        security_type: SecurityTypeProto::BondSecurity.into(),
        asset_class: "Fixed Income".into(),
        issuer_name: "US Treasury".into(),
        quantity_type: SecurityQuantityTypeProto::OriginalFaceValue.into(),
        identifier: Some(identifier(IdentifierTypeProto::Cusip.into(), "912828ZT0")),
        description: "UST 5% 2030".into(),
        coupon_rate: Some(decimal("5.0")),
        coupon_type: CouponTypeProto::Fixed.into(),
        coupon_frequency: CouponFrequencyProto::Semiannually.into(),
        face_value: Some(decimal("1000")),
        issue_date: Some(date(2020, 1, 15)),
        dated_date: Some(date(2020, 1, 15)),
        maturity_date: Some(date(2030, 1, 15)),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.security_type, SecurityTypeProto::BondSecurity as i32);
    assert_eq!(parsed.asset_class, "Fixed Income");
    assert_eq!(parsed.issuer_name, "US Treasury");
    assert_eq!(parsed.description, "UST 5% 2030");
    assert_eq!(parsed.quantity_type, SecurityQuantityTypeProto::OriginalFaceValue as i32);
    assert_eq!(parsed.coupon_rate.unwrap().arbitrary_precision_value, "5.0");
    assert_eq!(parsed.coupon_type, CouponTypeProto::Fixed as i32);
    assert_eq!(parsed.coupon_frequency, CouponFrequencyProto::Semiannually as i32);
    assert_eq!(parsed.face_value.unwrap().arbitrary_precision_value, "1000");
    assert_eq!(parsed.issue_date.as_ref().unwrap().year, 2020);
    assert_eq!(parsed.dated_date.as_ref().unwrap().month, 1);
    assert_eq!(parsed.maturity_date.as_ref().unwrap().year, 2030);
    assert_eq!(parsed.maturity_date.as_ref().unwrap().month, 1);
    assert_eq!(parsed.maturity_date.as_ref().unwrap().day, 15);
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_value, "912828ZT0");
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_type, IdentifierTypeProto::Cusip as i32);
}

#[test]
fn tips_security_cpi_fields_survive_roundtrip() {
    let original = SecurityProto {
        object_class: "Security".into(),
        version: "0.0.1".into(),
        security_type: SecurityTypeProto::Tips.into(),
        asset_class: "Fixed Income".into(),
        issuer_name: "US Treasury".into(),
        coupon_rate: Some(decimal("0.625")),
        coupon_type: CouponTypeProto::Fixed.into(),
        coupon_frequency: CouponFrequencyProto::Semiannually.into(),
        face_value: Some(decimal("1000")),
        maturity_date: Some(date(2030, 1, 15)),
        base_cpi: Some(decimal("256.394")),
        inflation_index_type: IndexTypeProto::CpiU.into(),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.security_type, SecurityTypeProto::Tips as i32);
    assert_eq!(parsed.coupon_rate.unwrap().arbitrary_precision_value, "0.625");
    assert_eq!(parsed.coupon_type, CouponTypeProto::Fixed as i32);
    assert_eq!(parsed.coupon_frequency, CouponFrequencyProto::Semiannually as i32);
    assert_eq!(parsed.face_value.unwrap().arbitrary_precision_value, "1000");
    assert_eq!(parsed.maturity_date.as_ref().unwrap().year, 2030);
    assert_eq!(parsed.base_cpi.unwrap().arbitrary_precision_value, "256.394");
    assert_eq!(parsed.inflation_index_type, IndexTypeProto::CpiU as i32);
}

#[test]
fn frn_security_spread_fields_survive_roundtrip() {
    let original = SecurityProto {
        object_class: "Security".into(),
        version: "0.0.1".into(),
        security_type: SecurityTypeProto::Frn.into(),
        asset_class: "Fixed Income".into(),
        issuer_name: "US Treasury".into(),
        coupon_type: CouponTypeProto::Float.into(),
        coupon_frequency: CouponFrequencyProto::Quarterly.into(),
        face_value: Some(decimal("100")),
        maturity_date: Some(date(2028, 1, 15)),
        spread: Some(decimal("50")),
        reference_rate_index: IndexTypeProto::TBill13Week.into(),
        reset_frequency: CouponFrequencyProto::Quarterly.into(),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.security_type, SecurityTypeProto::Frn as i32);
    assert_eq!(parsed.coupon_type, CouponTypeProto::Float as i32);
    assert_eq!(parsed.coupon_frequency, CouponFrequencyProto::Quarterly as i32);
    assert_eq!(parsed.face_value.unwrap().arbitrary_precision_value, "100");
    assert_eq!(parsed.maturity_date.as_ref().unwrap().year, 2028);
    assert_eq!(parsed.spread.unwrap().arbitrary_precision_value, "50");
    assert_eq!(parsed.reference_rate_index, IndexTypeProto::TBill13Week as i32);
    assert_eq!(parsed.reset_frequency, CouponFrequencyProto::Quarterly as i32);
}

#[test]
fn equity_security_identifier_survives_roundtrip() {
    let original = SecurityProto {
        object_class: "Security".into(),
        version: "0.0.1".into(),
        security_type: SecurityTypeProto::EquitySecurity.into(),
        asset_class: "Equity".into(),
        issuer_name: "Apple Inc.".into(),
        quantity_type: SecurityQuantityTypeProto::Units.into(),
        identifier: Some(identifier(IdentifierTypeProto::ExchTicker.into(), "AAPL")),
        description: "Apple Inc. Common Stock".into(),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.security_type, SecurityTypeProto::EquitySecurity as i32);
    assert_eq!(parsed.asset_class, "Equity");
    assert_eq!(parsed.issuer_name, "Apple Inc.");
    assert_eq!(parsed.quantity_type, SecurityQuantityTypeProto::Units as i32);
    assert_eq!(parsed.description, "Apple Inc. Common Stock");
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_value, "AAPL");
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_type, IdentifierTypeProto::ExchTicker as i32);
}

#[test]
fn cash_security_cash_id_survives_roundtrip() {
    let original = SecurityProto {
        object_class: "Security".into(),
        version: "0.0.1".into(),
        security_type: SecurityTypeProto::CashSecurity.into(),
        asset_class: "Cash".into(),
        issuer_name: "Federal Reserve".into(),
        quantity_type: SecurityQuantityTypeProto::Units.into(),
        cash_id: "USD".into(),
        description: "US Dollar".into(),
        identifier: Some(identifier(IdentifierTypeProto::Cash.into(), "USD")),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.security_type, SecurityTypeProto::CashSecurity as i32);
    assert_eq!(parsed.asset_class, "Cash");
    assert_eq!(parsed.cash_id, "USD");
    assert_eq!(parsed.description, "US Dollar");
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_value, "USD");
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_type, IdentifierTypeProto::Cash as i32);
}

#[test]
fn index_security_index_type_survives_roundtrip() {
    let original = SecurityProto {
        object_class: "Security".into(),
        version: "0.0.1".into(),
        security_type: SecurityTypeProto::IndexSecurity.into(),
        asset_class: "Index".into(),
        issuer_name: "Bureau of Labor Statistics".into(),
        description: "US CPI-U All Urban Consumers".into(),
        index_type: IndexTypeProto::CpiU.into(),
        identifier: Some(identifier(IdentifierTypeProto::Cusip.into(), "CPI-U")),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.security_type, SecurityTypeProto::IndexSecurity as i32);
    assert_eq!(parsed.asset_class, "Index");
    assert_eq!(parsed.issuer_name, "Bureau of Labor Statistics");
    assert_eq!(parsed.description, "US CPI-U All Urban Consumers");
    assert_eq!(parsed.index_type, IndexTypeProto::CpiU as i32);
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_value, "CPI-U");
}
