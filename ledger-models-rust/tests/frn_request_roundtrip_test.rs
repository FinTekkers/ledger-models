
//! Step 3 tests — FrnInput / ProductInput proto round-trips.
//!
//! For each new message type: construct → encode to bytes → decode → verify all fields match.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::requests::valuation::{
    product_input, CurvePoint, FrnInput, ProductInput, ReferenceRateFixingProto, ValuationRequestProto,
    YieldCurveInput,
};
use ledger_models::fintekkers::models::security::bond::IssuanceProto;
use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::util::LocalDateProto;
use prost::Message;


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

    assert_eq!(parsed.tenor.unwrap().canonical(), "2.0");
    assert_eq!(parsed.rate.unwrap().canonical(), "0.0470");
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
    assert_eq!(parsed.points[0].tenor.as_ref().unwrap().canonical(), "0.25");
    assert_eq!(parsed.points[0].rate.as_ref().unwrap().canonical(), "0.0530");
    assert_eq!(parsed.points[4].tenor.as_ref().unwrap().canonical(), "5.0");
    assert_eq!(parsed.points[4].rate.as_ref().unwrap().canonical(), "0.0430");
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
            parsed.points[i].tenor.as_ref().unwrap().canonical(),
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

    assert_eq!(parsed.clean_price.unwrap().canonical(), "99.75");
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
            assert_eq!(f.clean_price.unwrap().canonical(), "99.875");
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
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Frn(frn)),
        }),
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

    let pi = parsed.product_input.unwrap();
    match pi.input.unwrap() {
        product_input::Input::Frn(f) => {
            assert_eq!(f.clean_price.unwrap().canonical(), "100.25");
        }
        other => panic!("Expected Frn variant, got {:?}", other),
    }
}

#[test]
fn valuation_request_without_product_input_unaffected() {
    // Existing callers that don't set product_input must still round-trip cleanly.
    let original = ValuationRequestProto {
        product_input: None,
        ..Default::default()
    };

    let parsed = roundtrip_valuation_request(&original);

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

// LM-365: published reference-rate fixings on FrnInput. T_BILL_13_WEEK is a
// non-default enum value, so it is on the wire.
fn fixing(year: u32, month: u32, day: u32, rate: &str) -> ReferenceRateFixingProto {
    ReferenceRateFixingProto {
        index: IndexTypeProto::TBill13Week.into(),
        fixing_date: Some(date(year, month, day)),
        rate: Some(decimal(rate)),
        ..Default::default()
    }
}

#[test]
fn reference_rate_fixing_all_fields_round_trip() {
    let original = fixing(2026, 10, 19, "0.0432");
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    let parsed = ReferenceRateFixingProto::decode(&buf[..]).expect("decode failed");

    assert_eq!(parsed.index, IndexTypeProto::TBill13Week as i32);
    let d = parsed.fixing_date.expect("fixing_date");
    assert_eq!(d.year, 2026);
    assert_eq!(d.month, 10);
    assert_eq!(d.day, 19);
    assert_eq!(parsed.rate.expect("rate").canonical(), "0.0432");
}

#[test]
fn frn_input_two_fixings_round_trip_in_order() {
    let mut second = fixing(2026, 10, 26, "0.0429");
    second.index = IndexTypeProto::Sofr.into();
    let original = FrnInput {
        clean_price: Some(decimal("99.75")),
        fixings: vec![fixing(2026, 10, 19, "0.0432"), second],
        ..Default::default()
    };
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    let parsed = FrnInput::decode(&buf[..]).expect("decode failed");

    assert_eq!(parsed.fixings.len(), 2);
    let expected = [
        (IndexTypeProto::TBill13Week, 19, "0.0432"),
        (IndexTypeProto::Sofr, 26, "0.0429"),
    ];
    for (f, (index, day, rate)) in parsed.fixings.iter().zip(expected) {
        assert_eq!(f.index, index as i32);
        let d = f.fixing_date.as_ref().expect("fixing_date");
        assert_eq!((d.year, d.month, d.day), (2026, 10, day));
        assert_eq!(f.rate.as_ref().expect("rate").canonical(), rate);
    }
    assert_eq!(parsed.clean_price.expect("clean_price").canonical(), "99.75");
}

// LM-382: the T_BILL_13_WEEK fixing carries its bill's maturity, and the
// issuance its auction date. Each date differs, so a swapped field fails.
#[test]
fn lm382_bill_maturity_date_round_trips() {
    let original = ReferenceRateFixingProto {
        bill_maturity_date: Some(date(2026, 10, 22)),
        ..fixing(2026, 7, 20, "4.215")
    };
    let parsed = ReferenceRateFixingProto::decode(original.encode_to_vec().as_slice()).expect("decode failed");

    assert_eq!(parsed.index, IndexTypeProto::TBill13Week as i32);
    assert_eq!(parsed.fixing_date, Some(date(2026, 7, 20)));
    assert_eq!(parsed.bill_maturity_date, Some(date(2026, 10, 22)));
    assert_eq!(parsed.rate.expect("rate").canonical(), "4.215");
}

#[test]
fn lm382_auction_date_round_trips() {
    let original = IssuanceProto {
        auction_announcement_date: Some(date(2026, 7, 16)),
        auction_date: Some(date(2026, 7, 20)),
        auction_issue_date: Some(date(2026, 7, 23)),
        high_discount_rate: Some(decimal("4.215")),
        ..Default::default()
    };
    let parsed = IssuanceProto::decode(original.encode_to_vec().as_slice()).expect("decode failed");

    assert_eq!(parsed.auction_date, Some(date(2026, 7, 20)));
    assert_eq!(parsed.auction_issue_date, Some(date(2026, 7, 23)));
    assert_eq!(parsed.auction_announcement_date, Some(date(2026, 7, 16)));
    assert_eq!(parsed.high_discount_rate.expect("high_discount_rate").canonical(), "4.215");
}

// LM-389: the T_BILL_13_WEEK fixing carries its auction's issue date.
// Fixing, issue and maturity dates all differ, so a swapped field fails.
#[test]
fn lm389_bill_issue_date_round_trips() {
    let original = ReferenceRateFixingProto {
        bill_maturity_date: Some(date(2026, 10, 22)),
        bill_issue_date: Some(date(2026, 7, 23)),
        ..fixing(2026, 7, 20, "4.215")
    };
    let parsed = ReferenceRateFixingProto::decode(original.encode_to_vec().as_slice()).expect("decode failed");

    assert_eq!(parsed.bill_issue_date, Some(date(2026, 7, 23)));
    assert_eq!(parsed.fixing_date, Some(date(2026, 7, 20)));
    assert_eq!(parsed.bill_maturity_date, Some(date(2026, 10, 22)));
}

#[test]
fn lm382_new_fields_decode_unset_when_absent() {
    let mut sofr = fixing(2026, 10, 26, "0.0429");
    sofr.index = IndexTypeProto::Sofr.into();
    let fixing = ReferenceRateFixingProto::decode(sofr.encode_to_vec().as_slice()).expect("decode failed");
    let old_issuance = IssuanceProto { auction_issue_date: Some(date(2026, 7, 23)), ..Default::default() };
    let issuance = IssuanceProto::decode(old_issuance.encode_to_vec().as_slice()).expect("decode failed");

    assert_eq!(fixing.bill_maturity_date, None);
    assert_eq!(fixing.bill_issue_date, None);
    assert_eq!(issuance.auction_date, None);
    assert_eq!(issuance.auction_issue_date, Some(date(2026, 7, 23)));
}
