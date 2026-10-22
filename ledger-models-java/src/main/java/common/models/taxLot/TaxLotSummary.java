package common.models.taxLot;

import common.models.IFinancialModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.price.Price;
import fintekkers.models.position.TaxLotProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.*;

/***
 * Provides a container for multiple Tax Lot deltas. Should be used
 * only for a single portfolio and security. Operations like average cost
 * only make sense on that level.
 */
public class TaxLotSummary implements IFinancialModelObject {

    private final Collection<TaxLotDelta> deltas;
    private TaxLotDelta latest;

    public TaxLotSummary(TaxLotDelta delta) {
        this.deltas = new ArrayList<>() {{ add(delta);}};
        this.latest = delta;
    }
    public TaxLotSummary(Collection<TaxLotDelta> deltas) {
        this.deltas = deltas;
        latest = deltas.stream().min(Comparator.comparing( TaxLotDelta::getAsOf)).get();
    }


    public void addTaxLot(TaxLotDelta delta){
        if(!latest.getID().equals(delta.getID()))
            throw new IllegalArgumentException(String.format(
                    "Can only add tax lots with the same ID. This summary represents %s, but received %s",
                    latest.getID(), delta.getID()));

        if(latest.getAsOf().compareTo(delta.getAsOf()) < 0) {
            latest = delta;
        }

        deltas.add(delta);
    }

    public UUID getID() {
        return latest.getID();
    }
    
    public Collection<TaxLotDelta> allLots() {
        return deltas;
    }

    public BigDecimal openQuantity() {
        BigDecimal openQuantity = BigDecimal.ZERO;
        for(TaxLotDelta delta : deltas) {
            openQuantity = openQuantity.add(delta.getDirectedQuantity());
        }

        return openQuantity;
    }

    /**
     * The proto form of this lot for {@code CostBasisInput.lots} (LM-364, LM-366).
     *
     * <p>{@code open_date} and {@code price} come from the earliest delta by asOf.
     * Every delta of a lot carries the same open date and purchase price
     * ({@link TaxLotDelta#createDelta} copies them), so, like {@link #openQuantity()},
     * no delta is skipped: invalidated deltas count too. {@code price} is the
     * purchase price as stored (per 100 face, clean; TIPS: real), not the
     * weighted average. {@code open_quantity} is {@link #openQuantity()}: a fully
     * closed lot gives 0, and the caller filters closed lots.
     *
     * @throws IllegalStateException naming the lot if it has no deltas, or its
     *         earliest delta has no open date or price
     */
    public TaxLotProto toProto() {
        TaxLotDelta opening = deltas.stream()
                .min(Comparator.comparing(TaxLotDelta::getAsOf))
                .orElseThrow(() -> new IllegalStateException(
                        String.format("Tax lot %s has no deltas", latest.getID())));
        if (opening.getOpenDate() == null) {
            throw new IllegalStateException(
                    String.format("Tax lot %s: open_date is unset on its opening delta", getID()));
        }
        if (opening.getPrice() == null || opening.getPrice().getPrice() == null) {
            throw new IllegalStateException(
                    String.format("Tax lot %s: price is unset on its opening delta", getID()));
        }

        return TaxLotProto.newBuilder()
                .setOpenDate(ProtoSerializationUtil.serializeLocalDate(opening.getOpenDate()))
                .setOpenQuantity(ProtoSerializationUtil.serializeBigDecimal(openQuantity()))
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(opening.getPrice().getPrice()))
                .build();
    }

    public BigDecimal getAverageCostBasis() {
        return getAverageCostBasis(allLots());
    }

    public static BigDecimal getAverageCostBasisFromSummaries(Collection<TaxLotSummary> summaries) {
        List<TaxLotDelta> deltas = new ArrayList<>();
        summaries.forEach(summary -> deltas.addAll(summary.allLots()));
        return getAverageCostBasis(deltas);
    }

    /**
     * Gets the average cost basis, based on the deltas.
     *
     * Will iterate through lots to get the initial cost, and how much is remaining, for each set of
     * tax lot deltas. Then will calculate the weighted average cost basis.
     *
     * @return Average cost for tax lots
     */
    public static BigDecimal getAverageCostBasis(Collection<? extends IFinancialModelObject> deltas) {
        // Remaining quantity and cost
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (IFinancialModelObject lot : deltas) {
            BigDecimal directedQuantity = lot.getMeasure(Measure.DIRECTED_QUANTITY);

            quantity = quantity.add(directedQuantity);
            Price price = (Price) lot.getField(Field.PRICE);
            totalCost = totalCost.add(price.getPrice().multiply(directedQuantity));
        }

        if(BigDecimal.ZERO.equals(quantity))
            return BigDecimal.ZERO;

        return totalCost.divide(quantity, new MathContext(16, RoundingMode.HALF_UP));
    }

    @Override
    public Object getField(Field field) {
        if(Field.POSITION_STATUS.equals(field) || Field.STRATEGY.equals(field)) {
            throw new IllegalArgumentException("Not supported: "+ field);
        }
        return latest.getField(field);
    }

    @Override
    public BigDecimal getMeasure(Measure measure) {
        if(Measure.DIRECTED_QUANTITY.equals(measure)) {
            return openQuantity();
        } else if (Measure.UNADJUSTED_COST_BASIS.equals(measure)) {
            return getAverageCostBasis();
        } else {
            throw new IllegalArgumentException("Not supported: "+ measure);
        }
    }

    @Override
    public Set<Measure> getMeasures() {
        return new HashSet<>() {{
            add(Measure.DIRECTED_QUANTITY);
            add(Measure.UNADJUSTED_COST_BASIS);
        }};
    }

    @Override
    public Set<Field> getFields() {
        return latest.getFields();
    }

    @Override
    public ZonedDateTime getAsOf() {
        return latest.getAsOf();
    }
}