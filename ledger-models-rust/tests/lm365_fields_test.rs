//! LM-365 is additive: FrnInput and IssuanceProto keep every field's number,
//! name and type, and gain only ReferenceRateFixingProto, FrnInput.fixings
//! (11) and IssuanceProto.high_discount_rate (28). Reads the checked-in
//! descriptor set, so it also guards against a stale `.bin`.
//! The fields come from test-fixtures/field-changes/lm-365.json.
//! Runs only with `cargo test --features test-utils`.

use std::collections::{BTreeMap, BTreeSet};

use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use prost_reflect::{Cardinality, DescriptorPool, FieldDescriptor, Kind};
use serde_json::Value;

fn fixture() -> Value {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../test-fixtures/field-changes/lm-365.json");
    serde_json::from_str(&std::fs::read_to_string(path).expect("read fixture")).expect("parse fixture")
}

fn pool() -> DescriptorPool {
    DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set")
}

fn entries(section: &str) -> Vec<Value> {
    fixture()[section].as_array().unwrap().clone()
}

fn field(pool: &DescriptorPool, entry: &Value) -> FieldDescriptor {
    let msg_name = entry["message"].as_str().unwrap().trim_start_matches('.');
    let msg = pool.get_message_by_name(msg_name).unwrap_or_else(|| panic!("{msg_name} missing"));
    let number = entry["number"].as_u64().unwrap() as u32;
    msg.get_field(number).unwrap_or_else(|| panic!("{msg_name} has no field {number}"))
}

fn type_name(f: &FieldDescriptor) -> String {
    match f.kind() {
        Kind::Message(m) => format!(".{}", m.full_name()),
        Kind::Enum(e) => format!(".{}", e.full_name()),
        other => format!("{other:?}"),
    }
}

fn check(pool: &DescriptorPool, entry: &Value) {
    let f = field(pool, entry);
    assert_eq!(f.name(), entry["name"].as_str().unwrap(), "{entry}");
    assert_eq!(type_name(&f), entry["type"].as_str().unwrap(), "{entry}");
    let repeated = entry["repeated"].as_bool().unwrap_or(false);
    assert_eq!(f.cardinality() == Cardinality::Repeated, repeated, "{entry}");
}

#[test]
fn kept_fields_keep_number_name_and_type() {
    let pool = pool();
    for entry in entries("kept") {
        check(&pool, &entry);
    }
}

#[test]
fn added_fields_have_their_number_name_and_type() {
    let pool = pool();
    for entry in entries("added") {
        check(&pool, &entry);
    }
}

#[test]
fn field_sets_are_exactly_kept_and_added() {
    let pool = pool();
    let mut expected: BTreeMap<String, BTreeSet<u32>> = BTreeMap::new();
    for entry in entries("kept").iter().chain(entries("added").iter()) {
        let msg = entry["message"].as_str().unwrap().trim_start_matches('.').to_string();
        expected.entry(msg).or_default().insert(entry["number"].as_u64().unwrap() as u32);
    }
    assert_eq!(expected.len(), 3);
    for (msg_name, numbers) in &expected {
        let msg = pool.get_message_by_name(msg_name).unwrap();
        let actual: BTreeSet<u32> = msg.fields().map(|f| f.number()).collect();
        assert_eq!(&actual, numbers, "{msg_name}");
    }
}

#[test]
fn fixings_is_a_repeated_message_not_a_map() {
    let pool = pool();
    let fixings = pool
        .get_message_by_name("fintekkers.requests.valuation.FrnInput")
        .unwrap()
        .get_field_by_name("fixings")
        .unwrap();
    assert_eq!(fixings.cardinality(), Cardinality::Repeated);
    assert!(!fixings.is_map());
    match fixings.kind() {
        Kind::Message(m) => {
            assert_eq!(m.full_name(), "fintekkers.requests.valuation.ReferenceRateFixingProto");
            assert!(!m.is_map_entry());
        }
        other => panic!("fixings is {other:?}"),
    }
}

#[test]
fn fixing_index_is_the_frn_extension_reference_rate_index_enum() {
    let pool = pool();
    let enum_of = |msg: &str, name: &str| match pool.get_message_by_name(msg).unwrap().get_field_by_name(name).unwrap().kind() {
        Kind::Enum(e) => e.full_name().to_string(),
        other => panic!("{msg}.{name} is {other:?}"),
    };
    let index = enum_of("fintekkers.requests.valuation.ReferenceRateFixingProto", "index");
    assert_eq!(index, enum_of("fintekkers.models.security.FrnExtensionProto", "reference_rate_index"));
    assert_eq!(index, "fintekkers.models.security.index.IndexTypeProto");
}
