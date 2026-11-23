# Rust Types Derived from Proto Files

Context

This project contains protobuf models of financial objects & request/response formats for APIs; as well as language specific bindings.

## Generating Types

To generate the types run ```cargo run --bin gen```. This will overwrite the files in ledger-models-rust. Any new file must be exported in lib.rs.

This is included in the compile.sh script which creates types across all languages.

## Project structure

Tonic/Prost is used to generate language bindings in Rust. Auto-generated files 
are created in the format fintekkers.<folder>.<file>.rs. 

Hand-written wrappers are included in the folder fintekkers/wrappers/file.rs. The purpose
of this code is to make it easier to use the Rust implementation of fintekkers without having
gitto understand all the nuance of protobufs, or nuances of performance optimizations made in the proto schema.

## DevOps

### Preparing Rust to publish
to publish a new version do the following 
1. generate the new protobus using the compile script
2. export any new models in lib.rs 
3. bump the package version in ```Cargo.toml```
4. merge your pr then create a release tagged with the version, if the version = 0.1.1, set the tag to v0.1.1
## Security metrics (LM-485)

Shares outstanding, NAV per share and total net assets of a security, read
and written through the SecurityMetric service in native types
(`NaiveDate`, `rust_decimal::Decimal`, `Uuid`). The service address is the
PRICE service's (`BROKER_HOST` wins, then `PRICE_SERVICE_HOST` /
`PRICE_SERVICE_PORT`, `API_URL`, `localhost:8083`); each call has a 30 second
deadline (`with_timeout` changes it).

Build a service with `SecurityMetricService::from_env()?` (or
`from_env_with(lookup)` for an injected environment) and pass it to the
`_with` methods. `security.get_metric(..)`, `security.shares_outstanding(..)`
and the other shortcuts without `_with` use the process-wide
`SecurityMetricService::default_instance()`. Only the security's UUID is
used: a link-mode security is never hydrated.

A value that is not known is `None`, never 0. `on` and `to` default to today.
In the example, `service`, `spy_uuid` and `qqq_uuid` are already defined.

```rust
use chrono::NaiveDate;
use ledger_models::fintekkers::models::security::SecurityMetricTypeProto::{NavPerShare, SharesOutstanding};
use ledger_models::fintekkers::wrappers::models::security::{link_of_latest, SecurityWrapper};
use rust_decimal_macros::dec;

let monday = NaiveDate::from_ymd_opt(2026, 11, 23).ok_or("bad date")?;
let spy = SecurityWrapper::new(link_of_latest(spy_uuid));

// The latest value on or before a date: Friday's point, 3 days old.
if let Some(shares) = spy.get_metric_with(&service, SharesOutstanding, Some(monday)).await? {
    println!("{} shares on {} ({} days old)", shares.value, shares.date, shares.age_days());
}
// The same through a shortcut.
let shares = spy.metrics_with(&service).shares_outstanding(Some(monday)).await?;

// Many securities in one call: every UUID is a key, unknown ones are None.
let latest = service.get(SharesOutstanding, &[spy_uuid, qqq_uuid], Some(monday)).await?;
assert!(latest[&qqq_uuid].is_none());

// Every point in a range, ascending; gaps stay gaps.
let from = NaiveDate::from_ymd_opt(2026, 11, 1).ok_or("bad date")?;
let history = spy.metrics_with(&service).shares_outstanding_history(from, Some(monday)).await?;
for point in &history.points {
    println!("{} {}", point.date, point.value);
}

// Write points: checked first (whole share counts, no duplicate dates),
// then sent in chunks. Returns the as_of the server stamped.
let as_of = service.record(NavPerShare, spy_uuid, &[(monday, dec!(512.34))]).await?;
println!("stored at {as_of}; shares {:?}", shares.map(|s| s.value));
```
