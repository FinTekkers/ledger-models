# ADR: settlement_convention — settlement date in, settlement date out

## Status

Accepted (LM-509). Additive and contract only: a new `SettlementConventionProto`, `ValuationRequestProto.settlement_convention = 80`, `ValuationResponseProto.settlement_date = 60` and `measure_asof_date = 61`. `DV01 = 25` and every existing field, number and enum value are unchanged. The `lm509` rule in `scripts/checks/wire-diff.py` allows exactly these additions (from `test-fixtures/field-changes/lm-509.json`). valuation-service computes the settlement date in its own item.

Amended (LM-512): comments only. The lag-0 roll rule below. No field, number or wire change.

Amended (LM-514): measure 31, which LM-509 added, is removed and both its number and name are reserved. A per-$1M figure is `DV01` (25) requested with a 1,000,000 face quantity.

## Context

A valuation's settlement date was the UTC date of `ValuationRequestProto.asof_datetime`. A client could not say "traded on the 25th, settles T+1 on the SIFMA calendar", so in a holiday week (Thanksgiving 2026-11-26) every settlement-dependent measure (accrued interest, the TIPS settlement month for `REFERENCE_CPI`, the latest FRN fixing, yields and durations through the stub fraction) was computed at the wrong date. The response did not say which date it used.

## Decision

### Request: an optional message

```proto
message SettlementConventionProto {
  fintekkers.models.util.LocalDateProto trade_date = 1;
  uint32 settlement_lag_business_days = 2;
  string calendar_id = 3;   // e.g. US_SIFMA
}
// ValuationRequestProto
SettlementConventionProto settlement_convention = 80;
```

- **Presence.** A message field has explicit presence, so "no convention" is distinct from a lag of 0 in every language (`HasField`, `hasSettlementConvention`, `Option`).
- **The spec, once.** The `settlement_convention` field comment defines the request's *effective settlement date*: unset, the UTC date of `asof_datetime`, exactly as before; set, `trade_date` plus `settlement_lag_business_days` business days on the `calendar_id` calendar. Every comment in `product_inputs.proto` and `measure.proto` that read settlement from `asof_datetime` gains one line pointing to `settlement_convention`; a Python test fails if a comment mentions `asof_datetime` without it.
- **Business days.** A weekday that is not a holiday on the calendar. Day 1 is the first business day after `trade_date`. A lag of 0 settles on trade_date itself when trade_date is a business day. With a lag of 0, a trade_date that is not a business day on the calendar rolls forward to the next business day. Example: trade_date 2026-11-28 (Saturday), lag 0, US_SIFMA settles on 2026-11-30.
- **Invalid** (valuation-service returns `INVALID_ARGUMENT`): `trade_date` unset while the convention is set; `calendar_id` empty, blank or unknown.
- `asof_datetime` still selects market data.

### Response: two dates

`settlement_date = 60` is the effective settlement date the service derived. `measure_asof_date = 61` is the date every measure was computed at; it equals `settlement_date` today and is a separate field for a later forward valuation. Both are unset when the request has no convention, so an existing client sees an identical response.

### Helpers: data checks only

Each binding gets one builder beside `typed(...)`: Python `ValuationRequests.settlement_convention`, Java `ValuationRequests.settlementConvention`, TypeScript `ValuationRequests.settlementConvention`, Rust `valuation_requests::settlement_convention`. They check only the calendar-free rules the comment states (trade_date set, lag not negative, calendar_id not blank) and return field-level violations (`settlement_convention.<field>`). They never compute a date and pass an unknown calendar id through. `typed(...)` is unchanged; callers attach the convention themselves.

## Alternatives

- **A calendar enum.** Type-checked, but every new calendar would need a ledger-models release and a minimum-version bump in every consumer. A string lets valuation-service add calendars alone; the cost is that a typo is caught only at runtime, by the service.
- **Three flat optional fields on the request.** Allows half-set states (a lag with no calendar) that the comment and service would have to define and reject, and uses three request numbers instead of one.

## Consequences

- Superseded by LM-514: measure 31 is removed and reserved. A per-$1M figure is `DV01` requested with a 1,000,000 face quantity.
- Consumers need no change. A service raises its ledger-models minimum only when its code reads the new fields.
- Request bytes written by v1.1.62 parse with the convention unset in every binding (`test-fixtures/wire/lm-509-request-v1.1.62.hex`).
