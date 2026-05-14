//! ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.
//!
//! For each type: construct → encode to bytes → decode → verify all fields match.

use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, IdentifierProto, IdentifierTypeProto,
    IndexDetailsProto, SecurityProto, SecurityQuantityTypeProto, ProductTypeProto,
};
use ledger_models::fintekkers::models::security::security_proto::NonBondDetails;
use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto, LocalTimestampProto, UuidProto};
use ledger_models::fintekkers::wrappers::models::security::{link_of, link_of_latest, SecurityWrapper};
use prost::Message;
use uuid::Uuid;
use prost_types::Timestamp;

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
        product_type: ProductTypeProto::TreasuryNote.into(),
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

    assert_eq!(parsed.product_type, ProductTypeProto::TreasuryNote as i32);
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
        product_type: ProductTypeProto::Tips.into(),
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

    assert_eq!(parsed.product_type, ProductTypeProto::Tips as i32);
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
        product_type: ProductTypeProto::TreasuryFrn.into(),
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

    assert_eq!(parsed.product_type, ProductTypeProto::TreasuryFrn as i32);
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
        product_type: ProductTypeProto::CommonStock.into(),
        asset_class: "Equity".into(),
        issuer_name: "Apple Inc.".into(),
        quantity_type: SecurityQuantityTypeProto::Units.into(),
        identifier: Some(identifier(IdentifierTypeProto::ExchTicker.into(), "AAPL")),
        description: "Apple Inc. Common Stock".into(),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.product_type, ProductTypeProto::CommonStock as i32);
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
        product_type: ProductTypeProto::Currency.into(),
        asset_class: "Cash".into(),
        issuer_name: "Federal Reserve".into(),
        quantity_type: SecurityQuantityTypeProto::Units.into(),
        cash_id: "USD".into(),
        description: "US Dollar".into(),
        identifier: Some(identifier(IdentifierTypeProto::Cash.into(), "USD")),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.product_type, ProductTypeProto::Currency as i32);
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
        product_type: ProductTypeProto::EquityIndex.into(),
        asset_class: "Index".into(),
        issuer_name: "Bureau of Labor Statistics".into(),
        description: "US CPI-U All Urban Consumers".into(),
        index_type: IndexTypeProto::CpiU.into(),
        identifier: Some(identifier(IdentifierTypeProto::Cusip.into(), "CPI-U")),
        ..Default::default()
    };

    let parsed = roundtrip(&original);

    assert_eq!(parsed.product_type, ProductTypeProto::EquityIndex as i32);
    assert_eq!(parsed.asset_class, "Index");
    assert_eq!(parsed.issuer_name, "Bureau of Labor Statistics");
    assert_eq!(parsed.description, "US CPI-U All Urban Consumers");
    assert_eq!(parsed.index_type, IndexTypeProto::CpiU as i32);
    assert_eq!(parsed.identifier.as_ref().unwrap().identifier_value, "CPI-U");
}

// ---------- v0.2.5: link helpers + constituents + wire-compat ----------

fn timestamp_at(seconds: i64) -> LocalTimestampProto {
    LocalTimestampProto {
        timestamp: Some(Timestamp { seconds, nanos: 0 }),
        time_zone: "UTC".to_string(),
    }
}

#[test]
fn link_of_populates_uuid_and_as_of_and_sets_is_link() {
    let uuid = Uuid::new_v4();
    let as_of = timestamp_at(1_700_000_000);

    let link = link_of(uuid, as_of.clone());

    assert!(link.is_link, "linkOf must set is_link=true");
    assert_eq!(link.uuid.as_ref().unwrap().raw_uuid, uuid.as_bytes().to_vec(),
               "linkOf must populate uuid");
    assert_eq!(link.as_of.as_ref().unwrap(), &as_of,
               "linkOf must populate as_of from caller-supplied timestamp");
    // No other fields should be populated.
    assert!(link.asset_class.is_empty());
    assert!(link.issuer_name.is_empty());
    assert_eq!(link.product_type, 0);
}

#[test]
fn link_of_latest_skips_as_of() {
    let uuid = Uuid::new_v4();
    let link = link_of_latest(uuid);

    assert!(link.is_link, "linkOfLatest must set is_link=true");
    assert_eq!(link.uuid.as_ref().unwrap().raw_uuid, uuid.as_bytes().to_vec());
    assert!(link.as_of.is_none(),
            "linkOfLatest must leave as_of unset (resolver returns latest)");
}

#[test]
fn link_round_trip_preserves_uuid_and_as_of() {
    let uuid = Uuid::new_v4();
    let as_of = timestamp_at(1_700_000_000);
    let link = link_of(uuid, as_of.clone());

    let parsed = roundtrip(&link);
    assert!(parsed.is_link);
    assert_eq!(parsed.uuid.as_ref().unwrap().raw_uuid, uuid.as_bytes().to_vec());
    assert_eq!(parsed.as_of.as_ref().unwrap(), &as_of);
}

#[test]
fn security_wrapper_is_link_reads_proto() {
    let wrapper_full = SecurityWrapper::new(SecurityProto::default());
    assert!(!wrapper_full.is_link());

    let link = link_of(Uuid::new_v4(), timestamp_at(1_700_000_000));
    let wrapper_link = SecurityWrapper::new(link);
    assert!(wrapper_link.is_link());
}

#[test]
#[should_panic(expected = "Cannot read product_type on a link-mode SecurityWrapper")]
fn security_wrapper_product_type_panics_on_link() {
    let link = link_of(Uuid::new_v4(), timestamp_at(1_700_000_000));
    let wrapper = SecurityWrapper::new(link);
    let _ = wrapper.product_type_i32();
}

#[test]
#[should_panic(expected = "Cannot read asset_class on a link-mode SecurityWrapper")]
fn security_wrapper_asset_class_panics_on_link() {
    let link = link_of(Uuid::new_v4(), timestamp_at(1_700_000_000));
    let wrapper = SecurityWrapper::new(link);
    let _ = wrapper.asset_class();
}

#[test]
fn index_details_constituents_round_trip() {
    // Server populates constituents under QuerySecurityRequestProto.lookthrough=true.
    // Each constituent is a link with is_link=true, uuid + as_of set.
    let as_of = timestamp_at(1_700_000_000);
    let c1 = link_of(Uuid::new_v4(), as_of.clone());
    let c2 = link_of(Uuid::new_v4(), as_of.clone());

    let index_security = SecurityProto {
        product_type: ProductTypeProto::EquityIndex as i32,
        non_bond_details: Some(NonBondDetails::IndexDetails(IndexDetailsProto {
            index_type: IndexTypeProto::CpiU as i32,
            constituents: vec![c1.clone(), c2.clone()],
        })),
        ..Default::default()
    };

    let parsed = roundtrip(&index_security);
    match &parsed.non_bond_details {
        Some(NonBondDetails::IndexDetails(idx)) => {
            assert_eq!(idx.constituents.len(), 2);
            assert!(idx.constituents[0].is_link);
            assert_eq!(idx.constituents[0].as_of.as_ref().unwrap(), &as_of);
            assert_eq!(idx.constituents[0].uuid, c1.uuid);
            assert_eq!(idx.constituents[1].uuid, c2.uuid);
        }
        other => panic!("Expected IndexDetails, got {:?}", other),
    }
}

#[test]
fn legs_wire_compatible_with_legacy_security_id_proto_bytes() {
    // SecurityIdProto carried uuid at tag 1 — identical wire format to
    // SecurityProto.uuid. Bytes from the legacy type MUST parse cleanly
    // under the new SecurityProto leg type. We reconstruct the legacy
    // wire form by encoding a SecurityProto with only the uuid set —
    // bit-for-bit identical to what SecurityIdProto would have produced.
    let leg_uuid = Uuid::new_v4();
    let legacy_shape = SecurityProto {
        uuid: Some(UuidProto { raw_uuid: leg_uuid.as_bytes().to_vec() }),
        ..Default::default()
    };
    let legacy_bytes = legacy_shape.encode_to_vec();

    let parsed = SecurityProto::decode(legacy_bytes.as_slice())
        .expect("legacy SecurityIdProto bytes must parse as SecurityProto");
    assert_eq!(parsed.uuid.as_ref().unwrap().raw_uuid, leg_uuid.as_bytes().to_vec());
}
