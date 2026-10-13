//! Decimal helpers shared by the integration tests.
#![allow(dead_code)]

use ledger_models::fintekkers::models::util::DecimalValueProto;
use ledger_models::fintekkers::wrappers::models::utils::decimal::{decode_decimal, encode_decimal, parse_decimal_str};

/// The `DecimalValueProto` for a decimal string such as `1.50`.
pub fn decimal(value: &str) -> DecimalValueProto {
    encode_decimal(&parse_decimal_str(value).unwrap_or_else(|e| panic!("{value:?}: {e}")))
}

/// The canonical string of a decimal, keeping its scale: `98.50` stays `98.50`.
pub trait Canonical {
    fn canonical(&self) -> String;
}

impl Canonical for DecimalValueProto {
    fn canonical(&self) -> String {
        decode_decimal(self).unwrap_or_else(|e| panic!("{self:?}: {e}")).to_canonical_string()
    }
}
