# ADR: Security metric series (`SecurityMetricSeriesProto`, `SecurityMetric` service)

## Status

Accepted (LM-484). Replaces LM-482, which was abandoned. Protos, comments,
type registration and wire tests only; storage and the server are PSR-54 and
PSR-55, and wrapper helpers (builders, chunk merging) are LM-485.

## Context

Funds publish per-security metrics by date: shares outstanding, NAV per share
and total net assets. The models had no home for them.

LM-482 proposed one full proto per observation: uuid, version, as_of,
valid_from / valid_to, source, a security link, the metric and the value on
every point. About 90% of each message was metadata repeated from the
previous point. The live price table, which follows that shape, averages
about 100 bytes per price for what is a date and a value.

## Decision

A **series**: one header per (security, metric, knowledge time) and points
that hold only a date and a value.

```
SecurityMetricSeriesProto { object_type = 1; version = 2;
                            UUIDProto security_id = 10;
                            SecurityMetricTypeProto metric = 11;
                            LocalTimestampProto as_of = 12;
                            repeated SecurityMetricPointProto points = 20; }
SecurityMetricPointProto  { LocalDateProto observation_date = 1;
                            DecimalValueProto value = 2; }
```

A point is about 15 to 20 bytes on the wire (a 3-varint date plus a compact
decimal); the header is sent once per series.

The `SecurityMetric` service has three RPCs, each with its own typed request
and response (the `IndexComposition` pattern):

| RPC | Request | Response |
| --- | --- | --- |
| `CreateOrUpdate` | one series | the header with the stamped `as_of`, zero points |
| `Search` | `security_id`, `repeated metrics`, `start_date`, `end_date`, optional `as_of` | stream of series chunks |
| `GetLatest` | `repeated security_ids`, `repeated metrics`, `date`, optional `as_of` | one series per pair, at most one point each |

The proto comments are the spec. In short:

- **Units per metric.** `SHARES_OUTSTANDING` is a whole-number count of
  shares (scale 0, never in millions). `NAV_PER_SHARE` is currency per share
  and `TOTAL_NET_ASSETS` a currency amount, both in the currency of the
  security's `SecurityProto.settlement_currency`. `EXPENSE_RATIO` (LM-491)
  is the fund's net annual expense ratio charged to holders, after any
  waiver, as a percentage of net assets (0.0945 = 0.0945% a year). Its
  `observation_date` is the date the ratio takes effect, so its series is
  sparse (one point per change) and `GetLatest` returns the ratio in force.
- **Absent means unknown, never 0.** A date with no point is unknown; a point
  with value 0 is a real zero. An empty series means no known observation
  (except in the `CreateOrUpdate` response, which never echoes points).
- **`as_of` is knowledge time**: what the store knew at that instant, never an
  observation date. The server stamps it on write and ignores the writer's.
- **Corrections close the old point through `valid_to`.** A new value for a
  stored `observation_date` sets the old stored row's `valid_to` to the new
  `as_of`. A query at an earlier `as_of` still sees the old value.
  `valid_from` / `valid_to` live on the server's rows, not on points.
- **Latest on or before.** `GetLatest` returns, per pair, the point with the
  latest `observation_date` on or before the date, or zero points.
- **Search chunks.** A long series arrives as consecutive messages that each
  repeat `security_id`, `metric` and `as_of`; the client appends their points.
  Only a metric with no points in the range yields a zero-point message.

`SecurityMetricSeriesProto` and the six request / response messages get
`ObjectTypeProto` values 17 and 134-139, and a row in each language's
stamp table: type registration that `proto-shape.sh` and the
`object_type_coverage` tests require, not LM-485 helpers.

## Designs compared

### Per-point (LM-482): rejected

One full proto per observation.

- Pro: each point is self-describing and maps 1:1 to a stored row.
- Con: about 90% of every message is repeated metadata. A 20-year daily
  series is about 5,000 points; at about 100 bytes each that is about 500 KB,
  against about 100 KB as a series.
- Con: per-point uuid, version, as_of and source invite points of one series
  to disagree on their knowledge time, which a series cannot express.

### Series with self-describing chunks: chosen

- Pro: metadata once per series (once per chunk on Search); points are a
  date and a value.
- Pro: each Search chunk is a full series header plus points, so a consumer
  can process or drop any chunk alone. The repeated header costs tens of
  bytes per chunk of hundreds of points.
- Con: the client merges consecutive chunks. The `Search` comment states the
  rule; a merge helper is LM-485.

### Series with header-then-batch frames: rejected

A `oneof` of a header frame and points-only frames.

- Pro: the header once per series, the smallest wire size.
- Con: a stateful protocol every client in four languages must reassemble,
  for a saving of about one header per few hundred points.

### Price-style generic query: rejected

One `QuerySecurityMetricRequestProto` with a `PositionFilterProto` for both
Search and GetLatest.

- Con: `security_id` and `metric` become string filter values that every
  service parses, and GetLatest's date hides in a range field.

## Other choices

- **Two `LocalDateProto` bounds, not `DateRangeProto`.** `DateRangeProto`
  holds `LocalTimestampProto` bounds, but observations are dates. Two
  existing `LocalDateProto` fields add no new type.
- **No `limit` / `page_token`.** Search is a server stream; chunking is a
  property of the stream, and its size the server's choice. The unary query
  paging in `docs/adr/query_paging.md` does not apply.
- **No Validate RPCs.** The item lists three RPCs. A `ValidateCreateOrUpdate`
  can be added later without a breaking change.
- **`security_id` is a `UUIDProto`, never a `SecurityProto` or link**, so
  `security_metric.proto` does not import `security.proto`.
- No existing message, field or enum number changes; `wire-diff.py` rule
  `lm484` allows exactly the additions.

## LM-485 wrapper helpers

Status: Accepted (LM-485). Client helpers only: no proto, generated code or
`wire-diff.py` change. The LM-484 decision above is unchanged.

### API

The helpers hang off whatever `Security` wrapper the caller already holds
(from any `SecurityService` call, a search or a link). They need only its
UUID, so a link-mode Security is not hydrated. camelCase in Java and JS,
snake_case in Python and Rust; `on` and `to` default to today's local date.

| Call | Returns | Absent |
| --- | --- | --- |
| `security.getMetric(metric, on)` | `MetricResult` (`value`, `date`, `on`, `ageDays`) | null / `None` / `undefined` / `None` |
| `security.getMetricHistory(metric, from, to)` | `MetricSeries` | an empty series |
| `securityMetricService.get(metric, uuids, on)` | map UUID → `MetricResult` or absent; every requested UUID is a key | the key's value is absent |
| `securityMetricService.getHistory(metric, uuid, from, to)` | `MetricSeries` | an empty series |
| `securityMetricService.record(metric, uuid, points)` | the server-stamped `as_of` | not applicable |

Shortcuts on the Security pass a fixed metric: `sharesOutstanding(on)`,
`navPerShare(on)`, `totalNetAssets(on)` and their `...History(from, to)`
forms.

- **Absent is never 0.** No path builds a 0 for a missing point. A
  GetLatest series with zero points, or no series for a UUID, is absent.
- **`ageDays`** is the calendar days from the observation date to `on`: a
  Monday `on` that gets Friday's point is 3 days old.
- **`MetricSeries`** has `points` (ascending date and value), `latest` (the
  last point or absent), a date → value map (`asDict` in Java and JS,
  `to_dict` in Python and Rust) and `asOf` from the first chunk. Python's
  `to_pandas()` imports pandas lazily and says `pip install pandas` when it
  is missing; pandas is not a dependency.
- **`get`** sends one GetLatest call for all UUIDs (duplicates dropped) and
  matches each series by `security_id`, never by position. An empty UUID
  list makes no call.
- **`getHistory`** joins Search chunks in order. Gaps stay gaps. A date out
  of order or repeated across chunks is a service error naming the date.
- **`record`** takes native dates and decimals (a map, or a list of pairs).
  Before any call it rejects, listing **every** bad point with its date: no
  points, a missing value, a fractional `SHARES_OUTSTANDING` and a duplicate
  date. A whole share count with zero fraction digits (`15204137000.00`) is
  accepted and sent at scale 0, as the proto comment requires: JS decimals
  carry no scale, so only this rule reads the same in every language. Points
  are sorted and sent in chunks of `RECORD_CHUNK_SIZE` = 5000, one
  CreateOrUpdate per chunk; `record` returns the **last** chunk's `as_of`.
  If a later chunk fails, the error says how many points were already
  stored; sending them again is safe, since the same value is a no-op.

### Errors

Input errors and service errors are different types, so a service can map
them to INVALID_ARGUMENT or UNAVAILABLE.

| Error | Kind | Says |
| --- | --- | --- |
| `MissingSecurityId` | input | the security has no UUID |
| `UnknownMetric` | input | the metric given, e.g. `UNKNOWN_SECURITY_METRIC` or `"SHARE_COUNT"` |
| `InvalidMetricPoints` | input | every rejected point: its date and reason |
| `SecurityMetricServiceError` | service | the address `host:port` and the gRPC status |
| `ServiceUnavailable` | service (a kind of the above) | "SecurityMetric service unreachable at `host:port`" |

### Address and fetcher seam

The default client finds the service through the existing service config
(`ServiceAddress` / `EnvConfig`) as **`PRICE`**: price-service-rust serves
this data (PSR-54/55). `BROKER_HOST` still wins, as for every service, so
calls go through the broker; until the broker routes `SecurityMetric`
(BS-45), they fail with a service error naming the broker address and
`UNIMPLEMENTED`. No new environment variable. Changing the host later means
changing the `PRICE` argument in each language.

A server can install a local source instead of the gRPC client, as with the
link fetchers: `SecurityMetricService.setFetcher` (Java),
`set_security_metric_fetcher` (Python), `setSecurityMetricFetcher` (JS) and
`SecurityMetricService::with_fetcher` / `set_default_fetcher` (Rust). The
seam has three methods, one per RPC: get latest, search (returns the
chunks) and create or update.

### Language differences

- Python and JS also accept the metric as its name (`"SHARES_OUTSTANDING"`);
  Java and Rust take only the enum.
- The JS date → value map is keyed by ISO date strings, since `LocalDate`
  objects are not equal as map keys.
- Rust's methods are `async`, as are the JS ones (grpc-js is async).

### Tests

`test-fixtures/security-metric/cases.json` holds the shared cases (latest,
merge, record); every language's core test runs all of them. Each language
also tests the helpers through its default gRPC client against an in-memory
fake `SecurityMetric` server (address from injected env), runs its README
example against that fake, and checks that an unreachable service's error
names `127.0.0.1:<port>`.
