package common.models.taxLot;

import common.models.IFinancialModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.price.Price;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/***
 * Quantity-weighted mean price of the buys in a set of fills. Sells never change it.
 *
 * Rule (identical in Java, Python, Rust and JS; see docs/adr/measure_semantics_and_purchase_price.md):
 *   - a buy is a fill with directed quantity > 0; sells, short sales and zero-quantity fills are skipped;
 *   - result = sum(quantity * price) / sum(quantity) over the buys, in exact decimals;
 *   - the quotient is rounded to 12 decimal places, HALF_EVEN, then trailing zeros are stripped;
 *   - no buys gives Optional.empty(). It never divides by zero.
 *
 * This is NOT TaxLotSummary.getAverageCostBasis, which nets sells into the average and returns 0 when the
 * net quantity is 0. That method is unchanged.
 *
 * The result comes from stripTrailingZeros(), so 150 can print as 1.5E+2 with toString(). Compare with
 * compareTo() or print with toPlainString().
 */
public final class WeightedAveragePurchasePrice {
    static final int SCALE = 12;

    private WeightedAveragePurchasePrice() {}

    /** One fill: signed quantity (positive is a buy) and its price, in the security's price convention. */
    public record Fill(BigDecimal directedQuantity, BigDecimal price) {
        public Fill {
            Objects.requireNonNull(directedQuantity, "directedQuantity");
            Objects.requireNonNull(price, "price");
        }
    }

    public static Optional<BigDecimal> of(Collection<Fill> fills) {
        Objects.requireNonNull(fills, "fills");
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (Fill fill : fills) {
            if (fill.directedQuantity().signum() <= 0)
                continue;
            quantity = quantity.add(fill.directedQuantity());
            totalCost = totalCost.add(fill.directedQuantity().multiply(fill.price()));
        }

        if (quantity.signum() == 0)
            return Optional.empty();

        return Optional.of(totalCost.divide(quantity, SCALE, RoundingMode.HALF_EVEN).stripTrailingZeros());
    }

    /**
     * Reads Measure.DIRECTED_QUANTITY and Field.PRICE from each lot, the same way
     * TaxLotSummary.getAverageCostBasis does. Pass TaxLotSummary.allLots() for one summary.
     */
    public static Optional<BigDecimal> fromLots(Collection<? extends IFinancialModelObject> lots) {
        Objects.requireNonNull(lots, "lots");
        List<Fill> fills = new ArrayList<>(lots.size());
        for (IFinancialModelObject lot : lots) {
            BigDecimal directedQuantity = lot.getMeasure(Measure.DIRECTED_QUANTITY);
            if (directedQuantity.signum() <= 0)
                continue; // sells don't count, so their price is never read
            Price price = (Price) lot.getField(Field.PRICE);
            fills.add(new Fill(directedQuantity, price.getPrice()));
        }
        return of(fills);
    }
}
