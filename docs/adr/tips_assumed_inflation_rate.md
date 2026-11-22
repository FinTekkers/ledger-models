# ADR: TIPS assumed inflation rate and cashflow index ratio

## Status

Accepted (LM-477). Additive wire change: `TipsInput` gains `assumed_inflation_rate = 5` and `CashflowProto` gains `index_ratio = 6`, both `optional fintekkers.models.util.DecimalValueProto`. valuation-service uses them in VS-159.

## Context

valuation-service already builds a TIPS cashflow schedule for `PRESENT_VALUE_CASHFLOWS`, but every row uses today's index ratio. Projecting future inflation-adjusted coupons and principal needs an inflation assumption, and no request field could carry one. The response could not say which ratio a row used either, so a caller could not show or check the projection. `/free/tips` shows "Projected cashflows: Unavailable" until this contract exists.

## Decision

### Two flat fields

- `TipsInput.assumed_inflation_rate` (5): an annual rate in percent a year (3.0 = 3% a year), constant from the settlement date to maturity. Settlement date is read from `ValuationRequestProto.asof_datetime`, as for every other TIPS measure. It is a forecast, not a CPI input: `cpi` (4) stays the only CPI input. It is used only for `PRESENT_VALUE_CASHFLOWS`.
- `CashflowProto.index_ratio` (6): the index ratio applied to that row, dimensionless (1.25 = principal accreted by 25%). Set for TIPS rows only; absent for every other product.

Both sit flat on their message, as `coupon_rate` already does on `CashflowProto`. Field 5 is the first number `TipsInput` has never used (3 is reserved since LM-344). `CashflowProto` uses 1 to 5 and reserves nothing.

### The formula

The proto comments and the `PRESENT_VALUE_CASHFLOWS` catalog entry state it; they are the spec VS-159 builds to:

- `ratio(t) = INDEX_RATIO at settlement x (1 + rate/100)^y`, where `y = days from settlement to t / 365` (ACT/365), compounded annually.
- Coupon = principal x ratio(t) x coupon rate per period.
- Principal at maturity = principal x max(ratio, 1), with the ratio at maturity.

`index_ratio` reports the unfloored ratio(t). The deflation floor applies only to principal at maturity, so that row's `fv_amount` can be above principal x ratio. Discounting of `pv_amount` is unchanged; VS-159 owns it.

### Unset is absent, never 0

Both fields are message-typed, so every language reports presence: `hasAssumedInflationRate()` / `hasIndexRatio()` in Java and JS, `HasField` in Python, `Option::None` in Rust. An unset rate is not 0% inflation: valuation-service keeps using today's `INDEX_RATIO` for every row, as before, so no existing request changes meaning. An unset ratio is not 0. Existing requests and responses carry no field 5 or 6 and parse as before.

### The PV invariant is scoped

The catalog's `sum(pv_amounts) == present_value == price` holds when `assumed_inflation_rate` is unset. With a rate, only the cashflow rows are projected; `PRESENT_VALUE` is unchanged, so the sums can differ.

### `optional` on a message field

Message fields already have presence in proto3, so `optional` adds nothing on the wire or in the generated API beyond a synthetic oneof. It is there only because LM-477 asks for it. It is not a pattern to copy: other message-typed fields in this repo stay without `optional`.

### Catalog: implemented, depends_on and applies_to unchanged

Only `formula`, `units` and `model_assumptions` of `PRESENT_VALUE_CASHFLOWS` change. The calculation ships in VS-159; no ledger-models helper in any language computes the projection.

## Options rejected

- **An `InflationAssumptionInput` message on `TipsInput`**, with room for a curve or compounding basis. One number is all that is needed today, and it does not match the field the item specifies. A rate curve can still be added later on a new field number.
- **A `TipsCashflowDetail` sub-message on `CashflowProto`** holding `index_ratio`. It breaks the flat-row pattern of `coupon_rate` and adds a nesting level for one value.

## Consequences

- A Rust struct literal of `TipsInput` or `CashflowProto` that names every field, without `..Default::default()`, stops compiling once a consumer raises its minimum ledger-models version. The five in this repo's tests now name `assumed_inflation_rate: None`.
- `wire-diff.py` rule `lm477` allows exactly these two additions (`test-fixtures/field-changes/lm-477.json`).
- Rollback after a release: delete the fields and reserve `5` / `"assumed_inflation_rate"` and `6` / `"index_ratio"`; never renumber.

## Related

- [inflation_index_input.md](inflation_index_input.md): `TipsInput.cpi` and the index ratio at settlement.
- [inflation_compensation_measure.md](inflation_compensation_measure.md): the deflation floor belongs to principal only.
