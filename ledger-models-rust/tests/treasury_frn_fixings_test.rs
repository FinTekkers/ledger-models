//! Treasury FRN 13-week fixing helpers (LM-386, part 3 of LM-382): the
//! per-issuance tenor, `standard_bill_term` and `select`, against the shared
//! fixture `test-fixtures/treasury-frn-fixings.json` that Java and Python
//! also pass, plus the skip and tie-break rules.

mod common;
use common::{decimal, Canonical};

use chrono::{Datelike, NaiveDate};
use serde_json::Value;

use ledger_models::fintekkers::models::security::bond::IssuanceProto;
use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::security::{BondDetailsProto, ProductTypeProto, SecurityProto};
use ledger_models::fintekkers::models::util::{DecimalValueProto, LocalDateProto};
use ledger_models::fintekkers::requests::valuation::ReferenceRateFixingProto;
use ledger_models::fintekkers::wrappers::models::bond_security::BondSecurity;
use ledger_models::fintekkers::wrappers::models::tenor::Tenor;
use ledger_models::fintekkers::wrappers::models::treasury_frn_fixings::{select, standard_bill_term};

const FIXTURE: &str = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../test-fixtures/treasury-frn-fixings.json"));

fn fixture() -> Value {
    serde_json::from_str(FIXTURE).expect("fixture parses")
}

fn parse_date(s: &str) -> NaiveDate {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").unwrap_or_else(|e| panic!("{s}: {e}"))
}

fn date_proto(s: &str) -> LocalDateProto {
    let d = parse_date(s);
    LocalDateProto { year: d.year() as u32, month: d.month(), day: d.day() }
}

/// `P<y>Y<m>M<d>D`, any part optional, as the fixture writes periods.
fn parse_period(s: &str) -> Tenor {
    let mut tenor = Tenor { years: 0, months: 0, days: 0 };
    let mut number = String::new();
    for c in s.strip_prefix('P').unwrap_or_else(|| panic!("{s}: no P")).chars() {
        match c {
            'Y' => tenor.years = number.parse().unwrap(),
            'M' => tenor.months = number.parse().unwrap(),
            'D' => tenor.days = number.parse().unwrap(),
            _ => {
                number.push(c);
                continue;
            }
        }
        number.clear();
    }
    tenor
}

fn str_of<'a>(v: &'a Value, key: &str) -> &'a str {
    v[key].as_str().unwrap_or_else(|| panic!("{key} missing in {v}"))
}

fn weeks_of(v: &Value) -> Option<u32> {
    v["standard_bill_term_weeks"].as_u64().map(|w| w as u32)
}

fn issuance(auction_date: Option<&str>, issue_date: Option<&str>, rate: Option<DecimalValueProto>) -> IssuanceProto {
    IssuanceProto {
        auction_date: auction_date.map(date_proto),
        auction_issue_date: issue_date.map(date_proto),
        high_discount_rate: rate,
        ..Default::default()
    }
}

fn bill(maturity: &str, issuances: Vec<IssuanceProto>) -> BondSecurity {
    BondSecurity::from_proto(SecurityProto {
        product_type: ProductTypeProto::Tbill as i32,
        bond_details: Some(BondDetailsProto {
            maturity_date: Some(date_proto(maturity)),
            issuance_info: issuances,
            ..Default::default()
        }),
        ..Default::default()
    })
    .expect("a TBILL is a bond")
}

fn fixture_bills(block: &Value) -> Vec<BondSecurity> {
    block["bills"]
        .as_array()
        .unwrap()
        .iter()
        .map(|b| {
            let issuances = b["issuances"]
                .as_array()
                .unwrap()
                .iter()
                .map(|i| {
                    issuance(
                        i["auction_date"].as_str(),
                        i["auction_issue_date"].as_str(),
                        i["high_discount_rate"].as_str().map(decimal),
                    )
                })
                .collect();
            bill(str_of(b, "maturity_date"), issuances)
        })
        .collect()
}

fn expected_fixing(f: &Value) -> ReferenceRateFixingProto {
    assert_eq!(str_of(f, "index"), "T_BILL_13_WEEK");
    ReferenceRateFixingProto {
        index: IndexTypeProto::TBill13Week as i32,
        fixing_date: Some(date_proto(str_of(f, "fixing_date"))),
        rate: Some(decimal(str_of(f, "rate"))),
        bill_maturity_date: Some(date_proto(str_of(f, "bill_maturity_date"))),
        // LM-389: the chosen issuance's auction_issue_date; a missing key panics.
        bill_issue_date: Some(date_proto(str_of(f, "bill_issue_date"))),
    }
}

fn check_select_block(block: &Value) {
    let bills = fixture_bills(block);
    for case in block["cases"].as_array().unwrap() {
        let name = str_of(case, "case");
        let got = select(&bills, parse_date(str_of(case, "date")));
        match &case["fixing"] {
            Value::Null => assert_eq!(got, None, "{name}"),
            f => {
                let got = got.unwrap_or_else(|| panic!("{name}: no fixing"));
                assert_eq!(got, expected_fixing(f), "{name}");
                // The published rate comes back unchanged, scale included.
                assert_eq!(got.rate.as_ref().unwrap().canonical(), str_of(f, "rate"), "{name}");
            }
        }
    }
}

// ---------- metric line 1 ----------

#[test]
fn fixture_issuance_tenors() {
    for row in fixture()["issuance_tenors"].as_array().unwrap() {
        let name = str_of(row, "case");
        let issue = parse_date(str_of(row, "auction_issue_date"));
        let maturity = str_of(row, "maturity_date");
        let b = bill(maturity, vec![issuance(None, Some(str_of(row, "auction_issue_date")), None)]);
        let tenor = b.issuance_tenor(&b.issuances()[0]).unwrap_or_else(|| panic!("{name}: no tenor"));
        assert_eq!(tenor, parse_period(str_of(row, "period")), "{name}");
        assert_eq!(tenor, Tenor::between(issue, parse_date(maturity)), "{name}");
        let end = tenor.add_to(issue).unwrap();
        assert_eq!((end - issue).num_days(), row["days"].as_i64().unwrap(), "{name}");
        assert_eq!(standard_bill_term(&tenor, issue), weeks_of(row), "{name}");
    }
}

#[test]
fn reopened_bill_tenors_per_issuance() {
    let b = bill(
        "2026-10-22",
        vec![
            issuance(Some("2026-04-20"), Some("2026-04-23"), None),
            issuance(Some("2026-07-20"), Some("2026-07-23"), None),
        ],
    );
    let issuances = b.issuances();
    let original = b.issuance_tenor(&issuances[0]).unwrap();
    let reopening = b.issuance_tenor(&issuances[1]).unwrap();
    assert_eq!(original, parse_period("P5M29D"));
    assert_eq!(reopening, parse_period("P2M29D"));
    assert_eq!(standard_bill_term(&original, issuances[0].issue_date().unwrap()), Some(26));
    assert_eq!(standard_bill_term(&reopening, issuances[1].issue_date().unwrap()), Some(13));
}

// ---------- metric line 2 ----------

#[test]
fn fixture_standard_bill_terms() {
    for row in fixture()["standard_bill_terms"].as_array().unwrap() {
        let name = str_of(row, "case");
        let tenor = parse_period(str_of(row, "period"));
        for anchor in row["anchors"].as_array().unwrap() {
            let anchor = parse_date(anchor.as_str().unwrap());
            assert_eq!(standard_bill_term(&tenor, anchor), weeks_of(row), "{name} from {anchor}");
        }
    }
}

// ---------- metric line 3 ----------

#[test]
fn fixture_select() {
    check_select_block(&fixture()["select"]);
}

#[test]
fn fixture_select_skips() {
    check_select_block(&fixture()["select_skips"]);
}

// ---------- metric line 4 ----------

#[test]
fn select_skips_an_issuance_missing_a_field_or_with_an_empty_rate() {
    let on_date = "2026-07-20";
    let bills = vec![
        bill("2026-10-22", vec![issuance(None, Some("2026-07-23"), Some(decimal("4.900")))]),
        bill("2026-10-22", vec![issuance(Some(on_date), None, Some(decimal("4.800")))]),
        bill("2026-10-22", vec![issuance(Some(on_date), Some("2026-07-23"), None)]),
        bill("2026-10-22", vec![issuance(Some(on_date), Some("2026-07-23"), Some(DecimalValueProto::default()))]),
        bill("2026-10-15", vec![issuance(Some("2026-07-13"), Some("2026-07-16"), Some(decimal("4.190")))]),
    ];
    let got = select(&bills, parse_date(on_date)).expect("the valid issuance qualifies");
    assert_eq!(got.rate.unwrap().canonical(), "4.190");
    assert_eq!(got.fixing_date, Some(date_proto("2026-07-13")));
    assert_eq!(got.bill_maturity_date, Some(date_proto("2026-10-15")));
}

#[test]
fn select_tie_on_auction_date_goes_to_the_first_in_input_order() {
    // Same auction date; the first has the smaller rate and earlier maturity,
    // so a "max rate" or "max maturity" rule would pick the other one.
    let first = || bill("2026-10-21", vec![issuance(Some("2026-07-20"), Some("2026-07-22"), Some(decimal("4.100")))]);
    let second = || bill("2026-10-22", vec![issuance(Some("2026-07-20"), Some("2026-07-23"), Some(decimal("4.215")))]);
    let date = parse_date("2026-07-20");

    let got = select(&[first(), second()], date).unwrap();
    assert_eq!(got.rate.unwrap().canonical(), "4.100");
    assert_eq!(got.bill_maturity_date, Some(date_proto("2026-10-21")));

    let got = select(&[second(), first()], date).unwrap();
    assert_eq!(got.rate.unwrap().canonical(), "4.215");
    assert_eq!(got.bill_maturity_date, Some(date_proto("2026-10-22")));
}

// ---------- LM-389: bill_issue_date ----------

#[test]
fn select_reopening_bill_issue_date_is_the_reopenings() {
    let bills = fixture_bills(&fixture()["select"]);
    let got = select(&bills, parse_date("2026-07-20")).expect("the reopening qualifies");
    assert_eq!(got.bill_issue_date, Some(date_proto("2026-07-23")));
    assert_ne!(got.bill_issue_date, Some(date_proto("2026-04-23")));
}

#[test]
fn select_bill_issue_date_is_copied_not_derived() {
    // Issued four days after the auction (e.g. a holiday), so the issue date
    // is neither maturity - 91 days nor auction + 3 days: 2026-07-23.
    let late = bill("2026-10-22", vec![issuance(Some("2026-07-20"), Some("2026-07-24"), Some(decimal("4.215")))]);
    let got = select(&[late], parse_date("2026-07-20")).expect("the late-issued bill qualifies");
    assert_eq!(got.bill_issue_date, Some(date_proto("2026-07-24")));
    assert_ne!(got.bill_issue_date, Some(date_proto("2026-07-23")));
}
