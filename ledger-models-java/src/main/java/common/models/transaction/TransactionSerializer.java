package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.Security;
import common.models.strategy.StrategyAllocation;
import common.util.LinkCache;
import common.util.ObjectTypes;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceProtoOrBuilder;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityProtoOrBuilder;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.VersionProto;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.portfolio.PortfolioSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.Objects;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Serializer for {@link Transaction} (LM-444; restored from before #340).
 *
 * <p>{@link #serialize} builds a new {@link TransactionProto} from the
 * transaction's fields on every call, children included, and only reads the
 * transaction: there is no shared builder and no cached proto. The bytes are
 * those the #340 wrapper wrote: Security and Portfolio as links
 * (strip-on-write), the trade Price inline with only its Security as a link
 * (LM-394), and {@code object_type}, {@code version} and {@code valid_from}
 * as received.
 *
 * <p>{@link #deserialize} is the one decode path ({@code new Transaction(proto)}
 * and {@link Transaction#fromProto} come here). It applies the UUID and Price
 * defaults (LM-276), and resolves each link once: a Security link through
 * {@link LinkCache#SECURITY} and the {@link Security.Fetcher} <b>before</b> the
 * class is chosen, so a Treasury reads back as a BondSecurity (LM-440). A link
 * that cannot be resolved stays a link and is written back unchanged.
 *
 * <p>Lives next to {@link Transaction} so it can read the transaction's
 * package-private fields without widening its public API.
 */
public final class TransactionSerializer implements IRawDataModelObjectSerializer<TransactionProto, Transaction> {
    private static final Logger LOG = Logger.getLogger(TransactionSerializer.class.getName());

    private static final class InstanceHolder {
        private static final TransactionSerializer INSTANCE = new TransactionSerializer();
    }

    public static TransactionSerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private TransactionSerializer() {
    }

    // ---- serialize ------------------------------------------------------

    /** A new proto with strip-on-write. Read-only: safe from many threads at once. */
    @Override
    public TransactionProto serialize(Transaction transaction) {
        return write(transaction, true);
    }

    /** As {@link #serialize}, with nested Security, Portfolio and the Price's Security in full. */
    public TransactionProto serializeRaw(Transaction transaction) {
        return write(transaction, false);
    }

    private TransactionProto write(Transaction t, boolean strip) {
        TransactionProto.Builder b = TransactionProto.newBuilder();
        if (t.objectType != null && t.objectType != ObjectTypeProto.UNRECOGNIZED) b.setObjectType(t.objectType);
        if (t.version != null) {
            b.setVersion(VersionProto.newBuilder()
                    .setMajor(t.version.major()).setMinor(t.version.minor()).setPatch(t.version.patch()));
        }
        b.setUuid(ProtoSerializationUtil.serializeUUID(t.getID()));
        if (t.getAsOf() != null) b.setAsOf(ProtoSerializationUtil.serializeTimestamp(t.getAsOf()));
        if (t.link) {
            return b.setIsLink(true).build();
        }
        if (t.validFrom != null) b.setValidFrom(ProtoSerializationUtil.serializeTimestamp(t.validFrom));
        if (t.getValidTo() != null) b.setValidTo(ProtoSerializationUtil.serializeTimestamp(t.getValidTo()));

        if (t.portfolioLink != null) {
            b.setPortfolio(strip || t.portfolio == null || t.portfolio.isLink() ? t.portfolioLink : t.portfolio.getProto());
        }
        if (t.securityLink != null) {
            b.setSecurity(strip ? t.securityLink : rawSecurity(t.security, t.securityLink));
        }
        if (t.transactionType != null) b.setTransactionType(TransactionTypeProto.valueOf(t.transactionType.name()));
        if (t.quantity != null) b.setQuantity(ProtoSerializationUtil.serializeBigDecimal(t.quantity));
        if (t.priceProto != null) {
            b.setPrice(strip ? t.priceProto : rawPrice(t.price, t.priceProto));
        }
        if (t.tradeDate != null) b.setTradeDate(ProtoSerializationUtil.serializeLocalDate(t.tradeDate));
        if (t.settlementDate != null) b.setSettlementDate(ProtoSerializationUtil.serializeLocalDate(t.settlementDate));

        // Only reads the children: never adds, removes or rebuilds them.
        for (Transaction child : t.childrenTransactions) {
            b.addChildTransactions(write(child, strip));
        }

        if (t.positionStatus != null && t.positionStatus != PositionStatusProto.UNRECOGNIZED) {
            b.setPositionStatus(t.positionStatus);
        }
        if (t.tradeName != null && !t.tradeName.isEmpty()) b.setTradeName(t.tradeName);
        if (t.strategyAllocationProto != null) b.setStrategyAllocation(t.strategyAllocationProto);
        b.setIsCancelled(t.cancelled);
        return b.build();
    }

    private static SecurityProto rawSecurity(Security security, SecurityProto link) {
        return security == null || security.isLink() ? link : security.getProto();
    }

    private static PriceProto rawPrice(Price price, PriceProto written) {
        if (price == null || written.getIsLink() || !written.hasSecurity()) return written;
        return written.toBuilder().setSecurity(rawSecurity(price.getSecurity(), written.getSecurity())).build();
    }

    // ---- wire forms, captured when a field is set -------------------------

    /**
     * The link strip-on-write writes for a security: a link passes through
     * unchanged; a full security becomes {@code is_link} + uuid + as_of, and
     * is put in {@link LinkCache#SECURITY} so a same-process reader of the
     * link resolves it without a fetch.
     */
    static SecurityProto linkOf(SecurityProto full) {
        if (full.getIsLink()) return full;
        primeCache(LinkCache.SECURITY, full, full.hasUuid() ? full.getUuid() : null, full.hasAsOf() ? full.getAsOf() : null);
        SecurityProto.Builder link = ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY).setIsLink(true);
        if (full.hasUuid()) link.setUuid(full.getUuid());
        if (full.hasAsOf()) link.setAsOf(full.getAsOf());
        return link.build();
    }

    /** As {@link #linkOf(SecurityProto)}, for a portfolio. */
    static PortfolioProto linkOf(PortfolioProto full) {
        if (full.getIsLink()) return full;
        primeCache(LinkCache.PORTFOLIO, full, full.hasUuid() ? full.getUuid() : null, full.hasAsOf() ? full.getAsOf() : null);
        PortfolioProto.Builder link = ObjectTypes.stamp(PortfolioProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PORTFOLIO).setIsLink(true);
        if (full.hasUuid()) link.setUuid(full.getUuid());
        if (full.hasAsOf()) link.setAsOf(full.getAsOf());
        return link.build();
    }

    /**
     * The price strip-on-write writes: inline (price decimal, uuid, as_of),
     * stamped, with only its Security as a link (LM-394). A price that is
     * already a link passes through unchanged.
     */
    static PriceProto inlinePrice(PriceProto full) {
        if (full.getIsLink()) return full;
        PriceProto.Builder inline = ObjectTypes.stamp(full.toBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE);
        if (full.hasSecurity()) inline.setSecurity(linkOf(full.getSecurity()));
        return inline.build();
    }

    static Transaction.WireVersion wireVersion(VersionProto v) {
        return new Transaction.WireVersion(v.getMajor(), v.getMinor(), v.getPatch());
    }

    private static <V> void primeCache(LinkCache<V> cache, V full,
                                       fintekkers.models.util.Uuid.UUIDProto uuid, LocalTimestampProto asOf) {
        if (uuid == null || asOf == null) return;
        UUID id;
        ZonedDateTime at;
        try {
            id = ProtoSerializationUtil.deserializeUUID(uuid);
            at = ProtoSerializationUtil.deserializeTimestamp(asOf);
        } catch (RuntimeException e) {
            return;   // unreadable key: the getter reports the error, nothing to cache
        }
        if (id != null && at != null) cache.put(id, full, at);
    }

    // ---- deserialize ----------------------------------------------------

    @Override
    public Transaction deserialize(TransactionProto proto) {
        return new Transaction(proto);
    }

    /**
     * Fills {@code t} from {@code proto}. Called once, by the Transaction
     * proto constructor, after it has set the ID and as_of.
     */
    static void fill(Transaction t, TransactionProto proto) {
        t.objectType = proto.getObjectType();
        t.version = proto.hasVersion() ? wireVersion(proto.getVersion()) : null;

        TransactionProto source = proto;
        if (proto.getIsLink()) {
            TransactionProto resolved = resolveTransaction(t.getID(), t.getAsOf());
            if (resolved == null) {
                t.link = true;
                return;
            }
            source = resolved;
            t.objectType = resolved.getObjectType();
            t.version = resolved.hasVersion() ? wireVersion(resolved.getVersion()) : null;
            if (resolved.hasAsOf()) {
                t.setAsOf(ProtoSerializationUtil.deserializeTimestamp(resolved.getAsOf(), "transaction.as_of"));
            }
        }

        if (source.hasValidFrom()) {
            t.validFrom = ProtoSerializationUtil.deserializeTimestamp(source.getValidFrom(), "transaction.valid_from");
        }
        if (source.hasValidTo()) {
            t.setValidTo(ProtoSerializationUtil.deserializeTimestamp(source.getValidTo(), "transaction.valid_to"));
        }

        // A field that fails to decode does not stop the build: its getter
        // raises the error, as before LM-444 (LM-254, LM-269, LM-272), and
        // its wire form is still written back.
        if (source.hasSecurity()) {
            SecurityProto security = withSecurityDefaults(source.getSecurity());
            t.securityLink = linkOf(security);
            try {
                t.security = Security.fromProto(resolveSecurity(security));
            } catch (RuntimeException e) {
                t.securityError = e;
            }
        }
        if (source.hasPortfolio()) {
            PortfolioProto portfolio = source.getPortfolio();
            t.portfolioLink = linkOf(portfolio);
            try {
                t.portfolio = PortfolioSerializer.getInstance().deserialize(resolvePortfolio(portfolio));
            } catch (RuntimeException e) {
                t.portfolioError = e;
            }
        }
        if (source.hasPrice()) {
            PriceProto price = withPriceDefaults(source.getPrice(), source);
            t.priceProto = inlinePrice(price);
            PriceProto readable = price.getIsLink() ? cachedPrice(price) : price;
            if (readable != null) {
                try {
                    t.price = readPrice(readable, t);
                } catch (RuntimeException e) {
                    t.priceError = e;
                }
            }
        }

        t.transactionType = transactionTypeOf(source.getTransactionType());
        if (source.hasQuantity()) {
            try {
                t.quantity = ProtoSerializationUtil.deserializeBigDecimal(source.getQuantity());
            } catch (RuntimeException e) {
                t.quantityError = e;
            }
        }
        try {
            t.tradeDate = ProtoSerializationUtil.deserializeOptionalLocalDate(
                    source.hasTradeDate() ? source.getTradeDate() : null, "trade_date");
        } catch (RuntimeException e) {
            t.tradeDateError = e;
        }
        try {
            t.settlementDate = ProtoSerializationUtil.deserializeOptionalLocalDate(
                    source.hasSettlementDate() ? source.getSettlementDate() : null, "settlement_date");
        } catch (RuntimeException e) {
            t.settlementDateError = e;
        }
        t.positionStatus = source.getPositionStatus();
        t.tradeName = source.getTradeName();
        if (source.hasStrategyAllocation()) {
            t.strategyAllocationProto = source.getStrategyAllocation();
            t.strategyAllocation = strategyOrNull(source.getStrategyAllocation());
        }
        t.cancelled = source.getIsCancelled();

        // Children as stored, not via addChildTransaction: a stored row that
        // breaks an LM-438 rule still loads.
        for (TransactionProto childProto : source.getChildTransactionsList()) {
            Transaction child = new Transaction(childProto);
            child.parentTransaction = t;
            t.childrenTransactions.add(child);
        }
    }

    // ---- defaults (LM-276), filled once at build --------------------------

    /**
     * A non-link security with no UUID (unset or empty raw_uuid) gets a random
     * one, and so does its non-link settlement_currency (parity with Python,
     * JS and Rust). Set UUIDs are never overwritten; a link passes through.
     */
    private static SecurityProto withSecurityDefaults(SecurityProto security) {
        if (security.getIsLink()) return security;
        boolean fillSecurity = !hasUsableUuid(security);
        boolean fillCurrency = security.hasSettlementCurrency()
                && !security.getSettlementCurrency().getIsLink()
                && !hasUsableUuid(security.getSettlementCurrency());
        if (!fillSecurity && !fillCurrency) return security;
        SecurityProto.Builder b = security.toBuilder();
        if (fillSecurity) b.setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()));
        if (fillCurrency) {
            b.getSettlementCurrencyBuilder().setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()));
        }
        return b.build();
    }

    /**
     * A non-link price with no UUID gets a random one; a non-link price with
     * no as_of gets the transaction's as_of (parity with Python and JS). Set
     * values are never overwritten; a link passes through as sent.
     */
    private static PriceProto withPriceDefaults(PriceProto price, TransactionProto txn) {
        if (price.getIsLink()) return price;
        boolean fillUuid = !hasUsableUuid(price);
        boolean fillAsOf = !price.hasAsOf() && txn.hasAsOf();
        if (!fillUuid && !fillAsOf) return price;
        PriceProto.Builder b = price.toBuilder();
        if (fillUuid) b.setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()));
        if (fillAsOf) b.setAsOf(txn.getAsOf());
        return b.build();
    }

    private static boolean hasUsableUuid(SecurityProtoOrBuilder security) {
        return security.hasUuid() && security.getUuid().getRawUuid().size() > 0;
    }

    private static boolean hasUsableUuid(PriceProtoOrBuilder price) {
        return price.hasUuid() && price.getUuid().getRawUuid().size() > 0;
    }

    // ---- link resolution, at build only ---------------------------------

    /**
     * Resolves a security link through {@link Security#resolveLink}. On a
     * miss or a fetcher failure, keeps the link: it is written back
     * unchanged, and only this row's security class is unknown.
     */
    private static SecurityProto resolveSecurity(SecurityProto security) {
        if (!security.getIsLink()) return security;
        SecurityProto resolved;
        try {
            resolved = Security.resolveLink(security);
        } catch (RuntimeException e) {
            LOG.log(Level.WARNING, "Security link " + uuidText(security.hasUuid() ? security.getUuid() : null)
                    + " could not be resolved; keeping the link", e);
            return security;
        }
        if (resolved == null) {
            LOG.warning("Security link " + uuidText(security.hasUuid() ? security.getUuid() : null)
                    + " not in LinkCache.SECURITY and not returned by the Security.Fetcher; keeping the link");
            return security;
        }
        return resolved;
    }

    private static PortfolioProto resolvePortfolio(PortfolioProto portfolio) {
        if (!portfolio.getIsLink()) return portfolio;
        try {
            PortfolioProto resolved = Portfolio.resolveLink(portfolio);
            return resolved != null ? resolved : portfolio;
        } catch (RuntimeException e) {
            LOG.log(Level.WARNING, "Portfolio link " + uuidText(portfolio.hasUuid() ? portfolio.getUuid() : null)
                    + " could not be resolved; keeping the link", e);
            return portfolio;
        }
    }

    /** A link price is read from {@link LinkCache#PRICE}; there is no Price fetcher. */
    private static PriceProto cachedPrice(PriceProto link) {
        if (!link.hasUuid()) return null;
        UUID id = ProtoSerializationUtil.deserializeUUID(link.getUuid());
        if (id == null) return null;
        ZonedDateTime asOf = link.hasAsOf() ? ProtoSerializationUtil.deserializeTimestamp(link.getAsOf()) : null;
        return LinkCache.PRICE.get(id, asOf);
    }

    private static TransactionProto resolveTransaction(UUID id, ZonedDateTime asOf) {
        TransactionProto cached = LinkCache.TRANSACTION.get(id, asOf);
        if (cached != null) return cached.getIsLink() ? null : cached;
        Transaction.Fetcher f = Transaction.getFetcher();
        if (f == null) return null;
        TransactionProto resolved;
        try {
            resolved = f.fetch(id, asOf);
        } catch (RuntimeException e) {
            LOG.log(Level.WARNING, "Transaction link " + id + " could not be resolved; keeping the link", e);
            return null;
        }
        if (resolved == null || resolved.getIsLink()) return null;
        ZonedDateTime resolvedAsOf = resolved.hasAsOf()
                ? ProtoSerializationUtil.deserializeTimestamp(resolved.getAsOf())
                : (asOf != null ? asOf : ZonedDateTime.now());
        LinkCache.TRANSACTION.put(id, resolved, resolvedAsOf);
        return resolved;
    }

    // ---- field decoding -------------------------------------------------

    /**
     * The Price getters return. Its security is the transaction's own when the
     * link names the same security, so it is resolved once; otherwise it is
     * resolved here.
     */
    private static Price readPrice(PriceProto p, Transaction t) {
        Security security = null;
        if (p.hasSecurity()) {
            SecurityProto sp = p.getSecurity();
            if (t.security != null && t.securityLink != null && sp.getIsLink()
                    && Objects.equals(sp.getUuid(), t.securityLink.getUuid())
                    && Objects.equals(sp.getAsOf(), t.securityLink.getAsOf())) {
                security = t.security;
            } else {
                security = Security.fromProto(resolveSecurity(sp));
            }
        }
        return new Price(
                ProtoSerializationUtil.deserializeUUID(p.getUuid()),
                ProtoSerializationUtil.deserializeBigDecimal(p.getPrice()),
                security,
                ProtoSerializationUtil.deserializeRequiredTimestamp(p.hasAsOf() ? p.getAsOf() : null, "price.as_of"));
    }

    private static TransactionType transactionTypeOf(TransactionTypeProto type) {
        if (type == TransactionTypeProto.UNKNOWN || type == TransactionTypeProto.UNRECOGNIZED) return null;
        try {
            return TransactionType.valueOf(type.name());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** A stored allocation without uuid or as_of loads; its getter raises the old error. */
    private static StrategyAllocation strategyOrNull(fintekkers.models.strategy.StrategyAllocationProto proto) {
        try {
            return new StrategyAllocation(proto);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static String uuidText(fintekkers.models.util.Uuid.UUIDProto uuid) {
        if (uuid == null) return "?";
        try {
            UUID id = ProtoSerializationUtil.deserializeUUID(uuid);
            return id != null ? id.toString() : "?";
        } catch (RuntimeException e) {
            return "?";
        }
    }
}
