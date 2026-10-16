//! Fields removed in 0.5 (LM-344) are gone from the checked-in descriptor set,
//! and their numbers and names are reserved. Guards against a stale `.bin`.
//! The fields come from test-fixtures/removed-fields/lm-344.json.
//! Runs only with `cargo test --features test-utils`.

use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use prost_reflect::{DescriptorPool, MessageDescriptor};
use serde_json::Value;

fn fixture() -> Value {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../test-fixtures/removed-fields/lm-344.json");
    serde_json::from_str(&std::fs::read_to_string(path).expect("read fixture")).expect("parse fixture")
}

fn message(pool: &DescriptorPool, entry: &Value) -> MessageDescriptor {
    let name = entry["message"].as_str().unwrap().trim_start_matches('.');
    pool.get_message_by_name(name).unwrap_or_else(|| panic!("{name} missing"))
}

#[test]
fn removed_fields_are_gone_and_reserved() {
    let pool = DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set");
    let fields = fixture()["fields"].as_array().unwrap().clone();
    assert_eq!(fields.len(), 3);
    for f in &fields {
        let msg = message(&pool, f);
        let number = f["number"].as_u64().unwrap() as u32;
        let name = f["name"].as_str().unwrap();
        assert!(msg.get_field(number).is_none(), "{} still has field {number}", msg.full_name());
        assert!(msg.get_field_by_name(name).is_none(), "{} still has {name}", msg.full_name());
        // Ranges are half-open: `reserved 24, 25` may be one range [24, 26).
        assert!(
            msg.reserved_ranges().any(|r| r.contains(&number)),
            "{} does not reserve {number}",
            msg.full_name()
        );
        assert!(msg.reserved_names().any(|n| n == name), "{} does not reserve {name}", msg.full_name());
    }
}

#[test]
fn tips_cpi_field_is_kept() {
    let pool = DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set");
    let kept = &fixture()["kept"];
    let field = message(&pool, kept)
        .get_field(kept["number"].as_u64().unwrap() as u32)
        .expect("TipsInput field 4 missing");
    assert_eq!(field.name(), kept["name"].as_str().unwrap());
}
