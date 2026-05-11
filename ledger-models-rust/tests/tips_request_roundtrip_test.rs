//! Step 3 tests — TipsInput / ProductInput proto round-trips.
//!
//! For each field: construct → encode to bytes → decode → verify field matches.

use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, SecurityProto, ProductTypeProto,
};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::requests::valuation::{
    product_input, ProductInput, TipsInput, ValuationRequestProto,
};
use prost::Message;

fn decimal(value: &str) -> DecimalValueProto {
    DecimalValueProto { arbitrary_precision_value: value.to_string() }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn tips_security(base_cpi: &str) -> SecurityProto {
    let mut sec = SecurityProto::default();
    sec.product_type = ProductTypeProto::Tips.into();
    sec.coupon_type = CouponTypeProto::Fixed.into();
    sec.coupon_frequency = CouponFrequencyProto::Semiannually.into();
    sec.face_value = Some(decimal("1000"));
    sec.coupon_rate = Some(decimal("0.625"));
    sec.maturity_date = Some(date(2030, 1, 15));
    sec.base_cpi = Some(decimal(base_cpi));
    sec
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
fn tips_input_clean_price_survives_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        current_cpi: Some(decimal("310.326")),
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_eq!(t.clean_price.unwrap().arbitrary_precision_value, "97.50");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn tips_input_current_cpi_survives_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        current_cpi: Some(decimal("310.326")),
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_eq!(t.current_cpi.unwrap().arbitrary_precision_value, "310.326");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn tips_input_security_fields_survive_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        current_cpi: Some(decimal("310.326")),
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            let sec = t.security.unwrap();
            assert_eq!(sec.product_type(), ProductTypeProto::Tips);
            assert_eq!(sec.coupon_type(), CouponTypeProto::Fixed);
            assert_eq!(sec.coupon_frequency(), CouponFrequencyProto::Semiannually);
            assert_eq!(sec.coupon_rate.unwrap().arbitrary_precision_value, "0.625");
            assert_eq!(sec.face_value.unwrap().arbitrary_precision_value, "1000");
            assert_eq!(sec.base_cpi.unwrap().arbitrary_precision_value, "260.474");
            let mat = sec.maturity_date.unwrap();
            assert_eq!(mat.year, 2030);
            assert_eq!(mat.month, 1);
            assert_eq!(mat.day, 15);
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn valuation_request_with_tips_product_input_survives_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        current_cpi: Some(decimal("310.326")),
    };
    let original = ValuationRequestProto {
        object_class: "ValuationRequest".into(),
        version: "0.0.1".into(),
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Tips(tips)),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

    assert_eq!(parsed.object_class, "ValuationRequest");
    let pi = parsed.product_input.unwrap();
    match pi.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_eq!(t.clean_price.unwrap().arbitrary_precision_value, "97.50");
            assert_eq!(t.current_cpi.unwrap().arbitrary_precision_value, "310.326");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn tips_is_distinct_from_bond_oneof_variant() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        current_cpi: Some(decimal("310.326")),
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };
    let parsed = roundtrip_product_input(&original);
    assert!(
        matches!(parsed.input, Some(product_input::Input::Tips(_))),
        "TipsInput ProductInput must decode as Tips, not Bond or other variant"
    );
}

#[test]
fn tips_index_ratio_fields_preserve_precision() {
    // Verifies that high-precision CPI values (used in index_ratio computation)
    // survive encode/decode without loss.
    let tips = TipsInput {
        security: Some(tips_security("260.47400")),
        clean_price: Some(decimal("98.765432")),
        current_cpi: Some(decimal("310.32600")),
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };
    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_eq!(t.current_cpi.unwrap().arbitrary_precision_value, "310.32600");
            let sec = t.security.unwrap();
            assert_eq!(sec.base_cpi.unwrap().arbitrary_precision_value, "260.47400");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}
