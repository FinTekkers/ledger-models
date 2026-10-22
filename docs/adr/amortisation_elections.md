# ADR: ADJUSTED_COST_BASIS spec, AmortisationElectionsProto and typed tax lots

## Status

Accepted (LM-364, filed by valuation-service plan VS-110; owner rulings of 22 Oct). Additive only: no existing field is renumbered, retyped, renamed or removed, and reserved fields 24 and 25 on `ValuationRequestProto` stay reserved.

## Context

`MeasureProto.ADJUSTED_COST_BASIS` (4) was "reserved for future use". VS-110 will compute it in valuation-service as tax amortised cost. To do that the stateless valuation service needs two inputs it has no way to receive: the holder's US tax elections for bond premium and market discount, and the position's open tax lots with their trade dates, settlement dates, quantities and prices.

## Decision

```proto
// fintekkers/models/portfolio/amortisation_elections.proto
message AmortisationElectionsProto {
  PremiumAmortisationElectionProto bond_premium = 10;             // IRC §171. UNSPECIFIED → PREMIUM_ELECTED
  MarketDiscountInclusionProto market_discount_inclusion = 11;    // IRC §1278(b). UNSPECIFIED → AT_DISPOSITION
  MarketDiscountAccrualMethodProto market_discount_accrual = 12;  // IRC §1276(b)(2). UNSPECIFIED → RATABLE; only with INCLUDE_CURRENTLY
  fintekkers.models.util.LocalDateProto effective_from = 13;      // lots purchased on or after; unset = since inception
}
enum PremiumAmortisationElectionProto { UNSPECIFIED_PREMIUM_ELECTION = 0; PREMIUM_ELECTED = 1; PREMIUM_NOT_ELECTED = 2; }
enum MarketDiscountInclusionProto { UNSPECIFIED_MARKET_DISCOUNT_INCLUSION = 0; AT_DISPOSITION = 1; INCLUDE_CURRENTLY = 2; }
enum MarketDiscountAccrualMethodProto { UNSPECIFIED_ACCRUAL_METHOD = 0; RATABLE = 1; CONSTANT_YIELD = 2; }

message PortfolioProto        { ... AmortisationElectionsProto amortisation_elections = 11; }
message ValuationRequestProto { ... AmortisationElectionsProto amortisation_elections = 26;
                                    repeated TaxLotInputProto tax_lots = 27; }

// fintekkers/requests/valuation/product_inputs.proto
message TaxLotInputProto {
  fintekkers.models.util.LocalDateProto trade_date = 1;
  fintekkers.models.util.LocalDateProto settlement_date = 2;
  fintekkers.models.util.DecimalValueProto quantity = 3;
  fintekkers.models.util.DecimalValueProto price = 4;
}
```

- **Enums in one message, value 0 = "use the default".** Each election has more than two states once "not stated" counts, so a bool cannot say "the holder made no election". An unset message, or any unset field, means the default. No key/value bag and no second elections message.
- **The portfolio owns the elections; the request carries a copy.** `AmortisationElectionsProto` lives in `models/portfolio/`. Callers copy `PortfolioProto.amortisation_elections` (11) into `ValuationRequestProto.amortisation_elections` (26). valuation-service is stateless and reads only field 26.
- **`effective_from` is compared with the lot's `trade_date`.** "Purchased" means the trade date. A lot whose trade date is on or after `effective_from` gets the elections. Other lots get every default.
- **Amortisation accrues from `settlement_date`.** The constant yield is solved for each lot at its settlement date and purchase price.
- **`TaxLotInputProto` lives in `product_inputs.proto`**, next to the other typed valuation inputs (`TipsInput`, `FrnInput`, `YieldCurveInput`).
- **TIPS lot `price` is the real (unadjusted) price**, as quoted. Valuation amortises in real terms and then multiplies by the index ratio at the valuation date. The result is per 100 of original face, in nominal (today's) dollars, the same way TIPS market value is reported.
- **No open lots: the measure is absent, never 0.** The response carries a "no open lots" warning.
- **Applies to fixed-rate bonds, TIPS and FRNs.** Equity is dropped from `ADJUSTED_COST_BASIS`; MBS comes later under plan LM-354.
- **Tax elections only.** Book (GAAP/IFRS) elections are out of scope and have no field or enum value.

### Divergence from the ruled text: fields 1 and 2

The VS-110 ruling also lists `string object_class = 1; string version = 2;`. LM-318 removed that pattern from every proto, and `scripts/checks/proto-shape.sh` fails on any `object_class` or `string version = 2`. The LM-318 replacement (`ObjectTypeProto object_type = 1` plus `VersionProto version = 2`) is for stamped top-level messages, and each one needs its own `ObjectTypeProto` value and stamp helpers in every language. `AmortisationElectionsProto` is a value nested in other messages, like `TipsInput`, so it is not stamped. Fields 1 and 2 are left unused, not reserved, so a later item can stamp the message if needed. Fields 10–13 and the three enums match the ruling exactly.

## Units

- `TaxLotInputProto.quantity`: the same units as the position's quantity (face-value dollars for bonds). Positive.
- `TaxLotInputProto.price`: clean price per 100 face. TIPS: real, not multiplied by the index ratio.
- `ADJUSTED_COST_BASIS`: price per 100 face, quantity-weighted across open lots. TIPS: per 100 of original face, in nominal dollars.

## Rules not enforced here

- valuation-service does not compute `ADJUSTED_COST_BASIS` yet; the catalog keeps `implemented: false` until it does (VS-110).
- Lot validation (every field set, positive quantity, settlement on or after trade) belongs to valuation-service for now.
- The Java `PortfolioSerializer` and the other language wrappers do not yet carry `PortfolioProto` field 11 on a round trip. LM-366 fixes that.

## Checks

- `scripts/checks/wire-diff.py` rule `lm364` allows exactly these additions with these types.
- Python descriptor tests pin the ruled names and numbers, no bools, no map and no book names. Rust, Java and JS round-trip the new fields with non-zero enum values.
- `test-fixtures/catalog/lm-364-unchanged.json` pins the `UNADJUSTED_COST_BASIS` and `PROFIT_LOSS` catalog entries and `measure.proto` comments.

## Consequences

- Old readers skip fields 11, 26 and 27; new readers see them unset in old data, which means every default and no lots.
- If any of these fields is ever removed, its number and name must be `reserved`, never reused.
