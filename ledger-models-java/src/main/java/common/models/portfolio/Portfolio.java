package common.models.portfolio;

import common.models.IFinancialModelObject;
import common.models.RawDataModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.util.LinkCache;
import fintekkers.models.portfolio.PortfolioProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/***
 * A Portfolio entity wrapper. Supports the {@code is_link} lazy-hydrate
 * pattern (parity with {@code SecurityWrapper} / {@code TransactionWrapper}
 * in the other languages). A Portfolio constructed from a link-mode
 * {@link PortfolioProto} resolves to its full form via {@link LinkCache#PORTFOLIO}
 * + the registered {@link Fetcher} on the first non-link-safe accessor.
 *
 * <p>{@code proto} is the single source of truth — never null. The
 * convenience POJO constructor builds a baseline proto inline from its args,
 * mirroring {@link common.models.security.Security}'s POJO ctor.
 */
public class Portfolio extends RawDataModelObject implements Comparable, IFinancialModelObject {

    /** Active proto. Mutable: swapped on lazy hydration. Never null. */
    private PortfolioProto proto;

    /**
     * True iff this wrapper currently holds a fully-populated proto.
     * Initialized to {@code !proto.getIsLink()} in every constructor.
     * Flipped to {@code true} after {@link #ensureHydrated()} swaps in a
     * resolved proto.
     */
    private boolean isHydrated;

    // ---- Fetcher hook (parity with Security.Fetcher / Python set_portfolio_fetcher) ----

    /**
     * Test seam: set a fetcher that resolves a link-mode portfolio to its
     * full form. The default delegates to {@link fintekkers.services.PortfolioService}
     * — production wiring needs no change. Override via {@link #setFetcher(Fetcher)}
     * for tests with canned protos or non-default endpoints.
     */
    @FunctionalInterface
    public interface Fetcher {
        PortfolioProto fetch(UUID id, ZonedDateTime asOf);
    }
    private static volatile Fetcher fetcher = defaultGrpcFetcher();
    public static void setFetcher(Fetcher f) { fetcher = f; }
    public static Fetcher getFetcher()       { return fetcher; }

    /**
     * Default fetcher: delegates to {@link fintekkers.services.PortfolioService#getByUuid}.
     * Auto-registered as the {@link Fetcher} for typical deployments.
     */
    static Fetcher defaultGrpcFetcher() {
        return (uuid, asOf) -> fintekkers.services.PortfolioService.getInstance().getByUuid(uuid, asOf);
    }

    // ---- Constructors ----

    /**
     * Convenience POJO constructor. Builds a baseline {@link PortfolioProto}
     * inline so {@link #proto} is always non-null. Equivalent to
     * {@code new Portfolio(PortfolioProto.newBuilder()...build())} with the
     * fields these args cover.
     */
    public Portfolio(UUID id, String portfolioName, ZonedDateTime asOf) {
        this(buildBaselineProto(id, portfolioName, asOf));
    }

    /** Primary proto-backed constructor. Honors link-mode for lazy hydration. */
    public Portfolio(PortfolioProto proto) {
        super(extractId(proto), extractAsOf(proto));
        Objects.requireNonNull(proto, "PortfolioProto must not be null");
        this.proto = proto;
        this.isHydrated = !proto.getIsLink();
    }

    private static PortfolioProto buildBaselineProto(UUID id, String portfolioName, ZonedDateTime asOf) {
        PortfolioProto.Builder b = PortfolioProto.newBuilder()
                .setObjectClass("Portfolio")
                .setVersion("0.0.1")
                .setIsLink(false);
        if (id != null) {
            b.setUuid(ProtoSerializationUtil.serializeUUID(id));
        }
        if (asOf != null) {
            b.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        }
        if (portfolioName != null) {
            b.setPortfolioName(portfolioName);
        }
        return b.build();
    }

    private static UUID extractId(PortfolioProto proto) {
        if (proto.hasUuid() && proto.getUuid().getRawUuid().size() == 16) {
            return ProtoSerializationUtil.deserializeUUID(proto.getUuid());
        }
        return UUID.randomUUID();
    }

    private static ZonedDateTime extractAsOf(PortfolioProto proto) {
        if (proto.hasAsOf()) {
            return ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf());
        }
        return null;
    }

    // ---- is_link / lazy-hydrate semantics ----

    /**
     * True iff this wrapper currently holds an unresolved link reference.
     * After a successful {@link #ensureHydrated()} swaps in a resolved
     * proto, this returns false (the wrapper now holds a full entity).
     */
    public boolean isLink() {
        return proto.getIsLink() && !isHydrated;
    }

    /**
     * If this wrapper holds an unresolved link, resolve it: cache hit first;
     * on miss, call the configured {@link Fetcher}; on miss with no fetcher,
     * throw. On success, swap the wrapper's internal proto. Mirrors
     * {@code SecurityWrapper.ensureHydrated()}.
     */
    private void ensureHydrated() {
        if (isHydrated) return;

        UUID id = getID();
        ZonedDateTime asOf = proto.hasAsOf()
                ? ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf())
                : null;

        PortfolioProto cached = LinkCache.PORTFOLIO.get(id, asOf);
        if (cached != null) {
            adoptResolvedProto(cached);
            return;
        }
        Fetcher f = fetcher;
        if (f != null) {
            PortfolioProto resolved = f.fetch(id, asOf);
            if (resolved == null) {
                throw new IllegalStateException(
                        "Cannot resolve link-mode Portfolio uuid=" + id
                        + " asOf=" + asOf + " — PortfolioService returned no record. "
                        + "Data lineage broken.");
            }
            ZonedDateTime resolvedAsOf = resolved.hasAsOf()
                    ? ProtoSerializationUtil.deserializeTimestamp(resolved.getAsOf())
                    : (asOf != null ? asOf : ZonedDateTime.now());
            LinkCache.PORTFOLIO.put(id, resolved, resolvedAsOf);
            adoptResolvedProto(resolved);
            return;
        }
        throw new IllegalStateException(
                "Cannot read fields on link-mode Portfolio uuid=" + id
                + " asOf=" + asOf + " — cache miss and no Portfolio.Fetcher configured. "
                + "Pre-warm via LinkResolver.resolvePortfoliosOnTransactions(...) "
                + "or call Portfolio.setFetcher(...) at startup. "
                + "See docs/adr/lazy-link-hydration.md.");
    }

    private void adoptResolvedProto(PortfolioProto resolved) {
        this.proto = resolved;
        this.isHydrated = true;
    }

    // ---- Accessors ----

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
        ensureHydrated();
        return proto.getPortfolioName();
    }

    /** Active proto. Returns the resolved form after lazy hydration. */
    public PortfolioProto getProto() {
        ensureHydrated();
        return proto;
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
