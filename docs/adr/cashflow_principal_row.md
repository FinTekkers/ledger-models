# ADR: Principal repayment is its own CashflowProto row

## Status

Accepted (LM-489, owner ruling 24 Nov 2026). Docs and comments only: no new or changed fields, numbers or messages.

## Context

valuation-service answers `PRESENT_VALUE_CASHFLOWS` with a schedule of `CashflowProto` rows. Today it sends one row on the maturity date with `fv_amount` = final coupon + principal. A consumer cannot split that row back into coupon and principal, so it cannot show them separately. US-328 was blocked by this.

## Decision

A cashflow schedule lists the principal repayment as its own row. The `CashflowProto` comments and the `PRESENT_VALUE_CASHFLOWS` catalog formula state the rules:

- Each coupon payment is one row, with `coupon_rate` set.
- The principal repayment is a separate row on its date, with `coupon_rate` unset (absent, never 0). This covers principal at maturity and any principal paydown. Its `fv_amount` and `pv_amount` cover principal only. For TIPS, `index_ratio` is set on it as on the coupon rows, and its `fv_amount` is principal x max(ratio, 1) (see `tips_assumed_inflation_rate.md`).
- So one date can have two rows: the final coupon and the principal.
- The sum of `pv_amount` over all rows, coupon and principal, still equals `PRESENT_VALUE` (scoped as before: when `TipsInput.assumed_inflation_rate` is unset).

It is one rule for every product with a cashflow schedule: fixed bonds, TIPS and FRNs (`applies_to`: `BOND`, `TIPS`, `TREASURY_FRN`). A consumer tells the rows apart with presence on `coupon_rate` (`hasCouponRate()` in Java and JS, `HasField` in Python, `Option::None` in Rust).

## Alternative not taken

Add `coupon_amount` and `principal_amount` fields to `CashflowProto`, keeping one row per date. Rejected: the owner asked for no new fields, and splitting rows uses the fields the message already has. It also keeps a principal paydown on a non-coupon date expressible without a coupon amount of zero.

## Consequences

- valuation-service must emit the separate principal row instead of the combined maturity row. That is service work, outside this item; consumers such as US-328 stay blocked until it lands.
- A consumer that grouped rows by `cashflow_date` must expect up to two rows per date.
- No wire change: existing messages parse as before.

Related: `principal_paydown_pattern.md` (the PRINCIPAL_PAYDOWN transaction type), `tips_assumed_inflation_rate.md` (TIPS index ratio and the maturity floor).
