//! Tests for `SecurityWrapper::identifiers` and `identifier_by_type`.

use ledger_models::fintekkers::models::security::{
    IdentifierProto, IdentifierTypeProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::wrappers::models::security::SecurityWrapper;

fn ident(ty: IdentifierTypeProto, value: &str) -> IdentifierProto {
    IdentifierProto {
        object_class: "Identifier".to_string(),
        version: "0.0.1".to_string(),
        identifier_value: value.to_string(),
        identifier_type: ty as i32,
    }
}

#[test]
fn identifiers_returns_all_in_order() {
    let proto = SecurityProto {
        product_type: ProductTypeProto::TreasuryNote as i32,
        identifiers: vec![
            ident(IdentifierTypeProto::Cusip, "912828ABC"),
            ident(IdentifierTypeProto::Isin, "US912828ABC1"),
            ident(IdentifierTypeProto::Figi, "BBG00ABCDEF1"),
        ],
        ..Default::default()
    };
    let wrapper = SecurityWrapper::new(proto);

    let ids = wrapper.identifiers();
    assert_eq!(ids.len(), 3);
    assert_eq!(ids[0].identifier_value, "912828ABC");
    assert_eq!(ids[0].identifier_type, IdentifierTypeProto::Cusip as i32);
    assert_eq!(ids[1].identifier_value, "US912828ABC1");
    assert_eq!(ids[2].identifier_value, "BBG00ABCDEF1");
}

#[test]
fn identifiers_empty_when_none_set() {
    let proto = SecurityProto {
        product_type: ProductTypeProto::TreasuryNote as i32,
        ..Default::default()
    };
    let wrapper = SecurityWrapper::new(proto);
    assert!(wrapper.identifiers().is_empty());
}

#[test]
fn identifier_by_type_finds_match() {
    let proto = SecurityProto {
        product_type: ProductTypeProto::TreasuryNote as i32,
        identifiers: vec![
            ident(IdentifierTypeProto::Cusip, "912828ABC"),
            ident(IdentifierTypeProto::Isin, "US912828ABC1"),
        ],
        ..Default::default()
    };
    let wrapper = SecurityWrapper::new(proto);

    let isin = wrapper.identifier_by_type(IdentifierTypeProto::Isin);
    assert!(isin.is_some());
    assert_eq!(isin.unwrap().identifier_value, "US912828ABC1");

    let cusip = wrapper.identifier_by_type(IdentifierTypeProto::Cusip);
    assert_eq!(cusip.unwrap().identifier_value, "912828ABC");
}

#[test]
fn identifier_by_type_returns_none_when_absent() {
    let proto = SecurityProto {
        product_type: ProductTypeProto::TreasuryNote as i32,
        identifiers: vec![ident(IdentifierTypeProto::Cusip, "912828ABC")],
        ..Default::default()
    };
    let wrapper = SecurityWrapper::new(proto);

    assert!(wrapper.identifier_by_type(IdentifierTypeProto::Figi).is_none());
    assert!(wrapper.identifier_by_type(IdentifierTypeProto::Isin).is_none());
}
