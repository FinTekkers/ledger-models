# ADR: ProductInputs.forSecurity and ValuationRequests.typed

## Status

Accepted (LM-410, filed by Plan LM-376). Additive: new builders in every binding. No proto change and no `hierarchy.json` change: the flat security and price fields (20 and 22) stay in `ValuationRequestProto` until LM-411.

## Context

LM-409 says which `ProductInput` arm values a security and which market data that arm needs (`armFor` / `requiredMarketData`, see [`valuation_arms.md`](valuation_arms.md)). Callers still filled the arm by hand, or kept sending the flat fields 20 and 22. A caller in any language should build a fully typed request in two calls, and get the same bytes and the same errors in every language.

## Decision

### Two builders

| Binding | Product input | Request |
|---|---|---|
| Java | `common.models.security.ProductInputs.forSecurity(SecurityProto, PriceProto, MarketData)` | `common.models.security.ValuationRequests.typed(LocalTimestampProto, ProductInput, PositionProto, List<MeasureProto>)` |
| Python | `fintekkers.wrappers.models.security.product_inputs.for_security(security, price, market_data=None)` | `fintekkers.wrappers.requests.valuation.ValuationRequests.typed(asof, product_input, position, measures)` |
| JS/TS | `wrappers/models/security/product_inputs` `forSecurity(security, price, marketData?)` | `wrappers/requests/valuation/ValuationRequests` `ValuationRequests.typed(asof, productInput, position, measures)` |
| Rust | `wrappers::models::product_inputs::for_security(&security, &price, &market_data)` | `wrappers::models::valuation_requests::typed(asof, product_input, position, &measures)` |

`forSecurity`:

1. The arm comes only from `armFor`. There is no second type-to-arm map. An unmapped or `unpriced` type raises LM-409's `UnmappedProductTypeError`; there is no fallback to fields 20 and 22.
2. It sets the arm's `security` and copies `price.price` as is (no re-parse, so the decimal bytes are the caller's) into `clean_price` for `bond`, `tips`, `frn` and `mbs`, or `unit_price` for `equity` and `cash`. An unset price stays unset.
3. `tips` takes `cpi` from the market data; `frn` takes `curve` and `fixings`. Market data the arm has no field for is ignored.
4. It never sets `cost_basis` (20). `ADJUSTED_COST_BASIS` callers add it themselves.
5. It then runs `checkProductInput` on the result.

`typed` sets `asof_datetime` (23), `measures` (30), `position_input` (21) and `product_input` (70), and stamps the request (LM-322). It never sets 20 or 22. `position_input` is always set: a missing position (or asof) is a `ModelValidationError` naming the field. Rust takes the position by value, so it cannot be missing. It runs `checkProductInput` first.

`checkProductInput` (public in every binding, so a service can check an input it received):

- no arm set: `ModelValidationError` on `product_input`;
- the arm is not the one `armFor` picks for the arm's security: `ModelValidationError` on `product_input.<arm>`;
- a kind the arm `requires` is missing: `MissingMarketDataError`.

So a `tips` input with no `cpi` raises from `typed` as well as from `forSecurity`, without a second rule.

### Market data and the presence rule

`MarketData` holds one field per `MarketDataKind` (LM-409's closed `requires` vocabulary): `CPI_U` is `cpi` (`InflationIndexInput`), `FRN_FIXINGS` is `fixings` (`ReferenceRateFixingProto` list), `FRN_CURVE` is `curve` (`YieldCurveInput`). The field names are the arm field names, so a kind maps to one field everywhere.

Presence is read from the built `ProductInput`, in one function per binding (`has`) next to the kind-to-field map (`fieldOf`):

- `CPI_U`: `tips.cpi` has `readings` or `reference_cpi` set. An `InflationIndexInput` with only `index` does not count.
- `FRN_FIXINGS`: `frn.fixings` is not empty.
- `FRN_CURVE`: `frn.curve` is set.

`forSecurity` with no market data (Python `None`, JS `undefined` or `null`, Java `null`, Rust `MarketData::default()`) behaves as an empty `MarketData`.

### Errors

`MissingMarketDataError` is an input error (see [`typed-input-errors.md`](typed-input-errors.md)): it extends `ModelValidationException` / `ModelValidationError`, names the arm (`tips`) and the kind (`CPI_U`), and carries one violation on the arm field (`tips.cpi`) with the security's UUID. Rust adds `ProductInputError::MissingMarketData` and `ProductInputError::Validation`. `ProductInputError` is now `#[non_exhaustive]` and no longer derives `Eq` (its new variants hold protos). LM-409 has not been released yet, so no published crate loses either.

### CPI-U is one name

The CPI kind is `CPI_U`, LM-409's `MarketDataKind.CPI_U`. It is the name the measures catalog already uses for the CPI input (`REFERENCE_CPI` `depends_on`) and equals `IndexTypeProto.CPI_U`, the index type on the CPI index security and on `tips_extension.inflation_index_type`. LM-375's CPI-U lookup has no reference in this repo; it keys the same index (`IndexTypeProto.CPI_U`), so no second identifier is added. A Python test checks that `CPI_U` is in the catalog's `depends_on` and is the only CPI kind.

LM-409's FRN kinds (`FRN_FIXINGS`, `FRN_CURVE`) do not match the catalog's input names (`BILL_FIXINGS`, `YIELD_CURVE`). This item keeps LM-409's names: changing a `requires` value is a breaking registry change (`registry-versioning.md`).

### FRN requires fixings

`hierarchy.json` gives `frn` `requires: ["FRN_FIXINGS"]` (LM-409). So `forSecurity` and `typed` reject an FRN with no fixings, even though valuation-service does not read `FrnInput.fixings` yet (VS-110). The curve is copied when present but not required.

### TreasuryFrnFixings

Not reused. Fixings come from price-service (MDI-100) and reach `forSecurity` ready to use through `MarketData`; the builder only copies them. The Java, Python, JS and Rust copies are marked deprecated in their docs and stay until LM-411. ledger-service still calls the Java copy until LS-202 lands, and consumers declare a minimum ledger-models version with no upper bound, so deleting it now would break ledger-service's next build.

### Shared fixtures

`test-fixtures/product-inputs/` holds one JSON file per case: one per arm in `valuation_arms` (inputs as hex, `expected_hex` for the `ProductInput`, and the `typed` request), plus `tips-missing-cpi`, `tips-empty-cpi` and `unmapped`. `ledger-models-python/test/requests/test_product_input_builders.py` generates them. Every binding lists the directory at run time, checks that the success cases cover every arm in its synced `hierarchy.json`, and compares bytes:

- `ProductInput` bytes are identical in all four bindings.
- Request bytes are identical in Java, Python and Rust. jspb writes fields in `.proto` declaration order (`measures`, 30, comes before `position_input`, 21), which is another valid encoding of the same message, so the JS test compares against the fixture re-encoded by jspb.

The fixture securities have no map fields, so map-entry order cannot differ.

## Consequences

- Python `ValuationService.run_valuation` builds its request with `for_security` and `typed`, and takes a new optional `market_data` argument. It now sends only `product_input` and `position_input`, and raises before sending when the security, position or price is missing, the type has no arm, or required market data is missing. Callers that relied on flat fields 20 and 22 for an unmapped product get an error instead.
- `PriceProto.price_type` is not read: a dirty price would go into `clean_price`, as it did on the flat-field path. A check is a follow-up.
- `feature/278-remove-flat-fields` was reviewed: it was merged into main by PR #216 (it removed security flat fields, not fields 20 and 22). Nothing left on it was reusable.
