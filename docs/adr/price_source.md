# ADR: Price source on `PriceProto` (`price_source`)

## Status

Accepted (LM-395). Proto enum, field and one helper each in Java, Rust and
Python. ledger-service, price-service and MDI adopt it in follow-up items.

## Context

`PriceProto` cannot tell a trade price from a market price. `price_type`
describes the units of the number (absolute, percentage, basis points, index
level), not where the price came from. Consumers that need only market
prices (e.g. FedInvest end of day) had no field to filter on.

## Decision

Add a new enum in `fintekkers/models/price/price_source.proto`, next to
`price_type.proto`, and one plain field on `PriceProto`:

| Name | Number | Meaning |
| --- | --- | --- |
| `UNKNOWN_PRICE_SOURCE` | `0` | Unset. Read as MARKET: prices stored before this field existed. |
| `MARKET` | `1` | A published or observed market price (e.g. FedInvest end of day). |
| `TRADE` | `2` | The price a transaction was executed at. |

`PriceSourceProto price_source = 13;` is the next free number on
`PriceProto`. `price_type`, its values and its comments are unchanged; no
field is renamed or renumbered.

- **Plain enum, no `optional`.** Unset and `MARKET` mean the same thing, so
  there is nothing to gain from presence tracking. Proto3 does not write a
  zero, so prices stored before this field existed parse as
  `UNKNOWN_PRICE_SOURCE` and old readers skip field 13 as unknown.
- **The proto comments are the spec.** `0` is read as `MARKET`.

### Helper

One helper per language, proto in, boolean out, beside the price rules:

- Java: `PriceRules.isMarketPrice(PriceProto)`
- Python: `price_rules.is_market_price(proto)`
- Rust: `wrappers::models::price::is_market_price(&PriceProto)`

It compares the raw number: `0` or `1` is true, `TRADE` is false. An
unrecognised future value is also **false**, so a new source is never read
as market by accident. Java `null` and Python `None` read as unset (true),
the same as `validate`. It reads one int field, so it never triggers link
hydration.

- **Validation is not changed.** An unset source is valid.
- **No JS helper.** JS gets the regenerated bindings only.

### Names

Proto3 enum values share their package's scope. `MARKET` and `TRADE` are now
package-level names in `fintekkers.models.price`: a future enum in this
package cannot reuse them.

## Consequences

- Additive wire change; the `lm395` rule in `scripts/checks/wire-diff.py`
  allows exactly the enum, its three values and field 13.
- Rollback after release: do not delete the tag; ship a patch with
  `reserved 13;` and `reserved "price_source";` on `PriceProto`.
