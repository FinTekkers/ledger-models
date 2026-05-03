# Context

This project contains protobuf models of financial objects & request/response formats for APIs; as well as language specific bindings.

# Design Principle

This project represents the mental model upon which all services are built. Services do not have their own financial 
models, meaning that any service that needs to model financial objects must add it here and consider the global impact
to all users. 

Goals:

* The models will be available in multiple languages (Java to start, then Python/Rust/Javascript)
* Models can be serialized to JSON in an efficient manner (this is only supported in the Java implementation)
* Models can be serialized to a binary object, and that is used to pass data between services
* Additive changes can be made without requiring deploying models to all services simultaneously
* Breaking changes are discouraged, but a breaking change will cause compilation failures in services

# Proto Package Structure

## ledger-models-protos

The golden source protobuf definitions. These are definitions for serialization. There is a balance between readability 
and performance. 

APIs and models are schematized, with language specific implementations auto-generated. The goal is to make service 
communication simple between languages.

Data modelling gets tough, e.g. a fixed income bond needs a coupon rate, whereas a floating rate bond needs a spread. 
Logic like this is implemented in language-specific implementations.

## ledger-models=<language>

Contains language specific implementations, including both auto-generated and hand-written code. Protobuf is a technical
implementation and can be hard to interpret by some developers. Hand-coded wrappers are used to unburden developers 
from this knowledge, as well as allow for improvements in the serialization formats with minimal impact to clients.

### Explanation of Bi-temporality

Separates out the record-keeping date from the system date (technical). The technical date
should only be used for debugging, it should have no impact on business processing. Where date/time 
gets complex additional business modelling should be done. Let's use a bond issuance as an example:

* Issue Date 10/30/2020; Auction date 11/7/2020; Dated date 11/6/2020
* ValidFrom timestamp: 2/5/2021

In this example above, the first set of dates explain date information about the bond. It must be
explained via annotations so that each field has a clear meaning. The validfrom date is simply for
system tracking purposes. In this case the bond may not have existed in the system until 2021 
perhaps because no-one was interested in it. If, for some reason, we want to track the first time
a user was interested in the bond, and therefore created it, a new business field with annotations
should be created, rather than relying on the validFrom date to inform the user.

This is very important when it comes to a view on aggregated data. We are only interested in the latest
state of data as it exists in the system for any given business date. If we advance to use 
cases such as year-end statements with revisions, we need to create business concepts to allow
it to be implemented. For example, when it comes to year end processing, there are a couple options:

* Implement a snapshot mechanism that records data as of a point in time. If its re-run then we create a new snapshot and can use the system timestamp to help explain why there are differences. It is okay to use system timestamps in this way because that use case is debugging.
* Create a business concept such as 'business processing date', which period should data should be applied to. 

The above philosophy is very important so that we don't end up re-using a technical field for various different business reasons across the infrastrcuture.

### Compatibility

* All objects contain a version that gets updated whenever a change is made
* All objects also contain a version which announces breaking changes
* Example:
  * You have a field, let's say 'industry'->str, that you refactor into 'industry_name'->str and 'industry_id'->int
  * This isn't a perfect example, because in this case you would likely just add industry_id as a new column to make it backwards compatiable
  * industry.version = 0 (there from the start)
  * industry.version = -1 (meaning the field is deleted)
  * industry.version.breaking = 1 (meaning the field was deleted on release of version 1)
  * industry_name.version = 1; industry_id.version = 1
* Implement versions via annotations. Should have no performance impact
  * Only used when errors are thrown

# DevOps

## Compiling protobufs

`./compile.sh` regenerates the proto bindings for all four language targets (Java, Python, Rust, JavaScript/TypeScript) and runs the test suites. Pass `--skip-integration` to exclude tests that require a running backend service.

**Before opening a PR that touches `*.proto` files, run `./compile.sh` and commit the resulting changes** (under `ledger-models-java/generated-src/`, `ledger-models-python/fintekkers/`, `ledger-models-javascript/node/`, and `ledger-models-rust/src/codegen/` + `ledger_models_file_descriptor_set_v_todo.bin`) along with your edit. A partial regen — proto edit committed without the full set of generated outputs — has historically caused downstream consumers to fail at runtime against a stale published jar.

Equivalently: `git status` should be empty after `./compile.sh --skip-integration` exits cleanly. If it isn't, stage and commit whatever it produced.

## Publishing

Publishing of java/rust/etc packages are done via GitHub actions when PRs are integrated. If you need to publish a package locally or get a snapshot, this is currently manual

