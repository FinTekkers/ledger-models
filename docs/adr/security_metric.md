# ADR: Dated security metrics (SecurityMetricProto and SecurityMetricService)

## Status

Accepted (LM-482). Additive wire change only: new `SecurityMetricTypeProto`, `SecurityMetricProto`, the `fintekkers.requests.security_metric` Create / Search / GetLatest requests and responses, the `SecurityMetric` gRPC service, and `ObjectTypeProto` values 17 and 134-139. `SecurityProto`, `PriceProto` and every existing field and enum number are unchanged. The server is price-service-rust (PSR-53).

## Context

Securities need dated figures that are not prices. The first is SPY's shares outstanding, daily since 2003 in State Street's NAV history; NAV per share and total net assets follow.

Until now a loader stored each figure as a new version of the security. That copies the whole security for every observation, and the figure is lost when another loader writes a later version without it (MDI-148, MDI-151). On 23 Nov the owner chose a separate time series, hosted in price-service-rust next to prices, which already have the same bitemporal shape.

## Decision

### A separate time series, keyed by security id

`SecurityMetricProto` is one observation: `security_id`, `metric`, `observation_date`, `value`, `source`, plus the price bitemporal fields (`uuid = 5`, `as_of = 6`, `valid_from = 8`, `valid_to = 9`). Field 7 is left unused on purpose: there is no `is_link`, because a metric is never embedded in another message.

`security_id` is a `UUIDProto` only, never a `SecurityProto` or link, so `security_metric.proto` does not import `security.proto`. A metric write never touches the security, and a security write never drops a metric. A test (`test_security_metric_proto.py`) checks the imports.

### Units per metric

The units are on `SecurityMetricTypeProto`:

- `SHARES_OUTSTANDING` (1): a whole-number count of shares, scale 0.
- `NAV_PER_SHARE` (2): the security's currency per share.
- `TOTAL_NET_ASSETS` (3): the security's currency, the fund total.
- `UNKNOWN_SECURITY_METRIC` (0) is invalid on write.

The currency is the security's own (the fund's base currency); the metric does not repeat it.

### Reads: latest on or before, latest version

- `GetLatest(repeated security_id, repeated metric, date)` returns at most one observation per (security, metric): the one with the latest `observation_date` on or before `date`. Each observation carries its own `observation_date`, so a caller can tell how stale it is and warn (as MDI-151 asks).
- `Search(security_id, repeated metric, from_date, to_date)` streams the observations with `observation_date` in the inclusive range, ordered by `observation_date`, then `metric`. An unset bound is unbounded.
- An empty `metric` list means all metrics. An empty `security_id` list on GetLatest gives an empty response.
- Both return only the latest `as_of` version per (`security_id`, `metric`, `observation_date`). There is no `as_of` read field yet; one can be added later as a new field number without a break.

### Absent is unknown, never 0

When no observation exists, nothing is sent: the pair is absent from GetLatest and the date is absent from Search. `value` is a message field, so every language reports its presence (`hasValue()`, `HasField("value")`, `Option::None`). A reader never reads an absent observation or an unset value as 0. A real zero is a set zero.

### Corrections are new versions

A correction for the same (`security_id`, `metric`, `observation_date`) is a new `SecurityMetricProto` with a later `as_of`, as with prices. Earlier versions are kept for audit; `valid_from`/`valid_to` record when each version was the current record. Neither is the observation date.

### Typed requests, not a filter query

Search and GetLatest take typed fields that match the item one-to-one, rather than the price service's generic filter query. Nothing has to parse filters, and GetLatest's at-most-one rule stays easy to state.

### Wrapper helpers through an installed fetcher, with no default

Each language's Security wrapper gets `getSecurityMetric(metric, date)` (an observation with value and observation date, or null/None) and `getSecurityMetricSeries(metric, from, to)` (a date-ordered list). They read through a `SecurityMetricFetcher` installed with a static setter, like the link fetchers:

| Language | Install | Clear | No-fetcher error |
| --- | --- | --- | --- |
| Java | `Security.setMetricFetcher(f)` | `Security.setMetricFetcher(null)` | `IllegalStateException` |
| Python | `set_security_metric_fetcher(f)` | `clear_security_metric_fetcher()` | `SecurityMetricFetcherMissing` |
| JS | `setSecurityMetricFetcher(f)` | `clearSecurityMetricFetcher()` | `SecurityMetricFetcherMissingError` |
| Rust | `set_security_metric_fetcher(f)` | `clear_security_metric_fetcher()` | `SecurityMetricError::NoFetcher` |

Each error message names `SecurityMetricFetcher` and the install call.

- **No default.** Unlike `Security.Fetcher`, which defaults to a gRPC call, the metric fetcher defaults to none. The helpers make no network call of their own; a consumer that wants gRPC installs a short adapter over the `SecurityMetric` stub (PSR-53 or the consumer owns it).
- **Domain-shaped.** The fetcher takes a security id, metric and dates, and returns observations, not request and response protos. Fakes in tests are a few lines, and the helper does not have to re-check the server's at-most-one rule.
- **Ids only.** The helpers read only the security's id, so a link-mode security is never hydrated.
- **One security per call.** GetLatest batching over many securities is not reachable through the helper; callers who need it use the stub.

### Sync in Java, Python and Rust; async in JS

The Rust `SecurityMetricFetcher` trait is sync, like the existing `SecurityFetchFn`, so the helpers stay plain methods on `SecurityWrapper`. An async caller (a tokio service with a tonic client) bridges inside its fetcher, as the default security fetcher does: a dedicated runtime or worker thread and `block_on`, never `block_on` on the caller's own runtime thread.

The JS helpers return promises, and the JS fetcher's methods are async. Node's gRPC stubs are async and there is no sync bridge in idiomatic Node, as with `Security.hydrate()` and `LinkResolver`. The JS `value` is the canonical decimal string, never a float.

## Consequences

- PSR-53 implements the `SecurityMetric` service from these proto comments, which are the spec.
- Loaders write metrics through `CreateOrUpdate` and stop versioning the security for them.
- `ObjectTypeProto` 17 and 134-139 are permanent. If one is removed after release it becomes `reserved`, never reused.
- Rolling back before a release is a revert. After a release, the helpers can be reverted, but the proto numbers stay reserved.
