# ADR: default_price_types — the trade price's price_type, by product

## Status

Accepted (LM-461). Additive: a new top-level `default_price_types` key in `hierarchy.json` (`schema_version` 1.5), a resolver in every binding, and an optional `price_type` on each binding's create-transaction path. No proto change beyond a comment on `PriceTypeProto.UNKNOWN_PRICE_TYPE`; existing sections, loaders and read paths are unchanged.

## Context

The create-transaction wrappers built the trade price with no `price_type`, so it went out as `UNKNOWN_PRICE_TYPE` (proto3's zero value). ledger-service stored it, then its trade-price outbox (LS-167) forwarded it to price-service, which rejects `UNKNOWN_PRICE_TYPE`. On 11 Nov 1,503 SOMA trade prices were stuck this way, retried every 5 minutes. Every client that uses the wrappers had the same gap.

What a price is quoted in depends on the product: a bond is quoted as a percentage of par, a stock in currency. That rule belongs to the shared model, in one place every binding reads.

## Decision

### The data lives in hierarchy.json only

```json
"default_price_types": {
  "BOND": "PERCENTAGE",
  "STOCK": "ABSOLUTE",
  "CURRENCY": "ABSOLUTE",
  "MONEY_MARKET_FUND": "ABSOLUTE",
  "INDEX": "INDEX_LEVEL",
  "T_BILL_13_WEEK_SERIES": "RATE",
  "SOFR_SERIES": "RATE"
}
```

- A key is any `product_types` node, abstract or leaf. A value is a `PriceTypeProto` name.
- There is no `unpriced` list. A product with no entry anywhere on its parent chain has no default: `FX_SPOT`, crypto, metals, futures, options, swaps, forwards, financing, `FUND_LP`, `PRODUCT_TYPE_UNKNOWN`.
- There is no mapping table in any binding. `ledger-models-protos/fixtures/default_price_types_cases.json` lists every `ProductTypeProto` value with its expected default (or `raises`), and every binding's tests check the resolver against it and check the fixture's keys equal the enum's names. A new product fails all four suites until someone classifies it.

`INDEX -> INDEX_LEVEL` sits beside `INDEX` in `valuation_input_types.unpriced`. They are different questions: what a trade in the product is quoted in, versus whether valuation-service values it. Do not "fix" one to match the other.

### Resolution rule (identical in every binding)

1. An explicit `price_type` other than `UNKNOWN_PRICE_TYPE` is used unchanged. An explicit `UNKNOWN_PRICE_TYPE` counts as omitted: it is proto3's unset value.
2. Otherwise walk from the security's `product_type` up its `parent` chain; **the first node with an entry decides**, so `SOFR_SERIES -> RATE` beats `INDEX -> INDEX_LEVEL`.
3. No entry is a typed input error, raised before anything is built: Python `NoDefaultPriceTypeError` and Java `NoDefaultPriceTypeError` (both `ModelValidationError` / `ModelValidationException`), JS `NoDefaultPriceTypeError extends ModelValidationError`, Rust `ProductInputError::NoDefaultPriceType`. One violation on `price.price_type`, `object_id` the security's UUID, message `no default price_type for product_type FX_SPOT in hierarchy.json default_price_types; pass price_type`. Services map it to `INVALID_ARGUMENT`.
4. A missing security, or one with no `product_type` (e.g. a link with only a UUID), reads as `PRODUCT_TYPE_UNKNOWN` and raises unless `price_type` is given.
5. **Never a guess.** The resolver never returns `UNKNOWN_PRICE_TYPE` and never falls back to a hard-coded type.
6. Only the type is set. The price number goes through as given; there is no scaling between `PERCENTAGE` and `ABSOLUTE`.

### Where it applies

| Binding | Create path |
|---|---|
| Python | `Transaction.create_from(..., price_type=None)` and `CreateTransactionRequest.create_transaction_request(..., price_type=None)` |
| Java | `Price.forTrade(price, security, asOf[, priceType])`, passed to a `Transaction` constructor. The 4-argument `Price` constructor and `Price.getPrice` are unchanged (still `UNKNOWN_PRICE_TYPE`); their Javadoc points to `forTrade` |
| JS | `new Transaction({..., priceType?})`. `Price.create(..., priceType?)` sets the type only when given; `Price.fromSimple` keeps its `PERCENTAGE` default |
| Rust | the new `CreateTransaction { ..., price_type: Option<PriceTypeProto> }` with `build()` / `build_request()`; `PriceProtoBuilder::price_type` sets it on a hand-built price |

Derived legs: JS cash legs are `ABSOLUTE` (a cash price is always 1.0), whatever the cash security's `product_type`; the JS maturation leg takes the parent's type, else the bond's default. Java's maturation child reuses the parent's price and its cash child copies the parent's type (LM-449), so a parent built with `forTrade` gives no `UNKNOWN` child. Python and Rust have no derived-leg builders.

### Load-time checks

Every binding checks the section once, on first use, and fails the load if the section is missing or not an object, a key is not a `product_types` node, or a value is not a `PriceTypeProto` name or is `UNKNOWN_PRICE_TYPE`. Same errors as `valuation_input_types`: Java `IllegalStateException`, Python `InvalidRegistryError`, JS `Error`, Rust `ProductInputError::InvalidRegistry` (returned, never a panic). Each binding has a parse entry point the tests feed broken sections through.

## Alternatives considered

- **Generate per-language constant tables from hierarchy.json.** Rejected: adds a codegen step and a staleness check for no gain; every binding already loads hierarchy.json at runtime.
- **Fill the default whenever any `Transaction` is constructed.** Rejected: it rewrites stored and received transactions on read, so round-trips stop being faithful, and it cannot raise for products with no default without breaking reads of existing data.

## Consequences

- Python `create_from()` / `create_transaction_request()` with no security, or a security with no default, now raise instead of building a trade price price-service rejects. Callers pass the full security or an explicit `price_type`.
- Prices already stored without a type (the stuck SOMA rows) are not touched; they need their own remediation.
- Adding an entry is additive (a product that raised now resolves). Changing an entry changes what new trades are tagged with. See `ledger-models-protos/registry-versioning.md`.
