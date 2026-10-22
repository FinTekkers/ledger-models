//! LM-364 — a TipsInput with cost_basis (20): non-default elections and two
//! TaxLotProto lots round-trip unchanged.
//!
//! The enum values are all non-zero: value 0 is not written on the wire, so
//! it would prove nothing.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::models::portfolio::{
    AmortisationElectionsProto, MarketDiscountAccrualMethodProto, MarketDiscountInclusionProto,
    PremiumAmortisationElectionProto,
};
use ledger_models::fintekkers::models::position::TaxLotProto;
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::requests::valuation::{
    product_input, CostBasisInput, ProductInput, TipsInput, ValuationRequestProto,
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
