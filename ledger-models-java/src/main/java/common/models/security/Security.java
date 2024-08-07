package common.models.security;

import common.models.IFinancialModelObject;
import common.models.RawDataModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.security.identifier.Identifier;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityTypeProto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

/***
 * Generally shouldn't be used except for tests, or absolute emergencies.
 */
public class Security extends RawDataModelObject implements Comparable, IFinancialModelObject {
    private final String issuer;
    private final CashSecurity settlementCurrency;
    protected Identifier identifier;

    private String description;

    private SecurityProto _sourceProto;

    public Security(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, asOf);
        this.issuer = issuer;
        this.settlementCurrency = settlementCurrency;
    }

    /**
     * Experimental. DO NOT USE.
     *
     * @return the security proto
     * */
    public SecurityProto getSecurityProto() {
        return this._sourceProto;
    }

    /**
     * Experimental. DO NOT USE. Rather than serializing/deserializing protos, we're going to
     * migrate the security to store the proto. This will be more extensible as it
     * means you can add fields to the security object without any code changes
     * to this codebase. However it may mean we create more Java-specific objects
     * like ZonedDateTime etc if we do it on-demand without caching.
     *
     * This should be called only when initializing the security object.
     *
     * @param proto
     */
    public void setSecurityProto(SecurityProto proto) {
        this._sourceProto = proto;
    }

    public CashSecurity getSettlementCurrency() {
        return settlementCurrency;
    }

    public boolean isCash() {
        return false;
    }

    public String getIssuer() {
        return this.issuer;
    }

    /**
     * Returns a high-level asset class for a security, such as 'Equity', 'FixedIncome', etc.
     *
     * @return Returns unclassified for basic securities, and a suitable value for other security values.
     */
    public String getAssetClass() {
        return "Unclassified";
    }

    public QuantityType getQuantityType() {
        return QuantityType.UNITS;
    }

    public Identifier getSecurityId() {
        return identifier;
    }

    public void setSecurityId(Identifier identifier) {
        this.identifier = identifier;
    }

    /***
     * Plumbing for positions
     */
    public Object getField(Field field) {
        return switch (field) {
            case SECURITY -> this;
            case ID, SECURITY_ID -> getID();
            case SECURITY_ISSUER_NAME -> getIssuer();
            case AS_OF, EFFECTIVE_DATE -> getAsOf();
            case ASSET_CLASS -> getAssetClass();
            case PRODUCT_CLASS -> getProductClass();
            case PRODUCT_TYPE -> getProductType();
            case IDENTIFIER -> getSecurityId();
            case TENOR, ADJUSTED_TENOR -> Tenor.UNKNOWN_TENOR;
            case SECURITY_DESCRIPTION -> getDescription();
            case MATURITY_DATE -> LocalDate.of(2999, 12, 31);
            case ISSUE_DATE -> this instanceof BondSecurity ? ((BondSecurity)this).getIssueDate() : LocalDate.of(1900, 1, 1);
            case CASH_IMPACT_SECURITY -> getSettlementCurrency();

            default -> throw new RuntimeException(String.format("Field not found %s", field));
        };
    }

    @Override
    public BigDecimal getMeasure(Measure measure) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Set<Measure> getMeasures() {
        throw new UnsupportedOperationException();
    }

    /**
     * The type of security as modeled in code layers. Examples: BondSecurity, EquitySecurity, etc.
     * @return String representation of the class, generally matches the class name in Java.
     */
    private String getProductClass() {
        return getClass().getSimpleName();
    }

    /**
     * The type of security that is suitable for user display. This will be a lower level of
     * <p>
     * BLAH. Maybe need to code in a product hierarchy now? TODO TODO TODO
     * <p>
     * 1/ Create a product type enum with opinionated values
     * 2/ Create a generic value to let people override
     * <p>
     * Needs an overridable concept. (a) How would that work; (b) What would the performance penalty be?
     *
     * @return TODO NEED TO DO THIS
     */
    public ProductType getProductType() {
        return ProductType.UNCLASSIFIED;
    }

    public Set<Field> getFields() {
        return new HashSet<>(Arrays.asList(Field.ID, Field.ASSET_CLASS, Field.PRODUCT_CLASS));
    }

    @Override
    public String toString() {
        return String.format("ID[%s], %s[%s]", getID().toString(), getClass().getSimpleName(), getIssuer());
    }

    @Override
    public boolean equals(Object obj) {
        if(obj instanceof Security) {
            return Objects.equals(((Security) obj).getID(), getID());
        } else {
            return false;
        }
    }

    @Override
    public int compareTo(Object obj) {
        if(obj instanceof Security) {
            return getID().compareTo(((Security)obj).getID());
        }

        return -1;
    }

    @Override
    public int hashCode() {
        return getID().hashCode();
    }

    public SecurityTypeProto getSecurityType() {
        throw new RuntimeException("Not supported. Need to code this in");
    }

    /**
     * @return If an explicit description is set then it is return, otherwise a generic description is returned.
     * The description is subject to change and should NEVER be parsed. The goal is for this to be human-readable.
     */
    public String getDisplayDescription() {
        return description != null ? description :
                identifier != null ? identifier.toString() :
                toString();
    }

    /**
     * @return the explicitly set description if set
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description Human-readable description
     */
    public void setDescription(String description) {
        this.description = description;
    }
}
