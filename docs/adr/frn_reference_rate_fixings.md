# ADR: FRN reference-rate fixings and IssuanceProto.high_discount_rate

## Status

Accepted (LM-365, filed by valuation-service plan VS-110). Additive only: no existing field is renumbered, retyped, renamed or removed, and no reserved number is reused.

## Context

A Treasury FRN accrues at its reference rate (the 13-week T-bill auction high rate, or SOFR) plus a spread. To value one between resets, valuation-service needs the rates already fixed, not only a projection curve. `FrnInput` had no place for them: the retired `ValuationRequestProto.reference_rate_input` (LM-344) was a single untyped price. Bill auctions also had nowhere to record Treasury's published high discount rate, which is where the 13-week fixing comes from.

## Decision

```proto
message FrnInput {
  ...                                            // 1, 2, 10 unchanged
  repeated ReferenceRateFixingProto fixings = 11;
}

message ReferenceRateFixingProto {
  fintekkers.models.security.index.IndexTypeProto index = 1;
  fintekkers.models.util.LocalDateProto fixing_date = 2;
  fintekkers.models.util.DecimalValueProto rate = 3;
}

message IssuanceProto {
  ...                                            // 1, 2, 6, 8, 9, 20-27 unchanged
  fintekkers.models.util.DecimalValueProto high_discount_rate = 28;
}
```

- **A typed `repeated` message, not a `map<>` or key/value bag.** A fixing has three typed parts. A map keyed by a date string would lose the `LocalDateProto` type and the index. It follows the `MonthlyIndexReading` pattern used for TIPS inputs.
- **Directly on `FrnInput`, no wrapper or `oneof`.** No alternative source (for example "fetch from price-service") is planned. A wrapper would add a layer every caller builds for no gain.
- **The index reuses `IndexTypeProto`**, the enum of `FrnExtensionProto.reference_rate_index`. No second enum. Each fixing's index must equal the FRN's `reference_rate_index`.
- **Decimals and dates use their protos.** `rate` and `high_discount_rate` are `DecimalValueProto`; `fixing_date` is `LocalDateProto`. Never `double`, `float` or `string`.
- **The message lives in `fintekkers.requests.valuation`**, next to `FrnInput`, because only valuation reads it today.

## Units

- `ReferenceRateFixingProto.rate` is a **decimal fraction**: `0.0432` = 4.32%. This is the rate the FRN accrues, the same unit as `CurvePoint.rate`. For `T_BILL_13_WEEK` it is the auction high rate converted to a money-market yield.
- `IssuanceProto.high_discount_rate` is **percent per annum on a bank-discount basis**, as Treasury publishes `HighDiscountRate`: `4.215` = 4.215%. Same style as `coupon_rate` (L1).
- The two differ on purpose, like L1 and L5 in `valuation_input_units.md` (rows L7 and L8). Models do not convert a discount rate to a money-market yield; the caller that builds the fixing (for example price-service) does.

## Rules not enforced here

- A duplicate `fixing_date`, or a fixing whose `index` differs from the FRN's `reference_rate_index`, makes an `FrnInput` invalid. No models validator checks this in LM-365. valuation-service owns the check under **VS-110**, until a later ledger-models validator lifts it here.
- valuation-service does not read `fixings` yet; that is VS-110, after it bumps its pinned version.

## Checks

- `scripts/checks/wire-diff.py` rule `lm365` allows exactly these additions with these types. The fields are listed once, in `test-fixtures/field-changes/lm-365.json` (`kept` and `added`), which `lm365` and the descriptor tests in Java, Python and Rust read. JS checks the wire bytes, since google-protobuf has no runtime descriptors.
- The descriptor tests assert each message's field numbers are exactly `kept` plus `added`.

## Consequences

- Old readers skip fields 11 and 28; new readers see them unset in old data.
- Moving `ReferenceRateFixingProto` to `fintekkers/models/` later (for example to store fixings as market data) keeps field numbers but changes its fully qualified name. That needs its own item.
- If either field is ever removed, its number and name must be `reserved`, never reused.
