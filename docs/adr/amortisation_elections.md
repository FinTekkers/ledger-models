# ADR: ADJUSTED_COST_BASIS spec, AmortisationElectionsProto, TaxLotProto and CostBasisInput

## Status

Accepted (LM-364, filed by valuation-service plan VS-110; owner rulings of 22 Oct). Additive only: no existing field is renumbered, retyped, renamed or removed. Nothing is added to the root of `ValuationRequestProto`, and its reserved fields 24 and 25 stay reserved. This replaces the PR #371 design (root fields 26/27, `TaxLotInputProto`, `effective_from`).

## Context

`MeasureProto.ADJUSTED_COST_BASIS` (4) was "reserved for future use". VS-110 will compute it in valuation-service as tax amortised cost. The stateless valuation service needs two inputs it has no way to receive: the portfolio's US tax elections for bond premium and market discount, and the holding's open tax lots.

## Decision

```proto
// fintekkers/models/portfolio/amortisation_elections.proto
message AmortisationElectionsProto {
  PremiumAmortisationElectionProto bond_premium = 10;             // IRC §171; UNSPECIFIED → PREMIUM_ELECTED
  MarketDiscountInclusionProto market_discount_inclusion = 11;    // IRC §1278(b); UNSPECIFIED → AT_DISPOSITION
  MarketDiscountAccrualMethodProto market_discount_accrual = 12;  // IRC §1276(b)(2); UNSPECIFIED → RATABLE; only with INCLUDE_CURRENTLY
}
message PortfolioProto { ... AmortisationElectionsProto amortisation_elections = 11; }

// fintekkers/models/position/tax_lot.proto
message TaxLotProto {
  fintekkers.models.util.LocalDateProto open_date = 1;
  fintekkers.models.util.DecimalValueProto open_quantity = 2;
  fintekkers.models.util.DecimalValueProto price = 3;
}

// fintekkers/requests/valuation/product_inputs.proto
message CostBasisInput {
  fintekkers.models.portfolio.AmortisationElectionsProto elections = 1;
  repeated fintekkers.models.position.TaxLotProto lots = 2;
}
message BondInput { ... CostBasisInput cost_basis = 20; }
message TipsInput { ... CostBasisInput cost_basis = 20; }
message FrnInput  { ... CostBasisInput cost_basis = 20; }
```

- **The input lives on the product inputs, not the root.** `ProductInput` already routes each request to one typed input (`BondInput`, `TipsInput`, `FrnInput`), and each carries what its engine reads. `CostBasisInput` follows that pattern: one shared message, field 20 on every input that supports `ADJUSTED_COST_BASIS`. The root of `ValuationRequestProto` gains nothing.
- **Enums in one message, value 0 = "use the default".** Each election has more than two states once "not stated" counts, so a bool cannot say "no election made". An unset message, or any unset field, means the default. No key/value bag and no second elections message.
- **Elections are fixed per portfolio.** They apply to every lot. There is no effective date (owner ruling). The portfolio owns them (`PortfolioProto.amortisation_elections` = 11); the caller copies them into `CostBasisInput.elections`, because valuation-service is stateless and reads only the request.
- **No stamp.** `AmortisationElectionsProto` is a value nested in other messages, so it has no `object_type`/`version` (LM-318). Fields 1 and 2 are left unused.
- **Lots are a domain model, not stripped transactions.** `TaxLotProto` is the proto form of the tax lots ledger-models already computes in Java (`common.models.taxLot.TaxLotSummary`, in this repo). It has three fields only: no copies of transaction fields and no `PositionProto` field or measure maps. Accrual starts at `open_date` plus the product's settlement lag (e.g. T+1 for Treasuries); valuation-service owns that convention table.
- **TIPS lot `price` is the real (unadjusted) price.** Valuation amortises in real terms and then multiplies by the index ratio at the valuation date, giving a figure per 100 original face in nominal dollars.
- **Tax elections only.** Book (GAAP/IFRS) elections are out of scope and have no field or enum value.

The full measure rules (OID, premium, market discount, de minimis, accrual start, TIPS, FRN, no lots, scope) are in the `ADJUSTED_COST_BASIS` comment in `measure.proto`, the spec, and in its catalog entry.

## Units

- `TaxLotProto.open_quantity`: the quantity still open, in the position's units (face value for bonds).
- `TaxLotProto.price`: purchase price per 100 face, clean. TIPS: real, not multiplied by the index ratio.
- `ADJUSTED_COST_BASIS`: price per 100 face, quantity-weighted over the open lots. TIPS: per 100 original face, in nominal dollars.

## Treasury FRN (LM-383)

The `ADJUSTED_COST_BASIS` comment and catalog entry state the Treasury FRN rule (`T_BILL_13_WEEK` index). It reuses the existing inputs and adds no field: `FrnInput.cost_basis` (20) for lots and elections, and `FrnInput.fixings` (11), whose `rate` keeps the LM-382 meaning, the published high discount rate in percent (`valuation_input_units.md` row L7).

- **Per lot, fixed at the lot's accrual start.** Each lot is amortised as the equivalent fixed-rate instrument, with coupon `MMY(fixing) + spread / 10000` from the fixing in effect at the lot's accrual start (latest `fixing_date` on or before it). Later resets do not change the schedule, so a lot's basis never needs the fixing history after it opens. OID uses the fixing in effect on the issue date.
- **The conversion is valuation-service's job** (owner ruling, 24 Oct, option (a)): `MMY = 360 * d / (360 - d * t)`, a 360-day basis, with `d = rate / 100` and `t = bill_maturity_date - bill_issue_date` in days. `bill_issue_date` (LM-389) is the chosen auction's own issue date, so a reopened bill counts from the reopening.
- **No fixing on or before a needed date makes the request invalid.** Other indices (SOFR) are not defined yet.

## Who maps TaxLotSummary to TaxLotProto

`TaxLotSummary` is in the models jar, so the `TaxLotSummary` → `TaxLotProto` serializer belongs in ledger-models too (Models first, rule 5), not in ledger-service. That serializer owns the unit conversion, once, for every service.

LM-366 added it as Java `TaxLotSummary.toProto()`:

- `open_date` and `price` come from the lot's earliest delta by `asOf`. `price` is that delta's purchase price, not `getAverageCostBasis()`. Lot prices are stored as quoted (clean, per 100 face; TIPS: real), so no scaling is applied.
- `open_quantity` is `openQuantity()`, the sum of every delta, so partial closes are netted. A fully closed lot gives 0; the caller filters closed lots.
- No delta is skipped, invalidated or not, matching `openQuantity()`. `TaxLotDelta.createDelta` copies the open date and price, so every delta of a lot carries the same values.
- A lot with no deltas, or with no open date or price, throws `IllegalStateException` naming the lot.

`TaxLotSummary` exists only in Java, so there is no counterpart in the other languages.

## Portfolio serialization keeps every field

Java `PortfolioSerializer.serialize` used to copy fields one by one and dropped `valid_from`, `valid_to` and `amortisation_elections`. Since LM-366 it starts from the portfolio's proto and re-stamps only `object_type`, `version`, `uuid` and `as_of`, so every stored field, including any added later, passes through. A link still serializes as `uuid`, `as_of` and `is_link` without hydrating. `Portfolio.getAmortisationElections()` returns the message; a portfolio stored before field 11 returns the default instance, so every election reads UNSPECIFIED and no migration is needed. The Python, JS and Rust wrappers already keep the whole proto.

## Rules not enforced here

- valuation-service does not compute `ADJUSTED_COST_BASIS` yet; the catalog keeps `implemented: false` until it does (VS-110).
- What happens when a bond has no `IssuanceProto.price_for_single_price_auction` is not yet ruled; that will be a comment-only follow-up.
- Persisting `PortfolioProto.amortisation_elections` in ledger-service is a ledger-service follow-up.
- The catalog `applies_to` for this entry uses product types (`TREASURY_NOTE`, …); older entries still use `BOND_SECURITY`/`TIPS`/`FRN`. No code reads `applies_to`.

## Checks

- `scripts/checks/wire-diff.py` rule `lm364` allows exactly these additions with these types; a root field or a fourth `TaxLotProto` field fails it.
- Python descriptor tests pin the ruled names and numbers, enums only, three lot fields, and the unchanged `ValuationRequestProto` field set. Java, Python, Rust and JS round-trip a `TipsInput` with non-default elections and two lots.
- `test-fixtures/catalog/lm-364-unchanged.json` pins the `UNADJUSTED_COST_BASIS` catalog entry and the `UNADJUSTED_COST_BASIS` and `PROFIT_LOSS` `measure.proto` comments. `PROFIT_LOSS` had no catalog entry before LM-364; LM-402 added one.
- `test_lm383_frn_acb_spec.py` checks the Treasury FRN rule in both the comment and the catalog entry, and that every line from before LM-383 (`test-fixtures/catalog/lm-383-acb-before.json`) is kept, in order.

## Consequences

- Old readers skip `PortfolioProto` 11 and the inputs' field 20; new readers see them unset in old data, which means every default and no lots, so the measure is absent.
- If any of these fields is ever removed, its number and name must be `reserved`, never reused.
