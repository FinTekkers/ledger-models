//! Round-trip tests for the new CurveInputProto fields (issue #203):
//!   - tenor (DecimalValueProto, decimal-years override)
//!   - clean_price (DecimalValueProto, alternative to price)

use ledger_models::fintekkers::models::security::{SecurityProto, SecurityTypeProto};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::requests::valuation::CurveInputProto;
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
    let mut sec = SecurityProto::default();
    sec.security_type = SecurityTypeProto::BondSecurity as i32;
    sec.issue_date = Some(date(2025, 1, 15));
    sec.maturity_date = Some(date(2035, 1, 15));

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
    assert_eq!(parsed_sec.security_type, SecurityTypeProto::BondSecurity as i32);
    assert_eq!(parsed_sec.maturity_date.as_ref().unwrap().year, 2035);
    assert_eq!(parsed_sec.issue_date.as_ref().unwrap().year, 2025);
}

#[test]
fn curve_input_without_new_fields_remains_compatible() {
    let mut sec = SecurityProto::default();
    sec.security_type = SecurityTypeProto::BondSecurity as i32;
    sec.maturity_date = Some(date(2035, 1, 15));

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
