//! Typed valuation requests (LM-410). Same rule in Java / Rust / Python /
//! JS-TS. See docs/adr/product_input_builders.md.

use crate::fintekkers::models::position::{MeasureProto, PositionProto};
use crate::fintekkers::models::util::{LocalDateProto, LocalTimestampProto};
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::requests::valuation::{ProductInput, SettlementConventionProto, ValuationRequestProto};
use crate::fintekkers::wrappers::models::product_inputs::{check_product_input, ProductInputError};
use crate::fintekkers::wrappers::util::object_types::stamp_own;

/// A `ValuationRequestProto` valued from `product_input` alone.
///
/// Sets `asof_datetime` (23), `measures` (30), `position_input` (21) and
/// `product_input` (70). `product_input` is checked with
/// [`check_product_input`] first, so a tips input with no cpi is
/// `Err(MissingMarketData)` here too. The caller's protos are copied in as
/// they are, not stamped (LM-322).
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

/// A `SettlementConventionProto` for
/// `ValuationRequestProto.settlement_convention` (80), LM-509.
///
/// Checks only the rule in the proto comment that needs no calendar and that
/// the types allow to break: `calendar_id` is not blank. `trade_date` is
/// required by the signature and a `u32` lag cannot be negative. It never
/// computes a settlement date, and an unknown `calendar_id` passes:
/// valuation-service owns the calendars. A lag of 0 is valid (same-day
/// settlement). Attach it with `request.settlement_convention = Some(convention)`.
pub fn settlement_convention(
    trade_date: LocalDateProto,
    lag_business_days: u32,
    calendar_id: &str,
) -> Result<SettlementConventionProto, ProductInputError> {
    if calendar_id.trim().is_empty() {
        return Err(ProductInputError::Validation(vec![FieldViolationProto {
            field: "settlement_convention.calendar_id".to_string(),
            object_id: None,
            message: "calendar_id is required".to_string(),
        }]));
    }
    Ok(SettlementConventionProto {
        trade_date: Some(trade_date),
        settlement_lag_business_days: lag_business_days,
        calendar_id: calendar_id.to_string(),
    })
}
