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

## Technical details

### Wire shape of a link sub-message

A link is the same proto message type as the full entity, with `is_link = true` and only the following fields populated:

| Field | Tag | Required when `is_link = true` | Notes |
|---|---|---|---|
| `uuid` | 5 | **Yes** — the only mandatory field on a link | Identifies which record to resolve. |
| `as_of` | 6 | No — omitted means "latest" | If set, resolver fetches the version of the record at that timestamp. |
| `is_link` | 7 | Yes (must be `true`) | What flags this message as a reference. |

All other fields (`object_class`, `version`, entity-specific payload, `valid_from`, `valid_to`, etc.) MUST be left at proto3 defaults. Producers MUST NOT populate them; consumers MUST NOT read them.

The field tags are stable across every entity proto that participates in the pattern (`SecurityProto`, `PriceProto`, `PortfolioProto`, `TransactionProto`, `StrategyProto`, `StrategyAllocationProto`). This is what makes a generic resolver possible.

### `GetByIds` request shape

Every entity service exposes a unary `GetByIds` RPC accepting the same `QueryXRequestProto` used by `Search`. The two fields a resolver needs to set are:

```proto
message QueryXRequestProto {
  // ... other search-time fields ...
  repeated fintekkers.models.util.UUIDProto       uuIds = 21;
  fintekkers.models.position.PositionFilterProto  search_x_input = 22;  // unused by resolver
  fintekkers.models.util.LocalTimestampProto      as_of = 23;
}
```

- `uuIds` — list of UUIDs to fetch (deduplicated by the resolver before sending). Note: declared as `uuIds` (camelCase) rather than the conventional snake_case `uu_ids`; generated accessors are `getUuidsList()` / `setUuidsList()` in JS / Python and equivalent in Java / Rust.
- `as_of` — single timestamp applied to **all** UUIDs in the request. Unset means latest.

`search_x_input` is for filter-based search and SHOULD NOT be populated by a resolver.

The response carries a list of full entities (`is_link = false`), one per UUID found. UUIDs not found are silently omitted; resolvers SHOULD treat that as a not-found error rather than returning a partial result.

### Batching contract

Because `GetByIds` carries a single `as_of` per request, a resolver consuming a heterogeneous result set MUST:

1. Walk the items and collect every link sub-message.
2. **Group by `as_of` bucket** (one bucket per distinct `as_of` value, plus a `latest` bucket for unset).
3. Fire **one `GetByIds` RPC per bucket**, with the bucket's `as_of` set on the request.
4. Within a bucket, deduplicate UUIDs.

Buckets MAY be fired in parallel — they are independent.

Consumers MUST NOT collapse different `as_of` values into one RPC: `GetByIds` ignores per-UUID timestamps because none exist in the request schema.

### Cache key

A resolver's cache MUST be keyed on the **(uuid, as_of)** pair, not on `uuid` alone. Two distinct timestamps for the same UUID are two different versions of the same record and MUST NOT alias.

A reasonable serialization is `${uuidString}@${asOfBinaryBase64}` with `@latest` reserved for the unset bucket. The exact serialization is an implementation detail; what matters is that no two distinct `as_of` values produce the same key.

### Concurrent in-flight de-duplication

When multiple call sites request the same `(uuid, as_of)` simultaneously, the resolver SHOULD share one in-flight RPC promise/future across all of them rather than firing N parallel requests. This is the same idea as the cache, just at a finer time grain (overlapping requests, not just sequential ones).

### Mutation semantic

Bulk resolvers SHOULD mutate the embedded sub-message in place — replacing the link stub with the resolved full entity (which carries `is_link = false`). The outer message (e.g., `Price`, `Transaction`) is untouched. This makes `parent.getEmbedded().getDetailField()` "just work" after `resolveX(items)` without any caller-side stitching.

The full entity's `is_link` field will be `false` by virtue of being a full entity, naturally indicating the link has been resolved.

### Server emission contract

When a server emits a link sub-message inside a parent that itself carries an `as_of`, the server MUST echo that `as_of` onto the emitted link. Consumers rely on this to time-travel correctly:

```
position.as_of == T
  → position.security.is_link == true, position.security.as_of == T   ✓
  → position.security.is_link == true, position.security.as_of UNSET  ✗ resolver loses time vintage
```

For position aggregation, ledger-service is responsible for setting `as_of` on the link sub-message at the same moment it stamps the parent.

### Edge cases

- **Zero / default LocalTimestampProto.** A `LocalTimestampProto` with `timestamp.seconds = 0, nanos = 0, time_zone = ""` is the proto3 default. Servers MUST NOT treat this as "latest" — it represents the Unix epoch. Resolvers SHOULD treat any `LocalTimestampProto` whose presence is set (HasField in proto2 terms; serialized non-default in proto3) as an explicit timestamp. The "latest" sentinel is **field unset**, not field present-but-zero.
- **`is_link = true` without `uuid` populated.** Invalid. Resolvers MUST treat this as a malformed message and skip / surface an error rather than fetch arbitrary entities.
- **`is_link = false` with `as_of` populated.** Treated as a normal full entity; `as_of` is informational data on the entity, not a resolution hint.
- **Mutated link in a request.** Create/update RPCs MUST NOT accept link-mode entities for fields that require full data; servers SHOULD reject `is_link = true` on input.

## Consequences

- **Storage efficiency**: Entities are stored once, referenced by UUID elsewhere
- **Network efficiency**: Responses can include links instead of duplicating large entities
- **Caller complexity**: Callers must check `is_link` and resolve when they need full data
- **Consistency**: The `is_link` field is always at tag 7 across all entity protos, making the pattern predictable
- **N+1 risk**: Naive implementations that resolve each link individually can create N+1 query patterns. Callers should batch-resolve using `GetByIds` with multiple UUIDs.
