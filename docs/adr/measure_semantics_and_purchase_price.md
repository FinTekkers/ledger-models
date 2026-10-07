# ADR: Measure semantics for P&L and cost basis, and a weighted-average purchase price helper

## Status

Proposed (LM-256). The helper section is in effect. The measure definitions section is **pending gate-5 approval** of the disagreement table on [#256](https://github.com/FinTekkers/ledger-models/issues/256#issuecomment-6048627872).

## Context

ledger-service items LS-23 and LS-24 redefined P&L and cost basis in ways that contradict `measure.proto`. LS-23 wanted P&L = MV − UCB, and LS-24 wanted UCB as a total. Also:

- `measure.proto` and valuation-service disagree on the equity price divisor (/100 vs 1).
- They disagree on the `PROFIT_LOSS_PERCENT` scale (0–1 vs ×100).
- Services need a weighted-average purchase price, and that maths was about to be copied into each service.

## Decision

### Measure definitions

Pending. The proto vs valuation-service disagreements are listed, with file:line on both sides, in the [gate-5 table on #256](https://github.com/FinTekkers/ledger-models/issues/256#issuecomment-6048627872). Once approved, the rows are copied here verbatim. The `measure.proto` comments, `catalog/measures.json` and the `Measure.java` description strings will then match them exactly. Until then, no definition in this repo changes.

### Weighted-average purchase price helper

The helper has one rule, and every binding implements it the same way:

- A **buy** is a fill with directed quantity > 0.
- Sells, short sales and zero-quantity fills are skipped. A sell never changes the result.
- The result is `sum(quantity × price) / sum(quantity)` over the buys, computed with exact decimals.
- The quotient is rounded to **12 decimal places, half-even**, then trailing zeros are removed. Every binding prints the same digits, e.g. buy 1 @ 1 plus buy 2 @ 2 gives `1.666666666667`.
- **No buys** (an empty input, a sell-only input, or a short-only book) returns empty. The helper never divides by zero and never returns NaN.
- Prices are taken as given, in the security's price convention. The helper doesn't convert between per-100-face and per-share prices.

| Binding | Function | Empty result | Decimal type |
|---|---|---|---|
| Java | `common.models.taxLot.WeightedAveragePurchasePrice.of(Collection<Fill>)` and `.fromLots(Collection<? extends IFinancialModelObject>)` | `Optional.empty()` | `BigDecimal` |
| Python | `fintekkers.wrappers.models.cost_basis.weighted_average_purchase_price(Iterable[(qty, price)])` | `None` | `decimal.Decimal`, with a module-local `Context`; `getcontext()` is never changed |
| Rust | `fintekkers::wrappers::models::cost_basis::weighted_average_purchase_price(&[(qty, price)])` | `None` | `rust_decimal::Decimal` |
| JS/TS | `weightedAveragePurchasePrice(fills)` in `node/wrappers/models/cost_basis` | `null` | `decimal.js`, through a local `Decimal.clone`; the global `Decimal.set` is never called |

**`fromLots` is Java-only.** Only Java has `IFinancialModelObject` tax lots (`TaxLotDelta`, `TaxLotSummary`). It reads `Measure.DIRECTED_QUANTITY` and `Field.PRICE` the same way `TaxLotSummary.getAverageCostBasis` does, so callers can pass `summary.allLots()`. The other bindings take `(quantity, price)` pairs. This asymmetry is deliberate and is not drift.

**Java output form.** Java uses `stripTrailingZeros()`, so `toString()` can print 150 as `1.5E+2`. Compare with `compareTo`, or print with `toPlainString()`.

**Range.** Rust's `Decimal` holds 28 significant digits, and inputs beyond that overflow. Java and Python are unbounded. JS works to 60 significant digits before the final rounding.

### Not `TaxLotSummary.getAverageCostBasis`

`TaxLotSummary.getAverageCostBasis` (and so `TaxLotSummary.getMeasure(UNADJUSTED_COST_BASIS)`) nets sells into the average at their sell price. It returns `0` when the net quantity is 0. For buy 100 @ 10, buy 100 @ 20, sell 50 @ 25, it returns `11.66666666666667`, while the helper returns `15`.

That method is **unchanged** here, and `WeightedAveragePurchasePriceTest` pins both results. Whether it should move to the buys-only rule is row 10 of the gate-5 table.

## Consequences

- ledger-service can replace its own cost-basis maths with this helper once it bumps its pinned version (LS-23, LS-24).
- Any approved definition that differs from valuation-service is fixed in a separate valuation-service item. valuation-service is not changed here.
