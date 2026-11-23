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
  security's `SecurityProto.settlement_currency`.
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
