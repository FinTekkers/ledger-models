//! LM-418 — the deprecated arm-named items give the same results as the
//! input-type names they call, the kept `arm` fields equal `input_type()`,
//! and hierarchy.json still loads with the legacy `valuation_arms` / `arm`
//! keys for one release.
#![allow(deprecated)]

use ledger_models::fintekkers::models::price::PriceProto;
use ledger_models::fintekkers::models::security::{
    BondDetailsProto, CouponTypeProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::wrappers::models::product_inputs::{
    arm_for, for_security, input_type_for, measures_for_arm, measures_for_input_type,
    parse_valuation_arms, parse_valuation_input_types, shipped_valuation_arms,
    shipped_valuation_input_types, valuation_input_types_from_hierarchy, Arm, InputTypeEntry,
    MarketData, MarketDataKind, MissingMarketDataError, ProductInputError, ValuationArms,
    ValuationInputTypes,
};
use serde_json::Value;

fn read_json(relative: &str) -> Value {
    let path = format!("{}/{relative}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {path}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {path}: {e}"))
}

fn hierarchy() -> Value {
    read_json("../ledger-models-protos/hierarchy.json")
}

/// `root` with the section and entry keys renamed to the legacy names.
fn legacy(root: &Value) -> Value {
    let mut out = root.clone();
    let obj = out.as_object_mut().expect("root object");
    let mut section = obj.remove("valuation_input_types").expect("section");
    for entry in section["entries"].as_array_mut().expect("entries") {
        let entry = entry.as_object_mut().expect("entry");
        let input_type = entry.remove("input_type").expect("input_type");
        entry.insert("arm".to_string(), input_type);
    }
    obj.insert("valuation_arms".to_string(), section);
    out
}

// ---------- metric 2: the aliases match the new names ----------

#[test]
fn arm_for_matches_input_type_for_on_every_fixture_case() {
    let root = read_json("../ledger-models-protos/fixtures/valuation_input_types_cases.json");
    let mut compared = 0;
    for case in root["cases"].as_array().expect("cases") {
        let pt = case["product_type"].as_str().expect("product_type");
        let Some(product_type) = ProductTypeProto::from_str_name(pt) else { continue };
        let coupon = CouponTypeProto::from_str_name(case["coupon_type"].as_str().expect("coupon_type"))
            .expect("coupon type name");
        let s = SecurityProto {
            product_type: product_type.into(),
            bond_details: Some(BondDetailsProto { coupon_type: coupon.into(), ..Default::default() }),
            ..Default::default()
        };
        let expected = input_type_for(&s);
        assert_eq!(arm_for(&s), expected, "{pt}");
        assert_eq!(arm_for(&s).map_err(|e| e.to_string()), expected.clone().map_err(|e| e.to_string()), "{pt}");
        if let Some(input_type) = case["input_type"].as_str() {
            assert_eq!(expected, Ok(input_type), "{pt}");
        }
        compared += 1;
    }
    assert!(compared >= 5, "too few fixture cases compared: {compared}");
}

#[test]
fn measures_for_arm_matches_measures_for_input_type() {
    let fixture = read_json("../test-fixtures/catalog/measures-for-input-type.json");
    let mut input_types: Vec<String> =
        fixture["input_types"].as_object().expect("input_types").keys().cloned().collect();
    input_types.push(fixture["unknown_input_type"].as_str().expect("unknown_input_type").to_string());
    for input_type in &input_types {
        let expected = measures_for_input_type(input_type);
        assert_eq!(measures_for_arm(input_type), expected, "{input_type}");
        assert_eq!(
            measures_for_arm(input_type).map_err(|e| e.to_string()),
            expected.map_err(|e| e.to_string()),
            "{input_type}"
        );
    }
}

#[test]
fn the_section_aliases_match_the_new_names() {
    let section = hierarchy()["valuation_input_types"].to_string();
    let parsed: ValuationArms = parse_valuation_arms(&section).expect("parse");
    assert_eq!(parsed, parse_valuation_input_types(&section).expect("parse"));
    let shipped: &ValuationInputTypes = shipped_valuation_arms().expect("shipped");
    assert!(std::ptr::eq(shipped, shipped_valuation_input_types().expect("shipped")));

    let entry: &Arm = shipped.resolve("TIPS", "FIXED").expect("tips");
    assert_eq!(entry.input_type(), "tips");
    assert_eq!(entry.arm, entry.input_type());
    let built = InputTypeEntry { arm: "frn".to_string(), requires: vec![MarketDataKind::FrnFixings] };
    assert_eq!(built.input_type(), "frn");
}

#[test]
fn missing_market_data_arm_field_matches_input_type() {
    let tips = SecurityProto { product_type: ProductTypeProto::Tips.into(), ..Default::default() };
    let e = match for_security(&tips, &PriceProto::default(), &MarketData::default()) {
        Err(ProductInputError::MissingMarketData(e)) => e,
        other => panic!("expected MissingMarketData, got {other:?}"),
    };
    assert_eq!(e.input_type(), "tips");
    assert_eq!(e.arm, e.input_type());
    assert!(e.to_string().contains("for input type tips"), "{e}");

    // The compatibility promise: a struct literal with `arm:` still compiles.
    let built = MissingMarketDataError {
        arm: "tips".to_string(),
        kind: MarketDataKind::CpiU,
        field: "tips.cpi".to_string(),
        object_id: None,
    };
    assert_eq!(built.input_type(), "tips");
    assert_eq!(built.violation().message, "missing market data CPI_U for input type tips");
}

// ---------- metric 3: the legacy keys load the same mapping ----------

#[test]
fn the_legacy_keys_load_the_same_mapping() {
    let root = hierarchy();
    assert_eq!(root["valuation_input_types"]["entries"].as_array().expect("entries").len(), 8);
    let current = valuation_input_types_from_hierarchy(&root.to_string()).expect("current");
    let old = valuation_input_types_from_hierarchy(&legacy(&root).to_string()).expect("legacy");
    assert_eq!(current, old);
    assert_eq!(&current, shipped_valuation_input_types().expect("shipped"));
    assert_eq!(current.uncovered_leaves(), old.uncovered_leaves());
}

#[test]
fn ambiguous_or_missing_keys_are_rejected() {
    let cases: [(&str, fn(&mut Value)); 3] = [
        ("both root keys", |r| r["valuation_arms"] = r["valuation_input_types"].clone()),
        ("neither root key", |r| {
            r.as_object_mut().expect("root").remove("valuation_input_types");
        }),
        ("an entry with both fields", |r| {
            r["valuation_input_types"]["entries"][0]["arm"] = Value::from("bond");
        }),
    ];
    for (name, brk) in cases {
        let mut root = hierarchy();
        brk(&mut root);
        match valuation_input_types_from_hierarchy(&root.to_string()) {
            Err(e @ ProductInputError::InvalidRegistry(_)) => {
                assert!(e.to_string().contains("valuation_input_types"), "{name}: {e}")
            }
            other => panic!("{name}: expected InvalidRegistry, got {other:?}"),
        }
    }
}
