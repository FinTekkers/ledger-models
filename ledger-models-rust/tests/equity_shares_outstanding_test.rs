//! LM-479: EquityDetailsProto.shares_outstanding round-trips, stays absent
//! when unset, and EquitySecurity::shares_outstanding never reports absent
//! as zero.

use ledger_models::fintekkers::models::security::security_proto::NonBondDetails;
use ledger_models::fintekkers::models::security::{
    EquityDetailsProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::models::util::DecimalValueProto;
use ledger_models::fintekkers::wrappers::models::equity_security::EquitySecurity;
use ledger_models::fintekkers::wrappers::models::utils::decimal::decimal_proto;
use ledger_models::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use prost::Message;
use rust_decimal::Decimal;

fn roundtrip(original: &SecurityProto) -> SecurityProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    SecurityProto::decode(&buf[..]).expect("decode failed")
}

fn etf(details: EquityDetailsProto) -> SecurityProto {
    SecurityProto {
        product_type: ProductTypeProto::Etf as i32,
        non_bond_details: Some(NonBondDetails::EquityDetails(details)),
        ..Default::default()
    }
}

fn equity_details(parsed: &SecurityProto) -> &EquityDetailsProto {
    match &parsed.non_bond_details {
        Some(NonBondDetails::EquityDetails(eq)) => eq,
        other => panic!("Expected EquityDetails, got {:?}", other),
    }
}

#[test]
fn shares_outstanding_round_trips_through_bytes() {
    let proto = etf(EquityDetailsProto {
        shares_outstanding: Some(decimal_proto(&Decimal::from(1_000_000_000i64))),
        ..Default::default()
    });

    let parsed = roundtrip(&proto);
    let p = equity_details(&parsed)
        .shares_outstanding
        .as_ref()
        .expect("shares_outstanding should be present");
    assert_eq!(
        ProtoSerializationUtil::deserialize_decimal(p).unwrap(),
        Decimal::from(1_000_000_000i64)
    );
}

#[test]
fn unset_shares_outstanding_stays_absent_after_round_trip() {
    let parsed = roundtrip(&etf(EquityDetailsProto { ..Default::default() }));
    assert!(equity_details(&parsed).shares_outstanding.is_none());
}

#[test]
fn getter_returns_value_after_serialize_parse_wrap() {
    let proto = etf(EquityDetailsProto {
        shares_outstanding: Some(decimal_proto(&Decimal::from(1_000_000_000i64))),
        ..Default::default()
    });
    let wrapper = EquitySecurity::from_proto(roundtrip(&proto)).expect("ETF is a STOCK");
    assert_eq!(wrapper.shares_outstanding(), Some(Decimal::from(1_000_000_000i64)));
}

#[test]
fn getter_returns_none_when_field_absent_after_round_trip() {
    let proto = etf(EquityDetailsProto { ..Default::default() });
    let wrapper = EquitySecurity::from_proto(roundtrip(&proto)).expect("ETF is a STOCK");
    assert_eq!(wrapper.shares_outstanding(), None);
}

#[test]
fn getter_returns_none_when_equity_details_absent() {
    let proto = SecurityProto {
        product_type: ProductTypeProto::Etf as i32,
        ..Default::default()
    };
    let wrapper = EquitySecurity::from_proto(proto).expect("ETF is a STOCK");
    assert_eq!(wrapper.shares_outstanding(), None);
}

#[test]
fn getter_returns_none_for_present_but_empty_decimal() {
    let proto = etf(EquityDetailsProto {
        shares_outstanding: Some(DecimalValueProto { ..Default::default() }),
    });
    let wrapper = EquitySecurity::from_proto(roundtrip(&proto)).expect("ETF is a STOCK");
    assert_eq!(wrapper.shares_outstanding(), None);
}

#[test]
fn from_proto_rejects_non_equity() {
    let proto = SecurityProto {
        product_type: ProductTypeProto::TreasuryBond as i32,
        ..Default::default()
    };
    assert!(EquitySecurity::from_proto(proto).is_err());
}
