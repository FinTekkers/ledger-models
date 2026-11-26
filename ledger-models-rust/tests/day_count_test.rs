//! LM-498 — bond day-count convention. `DayCountConventionProto`, optional
//! `BondDetailsProto.day_count`, hierarchy.json `default_day_count`, the
//! `SecurityWrapper::day_count` getter and the date helpers. Parity with
//! Python test_day_count.py, Java DayCountsTest and JS day_count.test.ts.
//!
//! Shared cases live in ledger-models-protos/fixtures/default_day_count_cases.json
//! and test-fixtures/day-count/cases.json; expected values come from those
//! files only, never from the code under test.

use std::collections::BTreeSet;

use chrono::NaiveDate;
use ledger_models::fintekkers::models::price::PriceTypeProto;
use ledger_models::fintekkers::models::security::{
    BondDetailsProto, DayCountConventionProto, EquityDetailsProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::models::security::security_proto::NonBondDetails;
use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use ledger_models::fintekkers::wrappers::models::day_count::{
    day_count, default_day_count_from_hierarchy, icma_period_fraction, icma_year_fraction, parse_default_day_count,
    resolve_day_count, shipped_default_day_counts, year_fraction, DayCountError,
};
use ledger_models::fintekkers::wrappers::models::default_price_types::default_price_types_from_hierarchy;
use ledger_models::fintekkers::wrappers::models::product_inputs::ProductInputError;
use ledger_models::fintekkers::wrappers::models::security::SecurityWrapper;
use prost::Message;
use prost_types::FileDescriptorSet;
use serde_json::Value;

fn read_json(relative: &str) -> Value {
    let path = format!("{}/{relative}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("read {path}: {e}"));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse {path}: {e}"))
}

fn product_cases() -> serde_json::Map<String, Value> {
    read_json("../ledger-models-protos/fixtures/default_day_count_cases.json")["cases"]
        .as_object()
        .expect("cases object")
        .clone()
}

fn date_cases() -> Vec<Value> {
    read_json("../test-fixtures/day-count/cases.json")["cases"].as_array().expect("cases array").clone()
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

fn bond(product_type: ProductTypeProto, day_count: Option<i32>) -> SecurityProto {
    SecurityProto {
        product_type: product_type.into(),
        bond_details: Some(BondDetailsProto { day_count, ..Default::default() }),
        ..Default::default()
    }
}

fn getter(proto: SecurityProto) -> DayCountConventionProto {
    SecurityWrapper::new(proto).day_count().expect("shipped registry")
}

fn date(v: &Value) -> NaiveDate {
    NaiveDate::parse_from_str(v.as_str().expect("date string"), "%Y-%m-%d").expect("ISO date")
}

fn ymd(y: i32, m: u32, d: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(y, m, d).expect("valid date")
}

// ---------- metric 1: enum numbers and presence ----------

#[test]
fn enum_numbers() {
    assert_eq!(DayCountConventionProto::UnknownDayCount as i32, 0);
    assert_eq!(DayCountConventionProto::ActActIcma as i32, 1);
    assert_eq!(DayCountConventionProto::Thirty360Us as i32, 2);
    assert_eq!(DayCountConventionProto::Act360 as i32, 3);
    assert_eq!(DayCountConventionProto::Act365Fixed as i32, 4);
}

#[test]
fn presence_is_false_when_unset_and_default_literal_compiles() {
    let bd = BondDetailsProto { coupon_rate: None, ..Default::default() };
    assert!(bd.day_count.is_none());
    let set = BondDetailsProto { day_count: Some(DayCountConventionProto::Act360.into()), ..Default::default() };
    assert_eq!(set.day_count(), DayCountConventionProto::Act360);
}

// ---------- metric 2: hierarchy.json default_day_count ----------

#[test]
fn shipped_section_has_the_six_leaf_mappings() {
    let section = hierarchy()["default_day_count"].clone();
    assert_eq!(
        section,
        serde_json::json!({
            "TREASURY_NOTE": "ACT_ACT_ICMA",
            "TREASURY_BOND": "ACT_ACT_ICMA",
            "TIPS": "ACT_ACT_ICMA",
            "STRIPS": "ACT_ACT_ICMA",
            "TBILL": "ACT_360",
            "CORP_BOND": "THIRTY_360_US"
        })
    );
    assert_eq!(&parse_default_day_count(&section.to_string()).unwrap(), shipped_default_day_counts().unwrap());
}

#[test]
fn fixture_lists_every_product_type_enum_value() {
    let keys: BTreeSet<String> = product_cases().keys().cloned().collect();
    assert_eq!(keys, product_type_names());
}

#[test]
fn every_product_resolves_as_the_fixture_says() {
    for (product_type, expected) in product_cases() {
        let pt = ProductTypeProto::from_str_name(&product_type).expect("enum name");
        let expected = DayCountConventionProto::from_str_name(expected.as_str().expect("string")).expect("name");
        assert_eq!(resolve_day_count(&bond(pt, None)).unwrap(), expected, "{product_type}");
    }
}

#[test]
fn broken_section_is_invalid_registry() {
    for (section, needle) in [
        (r#"{"NOT_A_NODE": "ACT_360"}"#, "NOT_A_NODE"),
        (r#"{"CORP_BOND": "THIRTY_360"}"#, "THIRTY_360"),
        (r#"{"CORP_BOND": "UNKNOWN_DAY_COUNT"}"#, "UNKNOWN_DAY_COUNT"),
        (r#"{"CORP_BOND": 2}"#, "CORP_BOND"),
        (r#"["CORP_BOND", "ACT_360"]"#, "object"),
    ] {
        match parse_default_day_count(section) {
            Err(ProductInputError::InvalidRegistry(detail)) => {
                assert!(detail.contains("default_day_count"), "{detail}");
                assert!(detail.contains(needle), "{needle}: {detail}");
            }
            other => panic!("{section}: expected InvalidRegistry, got {other:?}"),
        }
    }
    let mut root = hierarchy();
    root.as_object_mut().unwrap().remove("default_day_count");
    match default_day_count_from_hierarchy(&root.to_string()) {
        Err(ProductInputError::InvalidRegistry(detail)) => assert!(detail.contains("missing"), "{detail}"),
        other => panic!("expected InvalidRegistry, got {other:?}"),
    }
}

// ---------- metric 3: the getter ----------

#[test]
fn getter_returns_the_product_default_when_unset() {
    assert_eq!(getter(bond(ProductTypeProto::TreasuryNote, None)), DayCountConventionProto::ActActIcma);
    assert_eq!(getter(bond(ProductTypeProto::CorpBond, None)), DayCountConventionProto::Thirty360Us);
    assert_eq!(getter(bond(ProductTypeProto::Tbill, None)), DayCountConventionProto::Act360);
}

#[test]
fn getter_explicit_value_wins() {
    let proto = bond(ProductTypeProto::TreasuryNote, Some(DayCountConventionProto::Act360.into()));
    assert_eq!(getter(proto), DayCountConventionProto::Act360);
}

#[test]
fn round_trip_keeps_explicit_and_keeps_unset_unset() {
    let bytes = bond(ProductTypeProto::TreasuryNote, Some(DayCountConventionProto::Act360.into())).encode_to_vec();
    let explicit = SecurityProto::decode(bytes.as_slice()).unwrap();
    assert_eq!(explicit.bond_details.as_ref().unwrap().day_count, Some(DayCountConventionProto::Act360 as i32));
    assert_eq!(getter(explicit), DayCountConventionProto::Act360);

    let bytes = bond(ProductTypeProto::TreasuryNote, None).encode_to_vec();
    let unset = SecurityProto::decode(bytes.as_slice()).unwrap();
    assert!(unset.bond_details.as_ref().unwrap().day_count.is_none());
    assert_eq!(getter(unset), DayCountConventionProto::ActActIcma);
}

#[test]
fn round_trip_explicit_unknown_is_present_and_resolves_like_unset() {
    let bytes = bond(ProductTypeProto::CorpBond, Some(DayCountConventionProto::UnknownDayCount.into())).encode_to_vec();
    let parsed = SecurityProto::decode(bytes.as_slice()).unwrap();
    assert_eq!(parsed.bond_details.as_ref().unwrap().day_count, Some(0));
    assert_eq!(getter(parsed), DayCountConventionProto::Thirty360Us);
}

// ---------- guardrail 3: no entry is UNKNOWN_DAY_COUNT, never a guess ----------

#[test]
fn getter_returns_unknown_for_a_product_with_no_entry() {
    assert_eq!(getter(bond(ProductTypeProto::TreasuryFrn, None)), DayCountConventionProto::UnknownDayCount);
    assert_eq!(getter(bond(ProductTypeProto::ProductTypeUnknown, None)), DayCountConventionProto::UnknownDayCount);
}

#[test]
fn getter_returns_unknown_for_an_unrecognised_explicit_value() {
    assert_eq!(getter(bond(ProductTypeProto::CorpBond, Some(99))), DayCountConventionProto::UnknownDayCount);
}

#[test]
fn getter_on_an_equity_returns_unknown() {
    let equity = SecurityProto {
        product_type: ProductTypeProto::CommonStock.into(),
        non_bond_details: Some(NonBondDetails::EquityDetails(EquityDetailsProto::default())),
        ..Default::default()
    };
    assert_eq!(getter(equity), DayCountConventionProto::UnknownDayCount);
}

// ---------- metric 4: the date helpers ----------

#[test]
fn helpers_match_every_fixture_row() {
    let cases = date_cases();
    assert!(!cases.is_empty());
    for c in cases {
        let id = format!("{}:{}", c["convention"], c["case"]);
        let conv = DayCountConventionProto::from_str_name(c["convention"].as_str().unwrap()).expect("convention");
        let (start, end) = (date(&c["start"]), date(&c["end"]));
        assert_eq!(day_count(conv, start, end).unwrap(), c["day_count"].as_i64().unwrap(), "{id}");
        let expected = c["year_fraction"].as_f64().unwrap();
        if conv == DayCountConventionProto::ActActIcma {
            let (ps, pe) = (date(&c["period_start"]), date(&c["period_end"]));
            let frequency = u32::try_from(c["frequency"].as_u64().unwrap()).unwrap();
            let pf = icma_period_fraction(start, end, ps, pe).unwrap();
            assert!((pf - c["period_fraction"].as_f64().unwrap()).abs() <= 1e-12, "{id}: {pf}");
            let yf = icma_year_fraction(start, end, ps, pe, frequency).unwrap();
            assert!((yf - expected).abs() <= 1e-12, "{id}: {yf}");
        } else {
            let yf = year_fraction(conv, start, end).unwrap();
            assert!((yf - expected).abs() <= 1e-12, "{id}: {yf}");
        }
    }
}

#[test]
fn bad_input_is_a_typed_day_count_error() {
    let (jan, feb) = (ymd(2027, 1, 1), ymd(2027, 2, 1));
    let (ps, pe) = (ymd(2026, 12, 1), ymd(2027, 6, 1));
    assert!(matches!(
        day_count(DayCountConventionProto::Thirty360Us, feb, jan),
        Err(DayCountError::StartAfterEnd { .. })
    ));
    assert_eq!(day_count(DayCountConventionProto::UnknownDayCount, jan, feb), Err(DayCountError::UnknownConvention));
    assert_eq!(year_fraction(DayCountConventionProto::UnknownDayCount, jan, feb), Err(DayCountError::UnknownConvention));
    assert_eq!(year_fraction(DayCountConventionProto::ActActIcma, jan, feb), Err(DayCountError::UseIcma));
    assert!(matches!(icma_year_fraction(feb, jan, ps, pe, 2), Err(DayCountError::StartAfterEnd { .. })));
    assert!(matches!(
        icma_year_fraction(ymd(2026, 11, 1), feb, ps, pe, 2),
        Err(DayCountError::OutsidePeriod { .. })
    ));
    assert_eq!(icma_year_fraction(jan, feb, ps, pe, 0), Err(DayCountError::InvalidFrequency));
}

// ---------- guardrail 1: a bad day-count section breaks nothing else ----------

#[test]
fn bad_day_count_section_leaves_price_types_and_helpers_working() {
    let mut root = hierarchy();
    root["default_day_count"] = serde_json::json!({ "NOT_A_NODE": "ACT_360" });
    let text = root.to_string();
    assert!(matches!(default_day_count_from_hierarchy(&text), Err(ProductInputError::InvalidRegistry(_))));
    let price_types = default_price_types_from_hierarchy(&text).expect("price types still load");
    assert_eq!(price_types.default_for("TREASURY_NOTE"), Some(PriceTypeProto::Percentage));
    assert_eq!(day_count(DayCountConventionProto::Thirty360Us, ymd(2026, 12, 1), ymd(2027, 3, 1)), Ok(90));
}
