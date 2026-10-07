import Decimal from 'decimal.js';
export interface Fill {
    /** Signed quantity: positive is a buy. */
    directedQuantity: Decimal;
    /** Price in the security's price convention. */
    price: Decimal;
}
/**
 * Quantity-weighted mean price of the buys in `fills`. Sells never change it.
 *
 * A buy has directedQuantity > 0; sells, short sales and zero-quantity fills
 * are skipped. The result is sum(quantity * price) / sum(quantity) over the
 * buys, rounded to 12 decimal places half-even with trailing zeros removed.
 * Returns null when there are no buys; it never divides by zero or returns NaN.
 *
 * Not the same as Java's TaxLotSummary.getAverageCostBasis, which nets sells.
 */
export declare function weightedAveragePurchasePrice(fills: ReadonlyArray<Fill>): Decimal | null;
