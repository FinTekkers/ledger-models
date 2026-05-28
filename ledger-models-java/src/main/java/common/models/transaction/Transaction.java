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
import common.models.security.ProductHierarchy;
import common.models.security.Security;
import common.models.strategy.StrategyAllocation;
import common.models.util.persistence.IForeignKey;
import com.google.protobuf.ByteString;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.price.PriceSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

import static common.models.postion.Field.*;

/***
 * A transaction represents an operation that changes the position of a portfolio.
 *
 * <p>Phase 2 / sub-issue FinTekkers/second-brain#340 refactor: Transaction is
 * now a thin wrapper around a {@link TransactionProto}, mirroring the Phase 1
 * pattern from PR #225 (Security wrapper). The proto is the single source of
 * truth; field accessors forward to {@code proto.getXxx()} with type conversion.
 * Mutations write into a lazily-allocated {@code overlay} builder;
 * {@link #getProto()} returns the overlay-merged proto with inner
 * Security/Portfolio/Price sub-protos rewritten to {@code is_link=true}
 * (uuid + as_of preserved) — strip-on-write per Phase 2 dispatch.
 *
 * <p>Resolver wiring (D): Java Transaction wrapper takes ONLY proto in ctor,
 * matching the Python/Rust pattern. No auto-resolve. {@link #getSecurity()}
 * returns {@code Security.fromProto(proto.getSecurity())} directly — whether
 * inline or {@code is_link}. Caller is responsible for hydrating via
 * {@link common.util.LinkResolver#resolveSecuritiesOnTransactions(List)}
 * (and the portfolio counterpart) BEFORE wrapping. Same for Portfolio. Price
 * resolver is deferred to Phase 2.5; {@link #getPrice()} returns a Price POJO
 * with whatever data the inner PriceProto carries.
 */
public class Transaction extends RawDataModelObject implements ITransaction {

    /** Original immutable baseline. */
    private final TransactionProto proto;

    /**
     * Write buffer for in-place mutations. {@code null} until the first setter
     * call; allocated lazily by {@link #ensureOverlay()} as a copy of
     * {@link #proto} (via {@code proto.toBuilder()}, which deep-copies nested
     * sub-protos — non-trivial, hence the laziness).
     *
     * <p>Write lifecycle:
     * <ol>
     *   <li>Construction: {@code proto} = caller-supplied baseline (immutable);
     *       {@code overlay} = null. All reads go straight to {@code proto}.</li>
     *   <li>First setter (e.g. {@link #setQuantity}, {@link #setValidTo}):
     *       {@link #ensureOverlay()} clones {@code proto} into a Builder;
     *       the setter writes into that Builder. Subsequent reads via
     *       {@link #active()} prefer {@code overlay} when non-null, so writes
     *       are visible to in-process getters immediately.</li>
     *   <li>Serialize ({@link #getProto()}): the overlay (or {@code proto} if
     *       no writes occurred) is the basis for the emitted proto, with
     *       strip-on-write applied to nested Security/Portfolio/Price
     *       sub-protos and child transactions rebuilt from the in-memory
     *       {@code childrenTransactions} list.</li>
     * </ol>
     *
     * <p>The {@code overlay == null} check doubles as a "has been mutated?"
     * predicate (used by {@link #getRawProto()} to skip the rebuild path
     * entirely on untouched wrappers).
     */
    private TransactionProto.Builder overlay;

    /** Parent transaction is NOT in the proto (commented-out tag 21). In-memory only. */
    private Transaction parentTransaction;

    /**
     * Child transactions. Hydrated from {@code proto.child_transactions_list}
     * on construction. {@link #addChildTransaction(Transaction)} appends in
     * memory; {@link #getProto()} rebuilds the proto's child list from this
     * collection (so child mutations propagate on serialize).
     */
    private final List<Transaction> childrenTransactions = new ArrayList<>();

    // ---- Primary constructor (proto-backed) -----------------------------

    /** Primary constructor — wraps a TransactionProto. */
    public Transaction(TransactionProto proto) {
        super(extractId(proto), extractAsOf(proto));
        Objects.requireNonNull(proto, "TransactionProto must not be null");
        // UUID Regression A fix from PR #225: when input proto has no UUID,
        // extractId() synthesizes one via UUID.randomUUID() and stores on
        // parent. Reflect that synthesized UUID into this.proto so
        // getProto() exposes it.
        if (!proto.hasUuid() && this.getID() != null) {
            this.proto = proto.toBuilder()
                    .setUuid(ProtoSerializationUtil.serializeUUID(this.getID()))
                    .build();
        } else {
            this.proto = proto;
        }
        // Hydrate child wrappers from the proto. Mutations after construction
        // go through addChildTransaction; serialize rebuilds from this list.
        for (TransactionProto childProto : this.proto.getChildTransactionsList()) {
            Transaction child = new Transaction(childProto);
            child.parentTransaction = this;
            this.childrenTransactions.add(child);
        }
    }

    /**
     * 'Short-hand' constructor. Will generate derived transactions such as
     * cash impacts, and maturity transactions for bonds. Builds a baseline
     * proto from POJO args and delegates to the primary constructor.
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
     * @deprecated Same shape as the short-form ctor — POJO args build a proto.
     */
    @Deprecated
    public Transaction(UUID id, Portfolio portfolio, Price price, LocalDate tradeDate, LocalDate settlementDate,
                       BigDecimal quantity, Security security, TransactionType transactionType, StrategyAllocation strategy,
                       ZonedDateTime asOf, Transaction parentTransaction, String tradeName, PositionStatusProto status) {
        this(buildBaselineProto(id, portfolio, price, tradeDate, settlementDate, quantity, security,
                transactionType, strategy, asOf, tradeName, status));

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
            ByteString raw = proto.getUuid().getRawUuid();
            int n = raw.size();
            if (n != 0 && n != 16) {
                throw new IllegalArgumentException(
                        "Invalid UUID: expected 16 bytes but got " + n);
            }
            UUID parsed = ProtoSerializationUtil.deserializeUUID(proto.getUuid());
            if (parsed != null) return parsed;
        }
        return UUID.randomUUID();
    }

    private static ZonedDateTime extractAsOf(TransactionProto proto) {
        if (proto.hasAsOf()) {
            return ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf());
        }
        return null;
    }

    private static TransactionProto buildBaselineProto(
            UUID id, Portfolio portfolio, Price price, LocalDate tradeDate, LocalDate settlementDate,
            BigDecimal quantity, Security security, TransactionType transactionType,
            StrategyAllocation strategy, ZonedDateTime asOf, String tradeName, PositionStatusProto status) {
        TransactionProto.Builder b = TransactionProto.newBuilder()
                .setObjectClass(Transaction.class.getSimpleName())
                .setVersion("0.0.1");
        if (id != null) b.setUuid(ProtoSerializationUtil.serializeUUID(id));
        if (asOf != null) b.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        if (portfolio != null) b.setPortfolio(PortfolioSerializer.getInstance().serialize(portfolio));
        if (security != null) b.setSecurity(security.getProto());
        if (transactionType != null) b.setTransactionType(TransactionTypeProto.valueOf(transactionType.name()));
        if (quantity != null) b.setQuantity(ProtoSerializationUtil.serializeBigDecimal(quantity));
        if (price != null) b.setPrice(PriceSerializer.getInstance().serialize(price));
        if (tradeDate != null) b.setTradeDate(ProtoSerializationUtil.serializeLocalDate(tradeDate));
        if (settlementDate != null) b.setSettlementDate(ProtoSerializationUtil.serializeLocalDate(settlementDate));
        b.setPositionStatus(Objects.requireNonNullElse(status, PositionStatusProto.HYPOTHETICAL));
        if (strategy == null) {
            strategy = new StrategyAllocation(UUID.randomUUID(), ZonedDateTime.now());
        }
        b.setStrategyAllocation(strategy.getProto());
        if (tradeName != null) b.setTradeName(tradeName);
        b.setIsCancelled(false);
        return b.build();
    }

    protected TransactionProto.Builder ensureOverlay() {
        if (overlay == null) {
            overlay = proto.toBuilder();
        }
        return overlay;
    }

    /**
     * Returns the active view of the proto with strip-on-write applied:
     *   - Inner Security/Portfolio/Price sub-protos rewritten to is_link=true
     *     with only uuid + as_of preserved.
     *   - childTransactions rebuilt from the in-memory list (so additions
     *     made via addChildTransaction propagate).
     *
     * <p>Replaces {@code TransactionSerializer.getInstance().serialize(transaction)}.
     * Per Phase 2 dispatch: serialize-back rewrites inner sub-protos to link
     * references so persisted bytes are compact; consumer hydrates on read.
     */
    public TransactionProto getProto() {
        TransactionProto.Builder b = (overlay != null) ? overlay : proto.toBuilder();

        // Rebuild child transactions from the in-memory list so additions
        // propagate. Each child's getProto() recursively strips-on-write.
        b.clearChildTransactions();
        for (Transaction child : childrenTransactions) {
            b.addChildTransactions(child.getProto());
        }

        // Strip inline Security → link reference.
        if (b.hasSecurity()) {
            b.setSecurity(stripSecurity(b.getSecurity()));
        }
        // Strip inline Portfolio → link reference.
        if (b.hasPortfolio()) {
            b.setPortfolio(stripPortfolio(b.getPortfolio()));
        }
        // Strip inline Price → link reference.
        if (b.hasPrice()) {
            b.setPrice(stripPrice(b.getPrice()));
        }
        return b.build();
    }

    /**
     * Returns the raw active proto without strip-on-write — for tests that
     * need to verify pre-strip field values, and for hydration round-trips
     * where the caller has already resolved the inner protos. Most consumers
     * should use {@link #getProto()}.
     */
    public TransactionProto getRawProto() {
        if (overlay != null) {
            // Still rebuild child transactions from the in-memory list, even
            // for the raw view, because addChildTransaction is the only way
            // children land on the proto.
            TransactionProto.Builder b = overlay;
            b.clearChildTransactions();
            for (Transaction child : childrenTransactions) {
                b.addChildTransactions(child.getRawProto());
            }
            return b.build();
        }
        return proto;
    }

    private static SecurityProto stripSecurity(SecurityProto full) {
        if (full.getIsLink()) return full; // already a link
        // Self-pre-warm: cache the full proto before stripping so any later
        // consumer that holds the link can lazy-hydrate without an RPC.
        // Covers same-process write-then-read flows (tests, in-process
        // gRPC server reading back what it just wrote, etc.).
        primeSecurityCache(full);
        SecurityProto.Builder link = SecurityProto.newBuilder().setIsLink(true);
        if (full.hasUuid()) link.setUuid(full.getUuid());
        if (full.hasAsOf()) link.setAsOf(full.getAsOf());
        return link.build();
    }

    private static PortfolioProto stripPortfolio(PortfolioProto full) {
        if (full.getIsLink()) return full;
        primePortfolioCache(full);
        PortfolioProto.Builder link = PortfolioProto.newBuilder().setIsLink(true);
        if (full.hasUuid()) link.setUuid(full.getUuid());
        if (full.hasAsOf()) link.setAsOf(full.getAsOf());
        return link.build();
    }

    private static PriceProto stripPrice(PriceProto full) {
        if (full.getIsLink()) return full;
        primePriceCache(full);
        PriceProto.Builder link = PriceProto.newBuilder().setIsLink(true);
        if (full.hasUuid()) link.setUuid(full.getUuid());
        if (full.hasAsOf()) link.setAsOf(full.getAsOf());
        return link.build();
    }

    // ---- LinkCache pre-warm helpers (write-through on strip) -------------

    private static void primeSecurityCache(SecurityProto full) {
        if (!full.hasUuid() || !full.hasAsOf()) return;
        java.util.UUID id = protos.serializers.util.proto.ProtoSerializationUtil.deserializeUUID(full.getUuid());
        java.time.ZonedDateTime asOf = protos.serializers.util.proto.ProtoSerializationUtil.deserializeTimestamp(full.getAsOf());
        if (id != null && asOf != null) common.util.LinkCache.SECURITY.put(id, full, asOf);
    }

    private static void primePortfolioCache(PortfolioProto full) {
        if (!full.hasUuid() || !full.hasAsOf()) return;
        java.util.UUID id = protos.serializers.util.proto.ProtoSerializationUtil.deserializeUUID(full.getUuid());
        java.time.ZonedDateTime asOf = protos.serializers.util.proto.ProtoSerializationUtil.deserializeTimestamp(full.getAsOf());
        if (id != null && asOf != null) common.util.LinkCache.PORTFOLIO.put(id, full, asOf);
    }

    private static void primePriceCache(PriceProto full) {
        if (!full.hasUuid() || !full.hasAsOf()) return;
        java.util.UUID id = protos.serializers.util.proto.ProtoSerializationUtil.deserializeUUID(full.getUuid());
        java.time.ZonedDateTime asOf = protos.serializers.util.proto.ProtoSerializationUtil.deserializeTimestamp(full.getAsOf());
        if (id != null && asOf != null) common.util.LinkCache.PRICE.put(id, full, asOf);
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
        } catch (NullPointerException | IllegalStateException e) {
            // is_link-mode Security/Portfolio reads (or partially-populated proto):
            // emit a link-style summary so logs are still useful.
            TransactionProto a = active();
            String idStr = a.hasUuid()
                    ? ProtoSerializationUtil.deserializeUUID(a.getUuid()).toString()
                    : "?";
            return String.format("Link[Transaction:%s]", idStr);
        }
    }

    @Override
    public boolean equals(Object other) {
        if(!(other instanceof Transaction otherTransaction)) {
            return false;
        }
        return getID().equals(otherTransaction.getID()) && getAsOf().equals(otherTransaction.getAsOf());
    }

    // ---- Field accessors (proto-backed) ---------------------------------

    private TransactionProto active() {
        return (overlay != null) ? overlay.build() : proto;
    }

    @Override
    public Portfolio getPortfolio() {
        TransactionProto a = active();
        if (!a.hasPortfolio()) return null;
        return PortfolioSerializer.getInstance().deserialize(a.getPortfolio());
    }

    @Override
    public Security getSecurity() {
        TransactionProto a = active();
        if (!a.hasSecurity()) return null;
        return Security.fromProto(a.getSecurity());
    }

    @Override
    public StrategyAllocation getStrategyAllocation() {
        TransactionProto a = active();
        if (!a.hasStrategyAllocation()) return null;
        return new StrategyAllocation(a.getStrategyAllocation());
    }

    @Override
    public Price getPrice() {
        TransactionProto a = active();
        if (!a.hasPrice()) return null;
        fintekkers.models.price.PriceProto pp = a.getPrice();
        // Lazy-hydrate the embedded Price: if it's a link-mode proto,
        // resolve via LinkCache.PRICE. Pre-warm-on-strip in this wrapper's
        // own getProto() populates that cache for round-trip flows, and
        // service-side write-through covers cross-process flows.
        if (pp.getIsLink() && pp.hasUuid()) {
            java.util.UUID priceId = protos.serializers.util.proto.ProtoSerializationUtil.deserializeUUID(pp.getUuid());
            java.time.ZonedDateTime priceAsOf = pp.hasAsOf()
                    ? protos.serializers.util.proto.ProtoSerializationUtil.deserializeTimestamp(pp.getAsOf())
                    : null;
            fintekkers.models.price.PriceProto cached = common.util.LinkCache.PRICE.get(priceId, priceAsOf);
            if (cached != null) {
                pp = cached;
            } else {
                throw new IllegalStateException(
                    "Cannot read fields on link-mode Price uuid=" + priceId
                    + " asOf=" + priceAsOf + " — LinkCache.PRICE miss. "
                    + "Pre-warm via LinkResolver.resolvePricesOnTransactions(...) "
                    + "or rely on strip-on-write self-prewarm (same-process flows).");
            }
        }
        return PriceSerializer.getInstance().deserialize(pp);
    }

    @Override
    public LocalDate getSettlementDate() {
        TransactionProto a = active();
        if (!a.hasSettlementDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(a.getSettlementDate());
    }

    @Override
    public BigDecimal getQuantity() {
        TransactionProto a = active();
        if (!a.hasQuantity()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(a.getQuantity());
    }

    @Override
    public BigDecimal getDirectedQuantity() {
        BigDecimal q = getQuantity();
        if (q == null) return null;
        return q.multiply(getTransactionType().getDirectionMultiplier());
    }

    @Override
    public LocalDate getTradeDate() {
        TransactionProto a = active();
        if (!a.hasTradeDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(a.getTradeDate());
    }

    @Override
    public TransactionType getTransactionType() {
        TransactionTypeProto tt = active().getTransactionType();
        if (tt == TransactionTypeProto.UNKNOWN) return null;
        try {
            return TransactionType.valueOf(tt.name());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    public Boolean isCancelled() {
        return active().getIsCancelled();
    }

    public void setCancelled(Boolean cancelled) {
        ensureOverlay().setIsCancelled(Boolean.TRUE.equals(cancelled));
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
        return active().getTradeName();
    }

    @Override
    public PositionStatusProto getPositionStatus() {
        return active().getPositionStatus();
    }

    public void setPositionStatus(PositionStatusProto status) {
        if (status == null) {
            ensureOverlay().clearPositionStatus();
        } else {
            ensureOverlay().setPositionStatus(status);
        }
    }

    @Override
    public ZonedDateTime getValidTo() {
        ZonedDateTime explicitlySet = super.getValidTo();
        if (explicitlySet != null) return explicitlySet;
        TransactionProto a = active();
        if (a.hasValidTo()) {
            return ProtoSerializationUtil.deserializeTimestamp(a.getValidTo());
        }
        return null;
    }

    @Override
    public ZonedDateTime getValidFrom() {
        TransactionProto a = active();
        if (a.hasValidFrom()) {
            return ProtoSerializationUtil.deserializeTimestamp(a.getValidFrom());
        }
        return super.getValidFrom();
    }

    @Override
    public void setValidTo(ZonedDateTime newValidTo) {
        super.setValidTo(newValidTo);
        if (newValidTo == null) {
            ensureOverlay().clearValidTo();
        } else {
            ensureOverlay().setValidTo(ProtoSerializationUtil.serializeTimestamp(newValidTo));
        }
    }

    // ---- Field map (positions plumbing) ---------------------------------

    @Override
    public Object getField(Field field) {
        return switch (field) {
            //Transaction Fields
            case ID -> getID();
            case AS_OF, EFFECTIVE_DATE -> getAsOf();
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
            case SECURITY_ID -> getSecurity().getID();
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
            Object comparatorValue = comparator.getValue();
            PositionFilter.Operator operator = comparator.getOperator();
            int compareResult = ((Comparable) getField(field)).compareTo(comparatorValue);
            if (operator.equals(PositionFilter.Operator.EQUALS))
                isMatch = isMatch && compareResult == 0;
            else if (operator.equals(PositionFilter.Operator.LESS_THAN_OR_EQUALS))
                isMatch = isMatch && compareResult <= 0;
            else if (operator.equals(PositionFilter.Operator.LESS_THAN))
                isMatch = isMatch && compareResult < 0;
            else if (operator.equals(PositionFilter.Operator.MORE_THAN_OR_EQUALS))
                isMatch = isMatch && compareResult >= 0;
            else if (operator.equals(PositionFilter.Operator.MORE_THAN))
                isMatch = isMatch && compareResult > 0;
            else if (operator.equals(PositionFilter.Operator.NOT_EQUALS))
                isMatch = isMatch && compareResult != 0;
            else
                throw new RuntimeException(String.format("Operator not supported in filters: %s", operator.name()));
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
                    "indicates an error in processing.");
        else
            return null;
    }

    public void setTransactionType(TransactionType transactionType) {
        if (transactionType == null) {
            ensureOverlay().clearTransactionType();
        } else {
            ensureOverlay().setTransactionType(TransactionTypeProto.valueOf(transactionType.name()));
        }
    }

    public void setQuantity(BigDecimal quantity) {
        if (quantity == null) {
            ensureOverlay().clearQuantity();
        } else {
            ensureOverlay().setQuantity(ProtoSerializationUtil.serializeBigDecimal(quantity));
        }
    }

    public void setTradeDate(LocalDate tradeDate) {
        if (tradeDate == null) {
            ensureOverlay().clearTradeDate();
        } else {
            ensureOverlay().setTradeDate(ProtoSerializationUtil.serializeLocalDate(tradeDate));
        }
    }

    public void setSettlementDate(LocalDate settlementDate) {
        if (settlementDate == null) {
            ensureOverlay().clearSettlementDate();
        } else {
            ensureOverlay().setSettlementDate(ProtoSerializationUtil.serializeLocalDate(settlementDate));
        }
    }

    public void addChildTransaction(Transaction maturation) {
        this.childrenTransactions.add(maturation);
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
                    throw new TransactionProcessingException(
                            "Bond face_value is required for transaction cash impact calculation");
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

        parentTransaction.addChildTransaction(cashTransaction);
        return cashTransaction;
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

    public static void addCashImpact(Transaction transaction) {
        if (transaction.getCashTransaction() != null) {
            throw new RuntimeException("This transaction already has a cash impact");
        }
        if (!transaction.getSecurity().isCash()) {
            Transaction cashTxn = Transaction.createCashTransaction(CashSecurity.USD, transaction);
            assert cashTxn.getParentTransaction().equals(transaction);
        }
    }
}
