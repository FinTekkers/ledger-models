# ADR: Forward-curve tenor range (`CurvePointProto.from_tenor` / `to_tenor`)

## Status

Accepted (LM-313). The proto change and regenerated bindings for Java,
Python, Rust and JS. Writers (valuation-service) and readers (ui-service)
adopt the fields in follow-up items in those repos.

## Context

`CurvePointProto` has `tenor = 1` and `yield = 2`, both `DecimalValueProto`.
For `PAR_YIELD` and `SPOT_YIELD` points `tenor` is the point tenor in years.

A forward point covers a period, not a point. valuation-service
(`forward_to_result` in `src/calculators/curve/mod.rs`) writes it as a text
label such as `"1-2"` in `tenor`'s deprecated string form
(`arbitrary_precision_value`), and ui-service splits the label to draw the
forward chart. That string is not a decimal at all.

The compact form (`unscaled_value` + `scale`, `docs/adr/compact_decimal.md`)
can only hold a number. Once LM-295 stops writing the string form, forward
tenors would arrive empty.

## Decision

1. **Two new fields on `CurvePointProto`:**

   | Field | Number | Type |
   | --- | --- | --- |
   | `from_tenor` | `3` | `fintekkers.models.util.DecimalValueProto` |
   | `to_tenor` | `4` | `fintekkers.models.util.DecimalValueProto` |

   - Both are in decimal years from the as-of date, like `tenor`.
   - **Set only on `FORWARD_YIELD` points**, always together. Unset on
     `PAR_YIELD` and `SPOT_YIELD` points, whose output does not change.
   - The point's `yield` is the forward rate from `from_tenor` to `to_tenor`.
   - When `CurveRequestProto.forward_term_years` is T (valuation-service uses
     1 when it is unset), `to_tenor = from_tenor + T`. This matches
     `compute_term_forward_curve`, which never truncates the last period: it
     only emits periods that end within the spot curve.
   - `from_tenor = 0` is valid (the first period starts today). Readers test
     presence of the message (`Option::is_some`, `hasFromTenor()`,
     `HasField("from_tenor")`), not a non-zero value. A compact zero is the
     single byte `0x00`, so it is never read as unset.
2. **`tenor` keeps its number, type and name.** Its comment now says it is the
   point tenor for par and spot points, and that readers must not parse it on
   forward points. The `"1-2"` label is legacy; LM-318 deleted the string form that carried it.
3. **Ordering contract.** `CurveResultProto.points` said "ordered by ascending
   tenor", which has no meaning for a label. It now says par and spot points
   are ordered by ascending `tenor`, forward points by ascending `from_tenor`.
   This is what valuation-service already emits.

## Alternatives rejected

- **A nested `TenorRangeProto { from_tenor, to_tenor }` field.** It keeps the
  pair together, but adds a nesting level for every consumer, and the item's
  metric names the two fields directly on `CurvePointProto`.
- **Two `double` fields.** proto3 scalars have no presence, and 0 is the
  default and also a valid `from_tenor`, so "unset on par and spot" could not
  be told apart from a period starting today. It also breaks the project-wide
  decimal convention that `tenor` and `yield` follow.

## Rollout

1. ledger-models releases the fields (this change). Old readers skip fields 3
   and 4. Old payloads decode with both fields unset.
2. ui-service bumps its pinned ledger-models, labels forward points from
   `from_tenor` / `to_tenor`, and falls back to splitting the `"1-2"` label
   when they are unset. It deploys first.
3. valuation-service bumps its pinned ledger-models and writes `from_tenor` /
   `to_tenor` on forward points.
4. LM-295 stops writing the decimal string form, `"1-2"` labels included. It
   depends on step 3.

## Rollback

After release, do not delete the fields: consumers pin the previous tag. To
retire them, mark them `[deprecated = true]` and later `reserved 3, 4;`.
Never reuse 3 or 4.

## Tests

`ledger-models-rust/tests/curve_response_roundtrip_test.rs` (run by
`scripts/checks/test.sh` and `.github/workflows/test.yml`):

- `from_tenor` = 1, `to_tenor` = 2 round-trip in the compact form only.
- `from_tenor` = 0 round-trips as set, not unset.
- The descriptor set has `tenor` = 1, `yield` = 2, `from_tenor` = 3 and
  `to_tenor` = 4, all `DecimalValueProto`.
- Hard-coded bytes of a pre-LM-313 point decode with both new fields unset.
