//! LM-412 is additive: PriceTypeProto gains RATE (5) and ProductTypeProto
//! gains T_BILL_13_WEEK_SERIES (36). Every existing value keeps its number
//! and name. Reads the checked-in descriptor set, so it also guards against a
//! stale `.bin`. The values come from test-fixtures/field-changes/lm-412.json.
//! Runs only with `cargo test --features test-utils`.

use std::collections::BTreeSet;

use ledger_models::fintekkers::models::price::PriceTypeProto;
use ledger_models::fintekkers::models::security::ProductTypeProto;
use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use prost_reflect::DescriptorPool;
use serde_json::Value;

const ENUMS: [&str; 2] = [
    ".fintekkers.models.price.PriceTypeProto",
    ".fintekkers.models.security.ProductTypeProto",
];

fn fixture() -> Value {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../test-fixtures/field-changes/lm-412.json");
    serde_json::from_str(&std::fs::read_to_string(path).expect("read fixture")).expect("parse fixture")
}

fn entries(section: &str) -> Vec<Value> {
    fixture()[section].as_array().unwrap().clone()
}

fn pool() -> DescriptorPool {
    DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set")
}

fn check(pool: &DescriptorPool, entry: &Value) {
    let name = entry["enum"].as_str().unwrap().trim_start_matches('.');
    let e = pool.get_enum_by_name(name).unwrap_or_else(|| panic!("{name} missing"));
    let number = entry["number"].as_i64().unwrap() as i32;
    let value = e.get_value(number).unwrap_or_else(|| panic!("{name} has no value {number}"));
    assert_eq!(value.name(), entry["name"].as_str().unwrap(), "{entry}");
}

#[test]
fn added_values_are_rate_and_t_bill_13_week_series() {
    let added: Vec<(String, i64, String)> = entries("added_values")
        .iter()
        .map(|v| (v["enum"].as_str().unwrap().to_string(), v["number"].as_i64().unwrap(), v["name"].as_str().unwrap().to_string()))
        .collect();
    assert_eq!(added, vec![
        (ENUMS[0].to_string(), 5, "RATE".to_string()),
        (ENUMS[1].to_string(), 36, "T_BILL_13_WEEK_SERIES".to_string()),
    ]);
    assert_eq!(PriceTypeProto::Rate as i32, 5);
    assert_eq!(PriceTypeProto::from_str_name("RATE"), Some(PriceTypeProto::Rate));
    assert_eq!(PriceTypeProto::Rate.as_str_name(), "RATE");
    assert_eq!(ProductTypeProto::TBill13WeekSeries as i32, 36);
    assert_eq!(ProductTypeProto::from_str_name("T_BILL_13_WEEK_SERIES"), Some(ProductTypeProto::TBill13WeekSeries));
    assert_eq!(ProductTypeProto::TBill13WeekSeries.as_str_name(), "T_BILL_13_WEEK_SERIES");
}

#[test]
fn added_values_have_their_number_and_name() {
    let pool = pool();
    for entry in entries("added_values") {
        check(&pool, &entry);
    }
}

#[test]
fn kept_values_keep_number_and_name() {
    let pool = pool();
    for entry in entries("kept") {
        check(&pool, &entry);
    }
}

#[test]
fn kept_plus_added_is_the_whole_enum() {
    let pool = pool();
    let listed: Vec<Value> = entries("kept").into_iter().chain(entries("added_values")).collect();
    for name in ENUMS {
        let expected: BTreeSet<(i64, String)> = listed
            .iter()
            .filter(|v| v["enum"].as_str() == Some(name))
            .map(|v| (v["number"].as_i64().unwrap(), v["name"].as_str().unwrap().to_string()))
            .collect();
        let e = pool.get_enum_by_name(name.trim_start_matches('.')).expect("enum");
        let actual: BTreeSet<(i64, String)> = e.values().map(|v| (v.number() as i64, v.name().to_string())).collect();
        assert_eq!(e.values().len(), expected.len(), "{name}");
        assert_eq!(actual, expected, "{name}");
    }
}
