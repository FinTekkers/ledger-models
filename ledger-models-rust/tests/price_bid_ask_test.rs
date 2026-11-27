//! LM-508: PriceProto bid / ask / mid. Driven by
//! test-fixtures/price/lm-508-cases.json, which the Java, Python and JS tests
//! share. Values compare as canonical plain strings (`Decimal::to_string`
//! keeps the scale), so a scale or precision drift fails.

mod common;
use common::decimal;

use std::str::FromStr;

use ledger_models::fintekkers::models::price::{PriceProto, PriceTypeProto};
use ledger_models::fintekkers::models::security::SecurityProto;
use ledger_models::fintekkers::models::util::UuidProto;
use ledger_models::fintekkers::wrappers::models::price::{
    resolved_price_decimal, validate_price, PriceKind, PriceProtoBuilder, PriceWrapper,
};
use ledger_models::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use ledger_models::fintekkers::wrappers::models::utils::decimal::{decode_decimal, DecimalWrapper};
use ledger_models::fintekkers::wrappers::models::utils::errors::Error;
use ledger_models::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use prost::Message;
use rust_decimal::Decimal;
use serde_json::Value;
use uuid::Uuid;

fn cases() -> Value {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../test-fixtures/price/lm-508-cases.json");
    serde_json::from_str(&std::fs::read_to_string(path).expect("read cases")).expect("parse cases")
}

fn unhex(s: &str) -> Vec<u8> {
    (0..s.len()).step_by(2).map(|i| u8::from_str_radix(&s[i..i + 2], 16).expect("hex")).collect()
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn uuid(s: &str) -> UuidProto {
    UuidProto { raw_uuid: Uuid::parse_str(s).expect("uuid").as_bytes().to_vec() }
}

fn legacy() -> (Value, PriceProto) {
    let legacy = cases()["legacy"].clone();
    let proto = PriceProto::decode(unhex(legacy["hex"].as_str().expect("hex")).as_slice()).expect("decode");
    (legacy, proto)
}

fn side(c: &Value, key: &str) -> Option<Decimal> {
    c.get(key).map(|v| Decimal::from_str(v.as_str().expect("decimal string")).expect("decimal"))
}

fn kind(name: &str) -> PriceKind {
    match name {
        "MID" => PriceKind::Mid,
        "DERIVED_MID" => PriceKind::DerivedMid,
        "BID" => PriceKind::Bid,
        "ASK" => PriceKind::Ask,
        other => panic!("unknown kind {other}"),
    }
}

/// A quote built with the builder: any mix of mid, bid and ask.
fn quote(c: &Value) -> PriceProto {
    let mut b = PriceProtoBuilder::new().price_type(PriceTypeProto::Percentage);
    if let Some(v) = side(c, "mid") {
        b = b.mid(DecimalWrapper::from(v));
    }
    if let Some(v) = side(c, "bid") {
        b = b.bid(DecimalWrapper::from(v));
    }
    if let Some(v) = side(c, "ask") {
        b = b.ask(DecimalWrapper::from(v));
    }
    b.build().expect("build")
}

fn name(c: &Value) -> &str {
    c["name"].as_str().expect("name")
}

fn plain(v: Option<Decimal>) -> Option<String> {
    v.map(|d| d.to_string())
}

fn expected(c: &Value, key: &str) -> Option<String> {
    c.get(key).map(|v| v.as_str().expect("string").to_string())
}

#[test]
fn legacy_bytes_read_as_mid() {
    let (legacy, proto) = legacy();

    assert_eq!(decode_decimal(proto.mid.as_ref().expect("mid")).expect("decode").to_canonical_string(), legacy["mid"]);
    assert!(proto.bid.is_none());
    assert!(proto.ask.is_none());
    let price = PriceWrapper::new(proto);
    assert_eq!(price.try_price().expect("price").to_string(), "99.5");
    assert_eq!(price.try_price_kind().expect("kind"), PriceKind::Mid);
    assert_eq!(plain(price.try_mid().expect("mid")), Some("99.5".to_string()));
    assert_eq!(price.try_bid().expect("bid"), None);
    assert_eq!(price.try_ask().expect("ask"), None);
}

#[test]
fn one_number_helper_rebuilds_legacy_bytes_exactly() {
    let (legacy, old) = legacy();
    let mut rebuilt = PriceProtoBuilder::new()
        .uuid(UUIDWrapper::new(uuid(legacy["uuid"].as_str().expect("uuid"))))
        .as_of(LocalTimestampWrapper::new(old.as_of.clone().expect("as_of")))
        .price(DecimalWrapper::from(Decimal::from_str("99.5").expect("decimal")))
        .security(SecurityProto { uuid: Some(uuid(legacy["security_uuid"].as_str().expect("uuid"))), ..Default::default() })
        .price_type(PriceTypeProto::Percentage)
        .build()
        .expect("build");
    // The builder also stamps valid_from with the clock; the legacy price has none.
    rebuilt.valid_from = None;

    assert_eq!(hex(&rebuilt.encode_to_vec()), legacy["hex"].as_str().expect("hex"));
}

#[test]
fn try_price_resolves_each_case() {
    for c in cases()["resolve"].as_array().expect("resolve") {
        let price = PriceWrapper::new(quote(c));
        let value = c["value"].as_str().expect("value");

        assert_eq!(price.try_price().expect("price").to_string(), value, "{}", name(c));
        assert_eq!(price.try_price_kind().expect("kind"), kind(c["kind"].as_str().expect("kind")), "{}", name(c));
        let q = price.try_price_quote().expect("quote");
        assert_eq!(q.value.to_string(), value, "{}", name(c));
        assert_eq!(q.kind, kind(c["kind"].as_str().expect("kind")), "{}", name(c));
        let resolved = resolved_price_decimal(&price.proto).expect("resolve").expect("set");
        assert_eq!(decode_decimal(&resolved).expect("decode").to_canonical_string(), value, "{}", name(c));
    }
}

#[test]
fn stored_quote_reads_back_unchanged() {
    for c in cases()["resolve"].as_array().expect("resolve") {
        let bytes = quote(c).encode_to_vec();
        let read = PriceWrapper::new(PriceProto::decode(bytes.as_slice()).expect("decode"));

        assert_eq!(plain(read.try_mid().expect("mid")), expected(c, "mid"), "{}", name(c));
        assert_eq!(plain(read.try_bid().expect("bid")), expected(c, "bid"), "{}", name(c));
        assert_eq!(plain(read.try_ask().expect("ask")), expected(c, "ask"), "{}", name(c));
        assert_eq!(read.try_price().expect("price").to_string(), c["value"].as_str().expect("value"), "{}", name(c));
        assert_eq!(read.try_price_kind().expect("kind"), kind(c["kind"].as_str().expect("kind")), "{}", name(c));
    }
}

#[test]
fn no_side_set_is_a_validation_error_on_mid() {
    let price = PriceWrapper::new(PriceProto::default());
    for err in [
        price.try_price().unwrap_err(),
        price.try_price_kind().unwrap_err(),
        price.try_price_quote().unwrap_err(),
    ] {
        assert!(matches!(err, Error::Validation(_)), "{err:?}");
        assert_eq!(err.violations()[0].field, "mid");
    }
    assert_eq!(resolved_price_decimal(&PriceProto::default()).expect("resolve"), None);

    let err = PriceProtoBuilder::new().build().unwrap_err();
    assert!(matches!(err, Error::Validation(_)), "{err:?}");
    assert_eq!(err.violations()[0].field, "mid");
}

#[test]
fn validator_cases() {
    for c in cases()["validate"].as_array().expect("validate") {
        let mut proto = PriceProto {
            security: Some(SecurityProto { uuid: Some(uuid("50850000-0000-4000-8000-000000000002")), ..Default::default() }),
            price_type: PriceTypeProto::Percentage as i32,
            ..Default::default()
        };
        let set = |key: &str| c.get(key).map(|v| decimal(v.as_str().expect("decimal string")));
        proto.mid = set("mid");
        proto.bid = set("bid");
        proto.ask = set("ask");

        let fields: Vec<String> = validate_price(&proto).into_iter().map(|v| v.field).collect();
        let want: Vec<String> = c["violations"].as_array().expect("violations").iter()
            .map(|v| v.as_str().expect("field").to_string()).collect();
        assert_eq!(fields, want, "{}", name(c));
    }
}

#[test]
fn golden_cases_match_at_their_tolerance() {
    for c in cases()["golden_cases"].as_array().expect("golden_cases") {
        let tolerance = side(c, "tolerance").unwrap_or(Decimal::ZERO);
        let value = PriceWrapper::new(quote(c)).try_price().expect("price");
        let want = side(c, "value").expect("value");
        assert!((value - want).abs() <= tolerance, "{}", name(c));
    }
}
