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

- **`REFERENCE_CPI = 28`.** With `reference_cpi`, the value as given. With `readings`, `RefCPI = CPI(m-3) + (d - 1) / days_in_month × (CPI(m-2) - CPI(m-3))`, for settlement month m and day d. The request is rejected unless readings are exactly months m-3 and m-2. Index points.
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

## Amendment 2026-10-15 (LM-346)

- **Readings must be exactly months m-3 and m-2.** A missing or extra month makes the request invalid, and it is rejected, the same as a duplicate `(year, month)`. Before, the measure was absent if a needed month was not sent, and other months were dropped silently. valuation-service will enforce the stricter rule, so the spec states it first ("Models first", rule 3).
- **The settlement month is taken in UTC.** It is the month of the UTC date of `ValuationRequestProto.asof_datetime`, read from `asof_datetime.timestamp`. `asof_datetime.time_zone` is not used. Example: `timestamp` = 2026-08-01T02:00Z with `time_zone` = `America/New_York` gives settlement month August, not July, so the readings must be May and June.
- **`REFERENCE_CPI` is still absent when no CPI is given.** The duplicate rule is unchanged.
- **No wire change.** Only comments and the `catalog/measures.json` assumption strings change. Enforcement end to end is the valuation-service item VS-101.

## Amendment 2026-10-16 (LM-344): fields 24, 25 and 3 removed in 0.5

- **Removed.** `ValuationRequestProto.cpi_price_input` (24), `ValuationRequestProto.reference_rate_input` (25) and `TipsInput.current_cpi` (3) are deleted. Their numbers and names are `reserved`, so they are never reused. The 15 Oct ruling approves this break. It ships as **0.5.0**, tagged by the owner, never as a 0.4.x patch.
- **Supersedes "Precedence and deprecations".** `TipsInput.cpi` (4) is the only CPI input. There is no fallback to field 3 or field 24.
- **The legacy flat-rate FRN path is retired.** With field 25 gone, FRNs are priced from `FrnInput.curve` only. There is no flat reference rate and no default rate.
- **Old clients.** A 0.4 client that still sends 24, 25 or 3 to a 0.5 reader is not rejected by the parser: the fields arrive as unknown fields and are ignored. A TIPS request whose CPI came only from 3 or 24 then has no CPI and valuation-service rejects it, so nothing is mispriced.
- **Wire check.** `scripts/checks/wire-diff.py` rule `lm344` allows exactly these three deletions. The fields are listed once, in `test-fixtures/removed-fields/lm-344.json`, which the descriptor tests in every language, the tracked-source scan (`test_removed_fields_scan.py`) and `lm344` all read.

### Consumer bumps from `<0.5` to 0.5

valuation-service goes first, because it is the only reader of the removed fields.

1. **valuation-service (Rust)**
   - Delete the flat-rate FRN path that reads `reference_rate_input`, including its `0.0533` default. Price FRNs from `FrnInput.curve` only.
   - Delete the TIPS fallback through `current_cpi` and `cpi_price_input`. Read `TipsInput.cpi` only.
   - Rename matches on `Error::MissingCurrentCpi` to `Error::MissingCpi`. The gRPC status a client sees is still `InvalidArgument`, but its message text changes from `MissingCurrentCpi` to `MissingCpi`.
2. **ledger-service (Java), broker-service (Rust), ui-service (JS) and Python clients**
   - Stop setting the three fields: `setCpiPriceInput`, `setReferenceRateInput` and `TipsInput.setCurrentCpi` (Java/JS), the `cpi_price_input`, `reference_rate_input` and `current_cpi` struct fields (Rust) and attributes (Python).
   - Set `TipsInput.cpi` for TIPS, and `FrnInput.curve` for FRNs.
3. **Every service** bumps its pinned ledger-models to `0.5.0`: Cargo (`ledger-models`), Gradle (Maven Central), pip and npm (`@fintekkers/ledger-models`). `^0.4` / `~0.4` ranges never resolve to 0.5, so each bump is deliberate.

## Amendment 2026-10-28 (LM-405): TIPS P&L, lot-date CPI readings and Appendix B rounding

- **TIPS `PROFIT_LOSS` and `PROFIT_LOSS_PERCENT` are nominal and clean, with both sides index-adjusted.** Market side = `clean_price / 100 × IndexRatio(valuation date) × directed_quantity`, which is `MARKET_VALUE` for TIPS. Cost side = the sum over the open lots in `TipsInput.cost_basis.lots` of `price_i / 100 × IndexRatio(S_i) × face_i`, where `price_i` is the lot's real price (`TaxLotProto.price`), `face_i` its open original face (`TaxLotProto.open_quantity`) and `S_i` its settlement date, `open_date` plus the product's settlement lag (T+1 business day for Treasuries; valuation-service owns the lag). `PROFIT_LOSS = market side − cost side`; `PROFIT_LOSS_PERCENT = PROFIT_LOSS / cost side`. Accrued interest is excluded on both sides. The non-TIPS formulas are unchanged.
- **Absent, never 0 and never the real-price fallback**, when there are no lots, a lot has no `open_date`, or a needed CPI-U month is missing. With `reference_cpi` there are no lot months, so both measures are absent.
- **Supersedes the LM-346 "exactly m-3 and m-2" rule.** Readings must still include months m-3 and m-2 of the valuation month. They may also carry the extra months lot settlement dates need (months L-3 and L-2 of each lot's settlement month L). An extra month no date needs is allowed and ignored, because only valuation-service knows the lag, so a caller cannot compute the exact set. A duplicate `(year, month)` or a month outside 1-12 is still rejected. A request with only m-3 and m-2 stays valid.
- **Supersedes "Both are unrounded" and the unrounded ratio in `MARKET_VALUE`.** `REFERENCE_CPI` (from readings) and `INDEX_RATIO` are rounded to 5 decimals (half up) per 31 CFR 356 Appendix B, as Treasury does. A given `reference_cpi` is still used as-is. Rounding each side of TIPS P&L to cents, and `MARKET_VALUE` for TIPS to cents, is a project rule, not Appendix B text. `PROFIT_LOSS_PERCENT` is not rounded further; Appendix B has no rule for it.
- **Meaning change, recorded.** Every measure that uses the index ratio now uses the rounded ratio, so results move in the last digits: `MARKET_VALUE`, `ADJUSTED_COST_BASIS`, `INFLATION_ADJUSTED_PRINCIPAL`, `REAL_YIELD` and `PRESENT_VALUE` (through the `clean_price × index_ratio` invariant), and the new TIPS `PROFIT_LOSS` and `PROFIT_LOSS_PERCENT`.
- **Worked example: 912810RL4**, from the owner-supplied inputs in `test-fixtures/tips/912810RL4.json` (TreasuryDirect base CPI, BLS CPI-U NSA): cost 96,961.94, market 96,159.37, P&L −802.57. `test_lm405_tips_pnl_spec.py` re-derives it.
- **No wire change.** Only comments, `catalog/measures.json` and the Java `Measure` descriptions change. valuation-service implements the formula, the lag, the relaxed readings rule and Appendix B rounding under VS-140; ledger-service sends lot months only after that (LS-198).
