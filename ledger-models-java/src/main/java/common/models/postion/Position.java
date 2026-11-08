package common.models.postion;

import common.models.IFinancialModelObject;
import common.models.IRawDataModelObject;
import common.models.portfolio.Portfolio;
import common.models.security.Security;
import fintekkers.models.security.SecurityProto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static java.lang.String.format;

public class Position implements IFinancialModelObject, IRawDataModelObject {
    private final PositionType type; // Transactions or TaxLots
    private final PositionView positionView; //Default or Strategy

    private final HashMap<Field, Object> fields;
    private final HashMap<Measure, BigDecimal> measures;
    /**
     * The incoming link proto of a security field (LM-442), so the serializer
     * writes back the link it received. Holds only links, never resolved data.
     */
    private final EnumMap<Field, SecurityProto> securityWireForms = new EnumMap<>(Field.class);
    private ZonedDateTime asOf;

    public void setAsOfDate(ZonedDateTime asOf) {
        this.asOf = asOf;
    }

    /**
     * To think through:
     *
     * PositionSource: Transaction / TaxLot / JournalEntry
     * PositionView: Basic / Strategy / Look-through
     * Key: Replaces Aggregation Level?
     *
     * Use cases:
     *
     *  * Find positions with settlement currency USD -> use the key concept?
     *  * Find cash equity positions -> use the key concept?
     *  * Settlement ladder / Cash Ladder - Should these be position views or you use the key somehow?
     *      -> use the key concept, to get raw positions, then have a layer above?
     *
     *  Need to think through decomposable views. I.e. show me total AUM; then show by portfolio, then portfolio and currency, etc.
     */

    public enum PositionType{
        TRANSACTION, TAX_LOT//, JournalEntry
    }

    public enum PositionView {
        DEFAULT_VIEW, STRATEGY_VIEW //, LOOKTHROUGH
    }

    public Position(PositionView view, PositionType type) {
        this.type = type;
        this.fields = new HashMap<>();
        this.measures = new HashMap<>();
        this.positionView = view;
    }

    public Position(PositionType type) {
        this(PositionView.DEFAULT_VIEW, type);
    }

    public Position(PositionType type, Measure measure, Portfolio portfolio, Security security, ZonedDateTime asOf) {
        this(PositionView.DEFAULT_VIEW, type);
        this.setFieldValue(Field.PORTFOLIO, portfolio);
        this.setFieldValue(Field.SECURITY, security);
        this.setMeasureValue(measure, null);
        this.asOf = asOf == null ? ZonedDateTime.now() : asOf;
    }

    public Position(PositionType type, Measure measure, Portfolio portfolio, Security security) {
        this(type, measure, portfolio, security, ZonedDateTime.now());
    }


    public PositionType getPositionType() {
        return type;
    }

    public PositionView getPositionView() {
        return positionView;
    }

    //Fields

    /**
     * Returns the field's value from this position's field map. For
     * {@code MATURITY_DATE} and {@code ISSUE_DATE} with no map entry, falls
     * back to the position's {@code SECURITY} when it is resolved (not a
     * link), so a link never fetches or throws here (LM-442). A map entry
     * always wins.
     */
    public Object getField(Field field) {
        Object value = this.fields.get(field);
        if (value != null) return value;
        if (field == Field.MATURITY_DATE || field == Field.ISSUE_DATE) {
            Object security = this.fields.get(Field.SECURITY);
            if (security instanceof Security && !((Security) security).isLink()) {
                return ((Security) security).getField(field);
            }
        }
        return null;
    }

    public Set<Field> getFields() {
        return this.fields.keySet();
    }

    public void setFieldValue(Field field, Object value) {
        this.securityWireForms.remove(field);
        if (value == null) {
            this.fields.remove(field);
        } else if(field.validateFieldValue(value)) {
            this.fields.put(field, value);
        } else {
            throw new RuntimeException(format("Field %s accepts %s type, but got %s",
                    field.name(),
                    field.getType().getName(),
                    value.getClass().getName()));
        }
    }

    /**
     * Serializer-internal (used by {@code PositionSerializer.deserialize}):
     * sets a security field to its resolved value and records {@code wireForm}
     * if it is a link, so serialize writes back the same link.
     */
    public void setSecurityFieldValue(Field field, Security value, SecurityProto wireForm) {
        setFieldValue(field, value);
        if (value != null && wireForm != null && wireForm.getIsLink()) {
            this.securityWireForms.put(field, wireForm);
        }
    }

    /**
     * Serializer-internal (used by {@code PositionSerializer.serialize}): the
     * link this security field was received as, or {@code null}.
     */
    public SecurityProto getSecurityWireForm(Field field) {
        return this.securityWireForms.get(field);
    }

    //Measures

    public void setMeasureValue(Measure measure, BigDecimal value) {
        if (value == null || measure.getType().equals(value.getClass())) {
            this.measures.put(measure, value);
        } else {
            throw new RuntimeException(format("Field %s accepts %s type, but got %s",
                    measure.name(), measure.getType().getName(), value.getClass().getName()));
        }
    }

    public BigDecimal getMeasure(Measure measure) {
        return this.measures.get(measure);
    }

    public Set<Measure> getMeasures() {
        return this.measures.keySet();
    }

    public String toString() {
        String measures = getMeasures().stream()
                .map(e -> e.toString().concat(":").concat(
                        getMeasure(e) == null ? "" : getMeasure(e).toString())
                ).collect(Collectors.joining("|"));

        String fields = getFields().stream()
                .map(e -> e.toString().concat(":").concat(
                        getField(e) == null ? "" : getField(e).toString())
                ).collect(Collectors.joining("|"));

        return format("Position [View=%s, Type= %s] { %s } { %s }",
                getPositionView().toString(), getPositionType().toString(), measures, fields);
    }


    @Override
    public UUID getID() {
        throw new UnsupportedOperationException("Not supported for positions");
    }

    @Override
    public ZonedDateTime getValidFrom() {
        throw new UnsupportedOperationException("Not supported for positions");
    }

    @Override
    public ZonedDateTime getValidTo() {
        throw new UnsupportedOperationException("Not supported for positions");
    }

    @Override
    public ZonedDateTime getAsOf() {
        return this.asOf;
    }
}
