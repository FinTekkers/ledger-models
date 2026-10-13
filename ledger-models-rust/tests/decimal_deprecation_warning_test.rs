//! LM-318 deleted the decimal string (field 10) and the LM-307 deprecation
//! warning that came with it. A price written by v0.4.33, with only the
//! string, now reads as unset: the typed required-field error on `price`,
//! never a value or zero.
//!
//! The file keeps its LM-307 name because main's scripts/checks/test.sh runs
//! it by name until this release lands.

use ledger_models::fintekkers::models::price::PriceProto;
use ledger_models::fintekkers::models::util::DecimalValueProto;
use ledger_models::fintekkers::wrappers::models::price::PriceWrapper;
use ledger_models::fintekkers::wrappers::models::utils::decimal::is_unset_decimal;
use prost::Message;

#[test]
fn a_string_only_price_is_unset_and_reads_as_the_typed_error() {
    // 0x52 = field 10, length-delimited: "101.25" as a v0.4.33 writer stored it.
    let old = DecimalValueProto::decode(&b"\x52\x06101.25"[..]).unwrap();
    assert!(is_unset_decimal(&old));

    let price = PriceProto { price: Some(old), ..Default::default() };
    let err = PriceWrapper::new(price).try_price().unwrap_err();
    assert_eq!(err.violations()[0].field, "price");
    assert!(err.to_string().contains("decimal is required but unset"), "{}", err);
}
