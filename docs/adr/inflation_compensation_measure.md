# ADR: INFLATION_COMPENSATION measure

## Status

Accepted (LM-433). Additive wire change: `MeasureProto` gains `INFLATION_COMPENSATION = 30`. Ships in the release after `v1.1.30`. valuation-service computes it in VS-155.

## Context

A TIPS holder wants the dollar inflation accrual on a position: how much of the position's value comes from CPI growth since the base date. No measure reported it. `INFLATION_ADJUSTED_PRINCIPAL` is close, but it applies the deflation floor, so it never shows a loss to deflation and cannot be split into face plus accrual.

## Decision

### The spec lives in the proto comment

`MeasureProto.INFLATION_COMPENSATION` (30) is declared directly after `INDEX_RATIO`. Its comment in `measure.proto` is the spec:

- **Formula:** `InflationCompensation = face × (INDEX_RATIO − 1)` at the as-of date (the UTC date of `ValuationRequestProto.asof_datetime`).
- **Face** is the position's original, unadjusted face: `DIRECTED_QUANTITY`. It is signed, so a short position gives the opposite sign. This matches how the other TIPS position measures use face.
- **Units:** dollars, nominal.
- **Examples:** `10.0B × (1.381 − 1) = 3.81B`, and with deflation `10.0B × (0.98 − 1) = −0.2B`.

The catalog `formula` field points to the proto instead of restating the formula, so there is one copy of the spec. No ledger-models helper in any language computes it: valuation-service does (VS-155). The `Measure.java` constant holds a description only, so the `Measure` static block does not warn about a missing constant.

### No deflation floor

The measure may be negative. The floor belongs to `INFLATION_ADJUSTED_PRINCIPAL` only, which is unchanged: it is a redemption amount, and Treasury redeems at no less than face. Inflation compensation is an accrual, and an accrual below the base CPI is a real loss the holder should see. Applying the floor here would also make `face + INFLATION_COMPENSATION` disagree with `face × INDEX_RATIO`.

### TIPS only, absent not zero

The measure is absent, never 0, for every input type other than TIPS. A 0 would claim that a nominal bond has no inflation accrual, which is a statement about a different quantity.

It is also absent when `INDEX_RATIO` is absent (no CPI or no base CPI). The item text did not state this rule. It is a deliberate addition: it follows from "absent not zero" and matches how `INDEX_RATIO` and `REFERENCE_CPI` behave when their inputs are missing.

### No price needed

The measure depends on `DIRECTED_QUANTITY` and `INDEX_RATIO` only. The `TipsInput.clean_price` comment now says a price is required only for price-dependent measures. The field keeps its number and type.

### Catalog: implemented false until VS-155

Every `measures.json` gains a TIPS-only entry with `implemented: false` and `computed_by: valuation-service`. `measures_for_input_type` returns only implemented entries, so it leaves the measure out for every input type until valuation-service computes it. The catalog never claims more than the service computes. A same-repo follow-up sets `implemented: true` after VS-155 ships. This is the pattern `PAR_YIELD` and `SPOT_YIELD` already follow.

VS-155 needs the enum from a ledger-models release before it can compile, so this item ships first.

## Consequences

- Old readers see an unknown enum value 30 and keep it; no existing measure is renumbered, removed or redefined. `wire-diff.py` rule `lm433` allows only this value.
- Consumers raise their ledger-models minimum only when their code uses the new value (VS-155).
- Rolling back after release means reserving 30 and the name in a later release, which is a breaking change and needs PM approval. A wording fix is comment-only.
