//! LM-364 — AmortisationElectionsProto on PortfolioProto (11) and
//! ValuationRequestProto (26), and the typed lots (27), round-trip.
//!
//! Each test sets non-zero enum values: value 0 is not written on the wire,
//! so it would prove nothing.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::models::portfolio::{
    AmortisationElectionsProto, MarketDiscountAccrualMethodProto, MarketDiscountInclusionProto,
    PortfolioProto, PremiumAmortisationElectionProto,
};
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::requests::valuation::{TaxLotInputProto, ValuationRequestProto};
use prost::Message;

fn date(year: u32, month: u32, day: u32) -> LocalDateProto {
    LocalDateProto { year, month, day }
}

fn elections() -> AmortisationElectionsProto {
    AmortisationElectionsProto {
        bond_premium: PremiumAmortisationElectionProto::PremiumNotElected.into(),
        market_discount_inclusion: MarketDiscountInclusionProto::IncludeCurrently.into(),
        market_discount_accrual: MarketDiscountAccrualMethodProto::ConstantYield.into(),
        effective_from: Some(date(2026, 1, 1)),
    }
}

fn lot(trade: LocalDateProto, settle: LocalDateProto, quantity: &str, price: &str) -> TaxLotInputProto {
    TaxLotInputProto {
        trade_date: Some(trade),
        settlement_date: Some(settle),
        quantity: Some(decimal(quantity)),
        price: Some(decimal(price)),
    }
}

#[test]
fn valuation_request_elections_and_lots_round_trip() {
    let request = ValuationRequestProto {
        amortisation_elections: Some(elections()),
        tax_lots: vec![
            lot(date(2025, 3, 3), date(2025, 3, 4), "1000000", "101.25"),
            lot(date(2026, 2, 2), date(2026, 2, 3), "500000", "98.50"),
        ],
        ..Default::default()
    };

    let decoded = ValuationRequestProto::decode(request.encode_to_vec().as_slice()).expect("decode");
    assert_eq!(decoded, request);

    let e = decoded.amortisation_elections.expect("elections");
    assert_eq!(e.bond_premium(), PremiumAmortisationElectionProto::PremiumNotElected);
    assert_eq!(e.market_discount_inclusion(), MarketDiscountInclusionProto::IncludeCurrently);
    assert_eq!(e.market_discount_accrual(), MarketDiscountAccrualMethodProto::ConstantYield);
    assert_eq!(e.effective_from, Some(date(2026, 1, 1)));

    assert_eq!(decoded.tax_lots.len(), 2);
    let second = &decoded.tax_lots[1];
    assert_eq!(second.trade_date, Some(date(2026, 2, 2)));
    assert_eq!(second.settlement_date, Some(date(2026, 2, 3)));
    assert_eq!(second.quantity.as_ref().expect("quantity").canonical(), "500000");
    assert_eq!(second.price.as_ref().expect("price").canonical(), "98.50");
}

#[test]
fn portfolio_elections_round_trip() {
    let portfolio = PortfolioProto {
        portfolio_name: "Tax lots".into(),
        amortisation_elections: Some(elections()),
        ..Default::default()
    };
    let decoded = PortfolioProto::decode(portfolio.encode_to_vec().as_slice()).expect("decode");
    assert_eq!(decoded.amortisation_elections, Some(elections()));
}

#[test]
fn unset_elections_read_back_every_default() {
    let decoded = AmortisationElectionsProto::decode(
        AmortisationElectionsProto::default().encode_to_vec().as_slice(),
    )
    .expect("decode");
    assert_eq!(decoded.bond_premium(), PremiumAmortisationElectionProto::UnspecifiedPremiumElection);
    assert_eq!(decoded.market_discount_inclusion(), MarketDiscountInclusionProto::UnspecifiedMarketDiscountInclusion);
    assert_eq!(decoded.market_discount_accrual(), MarketDiscountAccrualMethodProto::UnspecifiedAccrualMethod);
    assert_eq!(decoded.effective_from, None);
}
