//! Step 3 tests — FrnInput / ProductInput proto round-trips.
//!
//! For each new message type: construct → encode to bytes → decode → verify all fields match.

use ledger_models::fintekkers::requests::valuation::{
    product_input, CurvePoint, FrnInput, ProductInput, ValuationRequestProto, YieldCurveInput,
};
use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use prost::Message;

fn decimal(value: &str) -> DecimalValueProto {
    DecimalValueProto {
        arbitrary_precision_value: value.to_string(),
    }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn sofr_curve() -> YieldCurveInput {
    YieldCurveInput {
        index: IndexTypeProto::Sofr.into(),
        reference_date: Some(date(2025, 1, 31)),
        points: vec![
            CurvePoint { tenor: Some(decimal("0.25")), rate: Some(decimal("0.0530")) },
            CurvePoint { tenor: Some(decimal("0.5")),  rate: Some(decimal("0.0520")) },
            CurvePoint { tenor: Some(decimal("1.0")),  rate: Some(decimal("0.0500")) },
            CurvePoint { tenor: Some(decimal("2.0")),  rate: Some(decimal("0.0470")) },
            CurvePoint { tenor: Some(decimal("5.0")),  rate: Some(decimal("0.0430")) },
        ],
    }
}

fn roundtrip_product_input(original: &ProductInput) -> ProductInput {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    ProductInput::decode(&buf[..]).expect("decode failed")
}

fn roundtrip_valuation_request(original: &ValuationRequestProto) -> ValuationRequestProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    ValuationRequestProto::decode(&buf[..]).expect("decode failed")
}

#[test]
fn curve_point_fields_survive_roundtrip() {
    let original = CurvePoint {
        tenor: Some(decimal("2.0")),
        rate: Some(decimal("0.0470")),
    };
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    let parsed = CurvePoint::decode(&buf[..]).expect("decode failed");

    assert_eq!(parsed.tenor.unwrap().arbitrary_precision_value, "2.0");
    assert_eq!(parsed.rate.unwrap().arbitrary_precision_value, "0.0470");
}

#[test]
fn yield_curve_input_all_fields_survive_roundtrip() {
    let original = sofr_curve();
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    let parsed = YieldCurveInput::decode(&buf[..]).expect("decode failed");

    assert_eq!(parsed.index, IndexTypeProto::Sofr as i32);
    assert_eq!(parsed.reference_date.as_ref().unwrap().year, 2025);
    assert_eq!(parsed.reference_date.as_ref().unwrap().month, 1);
    assert_eq!(parsed.reference_date.as_ref().unwrap().day, 31);
    assert_eq!(parsed.points.len(), 5);
    assert_eq!(parsed.points[0].tenor.as_ref().unwrap().arbitrary_precision_value, "0.25");
    assert_eq!(parsed.points[0].rate.as_ref().unwrap().arbitrary_precision_value, "0.0530");
    assert_eq!(parsed.points[4].tenor.as_ref().unwrap().arbitrary_precision_value, "5.0");
    assert_eq!(parsed.points[4].rate.as_ref().unwrap().arbitrary_precision_value, "0.0430");
}

#[test]
fn yield_curve_point_order_preserved_roundtrip() {
    let tenors = ["0.25", "0.5", "1.0", "2.0", "5.0"];
    let original = sofr_curve();
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    let parsed = YieldCurveInput::decode(&buf[..]).expect("decode failed");

    for (i, expected_tenor) in tenors.iter().enumerate() {
        assert_eq!(
            parsed.points[i].tenor.as_ref().unwrap().arbitrary_precision_value,
            *expected_tenor,
        );
    }
}

#[test]
fn frn_input_all_fields_survive_roundtrip() {
    let original = FrnInput {
        clean_price: Some(decimal("99.75")),
        curve: Some(sofr_curve()),
        ..Default::default()
    };

    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    let parsed = FrnInput::decode(&buf[..]).expect("decode failed");

    assert_eq!(parsed.clean_price.unwrap().arbitrary_precision_value, "99.75");
    let curve = parsed.curve.unwrap();
    assert_eq!(curve.index, IndexTypeProto::Sofr as i32);
    assert_eq!(curve.points.len(), 5);
}

#[test]
fn product_input_frn_variant_survives_roundtrip() {
    let frn = FrnInput {
        clean_price: Some(decimal("99.875")),
        curve: Some(sofr_curve()),
        ..Default::default()
    };
    let original = ProductInput {
        input: Some(product_input::Input::Frn(frn)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Frn(f) => {
            assert_eq!(f.clean_price.unwrap().arbitrary_precision_value, "99.875");
            assert_eq!(f.curve.unwrap().index, IndexTypeProto::Sofr as i32);
        }
        other => panic!("Expected Frn variant, got {:?}", other),
    }
}

#[test]
fn valuation_request_product_input_field_survives_roundtrip() {
    let frn = FrnInput {
        clean_price: Some(decimal("100.25")),
        curve: Some(sofr_curve()),
        ..Default::default()
    };
    let original = ValuationRequestProto {
        object_class: "ValuationRequest".into(),
        version: "0.0.1".into(),
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Frn(frn)),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

    assert_eq!(parsed.object_class, "ValuationRequest");
    let pi = parsed.product_input.unwrap();
    match pi.input.unwrap() {
        product_input::Input::Frn(f) => {
            assert_eq!(f.clean_price.unwrap().arbitrary_precision_value, "100.25");
        }
        other => panic!("Expected Frn variant, got {:?}", other),
    }
}

#[test]
fn valuation_request_without_product_input_unaffected() {
    // Existing callers that don't set product_input must still round-trip cleanly.
    let original = ValuationRequestProto {
        object_class: "ValuationRequest".into(),
        version: "0.0.1".into(),
        product_input: None,
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

    assert_eq!(parsed.object_class, "ValuationRequest");
    assert!(parsed.product_input.is_none());
}

#[test]
fn new_rfr_index_types_round_trip() {
    // Verify SONIA, ESTR, TONA survive encode/decode on a YieldCurveInput.
    for (index, label) in [
        (IndexTypeProto::Sonia, "SONIA"),
        (IndexTypeProto::Estr, "ESTR"),
        (IndexTypeProto::Tona, "TONA"),
    ] {
        let curve = YieldCurveInput {
            index: index.into(),
            reference_date: Some(date(2025, 1, 31)),
            points: vec![CurvePoint {
                tenor: Some(decimal("1.0")),
                rate: Some(decimal("0.04")),
            }],
        };
        let mut buf = Vec::new();
        curve.encode(&mut buf).expect("encode failed");
        let parsed = YieldCurveInput::decode(&buf[..]).expect("decode failed");
        assert_eq!(parsed.index, index as i32, "{label} did not survive roundtrip");
    }
}
