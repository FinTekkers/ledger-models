//! LM-484 — security metric series, GetLatest and Search messages, built as
//! struct literals with `..Default::default()`, round-trip unchanged.
//!
//! An empty series (zero points: unknown) and a series with one point of
//! value 0 (a real zero) parse to different lengths and differ on the wire.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::models::security::{
    SecurityMetricPointProto, SecurityMetricSeriesProto, SecurityMetricTypeProto,
};
use ledger_models::fintekkers::models::util::{LocalDateProto, LocalTimestampProto, ObjectTypeProto, UuidProto};
use ledger_models::fintekkers::requests::security_metric::{
    GetLatestSecurityMetricRequestProto, GetLatestSecurityMetricResponseProto, SearchSecurityMetricRequestProto,
    SearchSecurityMetricResponseProto,
};
use prost::Message;

const SPY: [u8; 16] = [1; 16];
const QQQ: [u8; 16] = [2; 16];

fn uuid(raw: [u8; 16]) -> UuidProto {
    UuidProto { raw_uuid: raw.to_vec() }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn as_of() -> LocalTimestampProto {
    LocalTimestampProto {
        timestamp: Some(prost_types::Timestamp { seconds: 1_795_392_000, nanos: 0 }),
        time_zone: "UTC".to_string(),
    }
}

fn point(observation_date: LocalDateProto, value: &str) -> SecurityMetricPointProto {
    SecurityMetricPointProto { observation_date: Some(observation_date), value: Some(decimal(value)) }
}

fn series(security: [u8; 16], metric: SecurityMetricTypeProto, points: Vec<SecurityMetricPointProto>) -> SecurityMetricSeriesProto {
    SecurityMetricSeriesProto {
        object_type: ObjectTypeProto::ObjectTypeSecurityMetricSeries.into(),
        security_id: Some(uuid(security)),
        metric: metric.into(),
        as_of: Some(as_of()),
        points,
        ..Default::default()
    }
}

fn round_trip<M: Message + Default>(message: &M) -> M {
    M::decode(message.encode_to_vec().as_slice()).expect("decode")
}

fn points_of(s: &SecurityMetricSeriesProto) -> Vec<(Option<LocalDateProto>, String)> {
    s.points
        .iter()
        .map(|p| (p.observation_date.clone(), p.value.as_ref().expect("value").canonical()))
        .collect()
}

#[test]
fn three_point_series_round_trips_in_order_with_exact_decimals() {
    let original = series(
        SPY,
        SecurityMetricTypeProto::SharesOutstanding,
        vec![
            point(date(2026, 9, 28), "15204137000"),
            point(date(2026, 9, 29), "15210000000"),
            point(date(2026, 9, 30), "15198250000"),
        ],
    );

    let parsed = round_trip(&original);

    assert_eq!(parsed, original);
    assert_eq!(parsed.security_id, Some(uuid(SPY)));
    assert_eq!(parsed.metric(), SecurityMetricTypeProto::SharesOutstanding);
    assert_eq!(parsed.as_of, Some(as_of()));
    assert_eq!(
        points_of(&parsed),
        vec![
            (Some(date(2026, 9, 28)), "15204137000".to_string()),
            (Some(date(2026, 9, 29)), "15210000000".to_string()),
            (Some(date(2026, 9, 30)), "15198250000".to_string()),
        ]
    );
}

#[test]
fn empty_series_is_not_a_zero_valued_point() {
    let empty = series(SPY, SecurityMetricTypeProto::NavPerShare, vec![]);
    let zero = series(SPY, SecurityMetricTypeProto::NavPerShare, vec![point(date(2026, 11, 20), "0")]);

    let parsed_empty = round_trip(&empty);
    let parsed_zero = round_trip(&zero);

    assert_eq!(parsed_empty, empty);
    assert_eq!(parsed_zero, zero);
    assert_eq!(parsed_empty.points.len(), 0);
    assert_eq!(parsed_zero.points.len(), 1);
    assert_eq!(points_of(&parsed_zero), vec![(Some(date(2026, 11, 20)), "0".to_string())]);
    assert_ne!(empty.encode_to_vec(), zero.encode_to_vec());
}

#[test]
fn get_latest_request_and_response_round_trip() {
    let request = GetLatestSecurityMetricRequestProto {
        object_type: ObjectTypeProto::ObjectTypeGetLatestSecurityMetricRequest.into(),
        security_ids: vec![uuid(SPY), uuid(QQQ)],
        metrics: vec![SecurityMetricTypeProto::TotalNetAssets.into()],
        date: Some(date(2026, 11, 20)),
        as_of: Some(as_of()),
        ..Default::default()
    };
    let response = GetLatestSecurityMetricResponseProto {
        object_type: ObjectTypeProto::ObjectTypeGetLatestSecurityMetricResponse.into(),
        series: vec![
            series(SPY, SecurityMetricTypeProto::TotalNetAssets, vec![point(date(2026, 11, 19), "5100000000")]),
            series(QQQ, SecurityMetricTypeProto::TotalNetAssets, vec![]),
        ],
        ..Default::default()
    };

    let parsed_request = round_trip(&request);
    let parsed_response = round_trip(&response);

    assert_eq!(parsed_request, request);
    assert_eq!(parsed_request.security_ids, vec![uuid(SPY), uuid(QQQ)]);
    assert_eq!(parsed_request.metrics().collect::<Vec<_>>(), vec![SecurityMetricTypeProto::TotalNetAssets]);
    assert_eq!(parsed_request.date, Some(date(2026, 11, 20)));
    assert_eq!(parsed_request.as_of, Some(as_of()));

    assert_eq!(parsed_response, response);
    assert_eq!(parsed_response.series.len(), 2);
    assert_eq!(parsed_response.series[0].security_id, Some(uuid(SPY)));
    assert_eq!(points_of(&parsed_response.series[0]), vec![(Some(date(2026, 11, 19)), "5100000000".to_string())]);
    assert_eq!(parsed_response.series[1].security_id, Some(uuid(QQQ)));
    assert_eq!(parsed_response.series[1].metric(), SecurityMetricTypeProto::TotalNetAssets);
    assert_eq!(parsed_response.series[1].points.len(), 0);
}

#[test]
fn search_request_and_response_round_trip() {
    let request = SearchSecurityMetricRequestProto {
        object_type: ObjectTypeProto::ObjectTypeSearchSecurityMetricRequest.into(),
        security_id: Some(uuid(SPY)),
        metrics: vec![SecurityMetricTypeProto::NavPerShare.into(), SecurityMetricTypeProto::SharesOutstanding.into()],
        start_date: Some(date(2026, 11, 1)),
        end_date: Some(date(2026, 11, 20)),
        as_of: Some(as_of()),
        ..Default::default()
    };
    let response = SearchSecurityMetricResponseProto {
        object_type: ObjectTypeProto::ObjectTypeSearchSecurityMetricResponse.into(),
        series: Some(series(
            SPY,
            SecurityMetricTypeProto::NavPerShare,
            vec![point(date(2026, 11, 19), "100.98"), point(date(2026, 11, 20), "101.42")],
        )),
        ..Default::default()
    };

    let parsed_request = round_trip(&request);
    let parsed_response = round_trip(&response);

    assert_eq!(parsed_request, request);
    assert_eq!(parsed_request.security_id, Some(uuid(SPY)));
    assert_eq!(
        parsed_request.metrics().collect::<Vec<_>>(),
        vec![SecurityMetricTypeProto::NavPerShare, SecurityMetricTypeProto::SharesOutstanding]
    );
    assert_eq!(parsed_request.start_date, Some(date(2026, 11, 1)));
    assert_eq!(parsed_request.end_date, Some(date(2026, 11, 20)));
    assert_eq!(parsed_request.as_of, Some(as_of()));

    assert_eq!(parsed_response, response);
    let s = parsed_response.series.expect("series");
    assert_eq!(s.metric(), SecurityMetricTypeProto::NavPerShare);
    assert_eq!(
        points_of(&s),
        vec![
            (Some(date(2026, 11, 19)), "100.98".to_string()),
            (Some(date(2026, 11, 20)), "101.42".to_string()),
        ]
    );
}
