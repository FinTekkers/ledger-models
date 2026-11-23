//! LM-485: the pure SecurityMetric rules against the shared fixture
//! `test-fixtures/security-metric/cases.json` (latest, merge, record). Each
//! section must run at least one case, so an emptied fixture fails.

#[path = "common/security_metric_fake.rs"]
mod security_metric_fake;

use std::collections::BTreeMap;

use ledger_models::fintekkers::models::security::{SecurityMetricPointProto, SecurityMetricSeriesProto, SecurityMetricTypeProto};
use ledger_models::fintekkers::requests::security_metric::{
    GetLatestSecurityMetricRequestProto, GetLatestSecurityMetricResponseProto, SearchSecurityMetricResponseProto,
};
use ledger_models::fintekkers::wrappers::models::security_metric::{
    build_create, build_get_latest, build_search, check_metric, chunk_record, map_latest, merge_chunks,
    validate_record, SecurityMetricError, RECORD_CHUNK_SIZE,
};
use ledger_models::fintekkers::wrappers::models::utils::decimal::{decimal_proto, decode_decimal};
use ledger_models::fintekkers::wrappers::util::object_types::{read_type, read_version, OwnObjectType, SCHEMA_VERSION};
use rust_decimal::Decimal;
use security_metric_fake::{d, date_of, date_proto, dec, uuid_of, uuid_proto, SPY};
use serde_json::Value;
use uuid::Uuid;

const OTHER: Uuid = Uuid::from_bytes([0x0f; 16]);

fn fixture() -> Value {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("test-fixtures")
        .join("security-metric")
        .join("cases.json");
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("reading {}: {}", path.display(), e));
    serde_json::from_str(&text).expect("fixture is valid JSON")
}

fn metric_named(name: &str) -> SecurityMetricTypeProto {
    SecurityMetricTypeProto::from_str_name(name).unwrap_or_else(|| panic!("unknown metric {name}"))
}

fn points(v: &Value) -> Vec<(String, String)> {
    v.as_array()
        .expect("points array")
        .iter()
        .map(|p| (p[0].as_str().unwrap().to_string(), p[1].as_str().unwrap().to_string()))
        .collect()
}

fn series(uuid: Uuid, metric: SecurityMetricTypeProto, pts: &[(String, String)]) -> SecurityMetricSeriesProto {
    SecurityMetricSeriesProto {
        security_id: Some(uuid_proto(uuid)),
        metric: metric as i32,
        points: pts
            .iter()
            .map(|(day, value)| SecurityMetricPointProto {
                observation_date: Some(date_proto(d(day))),
                value: Some(decimal_proto(&dec(value))),
            })
            .collect(),
        ..Default::default()
    }
}

#[test]
fn latest_cases() {
    let fixture = fixture();
    let cases = fixture["latest"].as_array().expect("latest");
    let metric = SecurityMetricTypeProto::SharesOutstanding;
    let mut ran = 0;
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let on = d(case["on"].as_str().unwrap());
        // A decoy series for another security and one for another metric:
        // matching is by security_id and metric, never position.
        let mut response = GetLatestSecurityMetricResponseProto {
            series: vec![
                series(OTHER, metric, &[("2026-11-01".into(), "1".into())]),
                series(SPY, SecurityMetricTypeProto::NavPerShare, &[("2026-11-01".into(), "2".into())]),
            ],
            ..Default::default()
        };
        if !case["series"].is_null() {
            response.series.insert(0, series(SPY, metric, &points(&case["series"])));
        }
        let got = map_latest(&response, metric, &[SPY], on).unwrap_or_else(|e| panic!("{name}: {e}"));
        assert_eq!(got.len(), 1, "{name}: every requested uuid is a key and nothing else");
        let result = got.get(&SPY).unwrap_or_else(|| panic!("{name}: SPY must be a key"));
        let expected = &case["expected"];
        if expected.is_null() {
            assert!(result.is_none(), "{name}: absent, never 0: {result:?}");
        } else {
            let r = result.as_ref().unwrap_or_else(|| panic!("{name}: expected a result"));
            let want_value = expected["value"].as_str().unwrap();
            assert_eq!(r.value, dec(want_value), "{name}");
            assert_eq!(r.value.to_string(), want_value, "{name}: keeps the scale");
            assert_eq!(r.date, d(expected["date"].as_str().unwrap()), "{name}");
            assert_eq!(r.on, on, "{name}");
            assert_eq!(r.age_days(), expected["ageDays"].as_i64().unwrap(), "{name}");
        }
        ran += 1;
    }
    assert!(ran >= 1, "no latest case ran");
}

#[test]
fn merge_cases() {
    let fixture = fixture();
    let cases = fixture["merge"].as_array().expect("merge");
    let metric = SecurityMetricTypeProto::NavPerShare;
    let mut ran = 0;
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let chunks: Vec<SearchSecurityMetricResponseProto> = case["chunks"]
            .as_array()
            .unwrap()
            .iter()
            .map(|c| SearchSecurityMetricResponseProto {
                series: Some(series(SPY, metric, &points(c))),
                ..Default::default()
            })
            .collect();
        let got = merge_chunks(&chunks, SPY, metric);
        if let Some(error) = case.get("error") {
            let e = got.expect_err(name);
            assert!(e.is_service_error(), "{name}: a bad stream is the service's error: {e:?}");
            assert!(matches!(e, SecurityMetricError::InvalidResponse(_)), "{name}: {e:?}");
            assert!(e.to_string().contains(error.as_str().unwrap()), "{name}: {e}");
        } else {
            let s = got.unwrap_or_else(|e| panic!("{name}: {e}"));
            let want: Vec<(NaiveDateValue, String)> =
                points(&case["expected"]).into_iter().map(|(day, v)| (d(&day), v)).collect();
            let have: Vec<(NaiveDateValue, String)> = s.points.iter().map(|p| (p.date, p.value.to_string())).collect();
            assert_eq!(have, want, "{name}");
            assert_eq!(s.security_id, SPY);
            assert_eq!(s.metric, metric);
            assert_eq!(s.latest().map(|p| p.date), want.last().map(|w| w.0), "{name}");
            assert_eq!(s.to_dict().len(), want.len(), "{name}");
        }
        ran += 1;
    }
    assert!(ran >= 1, "no merge case ran");
}

type NaiveDateValue = chrono::NaiveDate;

#[test]
fn record_cases() {
    let fixture = fixture();
    let cases = fixture["record"].as_array().expect("record");
    let mut ran = 0;
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let metric = metric_named(case["metric"].as_str().unwrap());
        let chunk_size = case["chunkSize"].as_u64().unwrap() as usize;
        let input: Vec<(chrono::NaiveDate, Option<Decimal>)> = case["points"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (d(p[0].as_str().unwrap()), p[1].as_str().map(dec)))
            .collect();
        match validate_record(metric, &input) {
            Ok(valid) => {
                assert!(case.get("violations").is_none(), "{name}: expected violations");
                let chunks = chunk_record(&valid, chunk_size);
                let want_chunks: Vec<Vec<chrono::NaiveDate>> = case["expectedChunks"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|c| c.as_array().unwrap().iter().map(|x| d(x.as_str().unwrap())).collect())
                    .collect();
                let have_chunks: Vec<Vec<chrono::NaiveDate>> =
                    chunks.iter().map(|c| c.iter().map(|p| p.date).collect()).collect();
                assert_eq!(have_chunks, want_chunks, "{name}");
                // The wire values, decoded from each request's DecimalValueProto.
                let mut wire = vec![];
                for chunk in &chunks {
                    let request = build_create(metric, SPY, chunk);
                    let s = request.series.as_ref().unwrap();
                    assert_eq!(uuid_of(s.security_id.as_ref().unwrap()), SPY);
                    assert_eq!(s.metric, metric as i32);
                    for p in &s.points {
                        let value = decode_decimal(p.value.as_ref().unwrap()).unwrap();
                        if metric == SecurityMetricTypeProto::SharesOutstanding {
                            assert_eq!(value.scale, 0, "{name}: share counts at scale 0");
                        }
                        wire.push(value.to_canonical_string());
                    }
                }
                let want_values: Vec<String> =
                    case["expectedValues"].as_array().unwrap().iter().map(|v| v.as_str().unwrap().to_string()).collect();
                assert_eq!(wire, want_values, "{name}");
            }
            Err(e) => {
                let want = case["violations"].as_array().unwrap_or_else(|| panic!("{name}: unexpected {e}"));
                assert!(e.is_input_error(), "{name}");
                assert!(matches!(e, SecurityMetricError::InvalidMetricPoints { .. }), "{name}: {e:?}");
                let have: Vec<(Option<String>, String)> =
                    e.violations().iter().map(|v| (v.date.map(|x| x.to_string()), v.reason.clone())).collect();
                let want: Vec<(Option<String>, String)> = want
                    .iter()
                    .map(|v| (v["date"].as_str().map(str::to_string), v["reason"].as_str().unwrap().to_string()))
                    .collect();
                assert_eq!(have, want, "{name}");
                assert!(e.to_string().starts_with(&format!("invalid {} points: ", metric.as_str_name())), "{name}: {e}");
            }
        }
        ran += 1;
    }
    assert!(ran >= 1, "no record case ran");
}

#[test]
fn record_chunk_size_is_5000() {
    assert_eq!(RECORD_CHUNK_SIZE, 5000);
}

#[test]
fn requests_are_stamped_and_carry_the_arguments() {
    let on = d("2026-11-23");
    let get = build_get_latest(SecurityMetricTypeProto::TotalNetAssets, &[SPY, OTHER, SPY], on);
    assert_eq!(read_type(&get), GetLatestSecurityMetricRequestProto::OBJECT_TYPE);
    assert_eq!(read_version(&get), Some(SCHEMA_VERSION));
    assert_eq!(get.security_ids.iter().map(uuid_of).collect::<Vec<_>>(), vec![SPY, OTHER]);
    assert_eq!(get.date.as_ref().map(date_of), Some(on));

    let search = build_search(SecurityMetricTypeProto::NavPerShare, SPY, d("2026-11-01"), on).unwrap();
    assert_eq!(read_version(&search), Some(SCHEMA_VERSION));
    assert_eq!(search.metrics, vec![SecurityMetricTypeProto::NavPerShare as i32]);
    assert_eq!(search.start_date.as_ref().map(date_of), Some(d("2026-11-01")));
    assert_eq!(search.end_date.as_ref().map(date_of), Some(on));

    let create = build_create(SecurityMetricTypeProto::NavPerShare, SPY, &[]);
    assert_eq!(read_version(&create), Some(SCHEMA_VERSION));
    assert_eq!(read_version(create.series.as_ref().unwrap()), Some(SCHEMA_VERSION));
    assert_eq!(create.operation_type, ledger_models::fintekkers::requests::util::RequestOperationTypeProto::Create as i32);
}

#[test]
fn unknown_metric_is_named() {
    let e = check_metric(SecurityMetricTypeProto::UnknownSecurityMetric).unwrap_err();
    assert!(e.is_input_error());
    assert!(e.to_string().contains("UNKNOWN_SECURITY_METRIC"), "{e}");
    assert!(check_metric(42).unwrap_err().to_string().contains("42"));
}

#[test]
fn to_dict_matches_points() {
    let chunks = vec![SearchSecurityMetricResponseProto {
        series: Some(series(SPY, SecurityMetricTypeProto::NavPerShare, &[("2026-11-19".into(), "1.10".into())])),
        ..Default::default()
    }];
    let s = merge_chunks(&chunks, SPY, SecurityMetricTypeProto::NavPerShare).unwrap();
    assert_eq!(s.to_dict(), BTreeMap::from([(d("2026-11-19"), dec("1.10"))]));
    assert!(s.as_of.is_none(), "no as_of on the chunk: None");
}
