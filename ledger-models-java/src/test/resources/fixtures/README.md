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
