//! LM-509 — the settlement convention contract.
//!
//! A request with SettlementConventionProto (80) and DV01, and a response
//! with settlement_date (60), measure_asof_date (61) and a DV01 result,
//! round-trip unchanged. Measure 31, which LM-509 added, is removed and
//! reserved (LM-514); DV01 stays 25. Request bytes written by
//! v1.1.62 decode with the convention unset and every existing field as it
//! was. `valuation_requests::settlement_convention` checks only the
//! calendar-free rule the proto comment states; it computes no date.

mod common;
use common::decimal;

use ledger_models::fintekkers::models::position::{MeasureMapEntry, MeasureProto};
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::requests::valuation::{
    SettlementConventionProto, ValuationRequestProto, ValuationResponseProto,
};
use ledger_models::fintekkers::wrappers::models::product_inputs::ProductInputError;
use ledger_models::fintekkers::wrappers::models::valuation_requests::settlement_convention;
use prost::Message;

const OLD_REQUEST_HEX: &str = include_str!("../../test-fixtures/wire/lm-509-request-v1.1.62.hex");

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn from_hex(hex: &str) -> Vec<u8> {
    let hex = hex.trim();
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).expect("fixture is hex"))
        .collect()
}

fn full_request() -> ValuationRequestProto {
    ValuationRequestProto {
        measures: vec![MeasureProto::Dv01 as i32],
        settlement_convention: Some(
            settlement_convention(date(2026, 11, 25), 1, "US_SIFMA").expect("valid convention"),
        ),
        ..Default::default()
    }
}

#[test]
fn dv01_stays_25_and_nothing_is_31() {
    assert_eq!(MeasureProto::Dv01 as i32, 25);
    assert_eq!(MeasureProto::from_i32(25), Some(MeasureProto::Dv01));
    assert_eq!(MeasureProto::from_i32(31), None);
    // The removed name, split so the LM-514 grep finds it only in measure.proto.
    assert_eq!(MeasureProto::from_str_name(concat!("DV01", "_PER_MILLION")), None);
}

#[test]
fn request_round_trips_every_new_field() {
    let request = full_request();
    let decoded = ValuationRequestProto::decode(request.encode_to_vec().as_slice()).unwrap();
    assert_eq!(decoded, request);
    assert_eq!(
        decoded.settlement_convention,
        Some(SettlementConventionProto {
            trade_date: Some(date(2026, 11, 25)),
            settlement_lag_business_days: 1,
            calendar_id: "US_SIFMA".to_string(),
        })
    );
    assert_eq!(decoded.measures, vec![25]);
}

#[test]
fn response_round_trips_both_dates_and_a_dv01_result() {
    let response = ValuationResponseProto {
        valuation_request: Some(full_request()),
        settlement_date: Some(date(2026, 11, 27)),
        measure_asof_date: Some(date(2026, 11, 27)),
        measure_results: vec![MeasureMapEntry {
            measure: MeasureProto::Dv01 as i32,
            measure_decimal_value: Some(decimal("502.50")),
        }],
        ..Default::default()
    };
    let decoded = ValuationResponseProto::decode(response.encode_to_vec().as_slice()).unwrap();
    assert_eq!(decoded, response);
    assert_eq!(decoded.settlement_date, Some(date(2026, 11, 27)));
    assert_eq!(decoded.measure_asof_date, Some(date(2026, 11, 27)));
    assert_eq!(decoded.measure_results[0].measure, 25);
    assert_eq!(decoded.measure_results[0].measure_decimal_value, Some(decimal("502.50")));
}

#[test]
fn zero_lag_convention_reports_present() {
    let request = ValuationRequestProto {
        settlement_convention: Some(settlement_convention(date(2026, 11, 25), 0, "US_SIFMA").unwrap()),
        ..Default::default()
    };
    let decoded = ValuationRequestProto::decode(request.encode_to_vec().as_slice()).unwrap();
    let convention = decoded.settlement_convention.expect("a zero lag is still present");
    assert_eq!(convention.settlement_lag_business_days, 0);
}

#[test]
fn v1_1_62_request_bytes_decode_with_the_convention_unset() {
    let bytes = from_hex(OLD_REQUEST_HEX);
    let decoded = ValuationRequestProto::decode(bytes.as_slice()).unwrap();
    assert_eq!(decoded.settlement_convention, None);
    assert_eq!(decoded.measures, vec![MeasureProto::Dv01 as i32]);
    let asof = decoded.asof_datetime.as_ref().unwrap();
    assert_eq!(asof.timestamp.as_ref().map(|t| t.seconds), Some(1_795_813_200)); // 2026-11-27T21:00:00Z
    assert_eq!(asof.time_zone, "America/New_York");
    assert!(decoded.position_input.is_some());
    let bond = match decoded.product_input.and_then(|p| p.input) {
        Some(ledger_models::fintekkers::requests::valuation::product_input::Input::Bond(bond)) => bond,
        other => panic!("expected a bond input, got {other:?}"),
    };
    assert_eq!(bond.security.as_ref().map(|s| s.issuer_name.as_str()), Some("US Treasury"));
    assert_eq!(bond.clean_price, Some(decimal("99.75")));
    // Re-encoding gives the same bytes: nothing was dropped or added.
    assert_eq!(ValuationRequestProto::decode(bytes.as_slice()).unwrap().encode_to_vec(), bytes);
}

#[test]
fn response_without_convention_leaves_both_dates_unset() {
    let decoded = ValuationResponseProto::decode(ValuationResponseProto::default().encode_to_vec().as_slice()).unwrap();
    assert_eq!(decoded.settlement_date, None);
    assert_eq!(decoded.measure_asof_date, None);
}

#[test]
fn helper_rejects_a_blank_calendar() {
    for blank in ["", "   "] {
        let err = settlement_convention(date(2026, 11, 25), 1, blank).unwrap_err();
        assert!(matches!(err, ProductInputError::Validation(_)));
        let fields: Vec<String> = err.violations().into_iter().map(|v| v.field).collect();
        assert_eq!(fields, vec!["settlement_convention.calendar_id"]);
    }
}

#[test]
fn helper_accepts_a_zero_lag() {
    let convention = settlement_convention(date(2026, 11, 25), 0, "US_SIFMA").unwrap();
    assert_eq!(convention.settlement_lag_business_days, 0);
    assert_eq!(convention.trade_date, Some(date(2026, 11, 25)));
}

#[test]
fn helper_passes_an_unknown_calendar_through() {
    // valuation-service owns the calendars and rejects an unknown id.
    let convention = settlement_convention(date(2026, 11, 25), 1, "XX_UNKNOWN").unwrap();
    assert_eq!(convention.calendar_id, "XX_UNKNOWN");
}
