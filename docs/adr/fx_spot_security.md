# ADR: FX Spot Security Type and FxSpotDetailsProto

## Status

Accepted

## Context

FinTekkers needs to model spot foreign exchange (FX) rates as first-class securities so that FX prices and positions can be tracked through the same ledger infrastructure used for bonds, equities, and other instruments. An FX spot rate (e.g. USD/GBP) represents the current market exchange rate between two currencies.

FX rates are structurally different from other securities:
- They have no issuer, maturity, or coupon
- Their identity is defined by a currency pair (base + quote), not a ticker or CUSIP
- The price of an FX security is dimensionless only in context of the quoting convention

## Decision

### New enum value: `FX_SPOT = 7` in `SecurityTypeProto`

A dedicated enum value distinguishes spot FX instruments from cash securities (which represent a single currency balance) and from other instrument types. This keeps `security_type`-based dispatch reliable.

### New message: `FxSpotDetailsProto` in `security.proto`

```proto
message FxSpotDetailsProto {
  SecurityProto base_currency = 1;
  SecurityProto quote_currency = 2;
  string convention = 3;
}
```

**`base_currency`** — a link (`is_link=true`) to the cash security representing the currency being priced (e.g. the USD cash security). Stored as a `SecurityProto` link (using the `is_link` pattern) rather than a plain string so that:
- Currency securities are resolved through `SecurityService` like any other reference
- The full cash security (ISO code, settlement details) can be hydrated on demand
- Queries like "find all FX pairs where USD is the base" can use UUID equality

**`quote_currency`** — a link to the cash security in which the price is expressed (e.g. GBP). Same rationale as `base_currency`.

**`convention`** — a string describing the quoting convention. The standard value is `"UNITS_OF_QUOTE_PER_BASE"` (ISO convention: price = units of quote you receive for 1 unit of base). This field is a string rather than an enum to remain flexible for future conventions (e.g. forward points, cross rates) without a proto change.

### Placement in the `product_details` oneof

`FxSpotDetailsProto` is added as `fx_spot_details = 206` in the existing `product_details` oneof on `SecurityProto`. This follows the same pattern as `BondDetailsProto`, `TipsDetailsProto`, and all other instrument types added since the oneof migration.

No flat fields (equivalent to tags 50-92 for bonds) are added for FX, since there are no legacy callers to maintain backward-compatibility with. New consumers should use the oneof exclusively.

## Alternatives Considered

### Plain string currency codes (`string base_currency = 1`)
Simpler to populate but loses the link to the canonical cash security entity. Currency metadata (e.g. settlement conventions, ISO numeric code) would have to be fetched by string lookup rather than UUID. Rejected in favour of consistency with `SecurityProto.settlement_currency`.

### Separate `fx_pair.proto` file
Other detail types (`BondDetailsProto`, `TipsDetailsProto`, etc.) are defined inline in `security.proto`. A separate file would be inconsistent. Rejected — `FxSpotDetailsProto` is small enough to live alongside its siblings.

### Enum for `convention` instead of string
Only one convention exists today. A string avoids a proto change when new conventions are introduced and is self-documenting (the value is human-readable). Revisit if the set of conventions grows and exhaustive switching becomes common in business logic.

## Consequences

- **FX prices can now be stored** by creating a `PriceProto` whose `security` is a link to an FX_SPOT security.
- **FX positions can be computed** in the same ledger aggregation pipeline as bond/equity positions.
- **Currency pair lookup** is UUID-based: find all securities of type FX_SPOT where `fx_spot_details.base_currency.uuid == <USD uuid>`.
- **No flat-field fallback**: FX_SPOT securities must use the oneof. Consumers that only read flat fields (tags 50-92) will see an empty security — those consumers already do not handle FX.
