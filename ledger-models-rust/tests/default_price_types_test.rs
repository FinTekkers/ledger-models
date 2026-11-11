//! LM-461 — default trade-price type by product, from hierarchy.json
//! `default_price_types`. Parity with Python test_default_price_types.py,
//! Java DefaultPriceTypesTest and JS default_price_types.test.ts.
//!
//! The shared cases live in ledger-models-protos/fixtures/default_price_types_cases.json;
//! expected values come from that file only, never from the resolver under test.

use std::collections::BTreeSet;

use ledger_models::fintekkers::models::price::PriceTypeProto;
use ledger_models::fintekkers::models::security::{ProductTypeProto, SecurityProto};
use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use ledger_models::fintekkers::wrappers::models::default_price_types::{
    default_price_type_for, default_price_types_from_hierarchy, parse_default_price_types,
    resolve_trade_price_type, shipped_default_price_types,
};
use ledger_models::fintekkers::wrappers::models::product_inputs::ProductInputError;
use prost::Message;
use prost_types::FileDescriptorSet;
use serde_json::Value;

fn read_json(relative: &str) -> Value {
    let path = format!("{}/{relative}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {path}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {path}: {e}"))
}

fn fixture_cases() -> serde_json::Map<String, Value> {
    read_json("../ledger-models-protos/fixtures/default_price_types_cases.json")["cases"]
        .as_object()
        .expect("cases object")
        .clone()
}

fn hierarchy() -> Value {
    read_json("../ledger-models-protos/hierarchy.json")
}

/// Every `ProductTypeProto` name, from the descriptor set.
fn product_type_names() -> BTreeSet<String> {
    let set = FileDescriptorSet::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set");
    let names: BTreeSet<String> = set
        .file
        .iter()
        .flat_map(|f| f.enum_type.iter())
        .filter(|e| e.name() == "ProductTypeProto")
        .flat_map(|e| e.value.iter().map(|v| v.name().to_string()))
        .collect();
    assert!(!names.is_empty());
    names
}

fn security(product_type: ProductTypeProto) -> SecurityProto {
    SecurityProto { product_type: product_type.into(), ..Default::default() }
}

// ---------- metric 3: every product resolves to the fixture, never UNKNOWN ----------

#[test]
fn fixture_lists_every_product_type_enum_value() {
    let keys: BTreeSet<String> = fixture_cases().keys().cloned().collect();
    assert_eq!(keys, product_type_names());
}

#[test]
fn fixture_covers_deepest_node_wins() {
    let cases = fixture_cases();
    assert_eq!(cases["SOFR_SERIES"], "RATE");
    assert_eq!(cases["T_BILL_13_WEEK_SERIES"], "RATE");
    assert_eq!(cases["CPI_SERIES"], "INDEX_LEVEL");
}

#[test]
fn every_product_resolves_as_the_fixture_says() {
    for (product_type, expected) in fixture_cases() {
        let pt = ProductTypeProto::from_str_name(&product_type).expect("enum name");
        let s = security(pt);
        let expected = expected.as_str().expect("string");
        if expected == "raises" {
            assert_eq!(default_price_type_for(Some(&s)).unwrap(), None, "{product_type}");
            match resolve_trade_price_type(Some(&s), None) {
                Err(ProductInputError::NoDefaultPriceType { product_type: p, .. }) => assert_eq!(p, product_type),
                other => panic!("{product_type}: expected NoDefaultPriceType, got {other:?}"),
            }
        } else {
            let resolved = resolve_trade_price_type(Some(&s), None).unwrap();
            assert_eq!(resolved, PriceTypeProto::from_str_name(expected).expect("type name"), "{product_type}");
            assert_ne!(resolved, PriceTypeProto::UnknownPriceType, "{product_type}");
        }
    }
}

#[test]
fn each_table_key_resolves_to_its_own_entry() {
    let section = hierarchy()["default_price_types"].as_object().expect("section").clone();
    assert!(!section.is_empty());
    let shipped = shipped_default_price_types().unwrap();
    for (node, name) in section {
        let expected = PriceTypeProto::from_str_name(name.as_str().unwrap()).unwrap();
        assert_eq!(shipped.default_for(&node), Some(expected), "{node}");
    }
}

#[test]
fn source_section_parses_to_the_shipped_table() {
    let parsed = default_price_types_from_hierarchy(&hierarchy().to_string()).unwrap();
    assert_eq!(&parsed, shipped_default_price_types().unwrap());
}

// ---------- guardrail 3: a broken section is InvalidRegistry ----------

#[test]
fn broken_section_is_invalid_registry() {
    let cases = [
        (r#"{"NOT_A_NODE": "PERCENTAGE"}"#, "NOT_A_NODE"),
        (r#"{"BOND": "PERCENT"}"#, "PERCENT"),
        (r#"{"BOND": "UNKNOWN_PRICE_TYPE"}"#, "UNKNOWN_PRICE_TYPE"),
        (r#"{"BOND": 2}"#, "BOND"),
        (r#"["BOND", "PERCENTAGE"]"#, "object"),
    ];
    for (json, needle) in cases {
        match parse_default_price_types(json) {
            Err(e @ ProductInputError::InvalidRegistry(_)) => {
                let message = e.to_string();
                assert!(message.contains("default_price_types") && message.contains(needle), "{json}: {message}");
            }
            other => panic!("{json}: expected InvalidRegistry, got {other:?}"),
        }
    }
}

#[test]
fn missing_section_is_invalid_registry() {
    let mut root = hierarchy();
    root.as_object_mut().unwrap().remove("default_price_types");
    match default_price_types_from_hierarchy(&root.to_string()) {
        Err(e @ ProductInputError::InvalidRegistry(_)) => assert!(e.to_string().contains("missing"), "{e}"),
        other => panic!("expected InvalidRegistry, got {other:?}"),
    }
}
