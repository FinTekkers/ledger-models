from decimal import ROUND_HALF_EVEN, Context, Decimal
from typing import Iterable, Optional

# Same rule in Java (WeightedAveragePurchasePrice), Rust and JS; see
# docs/adr/measure_semantics_and_purchase_price.md.
_SCALE = Decimal(1).scaleb(-12)
# Local context: wide enough that sums and the quotient stay exact before the
# final 12-place rounding. The caller's decimal.getcontext() is never touched.
_CONTEXT = Context(prec=60, rounding=ROUND_HALF_EVEN)


def weighted_average_purchase_price(
    fills: Iterable[tuple[Decimal, Decimal]],
) -> Optional[Decimal]:
    """Quantity-weighted mean price of the buys in `fills`. Sells never change it.

    Each fill is `(directed_quantity, price)`. A buy has directed_quantity > 0;
    sells, short sales and zero-quantity fills are skipped. The result is
    sum(quantity * price) / sum(quantity) over the buys, rounded to 12 decimal
    places HALF_EVEN with trailing zeros removed. Returns None when there are
    no buys; it never divides by zero.

    Not the same as Java's TaxLotSummary.getAverageCostBasis, which nets sells.
    """
    quantity = Decimal(0)
    total_cost = Decimal(0)
    for directed_quantity, price in fills:
        if directed_quantity <= 0:
            continue
        quantity = _CONTEXT.add(quantity, directed_quantity)
        total_cost = _CONTEXT.add(total_cost, _CONTEXT.multiply(directed_quantity, price))

    if quantity == 0:
        return None

    average = _CONTEXT.divide(total_cost, quantity).quantize(_SCALE, context=_CONTEXT)
    return _strip_trailing_zeros(average)


def _strip_trailing_zeros(value: Decimal) -> Decimal:
    # normalize() alone turns 150 into 1.5E+2; keep integers in plain form.
    if value == value.to_integral_value():
        return value.quantize(Decimal(1), context=_CONTEXT)
    return value.normalize(_CONTEXT)
