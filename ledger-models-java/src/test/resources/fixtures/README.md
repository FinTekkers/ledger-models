# Test fixtures

## `portfolio_pre_lm366.bin`

Wire bytes of a `PortfolioProto` stored before LM-366, with no
`amortisation_elections` (field 11). Generated once on commit `ca312a0b`
(LM-364) by a throwaway test that was then deleted: Java
`PortfolioSerializer.serialize(new Portfolio(id, name, asOf))`, plus
`valid_from`.

Fields set:

- `object_type` = `OBJECT_TYPE_PORTFOLIO`, `version` = the schema version (from `ObjectTypes.stamp`)
- `uuid` = `3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b`
- `as_of` = 2026-03-02T09:30 `America/New_York`
- `valid_from` = 2026-03-01T08:00 `America/New_York`
- `portfolio_name` = `Pre LM-366 Portfolio`

Read by `PortfolioSerializerTest.preLm366FixtureLoads`. Do not regenerate it
with newer code.

## `txn_{buy,sell,tips,frn}_lm444.bin` (LM-444)

Wire bytes of `Transaction.getProto()` under the #340 proto-backed wrapper,
captured on `main` at `18181d1e` by `GoldenFixtureCapture`, before LM-444
rewrote Transaction as a plain object. The builders are in
`TransactionGoldenFixtures`; every UUID and timestamp is fixed, and a second
capture gave identical bytes.

- `buy`: Treasury note BUY, quantity `1000000.00`, price `99.015625`,
  `as_of` 2026-11-06T09:30:15.123456789 `America/New_York`. A cash child
  and a maturity child with its own cash child.
- `sell`: SELL with no trade name and no position status (constructor
  defaults), a cash child and a `MATURATION_OFFSET` child.
- `tips`: TIPS BUY, a cash child and a maturity child.
- `frn`: FRN BUY built from a `TransactionProto` with every field set:
  `object_type`, `version`, `valid_from`, `valid_to`, inline portfolio,
  security and price, `position_status`, `trade_name`,
  `strategy_allocation` and `is_cancelled = true`. Two children.

Read by `TransactionGoldenBytesTest` (both directions) and
`TransactionRoundTripTest`. Do not regenerate them with newer code.

## `soma_buy_20261106.bin` and `soma_security_20261106.bin` (LM-444)

A SOMA Treasury BUY in the shape ledger-service stored on 6 Nov 2026: built
with the long-form constructor, then `addCashImpact` and
`addDerivedTransactions` (a cash child and a maturity child, the correct
2-child shape), serialised by the #340 wrapper at `18181d1e`. The child UUIDs
were random at capture. The security file is the full `SecurityProto` of the
note (maturity 2029-11-15) that the row's security link names.

These are reconstructed by `GoldenFixtureCapture`, not exported from a
database: they hold proto bytes only, no credentials or host data. Read by
`TransactionSomaFixtureTest` and `TransactionGoldenBytesTest`.
