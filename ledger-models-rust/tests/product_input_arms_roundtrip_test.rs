//! LM-408 — the mbs (13), equity (14) and cash (15) ProductInput arms each
//! round-trip through bytes as the same arm, with the security, the price
//! and, for mbs, a non-default cost_basis.

mod common;
use common::{decimal, Canonical};

use ledger_models::fintekkers::models::position::TaxLotProto;
use ledger_models::fintekkers::models::security::{MbsExtensionProto, ProductTypeProto, SecurityProto};
use ledger_models::fintekkers::models::util::LocalDateProto;
use ledger_models::fintekkers::requests::valuation::{
    product_input, CashInput, CostBasisInput, EquityInput, MbsInput, ProductInput,
};
use prost::Message;

fn roundtrip(input: product_input::Input) -> (ProductInput, ProductInput) {
    let original = ProductInput { input: Some(input) };
    let decoded = ProductInput::decode(original.encode_to_vec().as_slice()).expect("decode");
    (original, decoded)
}

fn security(product_type: ProductTypeProto, issuer_name: &str) -> SecurityProto {
    SecurityProto {
        product_type: product_type.into(),
        issuer_name: issuer_name.to_string(),
        ..Default::default()
    }
}

#[test]
fn mbs_arm_round_trips() {
    let mbs = MbsInput {
        security: Some(SecurityProto {
            mbs_extension: Some(MbsExtensionProto {
                pool_number: "FN AS1234".to_string(),
                current_factor: Some(decimal("0.8125")),
                ..Default::default()
            }),
            ..security(ProductTypeProto::MortgageBacked, "FNMA")
        }),
        clean_price: Some(decimal("101.5")),
        cost_basis: Some(CostBasisInput {
            lots: vec![TaxLotProto {
                open_date: Some(LocalDateProto { year: 2025, month: 6, day: 2 }),
                open_quantity: Some(decimal("250000")),
                price: Some(decimal("99.50")),
            }],
            ..Default::default()
        }),
    };

    let (original, decoded) = roundtrip(product_input::Input::Mbs(mbs));
    assert_eq!(decoded, original);
    let parsed = match decoded.input {
        Some(product_input::Input::Mbs(m)) => m,
        other => panic!("Expected Mbs, got {:?}", other),
    };

    let sec = parsed.security.expect("security");
    assert_eq!(sec.product_type(), ProductTypeProto::MortgageBacked);
    assert_eq!(sec.mbs_extension.expect("mbs_extension").pool_number, "FN AS1234");
    assert_eq!(parsed.clean_price.expect("clean_price").canonical(), "101.5");
    let lots = parsed.cost_basis.expect("cost_basis").lots;
    assert_eq!(lots.len(), 1);
    assert_eq!(lots[0].open_quantity.as_ref().expect("open_quantity").canonical(), "250000");
    assert_eq!(lots[0].price.as_ref().expect("price").canonical(), "99.50");
}

#[test]
fn equity_arm_round_trips() {
    let equity = EquityInput {
        security: Some(security(ProductTypeProto::CommonStock, "equity")),
        unit_price: Some(decimal("187.25")),
    };

    let (original, decoded) = roundtrip(product_input::Input::Equity(equity));
    assert_eq!(decoded, original);
    let parsed = match decoded.input {
        Some(product_input::Input::Equity(e)) => e,
        other => panic!("Expected Equity, got {:?}", other),
    };

    let sec = parsed.security.expect("security");
    assert_eq!(sec.product_type(), ProductTypeProto::CommonStock);
    assert_eq!(sec.issuer_name, "equity");
    assert_eq!(parsed.unit_price.expect("unit_price").canonical(), "187.25");
}

#[test]
fn cash_arm_round_trips() {
    let cash = CashInput {
        security: Some(security(ProductTypeProto::MoneyMarketFund, "cash")),
        unit_price: Some(decimal("1.00")),
    };

    let (original, decoded) = roundtrip(product_input::Input::Cash(cash));
    assert_eq!(decoded, original);
    let parsed = match decoded.input {
        Some(product_input::Input::Cash(c)) => c,
        other => panic!("Expected Cash, got {:?}", other),
    };

    let sec = parsed.security.expect("security");
    assert_eq!(sec.product_type(), ProductTypeProto::MoneyMarketFund);
    assert_eq!(sec.issuer_name, "cash");
    assert_eq!(parsed.unit_price.expect("unit_price").canonical(), "1.00");
}
