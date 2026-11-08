# ADR: `priceType` on the Java `Price`, and prices with no security

## Status

Accepted (LM-449). Java model field; null-safe price serialization in Java,
Rust, Python and JS. No proto change.

## Context

LM-444 made the long-form Java `Transaction` constructor serialize its price
with `PriceSerializer.serialize`. That dereferenced `price.getSecurity()`
unconditionally, but `TransactionSerializer.readPrice` builds a `Price` with
a null security when the proto price has none. A bond BUY or SELL whose trade
price has no `security` (ledger-service LS-217) therefore threw an NPE in
`addMaturationTransaction`.

The Java `Price` also had no field for `PriceProto.price_type` (field 12), so
the re-serialized price on the maturation child lost it.

## Decision

- `Price` gains `PriceTypeProto priceType`, mirroring `PriceProto.price_type`.
  The existing 4-arg constructor keeps working and means `UNKNOWN_PRICE_TYPE`;
  a 5-arg overload takes the type (null means `UNKNOWN_PRICE_TYPE`).
  `equals` and `hashCode` stay keyed on `(id, asOf)`.
- `PriceSerializer.serialize` writes `security` only when it is set, and
  writes `price_type` only when it is not `UNKNOWN_PRICE_TYPE` or
  `UNRECOGNIZED`. Bytes for untyped prices that have a security are
  unchanged (the LM-444 golden fixtures still pass).
- `PriceSerializer.deserialize` and `TransactionSerializer.readPrice` read
  `price_type`. A proto with no `security` now deserializes to a null
  security in both, instead of `Security.fromProto` on an empty proto.
  Callers of `PriceSerializer.deserialize` (e.g. via `ProtoSerializationUtil`
  and `SerializerFactory`) may now see `getSecurity() == null`.
- A missing `security` stays absent. The models never fill it from the
  transaction's security; ledger-service's stopgap does that until it raises
  its minimum ledger-models version to this release.
- The cash child's price stays the fixed 1 USD cash price, tagged with the
  parent price's `price_type` when the parent has one (metric 3 of LM-449, as
  written). An untyped parent keeps `Price.getCashPrice()` unchanged.
- The same null guard in the other languages: Rust
  `PriceProtoBuilder::build()` no longer panics without a security, Python
  `Price.create_price(None, ...)` and JS `Price.create(..., null, ...)` leave
  `security` unset. An inline trade price is not a standalone price, so the
  price validators still report a missing `security` on their own.

## Consequences

- `price_source` (field 13) has no Java model field either, so a derived
  maturation child still drops it. Out of scope for LM-449; tracked
  separately.
- A `price_type` value unknown to an older jar reads as `UNRECOGNIZED` and is
  dropped on derived children. The parent keeps its stored bytes. Accepted:
  all languages release together.
