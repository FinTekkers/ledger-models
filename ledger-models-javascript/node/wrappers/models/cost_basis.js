"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightedAveragePurchasePrice = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
/** Decimal places of the result. Same in Java, Python and Rust; see docs/adr/measure_semantics_and_purchase_price.md. */
const SCALE = 12;
// Local constructor: wide enough that sums and the quotient stay exact before
// the final 12-place rounding. The global Decimal settings are never touched.
const LocalDecimal = decimal_js_1.default.clone({ precision: 60, rounding: decimal_js_1.default.ROUND_HALF_EVEN });
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
function weightedAveragePurchasePrice(fills) {
    let quantity = new LocalDecimal(0);
    let totalCost = new LocalDecimal(0);
    for (const { directedQuantity, price } of fills) {
        if (!directedQuantity.greaterThan(0)) {
            continue;
        }
        quantity = quantity.plus(directedQuantity);
        totalCost = totalCost.plus(new LocalDecimal(directedQuantity).times(price));
    }
    if (quantity.isZero()) {
        return null;
    }
    return totalCost.dividedBy(quantity).toDecimalPlaces(SCALE, decimal_js_1.default.ROUND_HALF_EVEN);
}
exports.weightedAveragePurchasePrice = weightedAveragePurchasePrice;
//# sourceMappingURL=cost_basis.js.map