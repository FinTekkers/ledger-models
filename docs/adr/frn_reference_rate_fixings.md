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

Treasury's investment-rate formula counts days from the bill's **issue** date to maturity. The fixing carries `fixing_date` (the auction date) and `bill_maturity_date`, but no issue date, and no further field is added here. valuation-service must count from the issue date (for example `fixing_date` plus the bill's settlement lag), or it overstates the days by the auction-to-issue lag. The owner rules on this in the valuation-service follow-up. *Superseded by the LM-389 amendment below: the fixing now carries `bill_issue_date`.*

### Consequences

- A producer still sending decimal-fraction money-market yields for `T_BILL_13_WEEK` will be misread once valuation-service converts. No code in ledger-models reads or converts `rate`, so this change alone alters no behaviour.
- Old readers skip fields 29 and 4; new readers see them unset in old data.
- Rust code that builds `ReferenceRateFixingProto` or `IssuanceProto` with a struct literal and no `..Default::default()` must add the new field.
- `wire-diff.py` rule `lm382` allows exactly the two additions, listed in `test-fixtures/field-changes/lm-382.json`. The Java, Python and Rust exact-field-set tests take the union with that file.
- If either field is ever removed, its number and name must be `reserved`, never reused.

## Amendment 2026-10-24 (LM-385): Java and Python fixing helpers

### Status

Accepted (LM-385, part 2 of LM-382). Library methods only; no proto change. JS and Rust follow in LM-386.

### Decision

- **Java:** `Issuance.getAuctionDate()` and `getHighDiscountRate()`; `BondSecurity.getIssuanceTenor(Issuance)`; `common.models.security.bonds.TreasuryFrnFixings.standardBillTerm(Tenor, LocalDate anchor) -> OptionalInt` and `select(List<BondSecurity> bills, LocalDate date) -> Optional<ReferenceRateFixingProto>`.
- **Python:** `Issuance.get_auction_date()` and `get_high_discount_rate()`; `BondSecurity.get_issuance_tenor(issuance)`; `fintekkers.wrappers.models.security.treasury_frn_fixings.standard_bill_term(tenor, anchor) -> Optional[int]` and `select(bills, as_of) -> Optional[ReferenceRateFixingProto]`.
- **Per-issuance tenor** is `Period.between(auction_issue_date, maturity_date)`, the formula of `getTenor()`, which is unchanged. Unknown tenor when either date is unset.
- **`standardBillTerm`** counts days from `anchor` to `anchor + tenor` and snaps to 4, 6, 8, 13, 17, 26 or 52 weeks within ±3 days. Empty for a null tenor, a non-`TERM` tenor or a null anchor.
- **`select`** walks bills in input order, then each bill's issuances in order. It skips a bill with no `maturity_date`, and an issuance with no `auction_date`, no `auction_issue_date`, no `high_discount_rate` (unset, or set to an empty decimal), or an `auction_date` after the date. It keeps issuances whose per-issuance tenor snaps to 13W anchored on `auction_issue_date`, and picks the latest `auction_date`; on a tie the first in input order wins. The fixing is `index = T_BILL_13_WEEK`, `rate` = the `high_discount_rate` proto copied unchanged (no decimal round trip, so the published scale stays), `fixing_date` = `auction_date`, `bill_maturity_date` = the bill's maturity. Empty when nothing qualifies.
- **Python builds the period from fields.** `Tenor.period_between(start, end)` ports Java's `LocalDate.until` and returns `relativedelta(years=, months=, days=)`, splitting months by truncation toward zero as Java does. It never calls `relativedelta(end, start)`, which gives `P3M` for 2026-08-31 → 2026-11-30 where Java gives `P2M30D`. `Tenor.of_period` wraps it in the existing `Tenor`; there is no second period type.
- **Python rounding trap.** `Tenor.get_tenor_description()` and `as_proto()` round 27 or more days up to a month (`P2M29D` prints as `3M`). Read a per-issuance tenor with `get_tenor()`; its printed form differs from Java's `Period.toString()`.
- **Fixture.** `test-fixtures/treasury-frn-fixings.json` gains a `select_skips` block (a 13W issuance with no `high_discount_rate`, first in input order and auctioned on the date, and a 13W auction one day before the date). The existing blocks are unchanged.

## Amendment 2026-10-24 (LM-386): JS and Rust fixing helpers

### Status

Accepted (LM-386, part 3 of LM-382). Library methods only; no proto change. The rule is the LM-385 one above; all four languages pass `test-fixtures/treasury-frn-fixings.json`.

### Decision

- **JS:** `Issuance.getAuctionDate(): Date | null` and `getHighDiscountRate(): Decimal | null` (null when unset or an empty decimal); `BondSecurity.getIssuanceTenor(issuance): Tenor` (`Tenor.UNKNOWN_TENOR` when either date is unset); `node/wrappers/models/security/TreasuryFrnFixings.ts` exports `standardBillTerm(tenor, anchor): number | null` and `select(bills, date): ReferenceRateFixingProto | null`. `utils/date.ts` gains `plusMonthsClamped`, `plusDays` and `daysBetween`; all three read local date parts, as `localDateProtoToDate` builds dates, and `daysBetween` counts through `Date.UTC` so a DST change cannot shift a day.
- **JS `calculatePeriod` fix (owner ruling, Option A).** `getIssuanceTenor` reuses the private `calculatePeriod`, the formula of `getTenor()`, so JS keeps one term formula. For a forward period (start on or before end) it now ports Java's `LocalDate.until`: whole months stepped from the start with month-end clamping, then the leftover days. Before, it added the prior month's length with no clamp, so `2026-01-31 -> 2026-03-01` gave `P1M-2D` and `2026-01-31 -> 2026-03-30` gave `P1M27D`; both now match Java (`P1M1D`, `P1M30D`). Years and months never change, so `getProductType()` is unaffected; only days change, for start days past the length of the month before the end month. **The backward branch** (start after end, from `getTenor(asOfDate)` after maturity) **keeps the original arithmetic on purpose**, so no existing years or months output changes.
- **Rust:** `wrappers::models::tenor::Tenor { years, months, days }` mirrors Java's `Period`, not the JS `Tenor` (which also holds a tenor type). `Tenor::between(start, end)` ports `LocalDate.until`, backward periods included; `Tenor::add_to(date)` is `LocalDate.plus(Period)`. It is a period type, not a stored term: `BondSecurity::original_tenor()` stays the ACT/ACT decimal-year count. `Issuance::auction_date()` and `high_discount_rate()` (None when unset or an empty decimal); `BondSecurity::issuance_tenor(&issuance) -> Option<Tenor>` (None where Java returns `UNKNOWN_TENOR`); `wrappers::models::treasury_frn_fixings::standard_bill_term(&Tenor, anchor) -> Option<u32>` and `select(&[BondSecurity], date) -> Option<ReferenceRateFixingProto>`. `select` skips through `high_discount_rate()`, so an empty decimal is skipped as in Java.
- **Builder-stamp guards.** `ReferenceRateFixingProto` has no `object_type`. The Rust scan does not flag `select`; the JS scan flags it only for calling `BondSecurity.getIssuances`, so it is an `EXCLUSIONS` row in `object-types.test.ts`.

## Amendment 2026-10-24 (LM-389): `bill_issue_date`

### Status

Accepted (LM-389). Owner ruling on LM-383, option (a), 24 Oct. Additive proto change.

### Decision

- `ReferenceRateFixingProto` gains `fintekkers.models.util.LocalDateProto bill_issue_date = 5`. For `T_BILL_13_WEEK` it is the issue date of the auction chosen for the fixing, copied from that issuance's `IssuanceProto.auction_issue_date`. A reopened bill uses the reopening's own issue date, not the original auction's. Unset for SOFR.
- valuation-service counts the bill's days to maturity from `bill_issue_date` to `bill_maturity_date`. This settles the open point above; no settlement-lag guess is needed. ledger-models still does no conversion maths.
- `rate`, `fixing_date` and `bill_maturity_date` keep their meanings.
- `select` in all four languages still picks the same issuance and copies its `auction_issue_date` proto into `bill_issue_date`. It never derives it, from maturity minus 91 days or from the auction date. The shared fixture's expected fixings gain `bill_issue_date`; every language also tests an inline bill issued four days after its auction, where a derived date would be wrong.
- Validation that a `T_BILL_13_WEEK` fixing has `bill_issue_date` is left to a separate item, once valuation-service reads the field. Requiring it now would reject valid payloads built before this field.

### Consequences

- Old readers skip field 5; new readers see it unset in old data.
- Rust code that builds `ReferenceRateFixingProto` with a struct literal and no `..Default::default()` must add the field.
- `wire-diff.py` rule `lm389` allows exactly this addition, listed in `test-fixtures/field-changes/lm-389.json`. The Java, Python and Rust exact-field-set tests take the union with that file.
- If the field is ever removed, 5 and `bill_issue_date` must be `reserved`, never reused.

## Amendment 2026-10-29 (LM-412): SOFR in published percent; RATE price type

### Status

Accepted (LM-412, owner ruling of 29 Oct on [LM-412](https://github.com/FinTekkers/ledger-models/issues/412)). Additive only: `PriceTypeProto.RATE = 5` and `ProductTypeProto.T_BILL_13_WEEK_SERIES = 36`. No value is renumbered, renamed or removed, and no field changes.

### Decision

```proto
enum PriceTypeProto {
  ...                                            // 0-4 unchanged
  RATE = 5;
}

enum ProductTypeProto {
  ...                                            // existing values unchanged
  T_BILL_13_WEEK_SERIES = 36;
}
```

- **Every `ReferenceRateFixingProto.rate` is the rate exactly as its source publishes it, in percent per annum.** SOFR is the rate as the New York Fed publishes it: `4.32` = 4.32%. This **supersedes** the LM-382 line "SOFR is unchanged" above, and the LM-365 Units text that `rate` is a decimal fraction. SOFR now matches `T_BILL_13_WEEK`, which has carried the published rate since LM-382.
- **valuation-service converts.** It converts SOFR from percent, and `T_BILL_13_WEEK` to the money-market yield as before. Models do no conversion.
- **`PriceTypeProto.RATE`** marks a price that is a reference-rate fixing (for example a SOFR or 13-week T-bill series stored in price-service). Its value uses the unit that `ReferenceRateFixingProto.rate` defines for the security's index. `INDEX_LEVEL` (CPI readings) and `PERCENTAGE` (bond prices as % of par) keep their meanings.
- **`ProductTypeProto.T_BILL_13_WEEK_SERIES`** is the series product for the 13-week T-bill benchmark, the counterpart of `SOFR_SERIES`. In `hierarchy.json` it has the same classification: parent `INDEX`, asset class `RATES`, instrument type `REFERENCE_INDEX`.
- The `DISCOUNT_MARGIN` catalog entry now says SOFR fixings are the published percent. `valuation_input_units.md` row L7 is restated to match.

### Consequences

- valuation-service does not read `fixings` yet (VS-110), so the SOFR unit change alters no reader's behaviour. VS-110 must convert SOFR from percent.
- A producer that already sends SOFR fixings as decimal fractions (`0.0432`) will be misread once VS-110 lands. No such producer is known.
- Old readers see `RATE` and `T_BILL_13_WEEK_SERIES` as unknown enum numbers; proto3 keeps them, so nothing breaks. price-service picks them up in its own item.
- If either value is ever retired, it is marked deprecated, never removed or renumbered.

### Checks

- `scripts/checks/wire-diff.py` rule `lm412` allows exactly the two values, listed in `test-fixtures/field-changes/lm-412.json`. That file's `kept` list holds every existing value of both enums. The descriptor tests in Java, Python, Rust and JS read it and assert that `kept` plus `added_values` is the whole enum.
- Each language's hierarchy tests assert that `T_BILL_13_WEEK_SERIES` has the same parent, asset class and instrument type as `SOFR_SERIES`.
- `ledger-models-python/test/requests/test_lm412_sofr_rate_spec.py` checks the `rate` comment, this amendment and the unchanged `INDEX_LEVEL` and `PERCENTAGE` comments.
