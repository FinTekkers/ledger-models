package common.models.transaction;

import common.models.RawDataModelObject;
import common.models.errors.transaction.TransactionProcessingException;
import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.PositionFilter;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.Security;
import common.models.strategy.StrategyAllocation;
import common.models.util.persistence.IForeignKey;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.security.SecurityTypeProto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static common.models.postion.Field.PRODUCT_CLASS;
import static common.models.postion.Field.SECURITY_ISSUER_NAME;

/***
 * A transaction represents an operation that changes the position of a portfolio. The most obvious of which
 * is buy or sell transaction from the order management system, but this could also represent a transfer of a security
 * or a post-trade activity such as a dividend payment, stock split, and so on.
 *
 */
public class Transaction extends RawDataModelObject implements ITransaction {
    /**
     * 'Short-hand' constructor. Will generate derived transactions such as cash impacts, and maturity
     * transactions for bonds.
     *
     * @param id the UUID for this transaction
     * @param portfolio the fully formed portfolio object
     * @param price the fully formed price object
     * @param tradeDate the trade date
     * @param settlementDate the settlement date
     * @param quantity the non-directed quantity
     * @param security the fully formed security object
     * @param transactionType the transaction type
     * @param strategy strategy allocation if there is one
     * @param asOf the zoned asof date
     */
    public Transaction(UUID id, Portfolio portfolio, Price price, LocalDate tradeDate, LocalDate settlementDate,
                       BigDecimal quantity, Security security, TransactionType transactionType, StrategyAllocation strategy,
                       ZonedDateTime asOf) {
        this(id, portfolio, price, tradeDate, settlementDate, quantity, security,
                transactionType, strategy, asOf, null, null, null);

        addCashImpact(this);
        addDerivedTransactions(this);
    }

    /**
     * 'Long-form' constructor. Will NOT generate dependent transactions.
     */
    public Transaction(UUID id, Portfolio portfolioId, Price price, LocalDate tradeDate, LocalDate settlementDate,
                       BigDecimal quantity, Security security, TransactionType transactionType, StrategyAllocation strategy,
                       ZonedDateTime asOf, Transaction parentTransaction, String tradeName, PositionStatusProto status) {
        super(id, asOf);

        if (quantity.doubleValue() <= 0) {
            throw new TransactionProcessingException("Quantity should be expressed in absolute numbers. Doesn't support " +
                    "zero quantity transactions");
        }

        if(security instanceof BondSecurity &&
                quantity.doubleValue() < ((BondSecurity)security).getFaceValue().doubleValue()) {
            throw new TransactionProcessingException("Quantity must be expressed in face value. The quantity provided " +
                    "is below face value so you likely need to scale up the quantity. If this is a fraction " +
                    "of a bond unit, then that is not currently supported (should be a small chance)");
        }

        this.price = price;
        this.tradeDate = tradeDate;
        this.settlementDate = settlementDate;
        this.quantity = quantity;
        this.security = security;
        this.transactionType = transactionType;
        this.portfolio = portfolioId;
        this.parentTransaction = parentTransaction;

        this.strategy = Objects.requireNonNullElseGet(strategy, () -> new StrategyAllocation(UUID.randomUUID(), ZonedDateTime.now()));
        this.isCancelled = Boolean.FALSE;
        this.tradeName = tradeName == null ? "" : tradeName;
        this.status = Objects.requireNonNullElse(status, PositionStatusProto.HYPOTHETICAL); //Default to hypothetical
    }

    @IForeignKey
    private final Portfolio portfolio;

    @IForeignKey
    private Security security;
    private final StrategyAllocation strategy;
    private final String tradeName;
    private PositionStatusProto status;
    private Boolean isCancelled;

    private TransactionType transactionType;
    private LocalDate tradeDate;
    private LocalDate settlementDate;

    private Price price;
    private BigDecimal quantity;
    private Transaction parentTransaction;
    private final List<Transaction> childrenTransactions = new ArrayList<>();

    @Override
    public String toString() {
        try {
            String validTo = getValidTo() != null ? getValidTo().toString() : "NULL";
            return String.format("%sTXN[%s], " +
                            "TradeDate[%s], TxnType[%s], Price[%s], Quantity[%s]," +
                            "AsOf[%s], Portfolio[%s], Issuer[%s], ValidFrom[%s], ValidTo[%s], " +
                            " Strategy[%s]",
                    isCancelled() ? "INVALIDATED: " : "",
                    getID().toString(),
                    getTradeDate().toString(),
                    getTransactionType(),
                    getPrice(),
                    getQuantity(),
                    getAsOf().toString(),
                    getPortfolio().getPortfolioName(), getSecurity().getIssuer(),
                    getValidFrom().toString(), validTo,
                    getStrategyAllocation().toString());
        } catch (NullPointerException e) {
            e.printStackTrace();
            return "WHOOPS";
        }
    }

    //Field accessors
    @Override
    public Portfolio getPortfolio() {
        return portfolio;
    }

    @Override
    public Security getSecurity() {
        return security;
    }

    @Override
    public StrategyAllocation getStrategyAllocation() { return strategy; }

    @Override
    public Price getPrice() {
        return price;
    }

    @Override
    public LocalDate getSettlementDate() {
        return settlementDate;
    }

    /***
     * @return unsigned quantity.
     */
    @Override
    public BigDecimal getQuantity() {
        return quantity;
    }

    @Override
    public BigDecimal getDirectedQuantity() {
        return quantity.multiply(transactionType.getDirectionMultiplier());
    }

    @Override
    public LocalDate getTradeDate() {
        return tradeDate;
    }

    @Override
    public TransactionType getTransactionType() {
        return transactionType;
    }

    @Override
    public Boolean isCancelled() {
        return isCancelled;
    }

    public void setCancelled(Boolean cancelled) {
        isCancelled = cancelled;
        //This transaction will no longer be valid so need to set a validTo
        if(cancelled)
            setValidTo(ZonedDateTime.now());
        else
            setValidTo(null);
    }

    @Override
    public String getTradeName() {
        return tradeName;
    }

    @Override
    public PositionStatusProto getPositionStatus() {
        return status;
    }

    public void setPositionStatus(PositionStatusProto status) {
        this.status = status;
    }

    /***
     * Plumbing for positions
     */
    @Override
    public Object getField(Field field) {
        return switch (field) {
            //Transaction Fields
            case ID -> getID();
            case AS_OF -> getAsOf();
            case TRANSACTION_TYPE -> getTransactionType();
            case TRADE_DATE -> getTradeDate();
            case SETTLEMENT_DATE -> getSettlementDate();
            case POSITION_STATUS -> getPositionStatus();
            case PRICE -> getPrice();
            case IS_CANCELLED -> isCancelled();
            //Security Fields
            case SECURITY -> getSecurity();
            case SECURITY_ISSUER_NAME -> getSecurity().getField(SECURITY_ISSUER_NAME);
            case PRODUCT_TYPE -> getSecurity().getProductType().name();
            case IDENTIFIER -> getSecurity().getSecurityId();
            case ASSET_CLASS -> getSecurity().getAssetClass();
            case PRODUCT_CLASS -> getSecurity().getField(PRODUCT_CLASS);
            case SECURITY_DESCRIPTION -> getSecurity().getDisplayDescription();
            case SECURITY_ID -> getSecurity().getID();
            case TENOR -> getSecurity().getField(Field.TENOR);
            case ADJUSTED_TENOR -> getSecurity().getField(Field.ADJUSTED_TENOR);
            case MATURITY_DATE -> getSecurity().getField(Field.MATURITY_DATE);
            //Portfolio Fields
            case PORTFOLIO -> getPortfolio();
            case PORTFOLIO_ID -> getPortfolio().getID();
            case PORTFOLIO_NAME -> getPortfolio().getPortfolioName();
            default -> throw new RuntimeException(String.format("Field not found: %s", field));
        };
    }

    @Override
    public Set<Field> getFields() {
        return new HashSet<>(Arrays.asList(Field.ID, Field.PORTFOLIO, Field.SECURITY, Field.TRADE_DATE,
                Field.SETTLEMENT_DATE, Field.POSITION_STATUS, Field.IS_CANCELLED));
    }
    @Override
    public Set<Measure> getMeasures() {
        return new HashSet<>(Collections.singletonList(Measure.DIRECTED_QUANTITY));
    }

    @Override
    public BigDecimal getMeasure(Measure measure) {
        switch(measure) {
            case DIRECTED_QUANTITY:
                return getDirectedQuantity();
            case MARKET_VALUE:
            case ADJUSTED_COST_BASIS:
            case UNADJUSTED_COST_BASIS:
            default:
                throw new RuntimeException("Measure is not supported: "+ measure);
        }
    }

    @Override
    public boolean isMatch(PositionFilter filter) {
        boolean isMatch = true;

        for(Map.Entry<Field, PositionFilter.PositionComparator> entry : filter.getFilters().entrySet()) {
            Field field = entry.getKey();
            PositionFilter.PositionComparator comparator = entry.getValue();

            Object comparatorValue = comparator.getValue();
            PositionFilter.Operator operator = comparator.getOperator();

            int compareResult = ((Comparable)getField(field)).compareTo(comparatorValue);

            if(operator.equals(PositionFilter.Operator.EQUALS))
                isMatch = isMatch && compareResult == 0;
            else if(operator.equals(PositionFilter.Operator.LESS_THAN_OR_EQUALS))
                isMatch = isMatch && compareResult <= 0;
            else if(operator.equals(PositionFilter.Operator.LESS_THAN))
                isMatch = isMatch && compareResult < 0;
            else if(operator.equals(PositionFilter.Operator.MORE_THAN_OR_EQUALS))
                isMatch = isMatch && compareResult >= 0;
            else if(operator.equals(PositionFilter.Operator.MORE_THAN))
                isMatch = isMatch && compareResult > 0;
            else if(operator.equals(PositionFilter.Operator.NOT_EQUALS))
                isMatch = isMatch && compareResult != 0;
            else {
                throw new RuntimeException(String.format("Operator not supported in filters: %s", operator.name()));
            }
        }

        return isMatch;
    }

    public void setParentTransaction(Transaction parentTransaction) {
        this.parentTransaction = parentTransaction;
    }

    @Override
    public Transaction getParentTransaction() {
        return parentTransaction;
    }

    @Override
    public Transaction getCashTransaction() {
        List<Transaction> cashTransactions =
                getChildTransactions().stream().filter(t -> t.getSecurity().isCash()).toList();

        if(cashTransactions.size() == 1)
            return cashTransactions.get(0);
        else if(cashTransactions.size() > 1)
            throw new RuntimeException("There are two cash transactions with the same parent. That " +
                    "indicates an error in processing.");
        else
            return null;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    private void setSecurity(Security security) {
        this.security = security;
    }

    private void setPrice(Price price) {
        this.price = price;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    /**
     * Tests equivalency of two transactions based on as of and ID. Note, there are additional timestamps for system
     * timestamps. The current thinking is those timestamps shouldn't be propagated up to this level as this check is
     * for business equivalency. Theoretically, 2 objects with the same 'as of' timestamp could exist with different
     * timestaps. The guidance in this case would be to create objects with different as ofs, so that business users can
     * see the change without needing to understand the system timstamps.
     *
     * E.g. if you're implementing an end of day concept. You may select a 'special' timestamp. My suggestion would be
     * to have an end of day timestamp like 23:59:00.000, rather than 23:59:59.999. This way if you reclose the end of
     * day you could use 23:59:01.000 as a re-close. Then when listing objects to the user, it would make more sense
     * to them than, seeing 2 records with the same as of time, but have to understand and inspect the validFrom/validTo
     *
     *
     * @param other transaction
     * @return True if the ID and as of is the same
     */
    @Override
    public boolean equals(Object other) {
        if(!(other instanceof Transaction otherTransaction)) {
            return false;
        }

        return getID().equals(otherTransaction.getID()) && getAsOf().equals(otherTransaction.getAsOf());
    }

    public void addChildTransaction(Transaction maturation) {
        this.childrenTransactions.add(maturation);
    }

    /**
     * Gets the first level of child transactions. For a bond this would be the cash impact and the maturation
     * transaction, though the cash impact of the maturation would be nested too deep to be returned.
     *
     * @return first level of child transactions
     */
    public List<Transaction> getChildTransactions() {
        return this.childrenTransactions;
    }

    /**
     * Traverses the tree to get all transactions in a flat list
     * @return all transactions beneath this one, regardless of depth of the tree
     */
    public List<Transaction> getChildTransactionsRecursively() {
        List<Transaction> transactions = new ArrayList<>();
//        transactions.add(this);

        if(this.childrenTransactions.size() > 0) {
            for(Transaction childTransaction : this.childrenTransactions) {
                transactions.add(childTransaction);
                transactions.addAll(childTransaction.getChildTransactionsRecursively());
            }
        }

        return transactions;
    }

    public void setTradeDate(LocalDate tradeDate) {
        this.tradeDate = tradeDate;
    }

    public void setSettlementDate(LocalDate settlementDate) {
        this.settlementDate = settlementDate;
    }

    /* EVERYTHING BELOW HERE IS BUSINESS LOGIC; IT SHOULD BE MOVED TO A HIGHER LEVEL FUNCTION AT SOME POINT */

    /**
     * Copies all metadata for a transaction (timestamps, allocations, etc), but sets the security to the
     * given cash security (which will be validated). The price will be 1.
     *
     * @param cashSecurity The security that represents cash for this transaction
     * @param parentTransaction The transaction causing the cash effect
     * @return A transaction representing the impact to cash
     */
    private static Transaction createCashTransaction(CashSecurity cashSecurity, Transaction parentTransaction) {
        TransactionType transactionType = null;
        switch(parentTransaction.getTransactionType()) {
            case BUY:
            case MATURATION_OFFSET:
                transactionType = TransactionType.WITHDRAWAL;
                break;
            case SELL:
            case MATURATION:
                transactionType = TransactionType.DEPOSIT;
                break;
            default:
                throw new RuntimeException("SHOULDN'T GET HERE");
        }

        BigDecimal bookAmount = null;

        switch(parentTransaction.getSecurity().getSecurityType()) {
            case BOND_SECURITY:
                if(TransactionType.MATURATION.equals(parentTransaction.getTransactionType())
                    || TransactionType.MATURATION_OFFSET.equals(parentTransaction.getTransactionType())) {
                    bookAmount = parentTransaction.getQuantity();
                } else {
                    //E.g. if you bought 50 bonds with face value of $1000 @ $99.
                    // The face amount is $50k
                    // The book amount is: $49.5k  (i.e. 50 * (99 * scaled price))
                    BigDecimal priceScaleFactor = ((BondSecurity) parentTransaction.getSecurity()).getPriceScaleFactor();
                    BigDecimal faceValue = ((BondSecurity) parentTransaction.getSecurity()).getFaceValue();
                    BigDecimal scaledPrice = parentTransaction.getPrice().getPrice().multiply(priceScaleFactor);
                    BigDecimal numberBondUnits = parentTransaction.getQuantity().divide(faceValue);

                    bookAmount = numberBondUnits.multiply(scaledPrice);
                }
                break;
            default:
                bookAmount = parentTransaction.getQuantity().multiply(parentTransaction.getPrice().getPrice());
        }

        Transaction cashTransaction = new Transaction(
                UUID.randomUUID(), parentTransaction.getPortfolio(),
                Price.getCashPrice(),
                parentTransaction.getTradeDate(),
                parentTransaction.getSettlementDate(),
                bookAmount,
                cashSecurity,
                transactionType,
                null,
                parentTransaction.getAsOf(),
                parentTransaction,
                parentTransaction.getTradeName(),
                parentTransaction.getPositionStatus());
        cashTransaction.setPositionStatus(parentTransaction.getPositionStatus());

        //Cash transactions will have the originating transaction ID associated with it.
        parentTransaction.addChildTransaction(cashTransaction);

        return  cashTransaction;
    }

    /**
     * Generates additional transactions associated with this transaction. For instance a Buy transaction on
     * a bond will also create the maturation transaction.
     *
     * @param transaction The parent transaction
     */
    public static void addDerivedTransactions(Transaction transaction) {
        //TODO: Best to co-locate this with the transaction instantiator where we calculate the cash impacts, right?!
        boolean isBond = SecurityTypeProto.BOND_SECURITY.equals(transaction.getSecurity().getSecurityType())
                || SecurityTypeProto.FRN.equals(transaction.getSecurity().getSecurityType())
                || SecurityTypeProto.TIPS.equals(transaction.getSecurity().getSecurityType());
        boolean isABuyTransaction = TransactionType.BUY.equals(transaction.getTransactionType());
        boolean isASellTransaction = TransactionType.SELL.equals(transaction.getTransactionType());
        boolean isaMaturationTransaction = !TransactionType.MATURATION.equals(transaction.getTransactionType())
                && !TransactionType.MATURATION_OFFSET.equals(transaction.getTransactionType());


        if(isBond && isASellTransaction && isaMaturationTransaction) {
            addMaturationTransaction(transaction, TransactionType.MATURATION_OFFSET);
        }

        if(isBond && isABuyTransaction && isaMaturationTransaction) {
            addMaturationTransaction(transaction, TransactionType.MATURATION);
            /*
            Example:

            (A) Parent transaction BUY bond. Child transaction MATURE bond
            (B) Parent transaction links to the children (and vice - versa)
            (C) All transactions indexed in the in-memory layer, so are searchable
            (D) We create tax lot modifiers at that point in time

            TODO: We need to create multi-level tax lots, i.e. the ability to have a form of tax lot that are proposed
            but not concrete. For example, if there is a SELL transaction then the mature transaction needs to be down
            sized.

            Buy 100 bond ($100), face value $10k, mature 2032.
                Mature bond of -100, 'trade date' of 2032

            Sell 20 bond ($100), face value -$2k, mature 2032
                Mature bond of -80, trade-date of 2032 needs to be created

            Do that via modifiers? I.e. there will be a mature of -100, and a mature of 20. Makese, sense right?

            When un-doing a transaction, we'll need to traverse the parent/child transactions and remove the associated
            tax lots.

             */
        }
    }

    private static void addMaturationTransaction(Transaction transaction, TransactionType transactionType) {
        BondSecurity bondSecurity = (BondSecurity) transaction.getSecurity();

        Transaction maturation = new Transaction(
                UUID.randomUUID(), transaction.getPortfolio(), transaction.getPrice(),
                bondSecurity.getMaturityDate(),
                bondSecurity.getMaturityDate().plusDays(2),
                transaction.getQuantity(), transaction.getSecurity(),
                transactionType, transaction.getStrategyAllocation(),
                transaction.getAsOf(),
//                bondSecurity.getMaturityDate().atStartOfDay(ZonedDateTime.now().getZone()),
                transaction, transaction.getTradeName(), transaction.getPositionStatus()
        );

        transaction.addChildTransaction(maturation);

        addCashImpact(maturation);
    }

    public static void addCashImpact(Transaction transaction) {
        if(transaction.getCashTransaction() != null){
            throw new RuntimeException("This transaction already has a cash impact");
        }

        //Probably need to create a higher level transaction concept?
        if(!transaction.getSecurity().isCash()) {
            Transaction cashTxn = Transaction.createCashTransaction(CashSecurity.USD, transaction);
//            assert transaction.getCashTransaction().equals(cashTxn);
            assert cashTxn.getParentTransaction().equals(transaction);
        }
    }
}