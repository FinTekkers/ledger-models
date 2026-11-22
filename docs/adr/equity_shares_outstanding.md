# ADR: Equity shares outstanding

## Status

Accepted (LM-479). Additive wire change: `EquityDetailsProto` gains `optional fintekkers.models.util.DecimalValueProto shares_outstanding = 1`. The first user is the SPY quarter-end loader (MDI-151).

## Context

No model could hold an equity's or ETF's shares outstanding. `EquityDetailsProto`, the `equity_details = 204` variant of the `SecurityProto.non_bond_details` oneof, was an empty placeholder whose comment named `shares_outstanding` as a future field. The SPY loader needs to store SPY's shares outstanding at each quarter-end since December 2003, from State Street's NAV history.

## Decision

### One field on EquityDetailsProto

- `shares_outstanding` (1): a whole-number count of shares. Not thousands or millions, and not a currency amount. Field 1 is the first number: the message was empty.
- It is a `DecimalValueProto`, like every other quantity on `SecurityProto`, so very large counts are exact in every language.
- The whole-number rule is documented, not enforced. A value such as `1.5` is stored as it is. A check would be a validator change in a later item.

### Versioned by as_of, like every security attribute

There is no separate effective date. A new count is a new version of the security with a new `as_of`. The value valid at a date is the one on the latest version whose `as_of` is on or before that date. How securities are versioned does not change.

### Absent means unknown, never zero

The field is message-typed, so every language reports presence: `hasSharesOutstanding()` in Java and JS, `HasField` in Python, `Option::None` in Rust. Every wrapper getter returns null, `None` or `undefined` when `equity_details` is not set, the field is absent, or the decimal is present but empty (no `unscaled_value`). It never returns 0 for any of these. Securities stored before this change parse with the field absent, which means unknown.

`optional` adds nothing on the wire for a message field. It is there because LM-479 asks for it, as with LM-477.

### The getter lives on the equity wrapper

| Language | Getter |
| --- | --- |
| Java | `EquitySecurity.getSharesOutstanding(): BigDecimal` (nullable). `Security.fromProto` already returns `EquitySecurity` for every STOCK descendant, ETF included. |
| JS | `EquitySecurity.getSharesOutstanding(): Decimal \| undefined`. `Security.create` now returns `EquitySecurity` for STOCK descendants, and `isEquity()` narrows to it. |
| Python | `EquitySecurity.get_shares_outstanding() -> Optional[Decimal]`. Built directly, as `IndexSecurity` is. |
| Rust | `EquitySecurity::from_proto(proto)?.shares_outstanding() -> Option<Decimal>`. Accepts STOCK descendants, as `IndexSecurity` accepts INDEX descendants. |

Bond, cash and FX wrappers never see an equity getter.

## Options rejected

- **A getter on the base `Security` wrapper.** It puts an equity-only getter on bonds, cash and FX, and in Java bypasses the existing `EquitySecurity`.
- **A `FieldProto.SHARES_OUTSTANDING` value read through `getField`.** It widens the change to position aggregation and filter parsing in every service, and no consumer has asked for field-based access.

## Consequences

- JS `Security.create` returns an `EquitySecurity` for STOCK descendants instead of a plain `Security`. It is still `instanceof Security`.
- Rust `EquitySecurity::from_proto` reuses `Error::NotABondSecurity` for a non-equity, as `IndexSecurity` does.
- A Rust struct literal of `EquityDetailsProto` written as `EquityDetailsProto {}` stops compiling once a consumer raises its minimum ledger-models version. Write `EquityDetailsProto { ..Default::default() }`.
- `wire-diff.py` rule `lm479` allows exactly this addition (`test-fixtures/field-changes/lm-479.json`).
- Rollback after a release: delete the field and reserve `1` / `"shares_outstanding"`. Never renumber.
