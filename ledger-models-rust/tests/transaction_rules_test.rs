//! LM-438: transaction child-structure rules. The same fixture
//! (test-fixtures/transaction-children/cases.json) runs in Java, Python and JS.

use ledger_models::fintekkers::models::security::security_proto::NonBondDetails;
use ledger_models::fintekkers::models::security::{CashDetailsProto, ProductTypeProto, SecurityProto};
use ledger_models::fintekkers::models::transaction::{TransactionProto, TransactionTypeProto};
use ledger_models::fintekkers::models::util::UuidProto;
use ledger_models::fintekkers::wrappers::models::transaction::{
    require_valid_transaction, validate_transaction, SECOND_CASH_CHILD,
};
use serde_json::Value;
use uuid::Uuid;

fn cases() -> Vec<Value> {
    let path = format!("{}/../test-fixtures/transaction-children/cases.json", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {path}: {e}"));
    let root: Value = serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {path}: {e}"));
    root["cases"].as_array().expect("cases array").clone()
}

fn case(name: &str) -> Value {
    cases().into_iter().find(|c| c["name"] == name).unwrap_or_else(|| panic!("no case {name}"))
}

fn uuid(s: &str) -> UuidProto {
    let raw_uuid = if s.is_empty() { Vec::new() } else { Uuid::parse_str(s).expect("uuid").as_bytes().to_vec() };
    UuidProto { raw_uuid }
}

fn security(s: &Value) -> SecurityProto {
    let mut p = SecurityProto { uuid: Some(uuid(s["uuid"].as_str().expect("security uuid"))), ..Default::default() };
    if s["link"].as_bool() == Some(true) {
        p.is_link = true;
        return p;
    }
    if let Some(pt) = s["product_type"].as_str() {
        p.product_type = ProductTypeProto::from_str_name(pt).expect("product_type") as i32;
    }
    if s["cash_details"].as_bool() == Some(true) {
        p.non_bond_details = Some(NonBondDetails::CashDetails(CashDetailsProto::default()));
    }
    p
}

fn node(n: &Value) -> TransactionProto {
    TransactionProto {
        uuid: n["uuid"].as_str().map(uuid),
        transaction_type: TransactionTypeProto::from_str_name(n["transaction_type"].as_str().expect("type"))
            .expect("transaction_type") as i32,
        security: Some(security(&n["security"])),
        child_transactions: n["children"].as_array().map(|c| c.iter().map(node).collect()).unwrap_or_default(),
        ..Default::default()
    }
}

#[test]
fn fixture_has_the_six_cases() {
    let mut names: Vec<String> = cases().iter().map(|c| c["name"].as_str().unwrap_or_default().to_string()).collect();
    names.sort();
    assert_eq!(
        names,
        ["children_without_uuid", "duplicate_child_ids", "maturation_with_two_cash", "two_cash_children", "valid_buy", "valid_sell"]
    );
}

#[test]
fn shared_fixture_cases() {
    for c in cases() {
        let name = c["name"].as_str().unwrap_or_default();
        let actual = validate_transaction(&node(&c["transaction"]));
        let expected = c["violations"].as_array().expect("violations");
        assert_eq!(actual.len(), expected.len(), "{name}: {actual:?}");
        for (want, got) in expected.iter().zip(&actual) {
            assert_eq!(got.field, want["field"].as_str().unwrap_or_default(), "{name}");
            let object_id = got.object_id.as_ref().expect("object_id");
            assert_eq!(Uuid::from_slice(&object_id.raw_uuid).ok(), Uuid::parse_str(want["object_id"].as_str().unwrap_or_default()).ok(), "{name}");
            for id in want["message_ids"].as_array().expect("message_ids") {
                let id = id.as_str().unwrap_or_default();
                assert!(got.message.contains(id), "{name}: {id} not in {}", got.message);
            }
        }
    }
}

#[test]
fn children_without_uuid_has_an_empty_raw_uuid_child() {
    let p = node(&case("children_without_uuid")["transaction"]);
    assert!(p.child_transactions[0].uuid.is_none());
    assert_eq!(p.child_transactions[2].uuid.as_ref().map(|u| u.raw_uuid.len()), Some(0));
}

#[test]
fn two_cash_children_require_valid_errs() {
    let err = require_valid_transaction(&node(&case("two_cash_children")["transaction"])).expect_err("invalid");
    let violations = err.violations();
    assert_eq!(violations.len(), 1);
    assert_eq!(violations[0].field, "child_transactions[1]");
    assert!(violations[0].message.starts_with(SECOND_CASH_CHILD));
}
