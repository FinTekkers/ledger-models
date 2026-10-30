# ADR: valuation_arms — product type to ProductInput arm

## Status

Accepted (LM-409, filed by Plan LM-376). Additive: a new top-level `valuation_arms` key in `hierarchy.json` (`schema_version` 1.3) and a new `ProductInputs` lookup in every binding. No proto change; existing sections and loaders are unchanged.

## Context

LM-408 gave every product valuation-service prices a typed `ProductInput` arm (`bond`, `tips`, `frn`, `mbs`, `equity`, `cash`; see [`product_input_engine_arms.md`](product_input_engine_arms.md)). Callers still need to know which arm a security goes in, and which market data that arm needs, before they build the input (LM-410) or drop the flat fields (LM-411). Writing that answer in each service, or in each binding, would drift.

## Decision

### The data lives in hierarchy.json only

```json
"valuation_arms": {
  "entries": [
    { "node": "BOND", "arm": "bond", "requires": [] },
    { "node": "BOND", "coupon_types": ["FLOAT"], "arm": "frn", "requires": ["FRN_FIXINGS"] },
    { "node": "TIPS", "arm": "tips", "requires": ["CPI_U"] },
    ...
  ],
  "unpriced": ["FX_SPOT", "INDEX", "CRYPTO", ...]
}
```

- `node` is any `product_types` node, abstract or leaf. An abstract node covers every leaf beneath it.
- `coupon_types` (optional) narrows an entry to those `CouponTypeProto` names.
- `arm` is a field name of the `ProductInput.input` oneof.
- `requires` lists the market data the arm needs beyond the price. It is a closed vocabulary: `CPI_U`, `FRN_FIXINGS`, `FRN_CURVE`.
- `unpriced` lists nodes that have no arm. Unlike an unmapped node, it stops the walk, so an unpriced leaf never inherits an ancestor's arm.

There is no mapping table in any binding. Each binding has the three market-data names as a closed type (Java and Python `MarketDataKind` enums, a TS union, a Rust enum): a vocabulary, not a mapping.

### Resolution rule (identical in every binding)

1. Read `product_type` and `bond_details.coupon_type` from the `SecurityProto`. Unset `bond_details` reads as `UNKNOWN_COUPON_TYPE`. No class or `instanceof` checks, and no `SecurityRules.inferProductType`: the raw proto fields decide.
2. Walk from `product_type` up its `parent` chain.
3. At each node, in order: an entry whose `coupon_types` contains the coupon, then the node's entry with no `coupon_types`, then an `unpriced` listing.
4. **The first node with any match decides.** A deeper node always beats a shallower one, whatever the coupon. `TREASURY_FRN` gets `frn` from its own entry, `CONVERTIBLE_BOND` + `FLOAT` is unpriced (it does not reach the `BOND`/`FLOAT` entry), and `TREASURY_NOTE` + `FLOAT` gets `frn` from the `BOND` coupon entry, which beats the `BOND` plain entry.
5. No match, or an `unpriced` match, is an input error naming both types: `No valuation arm for product_type FX_SPOT, coupon_type UNKNOWN_COUPON_TYPE`. **There is no default arm and no fallback to the flat fields.**

`ZERO` and `UNKNOWN_COUPON_TYPE` bonds resolve to `bond` through the `BOND` plain entry; TBILL relies on this. Whether the bond engine prices every `ZERO` bond correctly is outside this ADR.

Planned structured and convertible leaves (`CMBS`, `ABS`, `CLO`, `CONVERTIBLE_BOND`, `COCO`) are `unpriced`, so they do not inherit `bond` from `BOND` (or `frn` for a floating coupon). `MORTGAGE_BACKED` alone gets `mbs`.

### Load-time checks

Every binding checks the section once, on first use, and fails the load if:

- a `node` or `unpriced` value is not in `product_types`;
- an `arm` is not a field of the `ProductInput.input` oneof, read from the generated descriptor (Java `Descriptors`, Python `DESCRIPTOR`, JS `ProductInput.InputCase`, Rust the embedded `FileDescriptorSet` decoded with `prost-types`, so `prost-reflect` stays behind `test-utils`);
- a `coupon_types` value is not a `CouponTypeProto` name;
- a `requires` value is not `CPI_U`, `FRN_FIXINGS` or `FRN_CURVE`;
- a (`node`, coupon) pair appears twice, or a node is both mapped and `unpriced`.

A broken registry is a different error from an unmapped type: Java `IllegalStateException`, Python `InvalidRegistryError` (a `RuntimeError`, not a `ValueError`), JS `Error`, Rust `ProductInputError::InvalidRegistry`. Rust returns it as an `Err`; it never panics.

### API

| Binding | Arm | Market data | Unmapped |
|---|---|---|---|
| Java | `common.models.security.ProductInputs.armFor(SecurityProto)` → `String` | `requiredMarketData(SecurityProto)` → unmodifiable `List<MarketDataKind>` | `common.models.errors.UnmappedProductTypeError` |
| Python | `fintekkers.wrappers.models.security.product_inputs.arm_for` → `str` | `required_market_data` → new `list[MarketDataKind]` | `fintekkers.wrappers.models.errors.UnmappedProductTypeError` |
| JS/TS | `wrappers/models/security/product_inputs` `armFor` → `string` | `requiredMarketData` → new `MarketDataKind[]` | `wrappers/models/errors` `UnmappedProductTypeError` |
| Rust | `wrappers::models::product_inputs::arm_for` → `Result<&'static str, ProductInputError>` | `required_market_data` → `Result<Vec<MarketDataKind>, ProductInputError>` | `Err(ProductInputError::Unmapped { product_type, coupon_type })` |

`UnmappedProductTypeError` is an input error (docs/adr/typed-input-errors.md), never a state error. Java's extends `IllegalArgumentException`; the `Error` suffix matches the other bindings, not the Java `*Exception` habit, and the class is not a `java.lang.Error`. Services map it to `INVALID_ARGUMENT`; Rust's `From<ProductInputError> for tonic::Status` does so for `Unmapped` (and `Internal` for `InvalidRegistry`).

### Why Java and Rust read the file again

`ProductHierarchy.java` and `product_hierarchy.rs` parse `hierarchy.json` into fixed structures. Teaching them a new section would change existing loaders, which this item keeps unchanged. So `ProductInputs` reads `/hierarchy.json` from the classpath (Java) or `include_str!`s the crate-root mirror (Rust) itself, and uses only the public tree helpers (`parentOf`, `descendantsOf`, `allProductTypes`). It is one more parse of a small file, once per process. Python reads through a new public `product_hierarchy.registry_section(name)` accessor, and JS imports the same JSON module, so neither parses twice.

### Coverage

Every leaf in `product_types`, active or planned, must resolve to an arm or to `unpriced`. Java and Python tests fail on any uncovered leaf. That test cannot catch a leaf that is covered wrongly: **a new leaf under a mapped node (e.g. a new `BOND` leaf) inherits that node's arm, so adding one needs a reviewed `valuation_arms` decision** (see `registry-versioning.md`).

## Consequences

- valuation-service (LM-410, LM-411) asks `armFor` / `requiredMarketData` instead of keeping its own table.
- Adding an arm to `ProductInput` is a proto change first; the registry can name it only once the descriptor has the field.
- The shared cases live in `ledger-models-protos/fixtures/valuation_arms_cases.json`, read by all four bindings' tests.
