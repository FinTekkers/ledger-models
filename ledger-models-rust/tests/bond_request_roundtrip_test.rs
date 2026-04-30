//! Step 3 tests — BondInput / ProductInput proto round-trips.
//!
//! For each new message type: construct → encode to bytes → decode → verify all fields match.

use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, SecurityProto, SecurityTypeProto,
};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::requests::valuation::{
    product_input, BondInput, CurvePoint, ProductInput, ValuationRequestProto, YieldCurveInput,
};
use prost::Message;

fn decimal(value: &str) -> DecimalValueProto {
    DecimalValueProto { arbitrary_precision_value: value.to_string() }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn treasury_security() -> SecurityProto {
    let mut sec = SecurityProto::default();
    sec.security_type = SecurityTypeProto::BondSecurity.into();
    sec.coupon_type = CouponTypeProto::Fixed.into();
    sec.coupon_frequency = CouponFrequencyProto::Semiannually.into();
    sec.face_value = Some(decimal("1000"));
    sec.coupon_rate = Some(decimal("4.5"));
    sec.maturity_date = Some(date(2030, 11, 15));
    sec
}

fn treasury_curve() -> YieldCurveInput {
    YieldCurveInput {
        points: vec![
            CurvePoint { tenor: Some(decimal("0.5")),  rate: Some(decimal("0.0430")) },
            CurvePoint { tenor: Some(decimal("1.0")),  rate: Some(decimal("0.0420")) },
            CurvePoint { tenor: Some(decimal("2.0")),  rate: Some(decimal("0.0400")) },
            CurvePoint { tenor: Some(decimal("5.0")),  rate: Some(decimal("0.0390")) },
            CurvePoint { tenor: Some(decimal("10.0")), rate: Some(decimal("0.0410")) },
        ],
        ..Default::default()
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
fn bond_input_clean_price_survives_roundtrip() {
    let bond = BondInput {
        security: Some(treasury_security()),
        clean_price: Some(decimal("98.50")),
        benchmark_curve: None,
    };
    let original = ProductInput {
        input: Some(product_input::Input::Bond(bond)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Bond(b) => {
            assert_eq!(b.clean_price.unwrap().arbitrary_precision_value, "98.50");
        }
        other => panic!("Expected Bond variant, got {:?}", other),
    }
}

#[test]
fn bond_input_security_fields_survive_roundtrip() {
    let bond = BondInput {
        security: Some(treasury_security()),
        clean_price: Some(decimal("101.25")),
        benchmark_curve: None,
    };
    let original = ProductInput {
        input: Some(product_input::Input::Bond(bond)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Bond(b) => {
            let sec = b.security.unwrap();
            assert_eq!(sec.security_type(), SecurityTypeProto::BondSecurity);
            assert_eq!(sec.coupon_type(), CouponTypeProto::Fixed);
            assert_eq!(sec.coupon_frequency(), CouponFrequencyProto::Semiannually);
            assert_eq!(sec.coupon_rate.unwrap().arbitrary_precision_value, "4.5");
            assert_eq!(sec.face_value.unwrap().arbitrary_precision_value, "1000");
            let mat = sec.maturity_date.unwrap();
            assert_eq!(mat.year, 2030);
            assert_eq!(mat.month, 11);
            assert_eq!(mat.day, 15);
        }
        other => panic!("Expected Bond variant, got {:?}", other),
    }
}

#[test]
fn bond_input_with_benchmark_curve_survives_roundtrip() {
    let bond = BondInput {
        security: Some(treasury_security()),
        clean_price: Some(decimal("99.75")),
        benchmark_curve: Some(treasury_curve()),
    };
    let original = ProductInput {
        input: Some(product_input::Input::Bond(bond)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Bond(b) => {
            assert_eq!(b.clean_price.unwrap().arbitrary_precision_value, "99.75");
            let curve = b.benchmark_curve.unwrap();
            assert_eq!(curve.points.len(), 5);
            assert_eq!(
                curve.points[2].tenor.as_ref().unwrap().arbitrary_precision_value,
                "2.0"
            );
        }
        other => panic!("Expected Bond variant, got {:?}", other),
    }
}

#[test]
fn valuation_request_with_bond_product_input_survives_roundtrip() {
    let bond = BondInput {
        security: Some(treasury_security()),
        clean_price: Some(decimal("98.50")),
        benchmark_curve: None,
    };
    let original = ValuationRequestProto {
        object_class: "ValuationRequest".into(),
        version: "0.0.1".into(),
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Bond(bond)),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

    assert_eq!(parsed.object_class, "ValuationRequest");
    let pi = parsed.product_input.unwrap();
    match pi.input.unwrap() {
        product_input::Input::Bond(b) => {
            assert_eq!(b.clean_price.unwrap().arbitrary_precision_value, "98.50");
        }
        other => panic!("Expected Bond variant, got {:?}", other),
    }
}

#[test]
fn bond_and_frn_are_distinct_oneof_variants() {
    // Encoding a Bond ProductInput and decoding it must never yield an Frn variant.
    let bond = BondInput {
        security: Some(treasury_security()),
        clean_price: Some(decimal("100.00")),
        benchmark_curve: None,
    };
    let original = ProductInput {
        input: Some(product_input::Input::Bond(bond)),
    };
    let parsed = roundtrip_product_input(&original);
    assert!(
        matches!(parsed.input, Some(product_input::Input::Bond(_))),
        "Bond ProductInput must decode as Bond, not Frn or other variant"
    );
}
