//! LM-463: trade-price rule. The same fixture
//! (test-fixtures/transaction-price/cases.json) runs in Java, Python and JS.

use ledger_models::fintekkers::models::price::{PriceProto, PriceTypeProto};
use ledger_models::fintekkers::models::transaction::TransactionProto;
use ledger_models::fintekkers::models::util::UuidProto;
use ledger_models::fintekkers::requests::util::errors::FieldViolationProto;
use ledger_models::fintekkers::wrappers::models::transaction::{
    validate_transaction, PRICE_PREFIX, UNKNOWN_TRADE_PRICE_TYPE,
};
use serde_json::Value;
use std::collections::HashSet;
use uuid::Uuid;

fn cases() -> Vec<Value> {
    let path = format!("{}/../test-fixtures/transaction-price/cases.json", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {path}: {e}"));
    let root: Value = serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {path}: {e}"));
    root["cases"].as_array().expect("cases array").clone()
}

fn case(name: &str) -> Value {
    cases().into_iter().find(|c| c["name"] == name).unwrap_or_else(|| panic!("no case {name}"))
}

fn uuid(s: &str) -> UuidProto {
    UuidProto { raw_uuid: Uuid::parse_str(s).expect("uuid").as_bytes().to_vec() }
}

fn price(p: &Value) -> PriceProto {
    let price_type = match &p["price_type"] {
        Value::Null => 0,
        // A number is the raw wire value.
        Value::Number(n) => n.as_i64().expect("price_type number") as i32,
        v => PriceTypeProto::from_str_name(v.as_str().expect("price_type name")).expect("price_type") as i32,
    };
    PriceProto {
        uuid: p["uuid"].as_str().map(uuid),
        is_link: p["link"].as_bool() == Some(true),
        price_type,
        ..Default::default()
    }
}

fn transaction(t: &Value) -> TransactionProto {
    TransactionProto {
        uuid: Some(uuid(t["uuid"].as_str().expect("transaction uuid"))),
        price: t.get("price").map(price),
        ..Default::default()
    }
}

fn field() -> String {
    format!("{PRICE_PREFIX}price_type")
}

fn on_price_type(violations: Vec<FieldViolationProto>) -> Vec<FieldViolationProto> {
    violations.into_iter().filter(|v| v.field == field()).collect()
}

#[test]
fn fixture_has_every_case_including_the_metric_cases() {
    let all = cases();
    let names: HashSet<String> = all.iter().map(|c| c["name"].as_str().expect("name").to_string()).collect();
    assert_eq!(names.len(), all.len(), "case names must be unique");
    for want in [
        "inline_unknown", "inline_unknown_no_uuid", "inline_absolute", "inline_percentage", "inline_rate",
        "inline_unrecognised_value", "link_no_price_type", "link_unknown_explicit", "no_price",
    ] {
        assert!(names.contains(want), "missing case {want}");
    }
}

#[test]
fn every_fixture_case_runs() {
    let all = cases();
    let mut ran = 0;
    for c in &all {
        let name = c["name"].as_str().expect("name");
        let actual = validate_transaction(&transaction(&c["transaction"]));
        let want = c["violations"].as_array().expect("violations");
        assert_eq!(actual.len(), want.len(), "{name}: {actual:?}");
        for (w, got) in want.iter().zip(&actual) {
            assert_eq!(got.field, w["field"].as_str().expect("field"), "{name}");
            assert_eq!(got.message, w["message"].as_str().expect("message"), "{name}");
            assert_eq!(got.object_id, w["object_id"].as_str().map(uuid), "{name}");
        }
        ran += 1;
    }
    assert_eq!(ran, all.len());
}

#[test]
fn inline_unknown_gives_exactly_one_violation_on_price_type() {
    let actual = validate_transaction(&transaction(&case("inline_unknown")["transaction"]));
    assert_eq!(actual.len(), 1, "{actual:?}");
    assert_eq!(actual[0].field, "price.price_type");
    assert!(actual[0].message.contains("price_type"));
    assert_eq!(actual[0].message, UNKNOWN_TRADE_PRICE_TYPE);
}

#[test]
fn inline_absolute_percentage_rate_give_no_violation() {
    for name in ["inline_absolute", "inline_percentage", "inline_rate"] {
        assert!(on_price_type(validate_transaction(&transaction(&case(name)["transaction"]))).is_empty(), "{name}");
    }
}

#[test]
fn link_price_is_never_checked() {
    for name in ["link_no_price_type", "link_unknown_explicit"] {
        assert!(on_price_type(validate_transaction(&transaction(&case(name)["transaction"]))).is_empty(), "{name}");
    }
}

#[test]
fn unrecognised_raw_value_passes() {
    let proto = TransactionProto {
        price: Some(PriceProto { price_type: 999, ..Default::default() }),
        ..Default::default()
    };
    assert!(PriceTypeProto::from_i32(999).is_none());
    assert!(validate_transaction(&proto).is_empty());
}

#[test]
fn every_named_price_type_except_unknown_passes() {
    let mut visited = Vec::new();
    for n in 1..=64 {
        let Some(t) = PriceTypeProto::from_i32(n) else { continue };
        let proto = TransactionProto {
            price: Some(PriceProto { price_type: t as i32, ..Default::default() }),
            ..Default::default()
        };
        assert!(validate_transaction(&proto).is_empty(), "{t:?}");
        visited.push(t);
    }
    assert!(visited.len() >= 5, "{visited:?}");
    assert!(visited.contains(&PriceTypeProto::Rate), "{visited:?}");
}
