
//! LM-290: `validate_price_required_fields` is reachable through the public
//! crate path, as a downstream service (price-service-rust) would call it.

mod common;
use common::decimal;

use ledger_models::fintekkers::models::price::{PriceProto, PriceSourceProto};
use ledger_models::fintekkers::models::security::SecurityProto;
use ledger_models::fintekkers::models::util::UuidProto;
use ledger_models::fintekkers::requests::util::errors::ErrorProto;
use ledger_models::fintekkers::wrappers::models::price::{is_market_price, validate_price_required_fields};
use prost::Message;
use uuid::Uuid;

fn valid_price() -> PriceProto {
    PriceProto {
        security: Some(SecurityProto {
            uuid: Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() }),
            ..Default::default()
        }),
        price: Some(decimal("1.5")),
        ..Default::default()
    }
}

#[test]
fn valid_price_has_no_errors() {
    let errors: Vec<ErrorProto> = validate_price_required_fields(&valid_price());
    assert!(errors.is_empty(), "{:?}", errors);
}

#[test]
fn missing_price_has_one_error() {
    let mut p = valid_price();
    p.price = None;
    let errors: Vec<ErrorProto> = validate_price_required_fields(&p);
    assert_eq!(errors.len(), 1, "{:?}", errors);
}

#[test]
fn is_market_price_unset_and_trade() {
    // LM-395: a price serialised before price_source existed reads as unset, which is market.
    let old = PriceProto::decode(valid_price().encode_to_vec().as_slice()).expect("decode");
    assert_eq!(old.price_source, PriceSourceProto::UnknownPriceSource as i32);
    assert!(is_market_price(&old));

    let mut trade = valid_price();
    trade.price_source = PriceSourceProto::Trade as i32;
    let trade = PriceProto::decode(trade.encode_to_vec().as_slice()).expect("decode");
    assert!(!is_market_price(&trade));
}
