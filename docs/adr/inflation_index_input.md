# ADR: InflationIndexInput, REFERENCE_CPI and INDEX_RATIO

## Status

Accepted (LM-343, filed by plan LM-339). Additive wire change, shipped as a 0.4.x patch.

## Context

A TIPS valuation needs the reference CPI for the settlement date. Treasury derives it from two monthly CPI-U NSA readings (months m-3 and m-2 of the settlement month m), interpolated by day of month. Before this change the contract had two ways to send a CPI, and neither said which CPI it was:

- `TipsInput.current_cpi` (3): a bare `DecimalValueProto`, used as the reference CPI as-is.
- `ValuationRequestProto.cpi_price_input` (24): a `PriceProto` on a CPI index security.

Neither could carry raw monthly readings, so every caller had to do Treasury's interpolation itself. The `MARKET_VALUE` spec had no TIPS branch, and `INFLATION_ADJUSTED_PRINCIPAL` cited `cpi_price_input` by name.

## Decision

### Input shape

`TipsInput` gains `InflationIndexInput cpi = 4`:

```proto
message InflationIndexInput {
  fintekkers.models.security.SecurityProto index = 1;
  oneof cpi {
    MonthlyIndexReadings readings = 2;
    fintekkers.models.util.DecimalValueProto reference_cpi = 3;
  }
}
message MonthlyIndexReadings { repeated MonthlyIndexReading readings = 1; }
message MonthlyIndexReading  { int32 year = 1; int32 month = 2; DecimalValueProto value = 3; }
```

- **Typed, in the `YieldCurveInput` / `SecurityBasedCurveInput` style.** No key/value bag. A caller sends either the raw readings, and valuation-service derives the reference CPI, or a reference CPI it already has, used as-is.
- **`MonthlyIndexReadings` is a wrapper** because a `oneof` cannot hold a `repeated` field directly. Readings are messages, not parallel arrays, so year, month and value cannot drift apart.
- **Readings are unordered.** Each `(year, month)` appears at most once. A request with a duplicate is invalid and is rejected, even when the values agree. Picking one would hide a data error upstream.
- **`index` is a `SecurityProto`.** Other inputs name securities this way (`SecurityCurvePoint.security`, `PriceProto.security`), so the index can be the same security price-service and security-service already hold. Its `index_details.index_type` (e.g. `CPI_U`) should match the TIPS's `tips_extension.inflation_index_type`.
- **No `source` field.** The `index` security already says which index the readings belong to. Where a reading came from (BLS, a vendor, a manual override) is data provenance. That belongs to price-service, which stores the readings, not to a valuation request. A `source` string would also invite a free-form key that valuation-service would have to interpret.
- **No timestamp.** Readings are keyed by `(year, month)`, the way CPI is published. The settlement date comes from `ValuationRequestProto.asof_datetime`, as for every other product input. A second date on the input could disagree with it.

### Precedence and deprecations

valuation-service reads the CPI in this order:

1. `TipsInput.cpi` (4), when set.
2. `TipsInput.current_cpi` (3), deprecated, only when `cpi` is unset.
3. `ValuationRequestProto.cpi_price_input` (24), deprecated, only when neither is set.

`TipsInput.current_cpi` (3), `ValuationRequestProto.cpi_price_input` (24) and `ValuationRequestProto.reference_rate_input` (25) are marked `[deprecated = true]`. `reference_rate_input` was already documented as superseded by `FrnInput.curve`. The option changes no wire shape: the fields keep their names, numbers and types, and old callers keep working. Generated code warns callers that use them, in every language. Removing them needs a minor release and is not planned here.

### New measures

- **`REFERENCE_CPI = 28`.** With `reference_cpi`, the value as given. With `readings`, `RefCPI = CPI(m-3) + (d - 1) / days_in_month × (CPI(m-2) - CPI(m-3))`, for settlement month m and day d. Absent when month m-3 or m-2 is missing. Index points.
- **`INDEX_RATIO = 29`.** `REFERENCE_CPI / security.tips_extension.base_cpi`. Dimensionless.
- **Both are unrounded.** Treasury publishes reference CPIs and index ratios to 5 decimals. We chose not to round: rounding is a presentation choice, and an unrounded ratio keeps `MARKET_VALUE` and `INFLATION_ADJUSTED_PRINCIPAL` consistent with each other. Results can differ from Treasury's published ratio in the last digits.
- **`INDEX_RATIO` is unfloored.** The deflation floor, `max(face × index_ratio, face)`, applies only to `INFLATION_ADJUSTED_PRINCIPAL` (redemption at maturity).
- **`MARKET_VALUE` for TIPS** is `clean_price / 100 × face × index_ratio × directed_quantity / face`, which is `clean_price / 100 × index_ratio × directed_quantity`, using the unrounded, unfloored index ratio.
- Both ship in `catalog/measures.json` with `"implemented": false` until valuation-service supports them.

### No helper in ledger-models

No CPI interpolation or index-ratio helper is added in any language. The formulas live in the `measure.proto` spec and are implemented once, in valuation-service. A helper in four languages would be four copies to keep in step.

## Consequences

- Wire-compatible: `scripts/checks/wire-diff.py` allows exactly the new messages, `TipsInput.cpi = 4` and measure values 28/29 (rule `lm343`). A `source` or timestamp field would fail that check.
- Consumers that read fields 24, 25 or 3 get deprecation warnings, not errors. In Rust, a struct literal for `TipsInput` without `..Default::default()` must add `cpi: None`, as with any new prost field.
- valuation-service must honour the precedence order above when it migrates.
