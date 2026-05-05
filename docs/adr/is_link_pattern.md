# ADR: The `is_link` Pattern

## Status

Accepted

## Context

FinTekkers entities (securities, prices, portfolios, transactions) frequently reference each other. A `TransactionProto` contains a `SecurityProto` and a `PortfolioProto`. A `PriceProto` contains a `SecurityProto`. If every embedded reference carried the full entity data, messages would be heavily duplicated — a single security referenced by 1,000 transactions would be serialized 1,000 times.

## Decision

Every entity proto that can be embedded inside another message has a `bool is_link = 7` field. This field signals whether the message is a **full entity** or a **lightweight reference** (link).

### When `is_link = false` (default)

The message is a fully populated entity. All fields are set and meaningful. This is the representation returned by service queries (e.g. `SecurityService.Search`) and used in create/update requests.

### When `is_link = true`

The message is a **reference**. Only `uuid` (and optionally `as_of`) is populated — all other fields should be ignored by the consumer. To obtain the full entity, the caller must resolve it by calling the entity's service:

| Entity | Resolve via |
|--------|-------------|
| SecurityProto | `SecurityService.GetByIds(uuid, [as_of])` |
| PriceProto | `PriceService.GetByIds(uuid, [as_of])` |
| PortfolioProto | `PortfolioService.GetByIds(uuid, [as_of])` |
| TransactionProto | `TransactionService.GetByIds(uuid, [as_of])` |
| StrategyProto | (no service yet) |
| StrategyAllocationProto | (no service yet) |

#### Resolution semantics: `uuid` only vs. `uuid` + `as_of`

- **`uuid` populated, `as_of` unset** → resolve to the **latest** version of the record. This is the default and is the right choice for live UI flows that always want the current entity.
- **`uuid` populated, `as_of` populated** → resolve to the version of the record **as of that timestamp**. This is required for backtesting, deterministic replay, and any flow where the link reference itself encodes a point in time (e.g., a position aggregated as-of `T` whose embedded security must also be as-of `T`).

A naive resolver that ignores `as_of` and always returns "latest" will silently mix time vintages within a single result set — a position computed as-of 2024-01-01 should not embed a security that was modified in 2025. The resolver MUST propagate the link's `as_of` into the corresponding `GetByIds` call.

Callers SHOULD set `as_of` on link sub-messages whenever the parent message itself carries an `as_of` (e.g., `Position.as_of`, search results from `XService.Search` with an explicit `as_of`). Server implementations SHOULD echo the parent's `as_of` onto link sub-messages they emit.

## Which protos use `is_link`

All entity protos that have a UUID primary key use `is_link` at field tag 7:

- `SecurityProto` (security.proto)
- `PriceProto` (price.proto)
- `PortfolioProto` (portfolio.proto)
- `TransactionProto` (transaction.proto)
- `StrategyProto` (strategy.proto)
- `StrategyAllocationProto` (strategy_allocation.proto)

`IssuanceProto` has `is_link` commented out (field 7 reserved but not active) because issuances are always stored inline on the parent security.

## Where links appear in practice

The most common use of links is in the **position aggregation** pipeline. When the ledger-service returns positions, each position contains field-value pairs (via `FieldMapEntry`). Entity-typed fields (SECURITY, PORTFOLIO) are packed as `Any` messages. These packed entities may be either full or link depending on the query:

- **Full**: when the caller requests the entity to be hydrated (e.g. for display)
- **Link**: when the caller only needs the UUID for further lookups (e.g. for aggregation keys)

Another common case: `TransactionProto.security` and `TransactionProto.portfolio` are typically stored as links in the database to avoid data duplication. The service hydrates them on read if the caller needs full data.

## How callers should handle `is_link`

```
// Pseudocode for any language
if (securityProto.is_link) {
    // Only uuid (and optionally as_of) is meaningful — resolve the full entity.
    // Pass the link's as_of through if set; pass nothing for "latest".
    fullSecurity = securityProto.has_as_of()
        ? securityService.getByIds(securityProto.uuid, securityProto.as_of)
        : securityService.getByIds(securityProto.uuid);
} else {
    // Full entity — use directly
    fullSecurity = securityProto;
}
```

Callers that only need the UUID (e.g. for equality checks or map keys) can use the UUID directly without resolving.

In JS, the `LinkResolver` utility (`wrappers/util/link-resolver.ts`) handles the `as_of` propagation, batching, and caching for you — see [`link_resolver.md`](./link_resolver.md).

## Consequences

- **Storage efficiency**: Entities are stored once, referenced by UUID elsewhere
- **Network efficiency**: Responses can include links instead of duplicating large entities
- **Caller complexity**: Callers must check `is_link` and resolve when they need full data
- **Consistency**: The `is_link` field is always at tag 7 across all entity protos, making the pattern predictable
- **N+1 risk**: Naive implementations that resolve each link individually can create N+1 query patterns. Callers should batch-resolve using `GetByIds` with multiple UUIDs.
