
//! Step 3 tests — TipsInput / ProductInput proto round-trips.
//!
//! For each field: construct → encode to bytes → decode → verify field matches.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::security::{
    security_proto, BondDetailsProto, CouponFrequencyProto, CouponTypeProto, IndexDetailsProto,
    SecurityProto, ProductTypeProto, TipsExtensionProto,
};
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::requests::valuation::{
    inflation_index_input, product_input, InflationIndexInput, MonthlyIndexReading,
    MonthlyIndexReadings, ProductInput, TipsInput, ValuationRequestProto,
};
use prost::Message;


fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

// TIPS shared fields live in bond_details; TIPS-specific extras in tips_extension.
fn tips_security(base_cpi: &str) -> SecurityProto {
    SecurityProto {
        product_type: ProductTypeProto::Tips.into(),
        bond_details: Some(BondDetailsProto {
            coupon_type: CouponTypeProto::Fixed.into(),
            coupon_frequency: CouponFrequencyProto::Semiannually.into(),
            face_value: Some(decimal("1000")),
            coupon_rate: Some(decimal("0.625")),
            maturity_date: Some(date(2030, 1, 15)),
            ..Default::default()
        }),
        tips_extension: Some(TipsExtensionProto {
            base_cpi: Some(decimal(base_cpi)),
            ..Default::default()
        }),
        ..Default::default()
    }
}

// A reference CPI already derived for the settlement date (TipsInput.cpi, 4).
fn reference_cpi(value: &str) -> InflationIndexInput {
    InflationIndexInput {
        index: None,
        cpi: Some(inflation_index_input::Cpi::ReferenceCpi(decimal(value))),
    }
}

fn assert_reference_cpi(cpi: Option<InflationIndexInput>, expected: &str) {
    match cpi.expect("cpi missing").cpi {
        Some(inflation_index_input::Cpi::ReferenceCpi(d)) => assert_eq!(d.canonical(), expected),
        other => panic!("Expected ReferenceCpi, got {:?}", other),
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
fn tips_input_clean_price_survives_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        cpi: Some(reference_cpi("310.326")),
        cost_basis: None,
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_eq!(t.clean_price.unwrap().canonical(), "97.50");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn tips_input_security_fields_survive_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        cpi: Some(reference_cpi("310.326")),
        cost_basis: None,
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };

    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            let sec = t.security.unwrap();
            assert_eq!(sec.product_type(), ProductTypeProto::Tips);
            let bond = sec.bond_details.unwrap();
            assert_eq!(bond.coupon_type(), CouponTypeProto::Fixed);
            assert_eq!(bond.coupon_frequency(), CouponFrequencyProto::Semiannually);
            assert_eq!(bond.coupon_rate.unwrap().canonical(), "0.625");
            assert_eq!(bond.face_value.unwrap().canonical(), "1000");
            let mat = bond.maturity_date.unwrap();
            assert_eq!(mat.year, 2030);
            assert_eq!(mat.month, 1);
            assert_eq!(mat.day, 15);
            let tips_ext = sec.tips_extension.unwrap();
            assert_eq!(tips_ext.base_cpi.unwrap().canonical(), "260.474");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn valuation_request_with_tips_product_input_survives_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        cpi: Some(reference_cpi("310.326")),
        cost_basis: None,
    };
    let original = ValuationRequestProto {
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Tips(tips)),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

    let pi = parsed.product_input.unwrap();
    match pi.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_eq!(t.clean_price.unwrap().canonical(), "97.50");
            assert_reference_cpi(t.cpi, "310.326");
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

#[test]
fn tips_is_distinct_from_bond_oneof_variant() {
    let tips = TipsInput {
        security: Some(tips_security("260.474")),
        clean_price: Some(decimal("97.50")),
        cpi: Some(reference_cpi("310.326")),
        cost_basis: None,
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
        cpi: Some(reference_cpi("310.32600")),
        cost_basis: None,
    };
    let original = ProductInput {
        input: Some(product_input::Input::Tips(tips)),
    };
    let parsed = roundtrip_product_input(&original);

    match parsed.input.unwrap() {
        product_input::Input::Tips(t) => {
            assert_reference_cpi(t.cpi, "310.32600");
            let sec = t.security.unwrap();
            assert_eq!(
                sec.tips_extension.unwrap().base_cpi.unwrap().canonical(),
                "260.47400"
            );
        }
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

// ── TipsInput.cpi (LM-343) ─────────────────────────────────────────────────

fn cpi_index() -> SecurityProto {
    SecurityProto {
        issuer_name: "CPI-U NSA".to_string(),
        non_bond_details: Some(security_proto::NonBondDetails::IndexDetails(IndexDetailsProto {
            index_type: IndexTypeProto::CpiU.into(),
            ..Default::default()
        })),
        ..Default::default()
    }
}

fn reading(year: i32, month: i32, value: &str) -> MonthlyIndexReading {
    MonthlyIndexReading { year, month, value: Some(decimal(value)) }
}

fn tips_request(tips: TipsInput) -> ValuationRequestProto {
    ValuationRequestProto {
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Tips(tips)),
        }),
        ..Default::default()
    }
}

fn roundtrip_tips(original: &ValuationRequestProto) -> TipsInput {
    match roundtrip_valuation_request(original).product_input.unwrap().input.unwrap() {
        product_input::Input::Tips(t) => t,
        other => panic!("Expected Tips variant, got {:?}", other),
    }
}

fn assert_cpi_index(index: Option<SecurityProto>) {
    let index = index.expect("index missing");
    assert_eq!(index.issuer_name, "CPI-U NSA");
    match index.non_bond_details {
        Some(security_proto::NonBondDetails::IndexDetails(d)) => {
            assert_eq!(d.index_type(), IndexTypeProto::CpiU)
        }
        other => panic!("Expected IndexDetails, got {:?}", other),
    }
}

#[test]
fn tips_cpi_readings_survive_valuation_request_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.47400")),
        clean_price: Some(decimal("97.50")),
        cpi: Some(InflationIndexInput {
            index: Some(cpi_index()),
            cpi: Some(inflation_index_input::Cpi::Readings(MonthlyIndexReadings {
                readings: vec![reading(2026, 4, "320.000"), reading(2026, 5, "321.500")],
            })),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_tips(&tips_request(tips));

    let cpi = parsed.cpi.expect("cpi missing");
    assert_cpi_index(cpi.index);
    match cpi.cpi {
        Some(inflation_index_input::Cpi::Readings(r)) => {
            let got: Vec<(i32, i32, String)> = r
                .readings
                .iter()
                .map(|x| (x.year, x.month, x.value.as_ref().unwrap().canonical()))
                .collect();
            assert_eq!(
                got,
                vec![(2026, 4, "320.000".to_string()), (2026, 5, "321.500".to_string())]
            );
        }
        other => panic!("Expected Readings, got {:?}", other),
    }
    assert_eq!(parsed.clean_price.unwrap().canonical(), "97.50");
}

#[test]
fn tips_cpi_reference_cpi_survives_valuation_request_roundtrip() {
    let tips = TipsInput {
        security: Some(tips_security("260.47400")),
        clean_price: Some(decimal("97.50")),
        cpi: Some(InflationIndexInput {
            index: Some(cpi_index()),
            cpi: Some(inflation_index_input::Cpi::ReferenceCpi(decimal("310.32600"))),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_tips(&tips_request(tips));

    let cpi = parsed.cpi.expect("cpi missing");
    assert_cpi_index(cpi.index);
    match cpi.cpi {
        Some(inflation_index_input::Cpi::ReferenceCpi(d)) => assert_eq!(d.canonical(), "310.32600"),
        other => panic!("Expected ReferenceCpi, got {:?}", other),
    }
}
