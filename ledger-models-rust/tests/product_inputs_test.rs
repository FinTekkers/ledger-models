//! LM-409 — valuation_arms in hierarchy.json, resolved by
//! `product_inputs::arm_for` / `required_market_data`.
//!
//! The shared cases live in ledger-models-protos/fixtures/valuation_arms_cases.json,
//! read by the Java, Python and JS tests too.

use ledger_models::fintekkers::models::security::{
    BondDetailsProto, CouponTypeProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::wrappers::models::product_hierarchy;
use ledger_models::fintekkers::wrappers::models::product_inputs::{
    arm_for, measures_for_arm, parse_valuation_arms, required_market_data, shipped_valuation_arms,
    MarketDataKind, ProductInputError,
};
use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use prost::Message;
use prost_types::FileDescriptorSet;
use serde_json::Value;

fn read_json(relative: &str) -> Value {
    let path = format!("{}/{relative}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {path}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {path}: {e}"))
}

fn source_section() -> Value {
    read_json("../ledger-models-protos/hierarchy.json")["valuation_arms"].clone()
}

fn security(product_type: ProductTypeProto, coupon_type: CouponTypeProto) -> SecurityProto {
    SecurityProto {
        product_type: product_type.into(),
        bond_details: Some(BondDetailsProto {
            coupon_type: coupon_type.into(),
            ..Default::default()
        }),
        ..Default::default()
    }
}

/// (arm, requires) through a real proto when the type has an enum value;
/// planned leaves by name.
fn resolve(product_type: &str, coupon_type: &str) -> Result<(String, Vec<String>), ProductInputError> {
    let names = |v: Vec<MarketDataKind>| v.iter().map(|k| k.as_str_name().to_string()).collect();
    match ProductTypeProto::from_str_name(product_type) {
        Some(pt) => {
            let coupon = CouponTypeProto::from_str_name(coupon_type).expect("coupon type name");
            let s = security(pt, coupon);
            Ok((arm_for(&s)?.to_string(), names(required_market_data(&s)?)))
        }
        None => {
            let a = shipped_valuation_arms()?.resolve(product_type, coupon_type)?;
            Ok((a.arm.clone(), names(a.requires.clone())))
        }
    }
}

fn unmapped(product_type: &str, coupon_type: &str) -> ProductInputError {
    ProductInputError::Unmapped {
        product_type: product_type.to_string(),
        coupon_type: coupon_type.to_string(),
    }
}

// ---------- metric 1: shared fixture ----------

#[test]
fn fixture_cases() {
    let root = read_json("../ledger-models-protos/fixtures/valuation_arms_cases.json");
    let cases = root["cases"].as_array().expect("fixture has cases");
    assert!(cases.len() >= 5, "fixture has too few cases: {}", cases.len());
    let mut seen = Vec::new();
    for case in cases {
        let pt = case["product_type"].as_str().expect("product_type");
        let coupon = case["coupon_type"].as_str().expect("coupon_type");
        seen.push(format!("{pt}/{coupon}"));
        if let Some(error) = case.get("error") {
            assert_eq!(error, "UnmappedProductTypeError");
            assert_eq!(resolve(pt, coupon), Err(unmapped(pt, coupon)), "{pt}/{coupon}");
        } else {
            let requires: Vec<String> = case["requires"]
                .as_array()
                .expect("requires")
                .iter()
                .map(|r| r.as_str().expect("requires value").to_string())
                .collect();
            let arm = case["arm"].as_str().expect("arm").to_string();
            assert_eq!(resolve(pt, coupon), Ok((arm, requires)), "{pt}/{coupon}");
        }
    }
    for required in ["TBILL/ZERO", "TIPS/FIXED", "CORP_BOND/FLOAT", "TREASURY_NOTE/FLOAT", "FX_SPOT/UNKNOWN_COUPON_TYPE"] {
        assert!(seen.iter().any(|s| s == required), "fixture is missing {required}: {seen:?}");
    }
}

// ---------- metric 2: unmapped types are Err(Unmapped) ----------

#[test]
fn unmapped_types_are_errors() {
    let mut types = vec!["FX_SPOT".to_string()];
    for root in ["INDEX", "CRYPTO", "COMMODITY_SPOT"] {
        types.extend(
            product_hierarchy::descendants_of(root)
                .into_iter()
                .filter(|n| product_hierarchy::descendants_of(n).is_empty()),
        );
    }
    for required in ["FX_SPOT", "COMMODITY_INDEX", "PLATINUM", "PALLADIUM", "CRYPTOCURRENCY", "GOLD"] {
        assert!(types.iter().any(|t| t == required), "{required} missing from {types:?}");
    }
    for pt in &types {
        let err = resolve(pt, "UNKNOWN_COUPON_TYPE").expect_err(pt);
        assert_eq!(err, unmapped(pt, "UNKNOWN_COUPON_TYPE"));
        let message = err.to_string();
        assert!(message.contains(pt.as_str()) && message.contains("UNKNOWN_COUPON_TYPE"), "{message}");
    }
}

#[test]
fn message_names_product_and_coupon_type() {
    let gold = security(ProductTypeProto::Gold, CouponTypeProto::Float);
    let err = arm_for(&gold).expect_err("GOLD has no arm");
    assert_eq!(err, unmapped("GOLD", "FLOAT"));
    let message = err.to_string();
    assert!(message.contains("GOLD") && message.contains("FLOAT"), "{message}");
    assert_eq!(required_market_data(&gold), Err(unmapped("GOLD", "FLOAT")));
}

#[test]
fn unset_bond_details_reads_as_unknown_coupon_type() {
    let corp = SecurityProto { product_type: ProductTypeProto::CorpBond.into(), ..Default::default() };
    assert_eq!(arm_for(&corp), Ok("bond"));
    let fx = SecurityProto { product_type: ProductTypeProto::FxSpot.into(), ..Default::default() };
    assert_eq!(arm_for(&fx), Err(unmapped("FX_SPOT", "UNKNOWN_COUPON_TYPE")));
}

// ---------- LM-411: every ProductTypeProto value maps to an arm or raises ----------

/// The `ProductInput` arm names and the `ProductTypeProto` values, from the
/// descriptor set.
fn arms_and_product_types() -> (Vec<String>, Vec<i32>) {
    let set = FileDescriptorSet::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set");
    let mut arms = vec![];
    let mut types = vec![];
    for file in &set.file {
        for m in file.message_type.iter().filter(|m| m.name() == "ProductInput") {
            let input = m.oneof_decl.iter().position(|o| o.name() == "input").expect("oneof input") as i32;
            arms.extend(m.field.iter().filter(|f| f.oneof_index == Some(input)).map(|f| f.name().to_string()));
        }
        for e in file.enum_type.iter().filter(|e| e.name() == "ProductTypeProto") {
            types.extend(e.value.iter().map(|v| v.number()));
        }
    }
    assert!(!arms.is_empty() && !types.is_empty());
    (arms, types)
}

#[test]
fn every_product_type_maps_to_an_arm_or_raises() {
    let (arms, types) = arms_and_product_types();
    for value in types {
        let pt = ProductTypeProto::from_i32(value).expect("enum value");
        let s = SecurityProto { product_type: value, ..Default::default() };
        match arm_for(&s) {
            Ok(arm) => assert!(arms.iter().any(|a| a == arm), "{} -> {arm}", pt.as_str_name()),
            Err(err) => {
                assert_eq!(err, unmapped(pt.as_str_name(), "UNKNOWN_COUPON_TYPE"));
                assert!(err.to_string().contains(pt.as_str_name()), "{err}");
            }
        }
    }
}

#[test]
fn product_type_unknown_raises() {
    let s = SecurityProto { product_type: ProductTypeProto::ProductTypeUnknown.into(), ..Default::default() };
    let err = arm_for(&s).expect_err("PRODUCT_TYPE_UNKNOWN has no arm");
    assert!(err.to_string().contains("PRODUCT_TYPE_UNKNOWN"), "{err}");
}

// ---------- metric 3 ----------

#[test]
fn every_leaf_covered() {
    assert_eq!(shipped_valuation_arms().expect("shipped section").uncovered_leaves(), Vec::<String>::new());
}

// ---------- metric 4: bundled section equals source ----------

#[test]
fn bundled_section_matches_source() {
    // The crate-root mirror is what product_inputs embeds with include_str!.
    let bundled = read_json("hierarchy.json");
    assert!(bundled.get("valuation_arms").is_some(), "bundled hierarchy.json has no valuation_arms");
    assert_eq!(bundled["valuation_arms"], source_section());
}

// ---------- metric 5: closed requires vocabulary ----------

#[test]
fn parse_rejects_unknown_requires() {
    let mut section = source_section();
    section["entries"][0]["requires"]
        .as_array_mut()
        .expect("requires list")
        .push(Value::from("FX_RATE"));
    match parse_valuation_arms(&section.to_string()) {
        Err(ProductInputError::InvalidRegistry(detail)) => assert!(detail.contains("FX_RATE"), "{detail}"),
        other => panic!("expected InvalidRegistry, got {other:?}"),
    }
}

#[test]
fn unmapped_maps_to_invalid_argument() {
    let status: tonic::Status = unmapped("FX_SPOT", "UNKNOWN_COUPON_TYPE").into();
    assert_eq!(status.code(), tonic::Code::InvalidArgument);
}

// ---------- LM-427: measures_for_arm ----------

const ARMS: [&str; 6] = ["bond", "tips", "frn", "mbs", "equity", "cash"];

fn measures_fixture() -> Value {
    read_json("../test-fixtures/catalog/measures-for-arm.json")
}

fn measure_names(arm: &str) -> Vec<String> {
    measures_for_arm(arm)
        .unwrap_or_else(|e| panic!("{arm}: {e}"))
        .iter()
        .map(|m| m.as_str_name().to_string())
        .collect()
}

#[test]
fn measures_fixture_lists_the_six_arms_none_empty() {
    let fixture = measures_fixture();
    let arms = fixture["arms"].as_object().expect("arms");
    let mut keys: Vec<&str> = arms.keys().map(String::as_str).collect();
    keys.sort();
    let mut expected = ARMS.to_vec();
    expected.sort();
    assert_eq!(keys, expected);
    for (arm, list) in arms {
        assert!(!list.as_array().expect("list").is_empty(), "{arm}");
    }
}

#[test]
fn measures_for_arm_matches_the_shared_fixture() {
    let fixture = measures_fixture();
    for arm in ARMS {
        let mut expected: Vec<String> = fixture["arms"][arm]
            .as_array()
            .expect("list")
            .iter()
            .map(|v| v.as_str().expect("name").to_string())
            .collect();
        expected.sort();
        let mut got = measure_names(arm);
        let mut distinct = got.clone();
        distinct.sort();
        distinct.dedup();
        assert_eq!(got.len(), distinct.len(), "{arm} has duplicates");
        got.sort();
        assert_eq!(got, expected, "{arm}");
    }
}

#[test]
fn measures_for_arm_frn_and_tips() {
    let frn = measure_names("frn");
    for name in ["CONVEXITY", "MODIFIED_DURATION", "DV01", "PROFIT_LOSS_PERCENT"] {
        assert!(!frn.contains(&name.to_string()), "frn has {name}");
    }
    let tips = measure_names("tips");
    for name in ["REFERENCE_CPI", "INDEX_RATIO"] {
        assert!(tips.contains(&name.to_string()), "tips lacks {name}");
    }
}

#[test]
fn measures_for_unknown_arm_is_unmapped() {
    let fixture = measures_fixture();
    let arm = fixture["unknown_arm"].as_str().expect("unknown_arm");
    let err = measures_for_arm(arm).expect_err("unknown arm");
    assert!(
        matches!(err, ProductInputError::Unmapped { ref product_type, .. } if product_type == "swap"),
        "{err:?}"
    );
}
