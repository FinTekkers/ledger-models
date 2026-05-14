//! Round-trip tests for CurveInputProto fields (issue #203) and the
//! CurveRequestProto.forward_term_years field (issue #264, v0.2.4).

use ledger_models::fintekkers::models::security::{BondDetailsProto, SecurityProto, ProductTypeProto};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::requests::valuation::{CurveInputProto, CurveRequestProto};
use prost::Message;

fn decimal(value: &str) -> DecimalValueProto {
    DecimalValueProto {
        arbitrary_precision_value: value.to_string(),
    }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn roundtrip(original: &CurveInputProto) -> CurveInputProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    CurveInputProto::decode(&buf[..]).expect("decode failed")
}

#[test]
fn curve_input_tenor_and_clean_price_survive_roundtrip() {
    // v0.4.0: dates live in bond_details rather than flat top-level fields.
    let sec = SecurityProto {
        product_type: ProductTypeProto::TreasuryNote as i32,
        bond_details: Some(BondDetailsProto {
            issue_date: Some(date(2025, 1, 15)),
            maturity_date: Some(date(2035, 1, 15)),
            ..Default::default()
        }),
        ..Default::default()
    };

    let original = CurveInputProto {
        security: Some(sec),
        price: None,
        tenor: Some(decimal("10.0")),
        clean_price: Some(decimal("99.50")),
    };

    let parsed = roundtrip(&original);

    let parsed_tenor = parsed
        .tenor
        .as_ref()
        .expect("tenor should round-trip");
    assert_eq!(parsed_tenor.arbitrary_precision_value, "10.0");

    let parsed_clean_price = parsed
        .clean_price
        .as_ref()
        .expect("clean_price should round-trip");
    assert_eq!(parsed_clean_price.arbitrary_precision_value, "99.50");

    let parsed_sec = parsed.security.as_ref().expect("security should round-trip");
    assert_eq!(parsed_sec.product_type, ProductTypeProto::TreasuryNote as i32);
    let bd = parsed_sec.bond_details.as_ref().unwrap();
    assert_eq!(bd.maturity_date.as_ref().unwrap().year, 2035);
    assert_eq!(bd.issue_date.as_ref().unwrap().year, 2025);
}

#[test]
fn curve_input_without_new_fields_remains_compatible() {
    let sec = SecurityProto {
        product_type: ProductTypeProto::TreasuryNote as i32,
        bond_details: Some(BondDetailsProto {
            maturity_date: Some(date(2035, 1, 15)),
            ..Default::default()
        }),
        ..Default::default()
    };

    let original = CurveInputProto {
        security: Some(sec),
        price: None,
        tenor: None,
        clean_price: None,
    };

    let parsed = roundtrip(&original);
    assert!(parsed.tenor.is_none());
    assert!(parsed.clean_price.is_none());
    assert!(parsed.security.is_some());
}

#[test]
fn curve_input_synthetic_cmt_shape_survives_roundtrip() {
    // Synthetic CMT-style point: no security, just an explicit tenor + price-as-yield.
    let original = CurveInputProto {
        security: None,
        price: None,
        tenor: Some(decimal("0.5")),
        clean_price: None,
    };

    let parsed = roundtrip(&original);
    assert!(parsed.security.is_none());
    assert_eq!(
        parsed.tenor.as_ref().unwrap().arbitrary_precision_value,
        "0.5"
    );
    assert!(parsed.clean_price.is_none());
}

// ---------- CurveRequestProto.forward_term_years (v0.2.4, #264) ----------

fn roundtrip_request(original: &CurveRequestProto) -> CurveRequestProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    CurveRequestProto::decode(&buf[..]).expect("decode failed")
}

#[test]
fn curve_request_forward_term_years_survives_roundtrip() {
    // When set, FORWARD_YIELD curve result returns f(t, t+T) at annual t
    // for t in [0, T_max - T]. The proto field is the only carrier of T;
    // it must survive serialize/deserialize byte-for-byte.
    let original = CurveRequestProto {
        forward_term_years: 10,
        ..Default::default()
    };

    let parsed = roundtrip_request(&original);

    assert_eq!(parsed.forward_term_years, 10);
}

#[test]
fn curve_request_unset_forward_term_years_remains_default_zero() {
    // Existing-behavior preservation: when the caller doesn't set
    // forward_term_years, proto3 default of 0 means "unset" and the
    // server applies its prior FORWARD_YIELD behavior.
    let original = CurveRequestProto::default();

    let parsed = roundtrip_request(&original);

    assert_eq!(parsed.forward_term_years, 0,
               "unset forward_term_years must round-trip as proto3 default 0");
}
