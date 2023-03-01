package common.models.taxLot;

import common.models.IFinancialModelObject;
import common.models.RawDataModelObject;
import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.PositionFilter;
import common.models.price.Price;
import common.models.security.Security;
import common.models.strategy.StrategyAllocation;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;
import fintekkers.models.position.PositionStatusProto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

import static common.models.postion.Field.*;

/***
 * Tax lots result from transactions. We store Tax Lots as delta-based records, so in order to understand the
 * current state of a tax lot you need to aggregate across all the records that relate to a single UUID.
 *
 * This differs from transactions where the latest record represents the latest state. An example, of how Tax Lot
 * records are created.
 *
 * 1/ BUY of 100 shares of FB @ $300 initiates an open tax (ID=1) lot of 100 / $300. The cost basis per share is $300.
 *      The time is 9am.
 * 2/ SELL of 10 shares of FB @ #350 reduces the tax lot to 290, but not by editing the original record. The time is 10am
 *      There is now a second record, also with ID=1, with an amount of -10.
 *
 * At this point there are two records with the same ID. The timestamps as like this:
 *      TaxLot=1; Record=1; Amount=100, Price=300; Valid from=9am; Valid to= NULL; AsOf=9am
 *      TaxLot=1; Record=2; Amount=-10, Price=350; Valid from=10am; Valid to= NULL; AsOf=10am
 *
 * To know the current status you read the AsOf at 10am and validFrom >= 10am.
 *
 * In the case that there was an edit to the original transaction, e.g. the price was $330, not $300, then you get
 * the resulting records. The edit is made at 11am.
 *
 * At this point there are two records with the same ID. The timestamps as like this:
 *      TaxLot=1; Record=1; Amount=100, Price=300; Valid from=9am; Valid to=10:59.9999am; AsOf=9am
 *      TaxLot=1; Record=2; Amount=-10, Price=350; Valid from=10am; Valid to= NULL; AsOf=10am
 *      TaxLot=1; Record=1; Amount=100, Price=330; Valid from=11am; Valid to= NULL; AsOf=9am
 *
 * Now, when you read the records you read with asOf = 11am and validFrom >= 11am.
 */
public class TaxLotDelta extends RawDataModelObject implements IFinancialModelObject {
    public LocalDate getOpenDate() {
        return openDate;
    }

    public LocalDate getClosedDate() {
        return closedDate;
    }

    public void setClosedDate(LocalDate closedDate) {
        this.closedDate = closedDate;
    }

    public TaxLotStatus getTaxLotStatus() {
        return taxLotStatus;
    }

    public void setTaxLotStatus(TaxLotStatus taxLotStatus) {
        this.taxLotStatus = taxLotStatus;
    }

    public Portfolio getPortfolio() {
        return portfolio;
    }

    public void setPortfolio(Portfolio portfolio) {
        this.portfolio = portfolio;
    }

    public Boolean isInvalidated() {
        return isInvalidated;
    }

    public Object getField(Field field) {
        return switch (field) {
            case ID -> getID();
            case TAX_LOT_OPEN_DATE -> getOpenDate();
            case TAX_LOT_CLOSE_DATE -> getClosedDate();
            case PRICE -> getPrice();
            case IS_CANCELLED -> isInvalidated();
            case STRATEGY -> getStrategyAllocation();
            case POSITION_STATUS -> getPositionStatus();
            //Security fields
            case SECURITY -> getSecurity();
            case PRODUCT_TYPE -> getSecurity().getProductType().name();
            case IDENTIFIER -> getSecurity().getSecurityId();
            case ASSET_CLASS -> getSecurity().getAssetClass();
            case PRODUCT_CLASS -> getSecurity().getField(PRODUCT_CLASS);
            case SECURITY_DESCRIPTION -> getSecurity().getDisplayDescription();
            case SECURITY_ID -> getSecurity().getID();
            case TENOR -> getSecurity().getField(TENOR);
            //Portfolio fields
            case PORTFOLIO -> getPortfolio();
            case PORTFOLIO_ID -> getPortfolio().getID();
            case PORTFOLIO_NAME -> getPortfolio().getPortfolioName();
            default -> throw new RuntimeException(String.format("Field not found %s", field));
        };
    }


    public Set<Field> getFields() {
        return new HashSet<>(Arrays.asList(ID, TAX_LOT_OPEN_DATE, TAX_LOT_CLOSE_DATE, IS_CANCELLED,
                PORTFOLIO, SECURITY, POSITION_STATUS));
    }

    public Set<Measure> getMeasures() {
        return new HashSet<>(Collections.singletonList(Measure.DIRECTED_QUANTITY));
    }

    public BigDecimal getMeasure(Measure measure) {
        if (Measure.DIRECTED_QUANTITY.equals(measure)) {
            return getQuantity();
        }else if (Measure.UNADJUSTED_COST_BASIS.equals(measure)) {
            return getPrice().getPrice();
        }
        throw new RuntimeException("Not supported");
    }

    public PositionStatusProto getPositionStatus() {
        return positionStatus;
    }

    public BigDecimal getDirectedQuantity() {
        return getQuantity(); // Get quantity is already defined directionally
    }

    public enum TaxLotStatus {
        Open, Closed
    }

    public TaxLotDelta(Transaction txn) {
        this(UUID.randomUUID(), txn.getPortfolio(), TaxLotDelta.TaxLotStatus.Open,
                txn.getPrice(), txn.getTradeDate(), null, txn.getQuantity(), txn.getSecurity(),
                txn.getAsOf(), new TaxLotSource(txn), txn.getPositionStatus());

        if(!TransactionType.BUY.equals(txn.getTransactionType())) {
            throw new RuntimeException("You should only use this for buy transactions. Use createTaxLotDelta" +
                    " method for sales");
        }
    }

    public TaxLotDelta(UUID id, Portfolio portfolio, TaxLotStatus taxLotStatus, Price price,
                       LocalDate openDate, LocalDate closedDate,
                       BigDecimal quantity, Security security, ZonedDateTime asOf,
                       TaxLotSource source, PositionStatusProto positionStatus) {
        super(id, asOf);
        this.portfolio = portfolio;
        this.taxLotStatus = taxLotStatus;
        this.price = price;
        this.openDate = openDate;
        this.closedDate = closedDate;
        this.quantity = quantity;
        this.security = security;
        this.source = source;
        this.positionStatus = positionStatus;
    }

    private Portfolio portfolio;
    private TaxLotStatus taxLotStatus;
    private Price price;
    private final LocalDate openDate;
    private BigDecimal quantity;
    private Security security;

    private final TaxLotSource source;
    private PositionStatusProto positionStatus;
    private LocalDate closedDate;
    private Boolean isInvalidated = Boolean.FALSE;

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    /**
     * This is the unadjusted cost basis. For amortizing securities it will be the cost basis at initiation.
     **/
    public Price getPrice() {
        return price;
    }

    public void setPrice(Price price) {
        this.price = price;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    /**
     * Gets the strategy allocation for this tax lot from the originating transaction. If the tax lot does not have
     * a source event or that source has no strategy allocation attached, then null is returned.
     * @return the strategy allocation
     */
    public StrategyAllocation getStrategyAllocation() {
        return getSource() != null ?
                getSource().getTxn() != null ? getSource().getTxn().getStrategyAllocation()
                : null : null;
    }


    @Override
    public String toString() {
        String validTo = getValidTo() != null ? getValidTo().toString() : "NULL";
        return String.format(
                "OpenDate[%s], CloseDate[%s], TaxLotStatus[%s], Price[%s], Quantity[%s]"+
                "Portfolio[%s], Security[%s], " +
                "TaxLot[%s], AsOf[%s]," +
                "ValidFrom[%s], ValidTo[%s]",
            getOpenDate().toString(),
                getClosedDate() == null ? "" : getClosedDate().toString(),
                getTaxLotStatus(), getPrice(), getQuantity(),
            getPortfolio().getPortfolioName(), getSecurity().getIssuer(),
            getID().toString(), getAsOf().toString(),
            getValidFrom().toString(), validTo);
    }

    public TaxLotSource getSource() {
        return source;
    }

    public static TaxLotDelta createDelta(TaxLotDelta oldVersion, BigDecimal quantityChange, Transaction txn) {
//        ZonedDateTime now = ZonedDateTime.now();

        return new TaxLotDelta(oldVersion.getID(), oldVersion.getPortfolio(),
                oldVersion.getTaxLotStatus(), oldVersion.getPrice(),
                oldVersion.getOpenDate(), oldVersion.getClosedDate(),
                quantityChange, oldVersion.getSecurity(),
                txn.getAsOf(), new TaxLotSource(txn), txn.getPositionStatus());
    }

    public static void invalidate(TaxLotDelta oldVersion) {
        oldVersion.setValidTo(ZonedDateTime.now());
        oldVersion.isInvalidated = Boolean.TRUE;
    }

    public boolean isMatch(PositionFilter filter) {
        //TODO: SHould all asOf matching happen here?
        for(Field field : filter.getFilters().keySet()) {
            Object o = filter.getFilters().get(field).getValue();
            if(!o.equals(getField(field)))
                return false;
        }

        return true;
    }
}