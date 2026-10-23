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

## Amendment 2026-10-23 (LM-382): T-bill fixings carry the published rate

### Status

Accepted (LM-382, owner rulings of 23 Oct). Additive only: `IssuanceProto.auction_date = 29` and `ReferenceRateFixingProto.bill_maturity_date = 4`, both `LocalDateProto`. No other field changes.

### Decision

```proto
message ReferenceRateFixingProto {
  ...                                            // 1-3 unchanged
  fintekkers.models.util.LocalDateProto bill_maturity_date = 4;
}

message IssuanceProto {
  ...                                            // 1, 2, 6, 8, 9, 20-28 unchanged
  fintekkers.models.util.LocalDateProto auction_date = 29;
}
```

- **`rate` carries the published unit for `T_BILL_13_WEEK`.** It is the auction's high discount rate as Treasury publishes it: percent per annum on a bank-discount basis, `4.215` = 4.215%, the same value and unit as `IssuanceProto.high_discount_rate`. **Superseded:** the LM-365 Units text above that `rate` is, for `T_BILL_13_WEEK`, "the auction high rate converted to a money-market yield", and that the caller building the fixing converts it. Callers no longer convert. valuation-service converts the published rate to the money-market yield the FRN accrues on. Models still do no conversion.
- **SOFR is unchanged.** Its `rate` stays a decimal fraction (`0.0432` = 4.32%), with the same wording.
- **`bill_maturity_date`** is the maturity of the bill whose auction set the fixing. The conversion needs the bill's actual days to maturity; the 13-week label alone is not enough (a 13-week bill can run 90 to 92 days, and a reopened 26-week bill is auctioned as a 13-week one). Unset for SOFR.
- **`auction_date`** is the date the auction was held, the date a bill's high discount rate is set. It is neither `auction_issue_date` nor `auction_announcement_date`. A fixing's `fixing_date` is this date.
- **Term is one concept, measured per auction.** No stored term field. Each language computes the tenor of one issuance as `Period.between(auction_issue_date, maturity_date)` with its existing `Tenor` type, and `getTenor()` is unchanged. A reopened bill reads 26W for its original auction and 13W for a reopening auctioned 13 weeks before maturity. The helpers (`standardBillTerm`, `TreasuryFrnFixings.select`) follow in two later items: Java and Python, then JS and Rust.
  - **`standardBillTerm(tenor, anchor)` takes an anchor date** (owner-approved at the options gate). Days are counted as `anchor + tenor − anchor`, which is exact for any period, so 4, 6 and 8-week bills over February and month ends snap correctly. A day-only tenor gives the same answer for any anchor. `select` anchors each issuance on its `auction_issue_date`.
  - **Rust gains a computed year/month/day `Tenor`** that mirrors Java's `Period.between`, because Rust has no `Tenor` type today. It is a value, never a stored field. `original_tenor()` is unchanged. Python uses its existing `Tenor` wrapper.
  - The shared cases for those helpers are in `test-fixtures/treasury-frn-fixings.json`, read by all four languages.

### Open point for valuation-service: days to maturity

Treasury's investment-rate formula counts days from the bill's **issue** date to maturity. The fixing carries `fixing_date` (the auction date) and `bill_maturity_date`, but no issue date, and no further field is added here. valuation-service must count from the issue date (for example `fixing_date` plus the bill's settlement lag), or it overstates the days by the auction-to-issue lag. The owner rules on this in the valuation-service follow-up.

### Consequences

- A producer still sending decimal-fraction money-market yields for `T_BILL_13_WEEK` will be misread once valuation-service converts. No code in ledger-models reads or converts `rate`, so this change alone alters no behaviour.
- Old readers skip fields 29 and 4; new readers see them unset in old data.
- Rust code that builds `ReferenceRateFixingProto` or `IssuanceProto` with a struct literal and no `..Default::default()` must add the new field.
- `wire-diff.py` rule `lm382` allows exactly the two additions, listed in `test-fixtures/field-changes/lm-382.json`. The Java, Python and Rust exact-field-set tests take the union with that file.
- If either field is ever removed, its number and name must be `reserved`, never reused.
