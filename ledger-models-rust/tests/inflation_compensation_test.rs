//! LM-433: MeasureProto::INFLATION_COMPENSATION resolves by name to the number
//! declared in measure.proto, which is read here rather than written down.

use ledger_models::fintekkers::models::position::MeasureProto;

fn declared_number() -> i32 {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../ledger-models-protos/fintekkers/models/position/measure.proto");
    let text = std::fs::read_to_string(path).expect("read measure.proto");
    let line = text
        .lines()
        .map(|l| l.split("//").next().unwrap_or("").trim())
        .find(|l| l.starts_with("INFLATION_COMPENSATION ") || l.starts_with("INFLATION_COMPENSATION="))
        .expect("INFLATION_COMPENSATION is not declared in measure.proto");
    let number = line.split('=').nth(1).expect("no number").trim().trim_end_matches(';').trim();
    number.parse().expect("number")
}

#[test]
fn inflation_compensation_resolves_by_name_to_the_number_in_measure_proto() {
    let number = declared_number();
    let measure = MeasureProto::from_str_name("INFLATION_COMPENSATION").expect("INFLATION_COMPENSATION");
    assert_eq!(measure as i32, number);
    assert_eq!(MeasureProto::from_i32(number), Some(MeasureProto::InflationCompensation));
    assert_eq!(MeasureProto::InflationCompensation.as_str_name(), "INFLATION_COMPENSATION");
}
