package common.models.transaction;

import fintekkers.models.util.ObjectTypeProto;
import common.util.ObjectTypes;
import common.models.RawDataModelObject;
import common.models.errors.InvalidFieldException;
import common.models.errors.ModelValidationException;
import common.models.errors.transaction.InvalidChildTransactionException;
import common.models.errors.transaction.TransactionProcessingException;
import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.PositionFilter;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.ProductHierarchy;
import common.models.security.Security;
import common.models.security.SecurityRules;
import common.models.strategy.StrategyAllocation;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.strategy.StrategyAllocationProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static common.models.postion.Field.*;

/***
 * A transaction represents an operation that changes the position of a portfolio.
 *
 * <p>LM-444: a plain object again, as before #340. Fields and the list of child
 * transactions are held directly; {@link TransactionSerializer} builds a fresh
 * {@link TransactionProto} from them on every {@link #getProto()} call and never
 * edits anything shared, so two threads serialising the same transaction cannot
 * corrupt each other's output.
 *
 * <p>Nested parts are written the way the #340 wrapper wrote them, so stored and
 * wire bytes are unchanged: the Security and Portfolio become links
 * (strip-on-write) and the trade Price stays inline with only its Security as a
 * link (LM-394). Each nested part keeps the wire form it will be written as,
 * captured once when the field is set, next to the object its getter returns.
 *
 * <p>Links resolve once, when the object is built from a proto: a Security link
 * goes through {@link common.util.LinkCache#SECURITY} and the
 * {@link Security.Fetcher} before its class is chosen, so a Treasury link reads
 * as a {@link BondSecurity} (LM-440). Getters and serialising never fetch.
 *
 * <p>Thread safety: once built, concurrent reads and {@link #getProto()} calls
 * are safe. Setters are plain field writes: a setter racing a reader or a
 * serialise is not safe, as for any plain mutable object.
 */
public class Transaction extends RawDataModelObject implements ITransaction {

    // ---- Fetcher hook (parity with Security.Fetcher + Portfolio.Fetcher) ----

    /**
     * Resolves a link-mode TransactionProto to its full form, once, when a
     * Transaction is built from the link. Default delegates to
     * {@link fintekkers.services.TransactionService}; tests override with a fake.
     */
    @FunctionalInterface
    public interface Fetcher {
        TransactionProto fetch(UUID id, ZonedDateTime asOf);
    }
    private static volatile Fetcher fetcher = defaultGrpcFetcher();
    public static void setFetcher(Fetcher f) { fetcher = f; }
    public static Fetcher getFetcher()       { return fetcher; }

    /**
     * Default fetcher: delegates to {@link fintekkers.services.TransactionService#getByUuid}.
     * Auto-registered as the {@link Fetcher} for typical deployments. Override
     * with {@link #setFetcher(Fetcher)} for tests with canned protos or
     * non-default endpoints.
     */
    static Fetcher defaultGrpcFetcher() {
        return (uuid, asOf) -> fintekkers.services.TransactionService.getInstance().getByUuid(uuid, asOf);
    }

    /** The {@code version} a proto carried, so it is written back unchanged. */
    record WireVersion(int major, int minor, int patch) {}

    // Package-private: TransactionSerializer fills and reads these.

    /** {@code object_type} and {@code version} as received; stamped for objects built in Java. */
    ObjectTypeProto objectType;
    WireVersion version;

    /** True for a link this process could not resolve: only the ID and as_of are known. */
    boolean link;

    /** {@code valid_from} as received; {@code null} when the proto had none. */
    ZonedDateTime validFrom;

    Portfolio portfolio;
    /** The link {@link #getProto()} writes for {@link #portfolio}. */
    PortfolioProto portfolioLink;

    Security security;
    /** The link {@link #getProto()} writes for {@link #security}. */
    SecurityProto securityLink;

    /** {@code null} for a link price LinkCache.PRICE could not resolve at build, or on {@link #priceError}. */
    Price price;
    /** The price {@link #getProto()} writes: inline with a security link, or a link passed through. */
    PriceProto priceProto;

    /**
     * What {@link #getRawProto()} writes, captured when the field is set so
     * serialising never calls the nested objects' own {@code getProto()}:
     * the portfolio and security in full (or the link, if unresolved), and
     * {@link #priceProto} with its security in full.
     */
    PortfolioProto portfolioRaw;
    SecurityProto securityRaw;
    PriceProto priceRaw;

    StrategyAllocation strategyAllocation;
    /** The strategy allocation {@link #getProto()} writes, as it was when set. */
    StrategyAllocationProto strategyAllocationProto;

    TransactionType transactionType;
    BigDecimal quantity;
    LocalDate tradeDate;
    LocalDate settlementDate;
    /** A field that failed to decode at build: its getter raises this error. */
    RuntimeException securityError, portfolioError, priceError, quantityError, tradeDateError, settlementDateError;
    PositionStatusProto positionStatus;
    /**
     * Wire values Java has no form for, written back unchanged: the numbers
     * of an {@code object_type}, {@code transaction_type} or
     * {@code position_status} with no Java constant (e.g. PRINCIPAL_PAYDOWN),
     * 0 otherwise; and a {@code quantity}, {@code trade_date} or
     * {@code settlement_date} that did not decode, {@code null} otherwise.
     * The matching setter clears its own.
     */
    int objectTypeValue, transactionTypeValue, positionStatusValue;
    DecimalValueProto quantityWire;
    LocalDateProto tradeDateWire, settlementDateWire;
    String tradeName = "";
    boolean cancelled;

    /** Parent transaction is NOT in the proto (commented-out tag 21). In-memory only. */
    Transaction parentTransaction;

    /** Child transactions. Serialising only reads this list. */
    final List<Transaction> childrenTransactions = new ArrayList<>();

    // ---- Primary constructor (proto-backed) -----------------------------

    /**
     * Builds the transaction from a proto, children included, resolving
     * Security, Portfolio and Price links once. See
     * {@link TransactionSerializer#deserialize(TransactionProto)}.
     */
    public Transaction(TransactionProto proto) {
        super(extractId(proto), extractAsOf(proto));
        Objects.requireNonNull(proto, "TransactionProto must not be null");
        TransactionSerializer.fill(this, proto);
    }

    /**
     * 'Short-hand' constructor. Will generate derived transactions such as
     * cash impacts, and maturity transactions for bonds.
     *
     * @deprecated Construct a {@link TransactionProto} directly and use
     *             {@link #Transaction(TransactionProto)}. Retained for the
     *             existing business-logic and test paths.
     */
    @Deprecated
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
     *
     * @deprecated Same shape as the short-form ctor.
     */
    @Deprecated
    public Transaction(UUID id, Portfolio portfolio, Price price, LocalDate tradeDate, LocalDate settlementDate,
                       BigDecimal quantity, Security security, TransactionType transactionType, StrategyAllocation strategy,
                       ZonedDateTime asOf, Transaction parentTransaction, String tradeName, PositionStatusProto status) {
        super(id != null ? id : UUID.randomUUID(), requireAsOf(asOf));
        this.objectType = ObjectTypeProto.OBJECT_TYPE_TRANSACTION;
        this.version = TransactionSerializer.wireVersion(ObjectTypes.SCHEMA_VERSION);
        if (portfolio != null) {
            this.portfolio = portfolio;
            this.portfolioRaw = PortfolioSerializer.getInstance().serialize(portfolio);
            this.portfolioLink = TransactionSerializer.linkOf(portfolioRaw);
        }
        if (security != null) {
            this.security = security;
            this.securityRaw = security.getProto();
            this.securityLink = TransactionSerializer.linkOf(securityRaw);
        }
        this.transactionType = transactionType;
        this.quantity = quantity;
        if (price != null) {
            this.price = price;
            PriceProto full = PriceSerializer.getInstance().serialize(price);
            this.priceProto = TransactionSerializer.inlinePrice(full);
            this.priceRaw = TransactionSerializer.rawPrice(priceProto, full.hasSecurity() ? full.getSecurity() : null);
        }
        this.tradeDate = tradeDate;
        this.settlementDate = settlementDate;
        this.positionStatus = Objects.requireNonNullElse(status, PositionStatusProto.HYPOTHETICAL);
        if (strategy == null) {
            strategy = new StrategyAllocation(UUID.randomUUID(), ZonedDateTime.now());
        }
        this.strategyAllocation = strategy;
        this.strategyAllocationProto = strategy.getProto();
        this.tradeName = tradeName != null ? tradeName : "";

        if (quantity.doubleValue() <= 0) {
            throw new TransactionProcessingException("Quantity should be expressed in absolute numbers. Doesn't support " +
                    "zero quantity transactions");
        }

        if(security instanceof BondSecurity) {
            BigDecimal bondFaceValue = ((BondSecurity) security).getFaceValue();
            if (bondFaceValue != null && quantity.doubleValue() < bondFaceValue.doubleValue()) {
                throw new TransactionProcessingException("Quantity must be expressed in face value. The quantity provided " +
                        "is below face value so you likely need to scale up the quantity. If this is a fraction " +
                        "of a bond unit, then that is not currently supported (should be a small chance)");
            }
        }

        this.parentTransaction = parentTransaction;
    }

    // ---- Static factory --------------------------------------------------

    /** Convenience alias for {@link #Transaction(TransactionProto)}. */
    public static Transaction fromProto(TransactionProto proto) {
        return new Transaction(proto);
    }

    // ---- Internal helpers -----------------------------------------------

    private static UUID extractId(TransactionProto proto) {
        if (proto.hasUuid()) {
            // UUID Regression B fix from PR #225: explicit byte-length
            // validation. raw_uuid must be 0 (treat as unset) or 16 bytes;
            // anything else throws IllegalArgumentException.
            int n = proto.getUuid().getRawUuid().size();
            if (n != 0 && n != 16) {
                throw new IllegalArgumentException(
                        "Invalid UUID: expected 16 bytes but got " + n);
            }
            UUID parsed = ProtoSerializationUtil.deserializeUUID(proto.getUuid());
            if (parsed != null) return parsed;
        }
        return UUID.randomUUID();
    }

    /**
     * A non-link transaction must carry as_of (typed error naming
     * {@code transaction.as_of}); a link stub may omit it. Never defaulted.
     */
    private static ZonedDateTime extractAsOf(TransactionProto proto) {
        if (proto.hasAsOf()) {
            return ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf(), "transaction.as_of");
        }
        if (proto.getIsLink()) {
            return null;
        }
        return ProtoSerializationUtil.deserializeRequiredTimestamp(null, "transaction.as_of");
    }

    private static ZonedDateTime requireAsOf(ZonedDateTime asOf) {
        if (asOf == null) ProtoSerializationUtil.deserializeRequiredTimestamp(null, "transaction.as_of");
        return asOf;
    }

    /**
     * Builds a new proto from this transaction's fields, children included:
     * Security and Portfolio as links, the Price inline with its Security as a
     * link. Read-only; safe to call from many threads at once.
     */
    public TransactionProto getProto() {
        return TransactionSerializer.getInstance().serialize(this);
    }

    /**
     * Like {@link #getProto()} but without strip-on-write: nested Security,
     * Portfolio and the Price's Security are written in full (an unresolved
     * link stays a link). For tests and debugging; most consumers should use
     * {@link #getProto()}.
     */
    public TransactionProto getRawProto() {
        return TransactionSerializer.getInstance().serializeRaw(this);
    }

    // ---- toString / equals / hashCode -----------------------------------

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
        } catch (NullPointerException | IllegalStateException | InvalidFieldException e) {
            // is_link-mode Security/Portfolio reads (or a partially-populated
            // transaction): emit a link-style summary so logs are still useful.
            return String.format("Link[Transaction:%s]", getID());
        }
    }

    @Override
    public boolean equals(Object other) {
        if(!(other instanceof Transaction otherTransaction)) {
            return false;
        }
        return getID().equals(otherTransaction.getID()) && getAsOf().equals(otherTransaction.getAsOf());
    }

    // ---- is_link semantics ----

    /**
     * True iff this transaction was built from a link that could not be
     * resolved: only {@link #getID()} and {@link #getAsOf()} are known.
     * Mirrors {@link Security#isLink} / {@link Portfolio#isLink}.
     */
    public boolean isLink() {
        return link;
    }

    /** Business fields are unknown on an unresolved link: say so rather than return nothing. */
    private void requireResolved() {
        if (link) {
            throw new IllegalStateException(
                    "Cannot read fields on link-mode Transaction uuid=" + getID()
                    + " asOf=" + getAsOf() + " — it was not in LinkCache.TRANSACTION and the "
                    + "Transaction.Fetcher returned no record when it was built. "
                    + "Pre-warm via LinkResolver or call Transaction.setFetcher(...) at startup.");
        }
    }

    // ---- Field accessors ------------------------------------------------

    @Override
    public Portfolio getPortfolio() {
        requireResolved();
        if (portfolioError != null) throw portfolioError;
        return portfolio;
    }

    /**
     * The transaction's security, as the class its product type implies. A
     * link was resolved when this transaction was built (LM-440), so a
     * Treasury link reads as a {@link BondSecurity}. If it could not be
     * resolved then, this is the link-mode Security.
     */
    @Override
    public Security getSecurity() {
        requireResolved();
        if (securityError != null) throw securityError;
        return security;
    }

    /** The security's UUID, read from the link so an ID-only read needs nothing resolved. */
    private UUID getSecurityId() {
        requireResolved();
        if (securityLink != null && securityLink.hasUuid()) {
            UUID id = ProtoSerializationUtil.deserializeUUID(securityLink.getUuid());
            if (id != null) return id;
        }
        Security s = getSecurity();
        return s != null ? s.getID() : null;
    }

    @Override
    public StrategyAllocation getStrategyAllocation() {
        requireResolved();
        if (strategyAllocation == null && strategyAllocationProto != null) {
            // Stored without uuid or as_of: raise the same error as before LM-444.
            return new StrategyAllocation(strategyAllocationProto);
        }
        return strategyAllocation;
    }

    @Override
    public Price getPrice() {
        requireResolved();
        if (priceError != null) throw priceError;
        if (price == null && priceProto != null) {
            UUID priceId = priceProto.hasUuid() ? ProtoSerializationUtil.deserializeUUID(priceProto.getUuid()) : null;
            throw new IllegalStateException(
                "Cannot read fields on link-mode Price uuid=" + priceId
                + " — LinkCache.PRICE miss when the transaction was built. "
                + "Pre-warm LinkCache.PRICE (e.g. via price-service write-through) before building it. "
                + "Prices written by Transaction.getProto() stay inline and never take this path.");
        }
        return price;
    }

    @Override
    public LocalDate getSettlementDate() {
        requireResolved();
        if (settlementDateError != null) throw settlementDateError;
        return settlementDate;
    }

    @Override
    public BigDecimal getQuantity() {
        requireResolved();
        if (quantityError != null) throw quantityError;
        return quantity;
    }

    @Override
    public BigDecimal getDirectedQuantity() {
        BigDecimal q = getQuantity();
        if (q == null) return null;
        return q.multiply(getTransactionType().getDirectionMultiplier());
    }

    @Override
    public LocalDate getTradeDate() {
        requireResolved();
        if (tradeDateError != null) throw tradeDateError;
        if (tradeDate == null) throw InvalidFieldException.unset("trade_date");
        return tradeDate;
    }

    @Override
    public TransactionType getTransactionType() {
        requireResolved();
        return transactionType;
    }

    @Override
    public Boolean isCancelled() {
        requireResolved();
        return cancelled;
    }

    public void setCancelled(Boolean cancelled) {
        this.cancelled = Boolean.TRUE.equals(cancelled);
        // This transaction will no longer be valid so need to set a validTo
        // (matches pre-#340 behavior).
        if (Boolean.TRUE.equals(cancelled)) {
            setValidTo(ZonedDateTime.now());
        } else {
            setValidTo(null);
        }
    }

    @Override
    public String getTradeName() {
        requireResolved();
        return tradeName;
    }

    @Override
    public PositionStatusProto getPositionStatus() {
        requireResolved();
        return positionStatus != null ? positionStatus : PositionStatusProto.UNKNOWN;
    }

    public void setPositionStatus(PositionStatusProto status) {
        this.positionStatus = status;
        this.positionStatusValue = 0;
    }

    @Override
    public ZonedDateTime getValidFrom() {
        return validFrom != null ? validFrom : super.getValidFrom();
    }

    // ---- Field map (positions plumbing) ---------------------------------

    @Override
    public Object getField(Field field) {
        return switch (field) {
            //Transaction Fields
            case ID -> getID();
            case AS_OF -> getAsOf();
            // EFFECTIVE_DATE is declared LocalDate (field.proto): the as-of's date, in the as-of timestamp's own zone.
            case EFFECTIVE_DATE -> getAsOf() == null ? null : getAsOf().toLocalDate();
            case TRANSACTION_TYPE -> getTransactionType();
            case TRADE_DATE -> getTradeDate();
            case SETTLEMENT_DATE -> getSettlementDate();
            case POSITION_STATUS -> getPositionStatus();
            case PRICE -> getPrice();
            case IS_CANCELLED -> isCancelled();
            //Security Fields
            case SECURITY -> getSecurity();
            case SECURITY_ISSUER_NAME -> getSecurity().getField(SECURITY_ISSUER_NAME);
            case ISSUE_DATE -> getSecurity().getField(ISSUE_DATE);
            case PRODUCT_TYPE -> getSecurity().getProductType().name();
            case IDENTIFIER -> getSecurity().getIdentifiers().isEmpty() ? null : getSecurity().getIdentifiers().get(0);
            case ASSET_CLASS -> getSecurity().getAssetClass();
            case PRODUCT_CLASS -> getSecurity().getField(PRODUCT_CLASS);
            case SECURITY_DESCRIPTION -> getSecurity().getDisplayDescription();
            case SECURITY_ID -> getSecurityId();
            case TENOR -> getSecurity().getField(Field.TENOR);
            case ADJUSTED_TENOR -> getSecurity().getField(Field.ADJUSTED_TENOR);
            case MATURITY_DATE -> getSecurity().getField(Field.MATURITY_DATE);
            //Portfolio Fields
            case PORTFOLIO -> getPortfolio();
            case PORTFOLIO_ID -> getPortfolio().getID();
            case PORTFOLIO_NAME -> getPortfolio().getPortfolioName();
            //Strategy
            case STRATEGY -> getStrategyAllocation();
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
        switch (measure) {
            case DIRECTED_QUANTITY:
                return getDirectedQuantity();
            case MARKET_VALUE:
            case ADJUSTED_COST_BASIS:
            case UNADJUSTED_COST_BASIS:
            default:
                throw new RuntimeException("Measure is not supported: " + measure);
        }
    }

    @Override
    public boolean isMatch(PositionFilter filter) {
        boolean isMatch = true;
        for (Map.Entry<Field, PositionFilter.PositionComparator> entry : filter.getFilters().entrySet()) {
            Field field = entry.getKey();
            PositionFilter.PositionComparator comparator = entry.getValue();
            isMatch = isMatch && PositionFilter.matches(field, comparator, getField(field));
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
        if (cashTransactions.size() == 1)
            return cashTransactions.get(0);
        else if (cashTransactions.size() > 1)
            throw new RuntimeException("There are two cash transactions with the same parent. That " +
                    "indicates an error in processing. Transaction " + getID() + " has "
                    + cashTransactions.size() + " cash children: "
                    + cashTransactions.stream().map(t -> String.valueOf(t.getID())).collect(Collectors.joining(", ")));
        else
            return null;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
        this.transactionTypeValue = 0;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
        this.quantityError = null;
        this.quantityWire = null;
    }

    public void setTradeDate(LocalDate tradeDate) {
        this.tradeDate = tradeDate;
        this.tradeDateError = null;
        this.tradeDateWire = null;
    }

    public void setSettlementDate(LocalDate settlementDate) {
        this.settlementDate = settlementDate;
        this.settlementDateError = null;
        this.settlementDateWire = null;
    }

    /**
     * Attaches a child (LM-438). Refused with {@link InvalidChildTransactionException},
     * before anything changes, when the child belongs to another transaction,
     * repeats an existing child's ID, or would be a second cash child. A child
     * with no parent gets this transaction as its parent. Building from a proto
     * does not call this, so a stored transaction that breaks a rule still loads.
     */
    public void addChildTransaction(Transaction child) {
        Objects.requireNonNull(child, "child transaction must not be null");
        UUID parentId = getID();
        UUID childId = child.getID();
        Transaction childsParent = child.parentTransaction;
        if (childsParent != null && childsParent != this && !Objects.equals(childsParent.getID(), parentId)) {
            throw InvalidChildTransactionException.wrongParent(parentId, childId, childsParent.getID());
        }
        for (Transaction existing : childrenTransactions) {
            if (existing == child || Objects.equals(existing.getID(), childId)) {
                throw InvalidChildTransactionException.duplicateId(parentId, childId);
            }
        }
        if (isCashChild(child)) {
            for (Transaction existing : childrenTransactions) {
                if (isCashChild(existing)) {
                    throw InvalidChildTransactionException.secondCash(parentId, existing.getID(), childId);
                }
            }
        }
        if (childsParent == null) child.parentTransaction = this;
        this.childrenTransactions.add(child);
    }

    private static boolean isCashChild(Transaction child) {
        Security security = child.getSecurity();
        return security != null && security.isCash();
    }

    public List<Transaction> getChildTransactions() {
        return this.childrenTransactions;
    }

    public List<Transaction> getChildTransactionsRecursively() {
        List<Transaction> transactions = new ArrayList<>();
        if (!this.childrenTransactions.isEmpty()) {
            for (Transaction childTransaction : this.childrenTransactions) {
                transactions.add(childTransaction);
                transactions.addAll(childTransaction.getChildTransactionsRecursively());
            }
        }
        return transactions;
    }

    /* EVERYTHING BELOW HERE IS BUSINESS LOGIC; IT SHOULD BE MOVED TO A HIGHER LEVEL FUNCTION AT SOME POINT */

    private static Transaction createCashTransaction(CashSecurity cashSecurity, Transaction parentTransaction) {
        TransactionType transactionType;
        switch (parentTransaction.getTransactionType()) {
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

        BigDecimal bookAmount;

        if (ProductHierarchy.isDescendantOf(parentTransaction.getSecurity().getProductType(), "BOND")) {
            if (TransactionType.MATURATION.equals(parentTransaction.getTransactionType())
                    || TransactionType.MATURATION_OFFSET.equals(parentTransaction.getTransactionType())) {
                bookAmount = parentTransaction.getQuantity();
            } else {
                BondSecurity bond = (BondSecurity) parentTransaction.getSecurity();
                BigDecimal faceValue = bond.getFaceValue();
                if (faceValue == null) {
                    throw new ModelValidationException(List.of(ModelValidationException.violation(
                            SecurityRules.FACE_VALUE, bond.getID(),
                            "Bond face_value is required for transaction cash impact calculation")));
                }
                BigDecimal priceScaleFactor = bond.getPriceScaleFactor();
                BigDecimal scaledPrice = parentTransaction.getPrice().getPrice().multiply(priceScaleFactor);
                BigDecimal numberBondUnits = parentTransaction.getQuantity().divide(faceValue);
                bookAmount = numberBondUnits.multiply(scaledPrice);
            }
        } else {
            bookAmount = parentTransaction.getQuantity().multiply(parentTransaction.getPrice().getPrice());
        }

        Transaction cashTransaction = new Transaction(
                UUID.randomUUID(), parentTransaction.getPortfolio(),
                cashPriceFor(parentTransaction),
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

        parentTransaction.addChildTransaction(cashTransaction);
        return cashTransaction;
    }

    /**
     * LM-449: the cash child's price is the fixed 1 USD cash price, tagged with
     * the parent price's {@code price_type} when the parent has one. Read from
     * the parent's price proto so a link-mode price never throws here. An
     * untyped parent keeps {@link Price#getCashPrice()} as-is (bytes unchanged).
     */
    private static Price cashPriceFor(Transaction parentTransaction) {
        PriceTypeProto type = parentTransaction.priceProto != null
                ? parentTransaction.priceProto.getPriceType() : PriceTypeProto.UNKNOWN_PRICE_TYPE;
        Price cash = Price.getCashPrice();
        if (type == PriceTypeProto.UNKNOWN_PRICE_TYPE || type == PriceTypeProto.UNRECOGNIZED) return cash;
        return new Price(cash.getID(), cash.getPrice(), cash.getSecurity(), cash.getAsOf(), type);
    }

    public static void addDerivedTransactions(Transaction transaction) {
        boolean isBond = ProductHierarchy.isDescendantOf(transaction.getSecurity().getProductType(), "BOND");
        boolean isABuyTransaction = TransactionType.BUY.equals(transaction.getTransactionType());
        boolean isASellTransaction = TransactionType.SELL.equals(transaction.getTransactionType());
        boolean isaMaturationTransaction = !TransactionType.MATURATION.equals(transaction.getTransactionType())
                && !TransactionType.MATURATION_OFFSET.equals(transaction.getTransactionType());

        if (isBond && isASellTransaction && isaMaturationTransaction) {
            addMaturationTransaction(transaction, TransactionType.MATURATION_OFFSET);
        }
        if (isBond && isABuyTransaction && isaMaturationTransaction) {
            addMaturationTransaction(transaction, TransactionType.MATURATION);
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
                transaction, transaction.getTradeName(), transaction.getPositionStatus()
        );
        transaction.addChildTransaction(maturation);
        addCashImpact(maturation);
    }

    /**
     * Adds the cash child. A transaction that already has one is refused by
     * {@link #addChildTransaction} with {@link InvalidChildTransactionException},
     * naming both cash children.
     */
    public static void addCashImpact(Transaction transaction) {
        if (!transaction.getSecurity().isCash()) {
            Transaction cashTxn = Transaction.createCashTransaction(CashSecurity.USD, transaction);
            assert cashTxn.getParentTransaction().equals(transaction);
        }
    }
}
