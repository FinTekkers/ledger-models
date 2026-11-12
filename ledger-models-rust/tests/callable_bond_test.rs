//! LM-465: a bond carries `callable` and its first `call_date`. The call date
//! is never the maturity date: `maturity_date()` (the Rust equivalent of
//! Java's `getField(MATURITY_DATE)`) stays the legal final maturity.

use chrono::NaiveDate;
use ledger_models::fintekkers::models::security::{
    BondDetailsProto, IdentifierProto, IdentifierTypeProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::wrappers::models::raw_datamodel_object::RawDataModelObject;
use ledger_models::fintekkers::wrappers::models::security::SecurityWrapper;
use prost::Message;

// 912810CK2, 10 3/8% Bonds of 2004-2009: called 2004-11-15, legal maturity 2009-11-15.
fn call_date() -> NaiveDate {
    NaiveDate::from_ymd_opt(2004, 11, 15).unwrap()
}

fn maturity() -> NaiveDate {
    NaiveDate::from_ymd_opt(2009, 11, 15).unwrap()
}

fn local_date(d: NaiveDate) -> LocalDateProto {
    use chrono::Datelike;
    LocalDateProto { year: d.year() as u32, month: d.month(), day: d.day() }
}

fn bond(callable: bool) -> SecurityProto {
    SecurityProto {
        product_type: ProductTypeProto::TreasuryBond as i32,
        issuer_name: "US Treasury".into(),
        identifiers: vec![IdentifierProto {
            identifier_type: IdentifierTypeProto::Cusip as i32,
            identifier_value: "912810CK2".into(),
            ..Default::default()
        }],
        bond_details: Some(BondDetailsProto {
            maturity_date: Some(local_date(maturity())),
            callable,
            call_date: callable.then(|| local_date(call_date())),
            ..Default::default()
        }),
        ..Default::default()
    }
}

fn decode(bytes: &[u8]) -> SecurityProto {
    SecurityProto::decode(bytes).unwrap()
}

/// Serializes through the wrapper's `encode`, parses the bytes and wraps them again.
fn rewrap(security: &SecurityWrapper) -> SecurityWrapper {
    SecurityWrapper::new(decode(&security.encode()))
}

#[test]
fn callable_bond_wire_round_trip_keeps_all_three_values() {
    let decoded = decode(&bond(true).encode_to_vec());
    let details = decoded.bond_details.as_ref().unwrap();
    assert!(details.callable);
    assert!(details.call_date.is_some());

    let security = SecurityWrapper::new(decoded);
    assert!(security.callable());
    assert_eq!(security.call_date(), Some(call_date()));
    assert_eq!(security.maturity_date(), Some(maturity()));
}

#[test]
fn callable_bond_resaved_through_wrapper_keeps_all_three_values() {
    let security = rewrap(&SecurityWrapper::new(bond(true)));
    assert!(security.callable());
    assert_eq!(security.call_date(), Some(call_date()));
    assert_eq!(security.maturity_date(), Some(maturity()));
}

#[test]
fn maturity_date_is_the_legal_maturity_not_the_call_date() {
    let security = rewrap(&SecurityWrapper::new(bond(true)));
    assert_eq!(security.maturity_date(), Some(maturity()));
    assert_ne!(security.maturity_date(), Some(call_date()));
}

#[test]
fn non_callable_bond_round_trip_leaves_call_date_unset() {
    let decoded = decode(&bond(false).encode_to_vec());
    let details = decoded.bond_details.as_ref().unwrap();
    assert!(!details.callable);
    assert!(details.call_date.is_none());

    let security = rewrap(&SecurityWrapper::new(decoded));
    assert!(!security.callable());
    assert_eq!(security.call_date(), None);
    assert_ne!(security.call_date(), NaiveDate::from_ymd_opt(1970, 1, 1));
    assert_eq!(security.maturity_date(), Some(maturity()));
}

#[test]
fn non_bond_security_is_not_callable_and_has_no_call_date() {
    for product_type in [
        ProductTypeProto::CommonStock,
        ProductTypeProto::Currency,
        ProductTypeProto::EquityIndex,
    ] {
        let proto = SecurityProto { product_type: product_type as i32, ..Default::default() };
        let security = SecurityWrapper::new(decode(&proto.encode_to_vec()));
        assert!(!security.callable(), "{product_type:?}");
        assert_eq!(security.call_date(), None, "{product_type:?}");
    }
}
