//! Typed valuation requests (LM-410). Same rule in Java / Rust / Python /
//! JS-TS. See docs/adr/product_input_builders.md.

use crate::fintekkers::models::position::{MeasureProto, PositionProto};
use crate::fintekkers::models::util::LocalTimestampProto;
use crate::fintekkers::requests::valuation::{ProductInput, ValuationRequestProto};
use crate::fintekkers::wrappers::models::product_inputs::{check_product_input, ProductInputError};
use crate::fintekkers::wrappers::util::object_types::stamp_own;

/// A `ValuationRequestProto` valued from `product_input` alone.
///
/// Sets `asof_datetime` (23), `measures` (30), `position_input` (21) and
/// `product_input` (70). Never sets `security_input` (20) or `price_input`
/// (22). `product_input` is checked with [`check_product_input`] first, so a
/// tips input with no cpi is `Err(MissingMarketData)` here too. The caller's
/// protos are copied in as they are, not stamped (LM-322).
pub fn typed(
    asof: LocalTimestampProto,
    product_input: ProductInput,
    position: PositionProto,
    measures: &[MeasureProto],
) -> Result<ValuationRequestProto, ProductInputError> {
    check_product_input(&product_input)?;
    Ok(stamp_own(ValuationRequestProto {
        measures: measures.iter().map(|m| *m as i32).collect(),
        asof_datetime: Some(asof),
        position_input: Some(position),
        product_input: Some(product_input),
        ..Default::default()
    }))
}
