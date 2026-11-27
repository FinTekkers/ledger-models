# ADR: Bid, ask and mid on `PriceProto`

## Status

Accepted (LM-508). Proto rename and two new fields; wrappers, validators,
serializers and pricer inputs in Java, Python, JS/TS and Rust. Consumers
adopt it in their own items.

## Context

`PriceProto` held one number, field 10 `price`, so the side of the market was
lost. FedInvest publishes buy, sell and end of day for every Treasury, but
only end of day was kept. A corporate bond quote like 81.375 is a bid, with
nowhere to say so. High-yield bid/ask spreads are often 0.25 to 1 point, so
the side matters for valuation.

## Decision

### Proto

| Field | Number | Type | Meaning |
| --- | --- | --- | --- |
| `mid` | `10` | `DecimalValueProto` | The mid. Named `price` before LM-508. |
| `bid` | `14` | `DecimalValueProto` | The price a buyer quotes. |
| `ask` | `15` | `DecimalValueProto` | The price a seller quotes. |

- **Rename, not replace.** Field 10 keeps its number and type, so every
  price stored before this change reads as a mid with no migration. A new
  field plus a deprecated `price` would leave two fields meaning the same
  thing forever. The cost is a source break in the generated accessors and
  the JSON name, which the owner accepted (see `docs/release-notes/lm-508.md`).
- **14 and 15** are the next free numbers after `price_source = 13`.
- **One unit.** `price_type` is the unit of all three numbers. No per-side
  unit and no new enum: a quote whose sides are in different units is not a
  quote.
- **Validity.** At least one of mid, bid and ask is set (a non-empty
  `unscaled_value`; zero is valid), and ask ≥ bid when both are set. The
  validators report the first on `mid` and the second on `ask`.

The proto comment is the spec.

### Resolution order

One number, for callers that need one:

1. `mid` if set → kind `MID`;
2. else `(bid + ask) / 2` when both are set → kind `DERIVED_MID`;
3. else `bid` → kind `BID`;
4. else `ask` → kind `ASK`;
5. else none: Java `null`, Python `ModelValidationError` on `mid`, JS a
   `ModelValidationError` on `mid`, Rust `Error::Validation` on `mid`.

A set mid wins even when bid and ask are also set: a producer that publishes
a mid (e.g. FedInvest end of day) means it.

### The kind lives in the wrappers

`MID`, `DERIVED_MID`, `BID` and `ASK` are a wrapper enum in each language
(Java `PriceQuote.Kind`, Python `PriceKind`, JS `PriceKind`, Rust
`PriceKind`), not a proto enum: it is derived from which fields are set, so
storing it could only disagree with them.

The accessor is `getPriceKind()`, not `getPriceSource()`: `PriceProto`
already has field 13 `price_source` (MARKET / TRADE), and the generated
`getPriceSource()` would mean something else.

### Wrapper API

- `getPriceQuote()` (Python `get_price_quote()`, Rust `try_price_quote()`)
  returns the value and its kind together. **New code should use it**, so it
  cannot treat a bid as a mid by accident.
- `getPrice()` (Python `get_price()`, Rust `try_price()`) keeps its name and
  return type and returns the resolved value. It is the compatibility path:
  every existing caller compiles unchanged and, on mid-only data, gets the
  same number.
- `getPriceKind()` returns the kind alone.
- `getMid()`, `getBid()`, `getAsk()` return the raw fields, or null / None /
  `undefined` when unset.
- Builders take any mix: Java `Price.forQuote`, Python `Price.create_quote`,
  JS `Price.createQuote`, Rust `PriceProtoBuilder::mid / bid / ask`. The
  one-number helpers write `mid`, so their bytes are unchanged.

### Exact midpoint

The midpoint is computed on the unscaled integers, never in binary floating
point and never by a division with a precision limit:

- bring both values to the larger scale and add them;
- an even sum is halved at that scale; an odd sum is multiplied by 5 at one
  place more.

So `99 + 101 → 100`, `99.0 + 101.0 → 100.0` and `99.5 + 100 → 99.75`.
Halving always terminates in base 10, so this is exact, and all four
languages return the same value and scale. Java's `BigDecimal.divide(2)`
gives the same result. `decimal.js` division (20 digits by default) and
Python `Decimal` division (28 digits by default) would round, so neither is
used. Rust's `rust_decimal` holds at most 28 decimal places; a midpoint that
needs more is an `Error`, never rounded. The shared cases in
`test-fixtures/price/lm-508-cases.json` include a 29-digit midpoint.

### Pricer inputs

`ProductInputs.forSecurity` (and its Python, JS and Rust counterparts) puts
the resolved value into `clean_price` / `unit_price`. Mid, bid or ask is
copied as is; only a derived midpoint is a new decimal. A bid-only quote is
therefore valued at its bid; before, it had no price. Under "models first"
this rule belongs here, not in each service.

## Consequences

- Source break for every consumer that uses the generated accessor, the JSON
  name or the violation field name `"price"`. Listed in
  `docs/release-notes/lm-508.md`.
- A consumer on an older release reads a bid-only or ask-only price as no
  price. Producers write mid-only until consumers have upgraded.
- `wire-diff.py` rule `lm508` allows exactly the rename and the two
  additions.
