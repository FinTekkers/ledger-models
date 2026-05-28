package common.models.portfolio;

import common.models.IFinancialModelObject;
import common.models.RawDataModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/***
 * A transaction represents an operation that changes the position of a portfolio. The most obvious of which
 * is buy or sell transaction from the order management system, but this could also represent a transfer of a security
 * or a post-trade activity such as a dividend payment, stock split, and so on.
 *
 */
public class Portfolio extends RawDataModelObject implements Comparable, IFinancialModelObject {
    private final String portfolioName;

    public Portfolio(UUID id, String portfolioName,
                       ZonedDateTime asOf) {
        super(id, asOf);
        this.portfolioName = portfolioName;
    }

    @Override
    public String toString() {
        return String.format("ID[%s], Portfolio[%s]",
                getID().toString(), getPortfolioName());
    }

    @Override
    public boolean equals(Object obj) {
        if(obj instanceof Portfolio) {
            return ((Portfolio)obj).getID().equals(getID());
        } else {
            return false;
        }
    }

    /**
     * Java contract: when equals() is overridden, hashCode() must produce
     * identical values for objects that compare equal. equals() above keys
     * off getID(); hashCode() does the same. Without this override,
     * {@link Object#hashCode} returns identity hashes — so two Portfolio
     * instances built from the same UUID land in different HashMap buckets
     * and silently fail to dedupe in collectors / sets.
     *
     * Surfaced post-#340 because {@link common.models.transaction.Transaction#getPortfolio}
     * now deserializes a fresh Portfolio wrapper on every call. Pre-#340 the
     * wrapper was a stored POJO reference (identity hash matched without an
     * override), masking this bug.
     */
    @Override
    public int hashCode() {
        return getID().hashCode();
    }

    public String getPortfolioName() {
        return portfolioName;
    }

    @Override
    public int compareTo( Object o) {
        if(o instanceof Portfolio) {
            return getID().compareTo(((Portfolio)o).getID());
        }

        return -1;
    }

    @Override
    public Object getField(Field field) {
        return switch (field) {
            case ID, PORTFOLIO_ID -> getID();
            case AS_OF -> getAsOf();
            case PORTFOLIO_NAME -> getPortfolioName();
            default -> throw new RuntimeException(String.format("Field not found %s", field));
        };
    }

    @Override
    public BigDecimal getMeasure(Measure measure) {throw new UnsupportedOperationException();
    }

    @Override
    public Set<Measure> getMeasures() {throw new UnsupportedOperationException();
    }

    @Override
    public Set<Field> getFields() {
        return new HashSet<>(Arrays.asList(Field.PORTFOLIO_ID, Field.PORTFOLIO_NAME));
    }
}