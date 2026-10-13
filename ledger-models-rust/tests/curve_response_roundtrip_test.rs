//! Round-trip tests for the CurvePointProto forward period fields
//! `from_tenor` / `to_tenor` (LM-313, docs/adr/forward_curve_tenor_range.md).
//! Runs only with `cargo test --features test-utils`.

use ledger_models::fintekkers::models::util::DecimalValueProto;
use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use ledger_models::fintekkers::requests::valuation::CurvePointProto;
use ledger_models::fintekkers::wrappers::models::utils::decimal::{decode_decimal, is_unset_decimal};
use ledger_models::fintekkers::wrappers::models::utils::decimal_test_utils::{compact_only, form_of, DecimalForm};
use prost::Message;
use prost_reflect::{DescriptorPool, Kind};
use rust_decimal::Decimal;

fn roundtrip(original: &CurvePointProto) -> CurvePointProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    CurvePointProto::decode(&buf[..]).expect("decode failed")
}

fn value_of(d: &DecimalValueProto) -> Decimal {
    decode_decimal(d).expect("decodes").to_rust_decimal().expect("fits a Decimal")
}

fn forward_point(from: &str, to: &str) -> CurvePointProto {
    CurvePointProto {
        r#yield: Some(compact_only("0.045")),
        from_tenor: Some(compact_only(from)),
        to_tenor: Some(compact_only(to)),
        ..Default::default()
    }
}

#[test]
fn forward_point_tenor_range_survives_roundtrip() {
    let parsed = roundtrip(&forward_point("1", "2"));

    let from = parsed.from_tenor.as_ref().expect("from_tenor should round-trip");
    let to = parsed.to_tenor.as_ref().expect("to_tenor should round-trip");
    // Compact form only: the values survive without the deprecated string
    // form that LM-295 stops writing.
    assert_eq!(form_of(from), Some(DecimalForm::CompactOnly));
    assert_eq!(form_of(to), Some(DecimalForm::CompactOnly));
    assert_eq!(value_of(from), Decimal::from(1));
    assert_eq!(value_of(to), Decimal::from(2));
}

#[test]
fn zero_from_tenor_is_set_not_unset() {
    // The first forward period starts today: 0-1.
    let parsed = roundtrip(&forward_point("0", "1"));

    let from = parsed.from_tenor.as_ref().expect("a zero from_tenor is still present");
    assert!(!is_unset_decimal(from), "a zero from_tenor must not read as unset");
    assert_eq!(form_of(from), Some(DecimalForm::CompactOnly));
    assert_eq!(value_of(from), Decimal::ZERO);
    assert_eq!(value_of(parsed.to_tenor.as_ref().expect("to_tenor")), Decimal::from(1));
}

#[test]
fn curve_point_field_numbers_and_types_are_additive() {
    let pool = DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set decodes");
    let point = pool
        .get_message_by_name("fintekkers.requests.valuation.CurvePointProto")
        .expect("CurvePointProto is in the descriptor set");

    for (name, number) in [("tenor", 1), ("yield", 2), ("from_tenor", 3), ("to_tenor", 4)] {
        let field = point.get_field_by_name(name).unwrap_or_else(|| panic!("{} is missing", name));
        assert_eq!(field.number(), number, "{} has the wrong field number", name);
        match field.kind() {
            Kind::Message(m) => assert_eq!(m.full_name(), "fintekkers.models.util.DecimalValueProto", "{}", name),
            other => panic!("{} should be a DecimalValueProto, is {:?}", name, other),
        }
        assert!(!field.is_list(), "{} should be singular", name);
    }
}

#[test]
fn legacy_point_bytes_decode_with_range_unset() {
    // A point as written before LM-313: tenor 10 and yield 0.045, compact form.
    //   0a 03 | 5a 01 0a          field 1 (tenor): unscaled_value [10]
    //   12 05 | 5a 01 2d 60 03    field 2 (yield): unscaled_value [45], scale 3
    let legacy: [u8; 12] = [0x0a, 0x03, 0x5a, 0x01, 0x0a, 0x12, 0x05, 0x5a, 0x01, 0x2d, 0x60, 0x03];

    let parsed = CurvePointProto::decode(&legacy[..]).expect("decode failed");

    assert_eq!(value_of(parsed.tenor.as_ref().expect("tenor")), Decimal::from(10));
    assert_eq!(value_of(parsed.r#yield.as_ref().expect("yield")), Decimal::new(45, 3));
    assert!(parsed.from_tenor.is_none());
    assert!(parsed.to_tenor.is_none());
}
