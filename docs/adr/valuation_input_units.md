# ADR: Units and rules for valuation inputs

## Status

Accepted (LM-260). Comment-only change: no field, number, type, option or RPC changes.

Approval: Option A with decisions D1–D4 as proposed, approved at the LM-260 Horizon plan gate.
Approver: **TO BE FILLED IN** — the gate record passed to Implement did not carry the approver's name. Do not merge until it is added here.

## Context

While documenting caller inputs for valuation-service (FinTekkers/valuation-service#62, `docs/product-inputs.md` "Shared contract"), six proto comments in ledger-models 0.4.3 were found to disagree with what valuation-service does, with each other, or to leave the unit unstated. The proto comments are the spec (project rules, "Models first" rule 3), so the meaning is decided here.

Each comment now describes current behaviour. Where an intended check is not yet applied, the comment says so and names the valuation-service item that tracks it.

## Decision

| ID | Field | Decision |
|---|---|---|
| L1 / D1 | `BondDetailsProto.coupon_rate` | **Percent**: `6.0` = 6%, `0.625` = 0.625%. Not a decimal fraction: valuation-service rejects values in (0, 0.1) as decimal-fraction mistakes. |
| L2 | `TipsInput.current_cpi` | `adjusted_principal = max(face_value * index_ratio, face_value)` (deflation floor at par), matching `MeasureProto.INFLATION_ADJUSTED_PRINCIPAL`. |
| L3 / D2 | `YieldCurveInput.index` | **Relaxed**: should match the FRN's `reference_rate_index`, but is not read or validated today. Check tracked in **VS-74**. |
| L4 / D3 | `BondInput.security` | **Relaxed**: intended `TREASURY_NOTE` with `coupon_type FIXED`, but any `product_type` is accepted and `coupon_type` is ignored today. `dated_date` is not read today. Check tracked in **VS-69**. |
| L5 / D4 | `ValuationRequestProto.reference_rate_input` | **Decimal fraction**: `0.0533` = 5.33%. valuation-service currently also tolerates values > 1 as percent; that is a tolerance, not a second unit. When absent, valuation-service defaults to `0.0533`. |
| L6 | `ValuationRequestProto.price_input` | Bonds: per 100 face (`99.75` = 99.75% of par). Cash and equity: per unit. |

### Why

- **L1 percent.** Percent is what valuation-service requires and what the rest of the repo already says: `cashflow.proto` (`5.25 = 5.25%`), `measure.proto` and `ledger-models-protos/catalog/measures.json` ("coupon_rate as percentage"). LM-258 already moved the comment to percent (`tbill_coupon_validation.md`); this item adds the reject rule.
- **L1 and L5 use different units on purpose.** Each comment states its own unit with an example. Decimal for L5 is the unit valuation-service's `> 1` heuristic reads correctly for sub-1% rates (`0.25` would be misread as 25% only if callers were told to send percent).
- **L3 and L4 relaxed.** The comments claimed checks the service does not perform. Saying so, and naming VS-74 and VS-69, keeps the intended rule visible without misleading callers.

### Out of scope

- MBS `wac` and `pass_through_rate` stay decimal fraction. They are different fields.
- `FrnInput.curve` still says "curve.index must match security.frn_extension.reference_rate_index". It states the intended rule; like `YieldCurveInput.index`, it is **not validated today** — see VS-74. Left unchanged so this item rewords only L1–L6.
- No valuation-service changes (gaps G4–G12 stay there).

### Guardrail check: no binding enforces a coupon unit

No Java, Python, Rust or JS wrapper or validator checks the `coupon_rate` unit; the only coupon rule is the TBILL "no coupon" rule from LM-258. Several pass-through test fixtures use decimal-looking coupons. None enforces a unit, so they do not contradict this decision, but they do not illustrate it either (possible follow-up):

- Java: `BondSecurityFromPricerInputsTest.java` (`0.04125`), `TipsBondFromPricerInputsTest.java` (`0.01125`), `FloatingRateNoteFromPricerInputsTest.java` (`0.0001`), `MortgageBackedSecurityFromPricerInputsTest.java` (`0.04`).
- Python: `test_bond_security_pricer_inputs.py` (`0.045`).
- JS: `transaction_constructor.test.ts`, `transaction.derived.test.ts`, `security.test.ts` (models and services) (`'0.05'`).

## Consequences

- Callers can read units and current validation straight from the generated bindings.
- When VS-69 or VS-74 lands, the matching comment must be updated to say the rule is enforced.
