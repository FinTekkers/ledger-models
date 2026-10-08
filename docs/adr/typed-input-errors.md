# ADR: Typed input errors and FieldViolationProto

## Status

Accepted for Java (LM-255). Python, JS/TS and Rust follow in LM-255b, LM-255c and LM-255d.

## Context

Services could not tell bad input from a state conflict, so they returned ABORTED, INTERNAL or UNKNOWN where INVALID_ARGUMENT was right, and they copied validation rules that then drifted:

- A bond with no `face_value` threw `TransactionProcessingException` from `Transaction.addCashImpact`, the same type as "no lots to reduce", without the security's ID (LS-14).
- ledger-service decided "is it a bond" from the raw `product_type`, while the model infers `TREASURY_NOTE` from `bond_details`.
- The bond date rule (maturity after issue) threw a bare `IllegalArgumentException`, the same type as a malformed UUID, so ledger-service copied the rule to tell them apart (LS-12).

## Decision

### Input error versus state error

- **Input error**: the object itself has a bad or missing field. It holds whichever service receives it. Java raises `common.models.errors.ModelValidationException`. Services map it to `INVALID_ARGUMENT`.
- **State error**: the request conflicts with what a service already holds (no lots to reduce, quantity rules on an existing position). Java keeps `TransactionProcessingException` and its subclasses for these. Services map them to `FAILED_PRECONDITION`.

`ModelValidationException` extends `IllegalArgumentException`, so existing `catch (IllegalArgumentException)` sites keep working. It carries a non-empty, unmodifiable `List<FieldViolationProto>` and exposes `getField()` and `getObjectId()` for the first violation.

`getMessage()` joins the violations as `<field>: <message> (id <uuid>)`, separated by `; `. The text of each `message` is not stable; match on `getField()`, not on the message string.

### FieldViolationProto

`fintekkers/requests/util/errors/field_violation.proto` adds one message, and `ErrorProto` gains `repeated FieldViolationProto violations = 3`. Both changes are additive. The proto comments are the spec:

- `field`: snake_case proto field path relative to the validated top-level object, e.g. `bond_details.face_value` for a security, or `security.bond_details.face_value` for the same security validated through a transaction.
- `object_id`: UUID of the object that owns the bad field. For bond rules this is the security, even when found through a transaction. Unset if the input had no UUID.
- `message`: English text for developers. Not stable.

It lives next to `ErrorProto` and `SummaryProto` rather than in `models/util`, because it is an error-reporting shape. Validate RPCs already return `SummaryProto`, so a service returns violations as-is: one `ErrorProto` whose `violations` holds the validator's output, inside the `SummaryProto` (and/or in the gRPC `INVALID_ARGUMENT` status details). There is one wire shape for every binding.

### One shared rule set

`common.models.security.SecurityRules` is the single source of the security rules:

- `inferProductType` / `isBond`: the "is this a bond" answer. `Security.fromProto`, `BondSecurity.getProductType` and transaction cash-impact logic all use it, so a security with `bond_details` but no `product_type` is a `TREASURY_NOTE` bond on every path.
- `requiredFields`: a bond requires `bond_details.face_value` and `bond_details.issue_date`.
- `validate(SecurityProto)`: every violation, or an empty list. Rules: each missing required field, and `bond_details.maturity_date` not strictly after `issue_date` when both are set.
- `requireValid(SecurityProto)`: throws `ModelValidationException` with every violation.

`common.models.transaction.TransactionRules.validate` / `requireValid` apply the security rules to a transaction's inline security, prefixing fields with `security.`.

Validators are pure: proto in, list out. No I/O, no service state. **A link security is not fetched and yields no violations; callers must hydrate it first** (e.g. `LinkResolver`) to have its fields checked. Existence, duplicates, tax lots and permissions stay in services.

### Construction-time versus `requireValid` rules

The item forbids new rejections, so only the rule that already threw at construction still does:

- Maturity not after issue: `Security.fromProto` throws, as before, but now as `ModelValidationException` (field `bond_details.maturity_date`, the security ID). The message still contains `maturity_date must be after issue_date`.
- Missing `face_value` or `issue_date`: reported by `validate` and thrown by `requireValid`, not at construction. A bond with no `issue_date` (LS-19) still constructs; `getTenor()` returns `Tenor.UNKNOWN_TENOR` and `getProductType()` returns the inferred type, and neither invents a date.
- Missing `face_value` also throws `ModelValidationException` at the existing failure point in `Transaction.addCashImpact`.

Python, JS and Rust do not enforce maturity-after-issue at construction today. Adding it there would be a new rejection, so in those bindings the date rule will raise only through `requireValid`/`validate`. This is a deliberate Java/other difference.

### Per-binding base types

| Binding | Typed input error | Base | Notes |
|---|---|---|---|
| Java | `ModelValidationException` | `IllegalArgumentException` | This item. |
| Python | `ModelValidationError` | `ValueError` | Type added by LM-258 (`fintekkers/wrappers/models/errors.py`); LM-255b adds the bond rules. |
| JS/TS | `ModelValidationError` | `Error` | Type added by LM-258 (`node/wrappers/models/errors.ts`); LM-255c adds the bond rules. JS has no standard argument error; `TypeError` and `RangeError` mean something else. |
| Rust | `Error::Validation(Vec<FieldViolationProto>)` | `utils::errors::Error` | Variant added by LM-258; LM-255d adds the bond rules. Rust has no exception hierarchy; maps to `Code::InvalidArgument`. |

### Timestamps: unset `as_of` and blank `time_zone` (LM-272)

A `LocalTimestampProto` with a blank `time_zone` is never defaulted (second-brain#276). Since LM-272 it is a typed input error in every binding, not a bare `IllegalArgumentException` (Java), pytz `UnknownTimeZoneError` (Python) or plain `Error` (JS):

| Case | `field` |
|---|---|
| Price with no `as_of` | `price.as_of` |
| Price `as_of` with blank zone | `price.as_of.time_zone` |
| Non-link transaction with no `as_of` | `transaction.as_of` |
| Transaction `as_of` with blank zone | `transaction.as_of.time_zone` |
| Any other caller of the generic helper (e.g. `valid_from`) with a blank zone | `local_timestamp.time_zone` |

- Each binding has one required-timestamp helper: Java `ProtoSerializationUtil.deserializeRequiredTimestamp(ts, fieldPath)`, Python `ProtoSerializationUtil.deserialize_required_timestamp`, Rust `ProtoSerializationUtil::deserialize_required_timestamp`, JS `ZonedDateTime.fromRequired`.
- Java, Python and JS reject a non-link transaction with no `as_of` (or a blank zone) at construction. A link stub (`is_link=true`) may omit `as_of`. Prices are checked when `as_of` is read; a link price is resolved from the cache first.
- Rust keeps `TransactionWrapper::new` infallible. Rust rejects the input when `PriceWrapper::try_as_of` / `TransactionWrapper::try_as_of` is called. The panicking `get_as_of` and `From<&LocalTimestampWrapper>` paths remain until a breaking-change follow-up; the existing `deserialize_timestamp` still returns `Error::DateConversion`.
- **Python type change**: the blank-zone error moves from `UnknownTimeZoneError` (a `KeyError`) to `ModelValidationError` (a `ValueError`). Callers catching `KeyError` no longer see it.
- A non-empty but invalid zone (e.g. `Mars/Base`) keeps its previous error in each binding.

LM-254 adds an `InvalidFieldError` in Python and JS. LM-255b/c must reuse or extend it as the typed input error rather than add a second one, and must fold LM-258's T-bill coupon `validate()` into the shared rules module.

## Affected callers

- Java callers that catch `TransactionProcessingException` around `Transaction.addCashImpact` (or the short-form `Transaction` constructor) no longer see the missing-`face_value` case; it now arrives as `IllegalArgumentException` / `ModelValidationException`. No caller in this repo does this. ledger-service's dependent item maps it to `INVALID_ARGUMENT`.
- Callers that match the whole `getMessage()` string of the maturity error break; callers using `contains("maturity_date must be after issue_date")` keep working.
- Rust callers that `match` on `utils::errors::Error` exhaustively must add an arm when LM-255d adds `Error::Validation`.

## Known follow-ups

- **LS-12**: UUID-length errors in `Security.extractId` stay a bare `IllegalArgumentException`. They are not a rule named in this item.
- **Java-first rollout gap**: until LM-255b/c/d merge, only Java raises the typed error; the other bindings already have the generated `FieldViolationProto` and `ErrorProto.violations`.
- ledger-service deletes its copied bond rules and bond-inference logic in its own dependent items, after bumping its pinned version.
