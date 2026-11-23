//! LM-482 — SecurityMetricProto and the GetLatest and Search request and
//! response messages, built as struct literals with `..Default::default()`
//! and every field set, round-trip unchanged. An unset value parses back
//! unset, not 0.

mod common;
use common::decimal;

use ledger_models::fintekkers::models::security::{SecurityMetricProto, SecurityMetricTypeProto};
use ledger_models::fintekkers::models::util::{
    LocalDateProto, LocalTimestampProto, ObjectTypeProto, UuidProto, VersionProto,
};
use ledger_models::fintekkers::requests::security_metric::{
    GetLatestSecurityMetricRequestProto, GetLatestSecurityMetricResponseProto, SearchSecurityMetricRequestProto,
    SearchSecurityMetricResponseProto,
};
use prost::Message;
use prost_types::Timestamp;

fn uuid(byte: u8) -> UuidProto {
    UuidProto { raw_uuid: vec![byte; 16] }
}

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn timestamp(seconds: i64) -> LocalTimestampProto {
    LocalTimestampProto {
        timestamp: Some(Timestamp { seconds, nanos: 0 }),
        time_zone: "America/New_York".to_string(),
    }
}

fn version() -> VersionProto {
    VersionProto { major: 0, minor: 0, patch: 1 }
}

fn metric(uuid_byte: u8, kind: SecurityMetricTypeProto, value: &str) -> SecurityMetricProto {
    SecurityMetricProto {
        object_type: ObjectTypeProto::ObjectTypeSecurityMetric as i32,
        version: Some(version()),
        uuid: Some(uuid(uuid_byte)),
        as_of: Some(timestamp(1_717_400_000)),
        valid_from: Some(timestamp(1_717_300_000)),
        valid_to: Some(timestamp(1_717_500_000)),
        security_id: Some(uuid(9)),
        metric: kind as i32,
        observation_date: Some(date(2024, 5, 31)),
        value: Some(decimal(value)),
        source: "STATE_STREET_NAV_HISTORY".to_string(),
        ..Default::default()
    }
}

fn round_trip<M: Message + Default + PartialEq + std::fmt::Debug>(message: &M) -> M {
    let parsed = M::decode(message.encode_to_vec().as_slice()).expect("decodes");
    assert_eq!(&parsed, message);
    parsed
}

#[test]
fn security_metric_with_every_field_set_round_trips() {
    let m = metric(1, SecurityMetricTypeProto::NavPerShare, "512.3456");
    let parsed = round_trip(&m);
    assert_eq!(parsed.metric, SecurityMetricTypeProto::NavPerShare as i32);
    assert_eq!(parsed.value, Some(decimal("512.3456")));
}

#[test]
fn an_unset_value_parses_back_unset_not_zero() {
    let m = SecurityMetricProto { value: None, ..metric(1, SecurityMetricTypeProto::SharesOutstanding, "1") };
    let parsed = round_trip(&m);
    assert!(parsed.value.is_none());
}

#[test]
fn get_latest_request_and_response_round_trip() {
    let request = GetLatestSecurityMetricRequestProto {
        object_type: ObjectTypeProto::ObjectTypeGetLatestSecurityMetricRequest as i32,
        version: Some(version()),
        security_id: vec![uuid(9), uuid(8)],
        metric: vec![SecurityMetricTypeProto::NavPerShare as i32, SecurityMetricTypeProto::SharesOutstanding as i32],
        date: Some(date(2024, 6, 3)),
        ..Default::default()
    };
    let parsed = round_trip(&request);
    assert_eq!(parsed.security_id.len(), 2);
    assert_eq!(parsed.metric.len(), 2);

    let response = GetLatestSecurityMetricResponseProto {
        object_type: ObjectTypeProto::ObjectTypeGetLatestSecurityMetricResponse as i32,
        version: Some(version()),
        security_metric_response: vec![
            metric(1, SecurityMetricTypeProto::NavPerShare, "512.3456"),
            metric(2, SecurityMetricTypeProto::SharesOutstanding, "1003282116"),
        ],
        ..Default::default()
    };
    assert_eq!(round_trip(&response).security_metric_response.len(), 2);
}

#[test]
fn search_request_and_response_round_trip() {
    let request = SearchSecurityMetricRequestProto {
        object_type: ObjectTypeProto::ObjectTypeSearchSecurityMetricRequest as i32,
        version: Some(version()),
        security_id: Some(uuid(9)),
        metric: vec![SecurityMetricTypeProto::NavPerShare as i32, SecurityMetricTypeProto::TotalNetAssets as i32],
        from_date: Some(date(2024, 1, 2)),
        to_date: Some(date(2024, 6, 3)),
        ..Default::default()
    };
    assert_eq!(round_trip(&request).metric.len(), 2);

    let response = SearchSecurityMetricResponseProto {
        object_type: ObjectTypeProto::ObjectTypeSearchSecurityMetricResponse as i32,
        version: Some(version()),
        security_metric_response: vec![
            metric(1, SecurityMetricTypeProto::NavPerShare, "512.3456"),
            metric(2, SecurityMetricTypeProto::TotalNetAssets, "512345678901.25"),
        ],
        ..Default::default()
    };
    assert_eq!(round_trip(&response).security_metric_response.len(), 2);
}
