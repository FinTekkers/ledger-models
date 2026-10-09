# ADR: One asset-class vocabulary, a shared match helper, and enum labels

## Status

Accepted (LM-275, [#275](https://github.com/FinTekkers/ledger-models/issues/275)).

## Context

ledger-models had two asset-class vocabularies that did not match:

- `AssetClassProto` (`asset_class.proto`): `FIXED_INCOME`, `EQUITY`, `CASH_ASSET_CLASS`, `INDEX`, `VOLATILITY`, `CRYPTO`.
- `asset_classes` in `hierarchy.json`: 14 codes in a tree (`FIXED_INCOME` → `RATES` / `CREDIT`, `COMMODITY` → `METALS` / `ENERGY` / `AGRICULTURAL`, …).

`SecurityProto.asset_class` is a free string, and stored data holds `RATES`, `EQUITY` and `Cash`. A filter on one vocabulary found nothing in the other (asset-class filtering found no equities). ui-service also hard-codes identifier-type and instrument-type labels because ledger-models had none.

## Decision

### `hierarchy.json` is the one canonical list

- `asset_classes` in `ledger-models-protos/hierarchy.json` holds every asset-class code and the tree. No code, label or parent is copied into Java, JS or Python source; each loader reads the file at runtime.
- `AssetClassProto` values that have no `hierarchy.json` code are marked `deprecated = true`, with a comment pointing at `hierarchy.json`: `CASH_ASSET_CLASS` and `INDEX`. No value is renamed or renumbered. A test in Java and Python fails if any other non-`UNKNOWN` value lacks a code.
- `SecurityProto.asset_class` stays a `string`. Flipping it to the enum is a later, coordinated change.

### Aliases

An `asset_classes` entry may carry `"aliases": [...]`: legacy values that resolve to that code. Today only `CASH` has one, `"CASH_ASSET_CLASS"` (the enum name). Legacy display values like `"Cash"`, `"Equity"` and `"Fixed Income"` need no alias: they are the labels, and labels resolve.

### The match rule

The same in every language:

1. **Resolve** a value to a code:
   - `null` returns no code.
   - An exact `asset_classes` key returns that key.
   - Otherwise normalise: trim, upper-case, and turn each run of whitespace or hyphens into `_`. Look the result up in a map of normalised code, label and alias → code.
   - Anything else returns no code. Blank values normalise to `""` and return no code.
2. **Match** `(filter, stored)`: resolve both. If either has no code, `false`. Otherwise `true` iff the codes are equal or the stored code is a descendant of the filter code.

So `FIXED_INCOME` matches `RATES`, `CREDIT`, `"Fixed Income"` and `"fixed-income"`; `CASH` matches `"Cash"` and `"CASH_ASSET_CLASS"`; `EQUITY` does not match `RATES`; a child filter (`RATES`) does not match its parent; unknown values match nothing.

The lookup map is built from `asset_classes` only, never from `product_types` (which also has keys `INDEX` and `CRYPTO`). Building it **throws at load** if two codes claim the same normalised key, so an ambiguous label or alias can't ship.

`ledger-models-protos/fixtures/asset_class_matches.json` holds the cases. The Java, JS and Python tests all read it, so the three implementations can't drift.

### `INDEX` matches nothing

`hierarchy.json` has no `INDEX` asset class: indices are modelled by `instrument_type` `REFERENCE_INDEX` plus the underlying's asset class (`EQUITY_INDEX` is `EQUITY`, `BOND_INDEX` is `RATES`). So `INDEX` is deprecated with no alias, and a stored `"INDEX"` asset class (or an `INDEX` filter) matches nothing. The ui-service follow-up must know this. If it has to keep matching, add an alias in `hierarchy.json` only; no code changes.

### Enum labels

A new top-level `enum_labels` block in `hierarchy.json` holds labels, keyed by proto enum name then value name, for enum values with no entry elsewhere. Identifier types also get an input `placeholder`.

Lookup order:

| Enum | Label source |
| --- | --- |
| `IdentifierTypeProto` | `enum_labels.IdentifierTypeProto` (label and placeholder) |
| `InstrumentTypeProto` | `enum_labels.InstrumentTypeProto` |
| `ProductTypeProto` | `product_types[name].label`, else `enum_labels.ProductTypeProto` (`PRODUCT_TYPE_UNKNOWN`) |
| `AssetClassProto` | label of the code the name resolves to (`CASH_ASSET_CLASS` → `Cash`), else `enum_labels.AssetClassProto` (`UNKNOWN_ASSET_CLASS`, `INDEX`) |

A test per language loops over every value of the generated enums (not over `enum_labels`) and fails on any missing label or identifier-type placeholder, so a new enum value without a label fails CI.

The seed labels and placeholders are ledger-models' own. ui-service's current strings are not in this repo; the ui-service follow-up should compare them and change `enum_labels` here if they differ (labels are advisory, so that is a non-breaking change).

### Function names per language

| Purpose | Java (`common.models.security.ProductHierarchy`) | JS/TS (`node/wrappers/models/security/product_hierarchy`) | Python (`fintekkers.wrappers.models.security.product_hierarchy`) |
| --- | --- | --- | --- |
| Resolve to a code | `resolveAssetClass(String)` → `Optional<String>` | `resolveAssetClass(value)` → `string \| null` | `resolve_asset_class(value)` → `Optional[str]` |
| Match | `assetClassMatches(filterCode, storedValue)` | `assetClassMatches(filterCode, storedValue)` | `asset_class_matches(filter_code, stored_value)` |
| Identifier-type label | `labelOf(IdentifierTypeProto)` | `identifierTypeLabelOf(v)` | `identifier_type_label_of(v)` |
| Identifier-type placeholder | `placeholderOf(IdentifierTypeProto)` | `identifierTypePlaceholderOf(v)` | `identifier_type_placeholder_of(v)` |
| Instrument-type label | `labelOf(InstrumentTypeProto)` | `instrumentTypeLabelOf(v)` | `instrument_type_label_of(v)` |
| Product-type label | `labelOf(ProductTypeProto)` | `productTypeLabelOf(v)` | `product_type_label_of(v)` |
| Asset-class enum label | `labelOf(AssetClassProto)` | `assetClassProtoLabelOf(v)` | `asset_class_proto_label_of(v)` |

Java uses overloads; JS and Python enums are plain numbers, so each enum gets its own function name. An unknown value (Java `UNRECOGNIZED` or `null`, an out-of-range number in JS or Python) returns `null` / `None` and never throws. The existing Java `labelOf(String)` is unchanged and still takes a productType node.

A Rust helper is a follow-up item. Rust's `Registry` ignores the new keys, so it keeps loading the file unchanged.

## Alternatives considered

- **Labels as proto custom options** (`extend google.protobuf.EnumValueOptions`). Rejected: the `google-protobuf` JS runtime keeps no descriptors, so JS would need its own codegen step; and labels would live in protos while the tree and aliases live in JSON, giving two sources of truth.
- **Generate typed constants from `hierarchy.json`** in `compile.sh`. Rejected: a third mechanism beside the existing runtime loaders and mirrors, with generated files that need a drift check.

## Consequences

- `schema_version` goes from `1.0` to `1.1`; both new keys are additive (see `registry-versioning.md`).
- Java callers of `CASH_ASSET_CLASS` or `INDEX` get deprecation warnings, not errors. Wire format and field numbers are unchanged.
- ui-service and the other services can drop their hard-coded lists and labels after bumping to this release. That switch is follow-up work in their repos.
