# ADR: ProductInput arms grouped by engine (mbs, equity, cash)

## Status

Accepted (LM-408, filed by Plan LM-376). Additive only: three new messages and three new `ProductInput` arms. No existing field number, name or type changes.

## Context

`ValuationRequestProto.security_input` (20) and `price_input` (22) are deprecated in favour of `product_input` (70) (LM-377). They can only be removed (LM-411) once every product valuation-service prices has a typed `ProductInput` arm. Before this item the oneof had `bond` (1), `tips` (2) and `frn` (8). Mortgage-backed securities, equities and cash were still valued from the flat fields.

This item adds `MbsInput mbs = 13`, `EquityInput equity = 14` and `CashInput cash = 15`. Mapping a security to its arm (`valuation_arms`, LM-409) and the `ProductInputs.forSecurity` builder (LM-410) are separate items.

## Decision

### The arms, grouped by engine

| Engine | Arm | Message | Price field | Unit |
|---|---|---|---|---|
| Fixed income | `bond` (1) | `BondInput` | `clean_price` (2) | % of face value (`99.75` = 99.75% of par) |
| Fixed income | `tips` (2) | `TipsInput` | `clean_price` (2) | % of face value |
| Fixed income | `frn` (8) | `FrnInput` | `clean_price` (2) | % of face value |
| Fixed income | `mbs` (13) | `MbsInput` | `clean_price` (2) | **% of current face** (original face × `mbs_extension.current_factor`) |
| Unit-priced | `equity` (14) | `EquityInput` | `unit_price` (2) | Price per share, in the security's currency |
| Unit-priced | `cash` (15) | `CashInput` | `unit_price` (2) | NAV per unit, in the security's currency (e.g. `1.00`) |

- **Fixed income** arms carry a clean price and, at field 20, `CostBasisInput cost_basis` for `ADJUSTED_COST_BASIS`. Static terms are read from `security.bond_details` and the product's extension.
- **Unit-priced** arms carry only the security and a unit price. Market value is price × quantity, with no accrual and no cost-basis inputs.

The units agree with row L6 of [`valuation_input_units.md`](valuation_input_units.md): bonds per 100 face, cash and equity per unit. This ADR does not restate a different rule. The one refinement is MBS: its `clean_price` is a percentage of **current** face, not original face. LM-409 must not price MBS on original face.

The `product_inputs.proto` header keeps a numbering map only (13 `mbs`, 14 `equity`, 15 `cash`, 16+ other). The engine grouping lives here, so the comments do not carry two competing taxonomies.

### Coupon types per arm

- `bond`: intended for `coupon_type` `FIXED`. Not validated today; `coupon_type` is ignored (VS-69, row L4 of `valuation_input_units.md`). `ZERO` is not claimed: whether the bond engine takes it cannot be confirmed from this repo.
- `frn`: intended for `coupon_type` `FLOAT`.

The comments say "intended", not "routes": nothing enforces the coupon type today.

### MbsInput

`MbsInput` has exactly `security` (1), `clean_price` (2) and `cost_basis` (20), the same shape as `BondInput` and `FrnInput`.

- **No pool fields.** Pool data (`pool_number`, `wac`, `wam`, `pass_through_rate`, `current_factor`, `psa_speed`, ...) lives in `MbsExtensionProto` on `security.mbs_extension` (207), next to `bond_details`. Repeating it on the input would give two sources for the same fact.
- **Fields 10–19 are kept free** for later prepayment and curve inputs. This is a comment, not `reserved`: `reserved` means retired numbers, and these are not retired. A later item uses them without deleting a `reserved` line.
- **G8.** valuation-service's known gap 8 (its `docs/product-inputs.md`, Known gaps table), tracked as VS-71: `MORTGAGE_BACKED` is valued as a bullet fixed-rate bond (no amortisation or prepayment), because it descends from `BOND`. The `mbs` arm gives MBS its own route, but it still uses the bond engine, so the numbers are unchanged until a real MBS engine replaces it.

### EquityInput and CashInput

Each has exactly `security` (1) and `unit_price` (2). Equities are e.g. `COMMON_STOCK` or `ETF`; cash is e.g. `CURRENCY` or `MONEY_MARKET_FUND`.

### `product_input` (70) comment

The comment now says that when `product_input` is set, the service values from this input alone, and `security_input` (20) and `price_input` (22) are not read for the calculation (they may still be read for logging and audit). It no longer implies a fallback path. Comment only.

### Branches reviewed

- `feature/282-mbs-support` is already an ancestor of `main`. It gave us `MbsExtensionProto` and `MORTGAGE_BACKED = 10`. Nothing more was taken.
- `bot/grpc-approach-3-oneof` is **not merged** and must not be merged as is. It renumbers the oneof (`mbs = 4`, `tips = 7`), uses 13 for `amortizing_bond` and 14 for `scenario`, and gives `MbsInput` eight pool fields. Only its shape was taken: `security` first, then the price. Its numbers and pool fields were rejected.

## Consequences

- valuation-service can route MBS, equity and cash requests through `product_input` once LM-409 maps them. Until a real MBS engine lands, MBS numbers match the bond engine (G8, VS-71).
- `scripts/checks/wire-diff.py` rule `lm408` allows exactly these additions (`test-fixtures/field-changes/lm-408.json`). Any renumber, rename or retype of an existing arm still fails.
- Old readers see the new arms as unknown fields and ignore them. If an arm must ever go, reserve its number and name; never reuse them.

### Out of scope

- `valuation_arms` (LM-409), `ProductInputs.forSecurity` (LM-410) and removing `security_input`, `price_input` (LM-411).
- No valuation-service changes.

## Addendum 2026-11-01 (LM-411)

`ValuationRequestProto.security_input` (20) and `price_input` (22) are removed. Both numbers and both names are `reserved`, so they are never reused. `position_input` (21) keeps its number, name and type. Callers build `product_input` (70) with `ProductInputs.forSecurity` (LM-410) and the request with `ValuationRequests.typed`. A type with no arm in `valuation_arms` raises `UnmappedProductTypeError` naming the type; no binding returns a request with `product_input` unset. Release notes: `docs/release-notes/lm-411.md`.

- **Units.** Row L6 of `valuation_input_units.md` (bonds per 100 face, cash and equity per unit) now applies to the arm price: `clean_price` on `bond`, `tips`, `frn` and `mbs`, `unit_price` on `equity` and `cash`.
- **Rust.** `Error::MissingSecurityInput` and `Error::MissingPriceInput` are deleted. Nothing in this repo raised them.
- **Removed-fields scan.** `test-fixtures/removed-fields/lm-376.json` drives `ledger-models-python/test/requests/test_removed_fields_scan.py`, the same scan as LM-344. It counts every hit in every tracked file except: this ADR, the release notes, the fixture and the test; `reserved` lines in `.proto` files; and quoted descriptor lines in the exact generated files the fixture lists under `descriptor_files`.
- **Homonym.** `CreateSecurityRequestProto.security_input` (20) is a different field, still in use, with the same name. Renaming it would be a second breaking change. The fixture lists, by exact path, the files that use it under `homonyms.files`. A hit in one of them is skipped only while the file never mentions `ValuationRequest`; a file that mentions both counts. Prefixed names (`search_price_input`, `create_price_input`, `search_security_input`, `query_security_input`, `cpi_price_input`) are not the removed fields; the fixture's `not_preceded_by` skips them, but a bare name on the same line still counts.
- **Wire diff.** `scripts/checks/wire-diff.py` rule `lm411` allows exactly these two deletions.
