//! LM-364 — a TipsInput with cost_basis (20): non-default elections and two
//! TaxLotProto lots round-trip unchanged.
//!
//! The enum values are all non-zero: value 0 is not written on the wire, so
//! it would prove nothing.
//!
//! LM-378 — a TIPS ADJUSTED_COST_BASIS request: two lots plus the valuation
//! date's m-3 and m-2 CPI readings round-trip unchanged.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::models::portfolio::{
    AmortisationElectionsProto, MarketDiscountAccrualMethodProto, MarketDiscountInclusionProto,
    PremiumAmortisationElectionProto,
};
use ledger_models::fintekkers::models::position::TaxLotProto;
use ledger_models::fintekkers::models::util::{LocalDateProto, LocalTimestampProto};
use ledger_models::fintekkers::requests::valuation::{
    inflation_index_input, product_input, CostBasisInput, InflationIndexInput, MonthlyIndexReading,
    MonthlyIndexReadings, ProductInput, TipsInput, ValuationRequestProto,
};
use prost::Message;

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn lot(open_date: LocalDateProto, open_quantity: &str, price: &str) -> TaxLotProto {
    TaxLotProto {
        open_date: Some(open_date),
        open_quantity: Some(decimal(open_quantity)),
        price: Some(decimal(price)),
    }
}

fn reading(year: i32, month: i32, value: &str) -> MonthlyIndexReading {
    MonthlyIndexReading { year, month, value: Some(decimal(value)) }
}

#[test]
fn tips_input_cost_basis_round_trips_unchanged() {
    let tips = TipsInput {
        clean_price: Some(decimal("97.50")),
        cost_basis: Some(CostBasisInput {
            elections: Some(AmortisationElectionsProto {
                bond_premium: PremiumAmortisationElectionProto::PremiumNotElected.into(),
                market_discount_inclusion: MarketDiscountInclusionProto::IncludeCurrently.into(),
                market_discount_accrual: MarketDiscountAccrualMethodProto::ConstantYield.into(),
            }),
            lots: vec![lot(date(2024, 1, 15), "10000", "98.25"), lot(date(2025, 6, 2), "5000", "101.50")],
        }),
        ..Default::default()
    };
    let request = ValuationRequestProto {
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Tips(tips.clone())),
        }),
        ..Default::default()
    };

    let decoded = ValuationRequestProto::decode(request.encode_to_vec().as_slice()).expect("decode");
    let parsed = match decoded.product_input.and_then(|p| p.input) {
        Some(product_input::Input::Tips(t)) => t,
        other => panic!("Expected Tips, got {:?}", other),
    };
    assert_eq!(parsed, tips);

    assert!(parsed.cost_basis.is_some(), "cost_basis missing");
    let cost_basis = parsed.cost_basis.unwrap();
    assert!(cost_basis.elections.is_some(), "elections missing");
    let e = cost_basis.elections.unwrap();
    assert_eq!(e.bond_premium(), PremiumAmortisationElectionProto::PremiumNotElected);
    assert_eq!(e.market_discount_inclusion(), MarketDiscountInclusionProto::IncludeCurrently);
    assert_eq!(e.market_discount_accrual(), MarketDiscountAccrualMethodProto::ConstantYield);

    let lots: Vec<(Option<LocalDateProto>, String, String)> = cost_basis
        .lots
        .iter()
        .map(|l| {
            (
                l.open_date.clone(),
                l.open_quantity.as_ref().expect("open_quantity").canonical(),
                l.price.as_ref().expect("price").canonical(),
            )
        })
        .collect();
    assert_eq!(
        lots,
        vec![
            (Some(date(2024, 1, 15)), "10000".to_string(), "98.25".to_string()),
            (Some(date(2025, 6, 2)), "5000".to_string(), "101.50".to_string()),
        ]
    );
}

#[test]
fn tips_acb_request_with_cpi_readings_round_trips_unchanged() {
    // 2026-10-23T14:30:00Z: settlement month 2026-10, so m-3 and m-2 are 2026-07 and 2026-08.
    let asof = LocalTimestampProto {
        timestamp: Some(prost_types::Timestamp { seconds: 1_792_765_800, nanos: 0 }),
        ..Default::default()
    };
    let tips = TipsInput {
        clean_price: Some(decimal("97.50")),
        cpi: Some(InflationIndexInput {
            cpi: Some(inflation_index_input::Cpi::Readings(MonthlyIndexReadings {
                readings: vec![reading(2026, 7, "322.100"), reading(2026, 8, "322.900")],
            })),
            ..Default::default()
        }),
        cost_basis: Some(CostBasisInput {
            lots: vec![lot(date(2024, 1, 15), "10000", "98.25"), lot(date(2025, 6, 2), "5000", "101.50")],
            ..Default::default()
        }),
        ..Default::default()
    };
    let request = ValuationRequestProto {
        asof_datetime: Some(asof.clone()),
        product_input: Some(ProductInput {
            input: Some(product_input::Input::Tips(tips.clone())),
        }),
        ..Default::default()
    };

    let decoded = ValuationRequestProto::decode(request.encode_to_vec().as_slice()).expect("decode");
    assert_eq!(decoded.asof_datetime, Some(asof));
    assert_eq!(
        decoded.asof_datetime.as_ref().and_then(|a| a.timestamp.as_ref()).map(|t| t.seconds),
        Some(1_792_765_800)
    );
    let parsed = match decoded.product_input.and_then(|p| p.input) {
        Some(product_input::Input::Tips(t)) => t,
        other => panic!("Expected Tips, got {:?}", other),
    };
    assert_eq!(parsed, tips);

    match parsed.cpi.as_ref().and_then(|c| c.cpi.as_ref()) {
        Some(inflation_index_input::Cpi::Readings(r)) => {
            let got: Vec<(i32, i32, String)> = r
                .readings
                .iter()
                .map(|x| (x.year, x.month, x.value.as_ref().expect("value").canonical()))
                .collect();
            assert_eq!(
                got,
                vec![(2026, 7, "322.100".to_string()), (2026, 8, "322.900".to_string())]
            );
        }
        other => panic!("Expected Readings, got {:?}", other),
    }

    let lots: Vec<(Option<LocalDateProto>, String, String)> = parsed
        .cost_basis
        .expect("cost_basis missing")
        .lots
        .iter()
        .map(|l| {
            (
                l.open_date.clone(),
                l.open_quantity.as_ref().expect("open_quantity").canonical(),
                l.price.as_ref().expect("price").canonical(),
            )
        })
        .collect();
    assert_eq!(
        lots,
        vec![
            (Some(date(2024, 1, 15)), "10000".to_string(), "98.25".to_string()),
            (Some(date(2025, 6, 2)), "5000".to_string(), "101.50".to_string()),
        ]
    );
}
