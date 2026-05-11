# Registry versioning

Compatibility rules for changes to [`hierarchy.json`](./hierarchy.json) — the single source of truth for the FinTekkers product registry.

The registry is loaded by every consumer language at startup (Java / Rust / Python / JS-TS) and exposed via identical helpers (`parentOf`, `descendantsOf`, `isDescendantOf`, `assetClassOf`, `instrumentTypeOf`, `labelOf`). Changes to the registry have the same blast radius as changes to a public API — sometimes additive, sometimes breaking.

## Compatibility table

| Change | Compatibility | ledger-models bump |
| --- | --- | --- |
| Add a `status: active` leaf | Additive | minor (`0.x.0`) |
| Add a `status: planned` leaf | Additive — no proto enum value yet | none (patch ok) |
| Promote a leaf from `planned` → `active` (and ship its `ProductTypeProto` enum value) | Additive | minor |
| Add an abstract intermediate node | Additive only if it sits between an existing leaf and a different parent that the leaf already had — see "Reparenting" below | minor in the easy case |
| Remove a leaf | Breaking — drops a serialized proto enum value | major (`x.0.0`) |
| Reparent a leaf in the **productType** tree | Breaking — `descendantsOf` walkers and "all X" queries change result sets | major |
| Reparent an asset class in the **asset_class** tree | Breaking — same reason | major |
| Change `asset_class` on an existing leaf | Breaking — asset-class queries return different results | major |
| Change `instrument_type` on an existing leaf | Breaking — `instrumentTypeOf` queries return different results | major |
| Rename a leaf (string identity) | Breaking — proto enum value name changes; on-the-wire payloads referencing the old name fail to deserialize | major |
| Rename an abstract intermediate node | Breaking — `parentOf` / `descendantsOf` callers using the old name break | major |
| Change a `label` (display string) | Additive — labels are advisory, not load-bearing | none |
| Add `index_type` field to existing leaves when the dimension lands | Additive **if defaulted** — every existing leaf gets `index_type: "single_name"` (or a documented default) without opt-in | minor |
| Drop the `index_type` field after it's been added | Breaking | major |

## Why "reparenting" is breaking

`descendantsOf` walks the productType (or asset_class) tree to answer queries like "all credit bonds" or "all fixed income". If `MUNI_BOND` moves from `BOND` → `CREDIT_BOND`, then:

- `descendantsOf("BOND")` still includes `MUNI_BOND` transitively — but the path now goes through `CREDIT_BOND`. Existing callers that do shallow-only lookups (or that traverse one level expecting children to be leaves) misbehave.
- `descendantsOf("CREDIT_BOND")` previously returned `{CORP_BOND}` and now returns `{CORP_BOND, MUNI_BOND}`. Any caller depending on the old result set sees a behavioral change.

Either kind of change is breaking semantics, even though the JSON change is "small". Same applies to asset-class reparents: moving `RATES` to a different `FIXED_INCOME` ancestor changes "all FIXED_INCOME" results.

## Why renames are breaking

Leaf names are the string identity that `ProductTypeProto` enum values mirror. A rename means:

1. The proto enum value name changes (Java/Rust/Python/JS-TS callers using the old name fail to compile).
2. Persisted proto bytes referencing the old enum-value-by-number still deserialize — the underlying number is preserved — but text-based serializations (JSON, gRPC reflection clients, debug logs) break.
3. CI guard fails until every consumer updates.

If a rename is unavoidable, the safe sequence is:

1. Add the new name as a `status: planned` leaf with the same shape.
2. In a follow-up release, mark the old name `deprecated: true` and the new name `status: active`. Ship both proto enum values; consumers can read both, write the new one.
3. After all consumers are confirmed migrated, remove the old name in a subsequent major bump.

## Adding a new leaf — the easy path

For most cases (a new instrument type, a new option underlying, a new commodity) the addition is straightforward:

1. Edit `hierarchy.json`. Add the entry under the appropriate parent.
2. Pick `status: planned` if the proto enum value isn't being added in the same PR; pick `status: active` if it is.
3. If `status: active`: add the `ProductTypeProto` enum value with the next available number. The CI guard verifies that every active leaf has a matching proto enum value; the test fails until both sides are updated.
4. Update any worked example in [`hierarchy-examples.md`](./hierarchy-examples.md) that exemplifies the new leaf.
5. Ship as a minor version bump.

Loaders in market-data-inputs (separate repo) consume the leaf when they encounter the upstream code that maps to it. That mapping work is loader-side, not registry-side.

## What is *not* a registry change

The registry classifies **legal form**. It does not classify:

- Economic substance / risk look-through (a bond ETF is `STOCK › ETF` even though its risk is fixed-income — see "Look-through" in [hierarchy-examples.md](./hierarchy-examples.md)).
- Instrument-specific fields (coupon rate, maturity date, strike, expiry — those live on `SecurityProto` directly, not in the registry).
- Auction status (on-the-run vs off-the-run — lives elsewhere).
- Issuer or underlying identity (`AAPL` vs `MSFT` is a Security identity question, not a productType question).

Adding any of those concerns to the registry is **not** a registry change. They belong on `SecurityProto` (instrument fields), in the position service (look-through), or in dedicated reference-data services (auction calendar, issuer master).

## Quick decision flow

```
Is the change to hierarchy.json…

  …purely additive (new leaf, new abstract, new label string)?
    YES → minor bump (or none, for status:planned)

  …a rename of an existing leaf?
    YES → breaking, major bump. Use the deprecate-then-remove sequence.

  …a parent change for an existing leaf?
    YES → breaking, major bump. descendantsOf result sets change.

  …a (asset_class | instrument_type) change for an existing leaf?
    YES → breaking, major bump. Query results change.

  …a removal?
    YES → breaking, major bump.

Otherwise → review against the table above.
```

Reach for `status: planned` early when you're not sure — it lets the design land in the registry without committing to a proto enum value yet, which is the cheapest way to gather feedback.
