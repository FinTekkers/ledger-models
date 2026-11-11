//! LM-461 — `CreateTransaction` gives the trade price a typed `price_type`
//! (default from hierarchy.json `default_price_types`). Parity with Python
//! test_transaction_create.py, Java PriceForTradeTest and JS
//! transaction_constructor.test.ts.

use chrono::NaiveDate;
use ledger_models::fintekkers::models::portfolio::PortfolioProto;
use ledger_models::fintekkers::models::position::PositionStatusProto;
use ledger_models::fintekkers::models::price::PriceTypeProto;
use ledger_models::fintekkers::models::security::{ProductTypeProto, SecurityProto};
use ledger_models::fintekkers::models::transaction::TransactionTypeProto;
use ledger_models::fintekkers::models::util::UuidProto;
use ledger_models::fintekkers::requests::transaction::CreateTransactionRequestProto;
use ledger_models::fintekkers::wrappers::models::price::validate_price;
use ledger_models::fintekkers::wrappers::models::product_inputs::{ProductInputError, NO_DEFAULT_PRICE_TYPE_FIELD};
use ledger_models::fintekkers::wrappers::models::transaction::CreateTransaction;
use ledger_models::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use ledger_models::fintekkers::wrappers::models::utils::decimal::decode_decimal;
use prost::Message;
use rust_decimal_macros::dec;
use tonic::{Code, Status};
use uuid::Uuid;

const SECURITY_ID: &str = "6f1c5a3e-1d2b-4c5d-8e9f-0a1b2c3d4e5f";

fn security(product_type: ProductTypeProto) -> SecurityProto {
    SecurityProto {
        uuid: Some(UuidProto { raw_uuid: Uuid::parse_str(SECURITY_ID).unwrap().as_bytes().to_vec() }),
        product_type: product_type.into(),
        ..Default::default()
    }
}

fn create(product_type: ProductTypeProto, price_type: Option<PriceTypeProto>) -> CreateTransaction {
    CreateTransaction {
        security: security(product_type),
        portfolio: PortfolioProto::default(),
        trade_date: NaiveDate::from_ymd_opt(2024, 6, 15).unwrap(),
        settlement_date: NaiveDate::from_ymd_opt(2024, 6, 17).unwrap(),
        position_status: PositionStatusProto::Intended,
        transaction_type: TransactionTypeProto::Buy,
        price: dec!(99.5),
        quantity: dec!(1000),
        as_of: LocalTimestampWrapper::now(),
        price_type,
    }
}

fn price_type_of(request: &CreateTransactionRequestProto) -> i32 {
    request.create_transaction_input.as_ref().unwrap().price.as_ref().unwrap().price_type
}

// ---------- metric 1 ----------

#[test]
fn treasury_note_with_only_a_price_is_percentage() {
    let request = create(ProductTypeProto::TreasuryNote, None).build_request().unwrap();
    let price = request.create_transaction_input.as_ref().unwrap().price.as_ref().unwrap();

    assert_eq!(price.price_type, PriceTypeProto::Percentage as i32);
    assert!(validate_price(price).is_empty(), "{:?}", validate_price(price));
}

#[test]
fn stock_with_only_a_price_is_absolute() {
    let request = create(ProductTypeProto::CommonStock, None).build_request().unwrap();
    let price = request.create_transaction_input.as_ref().unwrap().price.as_ref().unwrap();

    assert_eq!(price.price_type, PriceTypeProto::Absolute as i32);
    assert!(validate_price(price).is_empty());
}

#[test]
fn explicit_price_type_overrides_the_default() {
    let request = create(ProductTypeProto::TreasuryNote, Some(PriceTypeProto::Absolute)).build_request().unwrap();
    assert_eq!(price_type_of(&request), PriceTypeProto::Absolute as i32);
}

#[test]
fn price_type_survives_the_wire() {
    let wire = create(ProductTypeProto::TreasuryNote, None).build_request().unwrap().encode_to_vec();

    let parsed = CreateTransactionRequestProto::decode(wire.as_slice()).unwrap();

    assert_eq!(price_type_of(&parsed), PriceTypeProto::Percentage as i32);
}

#[test]
fn price_number_is_unchanged() {
    let txn = create(ProductTypeProto::Tips, None).build().unwrap();
    let price = decode_decimal(txn.price.as_ref().unwrap().price.as_ref().unwrap()).unwrap();

    assert_eq!(price.to_canonical_string(), "99.5");
}

// ---------- metric 2 ----------

#[test]
fn no_default_and_no_price_type_is_a_typed_error_naming_the_product() {
    let err = create(ProductTypeProto::FxSpot, None).build_request().unwrap_err();

    match &err {
        ProductInputError::NoDefaultPriceType { product_type, .. } => assert_eq!(product_type, "FX_SPOT"),
        other => panic!("expected NoDefaultPriceType, got {other:?}"),
    }
    let violations = err.violations();
    assert_eq!(violations.len(), 1);
    assert_eq!(violations[0].field, NO_DEFAULT_PRICE_TYPE_FIELD);
    assert_eq!(violations[0].field, "price.price_type");
    assert_eq!(violations[0].object_id, security(ProductTypeProto::FxSpot).uuid);
    assert!(violations[0].message.contains("FX_SPOT"));
    assert!(err.to_string().contains("FX_SPOT"));
    assert_eq!(Status::from(err).code(), Code::InvalidArgument);
}

// ---------- guardrails ----------

#[test]
fn explicit_price_type_passes_through_on_a_product_with_no_default() {
    let request = create(ProductTypeProto::FxSpot, Some(PriceTypeProto::Rate)).build_request().unwrap();
    assert_eq!(price_type_of(&request), PriceTypeProto::Rate as i32);
}

#[test]
fn explicit_unknown_price_type_counts_as_omitted() {
    let request = create(ProductTypeProto::CommonStock, Some(PriceTypeProto::UnknownPriceType)).build_request().unwrap();
    assert_eq!(price_type_of(&request), PriceTypeProto::Absolute as i32);

    assert!(matches!(
        create(ProductTypeProto::FxSpot, Some(PriceTypeProto::UnknownPriceType)).build(),
        Err(ProductInputError::NoDefaultPriceType { .. })
    ));
}
