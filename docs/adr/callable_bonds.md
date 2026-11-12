# ADR: Callable bonds keep their maturity; the call date is a separate field

## Status

Accepted (LM-465).

## Context

Older 30-year Treasuries (issued 1979-84) were callable. SOMA held 11 of them from 2004, for example `912810CK2`, the 10⅜% "Bonds of 2004-2009": legal maturity **2009-11-15**, first call date **2004-11-15**. Treasury called all 11. The NY Fed feed reports each one's call date as its maturity; FiscalData's auction records carry `callable: Yes` and `call_date`. No proto had a field for either.

The owner's ruling: the security keeps its **original maturity**, and an exercised call shows up as transactions (a SELL to zero on the call date). The loader needs the call date on the security to book that.

## Decision

### Two flat fields on `BondDetailsProto`

```proto
bool callable = 9;
fintekkers.models.util.LocalDateProto call_date = 10;
```

- `callable` is true when the issuer may redeem the bond before `maturity_date`. Default false.
- `call_date` is the **first** date the issuer may redeem the bond at par. It is not the maturity date and never changes `maturity_date`, which stays the legal final maturity. It is set only when `callable` is true and unset otherwise, with no placeholder date (LM-441).
- Purely additive: 9 and 10 were the next free numbers. Nothing is renumbered. `scripts/checks/wire-diff.py` rule `lm465` allows exactly these two additions (`test-fixtures/field-changes/lm-465.json`).
- Existing serialized bonds read back as `callable = false` with `call_date` unset. No migration.

### Wrappers: store and expose only

| Binding | Callable | Call date (unset → null) | Setters |
|---|---|---|---|
| Java | `BondSecurity.isCallable()` | `BondSecurity.getCallDate()` → `LocalDate` or `null` | `setCallable(boolean)`, `setCallDate(LocalDate)` (`null` clears) |
| Python | `Security.is_callable()` | `Security.get_call_date()` → `date` or `None` | none |
| JS/TS | `Security.isCallable()` | `Security.getCallDate()` → `Date` or `null` | none |
| Rust | `SecurityWrapper::callable()` | `SecurityWrapper::call_date()` → `Option<NaiveDate>` | none |

- Java puts the accessors on `BondSecurity`, where its maturity accessors live; `TIPSBond`, `FloatingRateNote` and `MortgageBackedSecurity` inherit them. Python, JS and Rust put them on the base security wrapper, next to the maturity getters, and return false / null for a security with no bond details.
- Only Java gets setters, because Java builds securities through the wrapper. Python, JS and Rust callers set the proto fields directly. That matches the item: a getter in every language.
- The getters are **pass-through**. A stored `call_date` is returned even when `callable` is false, and Java `setCallable(false)` does not clear `call_date`. Hiding or reconciling the two would be validation logic, which this item rules out.
- Rust's `call_date()` returns `None` for an invalid stored date (for example month 13), the same as `maturity_date()`.
- `maturity_date`, every maturity getter and `getField(MATURITY_DATE)` are unchanged: they return the legal maturity, never `call_date`.

## Options rejected

- **Nested `CallProvisionProto`** (with `callable` derived from presence). It would rule out an inconsistent bool and date and leave room for a call schedule, but the item names `bool callable` and `call_date`, and a call schedule is out of scope.
- **`FieldProto` entries plus a consistency validator** (`call_date` set without `callable`, or not before `maturity_date`). Useful later, but it adds a contract change to position and filter code in every service, and this item is store and expose only. It can be its own item once the loader needs it.

## Consequences

- `callable` and `call_date` can disagree (false with a date). Nothing enforces the rule in the proto comment yet; a validator is a possible follow-up.
- No call price, notice period or list of call dates. A bond with a call schedule beyond the first call date carries only that first date.
- No valuation, cash-flow, yield or validation code reads either field.
- The SOMA loader books an exercised call as a SELL to zero on `call_date`; that is a separate consumer item after this releases.
