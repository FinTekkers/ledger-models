package common.models.security;

import common.models.IFinancialModelObject;
import common.models.RawDataModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.security.identifier.Identifier;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import fintekkers.models.util.Uuid.UUIDProto;
import com.google.protobuf.ByteString;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

/***
 * Generally shouldn't be used except for tests, or absolute emergencies.
 */
public class Security extends RawDataModelObject implements Comparable, IFinancialModelObject {
    private final String issuer;
    private final CashSecurity settlementCurrency;
    protected List<Identifier> identifiers = new ArrayList<>();

    private String description;

    private SecurityProto _sourceProto;

    // Lazy caches for bitemporal ZonedDateTime fields read from the stashed
    // _sourceProto. See FinTekkers/second-brain#338 (Phase 1 of #335).
    //
    // Rationale: ZonedDateTime is ~200B per instance, and validFrom/validTo
    // are read selectively (validTo only by `isDeleted(asOf)` callers; validFrom
    // only by bitemporal-supersession audits). Today's SecuritySerializer.deserialize
    // path does NOT populate these from the proto — validFrom is set to
    // ZonedDateTime.now() in the parent constructor and validTo defaults to null.
    // That dropped the proto's bitemporal data on the floor.
    //
    // These overrides preserve backward-compat (existing setters via the
    // RawDataModelObject parent still work and take precedence) AND lazy-decode
    // from `_sourceProto` on first read when no explicit set has occurred.
    // Cached after first decode for cheap repeat reads.
    //
    // _validToExplicitlySet is the disambiguator for "consumer set validTo to
    // null (resurrection per #316 §2.2)" vs "validTo never set, defer to proto."
    // Without this, setValidTo(null) followed by getValidTo() would incorrectly
    // fall through to the proto's valid_to.
    private ZonedDateTime _cachedValidTo;
    private boolean _validToCacheValid = false;
    private boolean _validToExplicitlySet = false;
    private ZonedDateTime _cachedValidFromFromProto;

    public Security(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, asOf);
        this.issuer = issuer;
        this.settlementCurrency = settlementCurrency;
    }

    /**
     * Build a {@link SecurityProto} link reference (is_link=true) with the given
     * uuid and as_of populated. Use this whenever you embed a Security inside
     * another message that itself carries an as_of (Position, Transaction,
     * Price, etc.) — the link MUST carry the same as_of as the parent so the
     * resolver hydrates the correct point-in-time vintage. See
     * docs/adr/is_link_pattern.md for the full pattern.
     *
     * @param uuid The Security UUID to reference.
     * @param asOf The as-of timestamp to embed; must be non-null. For "always
     *             return the latest version", use {@link #linkOfLatest(UUID)}.
     * @return A SecurityProto with is_link=true, uuid + as_of populated.
     */
    public static SecurityProto linkOf(UUID uuid, ZonedDateTime asOf) {
        Objects.requireNonNull(uuid, "uuid is required for linkOf");
        Objects.requireNonNull(asOf, "asOf is required for linkOf; use linkOfLatest(uuid) for latest-version semantics");
        return SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(toUuidProto(uuid))
                .setAsOf(toTimestampProto(asOf))
                .build();
    }

    /**
     * Build a {@link SecurityProto} link reference (is_link=true) with only
     * uuid populated. Resolution returns the latest version of the record.
     *
     * Explicit escape hatch for the rare case where the link is meant to
     * float to "latest" rather than carry the parent's as_of. Most callers
     * should prefer {@link #linkOf(UUID, ZonedDateTime)}.
     */
    public static SecurityProto linkOfLatest(UUID uuid) {
        Objects.requireNonNull(uuid, "uuid is required for linkOfLatest");
        return SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(toUuidProto(uuid))
                .build();
    }

    /**
     * True iff this Security wraps a link-mode SecurityProto. When true, only
     * {@link #getID()} and the as_of are meaningful; other field accessors
     * throw {@link IllegalStateException} to force the caller to resolve the
     * full entity via SecurityService.GetByIds. See
     * docs/adr/is_link_pattern.md.
     */
    public boolean isLink() {
        return _sourceProto != null && _sourceProto.getIsLink();
    }

    private void throwIfLink(String accessor) {
        if (isLink()) {
            throw new IllegalStateException(
                    "Cannot read " + accessor + " on a link-mode Security (is_link=true). "
                    + "Resolve via SecurityService.GetByIds first. "
                    + "See docs/adr/is_link_pattern.md.");
        }
    }

    private static UUIDProto toUuidProto(UUID uuid) {
        ByteBuffer bb = ByteBuffer.allocate(16);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return UUIDProto.newBuilder().setRawUuid(ByteString.copyFrom(bb.array())).build();
    }

    private static LocalTimestampProto toTimestampProto(ZonedDateTime asOf) {
        java.time.Instant instant = asOf.toInstant();
        return LocalTimestampProto.newBuilder()
                .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(instant.getEpochSecond())
                        .setNanos(instant.getNano())
                        .build())
                .setTimeZone(asOf.getZone().getId())
                .build();
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
        // The lazy validTo/validFrom caches refer to the previous _sourceProto's
        // values. Reset them so the next read decodes from the new proto. See
        // FinTekkers/second-brain#338.
        //
        // _validToExplicitlySet is NOT reset — a prior setValidTo() call still
        // wins over the new proto. (The typical call shape is
        // `serializer.deserialize(proto) → setSecurityProto(proto)`; if a
        // consumer mutates validTo BEFORE setSecurityProto runs, that mutation
        // is preserved. Today's deserialize sequence never does that.)
        this._validToCacheValid = false;
        this._cachedValidTo = null;
        this._cachedValidFromFromProto = null;
    }

    /**
     * Lazy-decode override. Returns, in priority order:
     *   1. Whatever was explicitly set via {@link #setValidTo(ZonedDateTime)} —
     *      including {@code null} (resurrection per second-brain#316 §2.2).
     *   2. Otherwise, the {@code valid_to} from the stashed {@code _sourceProto},
     *      decoded on first call and cached for subsequent calls.
     *   3. {@code null} if neither set nor proto-populated.
     *
     * This is a correctness fix on top of the pre-#338 behavior, where validTo
     * was always {@code null} on a freshly-deserialized Security — the proto's
     * {@code valid_to} was decoded by no path. See FinTekkers/second-brain#338.
     */
    @Override
    public ZonedDateTime getValidTo() {
        if (_validToExplicitlySet) {
            return super.getValidTo();
        }
        if (_validToCacheValid) {
            return _cachedValidTo;
        }
        if (_sourceProto != null && _sourceProto.hasValidTo()) {
            _cachedValidTo = ProtoSerializationUtil.deserializeTimestamp(_sourceProto.getValidTo());
        } else {
            _cachedValidTo = null;
        }
        _validToCacheValid = true;
        return _cachedValidTo;
    }

    /**
     * Lazy-decode override. Returns:
     *   1. The {@code valid_from} from the stashed {@code _sourceProto} if present,
     *      decoded on first call and cached.
     *   2. Otherwise, the parent's {@code validFrom} (set to
     *      {@code ZonedDateTime.now()} in the {@link RawDataModelObject} constructor —
     *      a legacy default that loses the proto's authoritative timestamp).
     *
     * The proto wins when present because the parent's local-clock default loses
     * the bitemporal record on every deserialize. Existing tests that build a
     * Security via the POJO constructor (no proto stashed) continue to see the
     * local-clock default. See FinTekkers/second-brain#338.
     */
    @Override
    public ZonedDateTime getValidFrom() {
        if (_cachedValidFromFromProto != null) {
            return _cachedValidFromFromProto;
        }
        if (_sourceProto != null && _sourceProto.hasValidFrom()) {
            _cachedValidFromFromProto = ProtoSerializationUtil.deserializeTimestamp(_sourceProto.getValidFrom());
            return _cachedValidFromFromProto;
        }
        return super.getValidFrom();
    }

    /**
     * Override to invalidate the lazy {@link #getValidTo()} cache and mark the
     * field as explicitly set, so subsequent reads see the new value (including
     * an explicit {@code null} for resurrection per second-brain#316 §2.2)
     * instead of falling back to the proto's {@code valid_to}.
     */
    @Override
    public void setValidTo(ZonedDateTime newValidTo) {
        super.setValidTo(newValidTo);
        this._validToExplicitlySet = true;
        this._validToCacheValid = false;
        this._cachedValidTo = null;
    }

    public CashSecurity getSettlementCurrency() {
        throwIfLink("settlementCurrency");
        return settlementCurrency;
    }

    public boolean isCash() {
        return false;
    }

    /**
     * Time-based soft-delete check. A Security is considered deleted iff it
     * carries a non-null {@code validTo} that has already elapsed at
     * {@code asOf}. A future-dated {@code validTo} means the row is still
     * live today and becomes deleted automatically when {@code asOf} catches
     * up. A null {@code validTo} is always active.
     *
     * <p>This is the single canonical soft-delete check across the platform —
     * the predecessor {@code SecurityProto.deleted_at} field has been removed
     * (tag 15 reserved). See /specs/soft-delete-validto-collapse.md
     * (FinTekkers/second-brain#316).</p>
     */
    public boolean isDeleted() {
        return isDeleted(ZonedDateTime.now());
    }

    public boolean isDeleted(ZonedDateTime asOf) {
        return getValidTo() != null && getValidTo().isBefore(asOf);
    }

    public String getIssuer() {
        throwIfLink("issuer");
        return this.issuer;
    }

    /**
     * Returns a high-level asset class for a security, such as 'Equity', 'FixedIncome', etc.
     *
     * @return Returns unclassified for basic securities, and a suitable value for other security values.
     */
    public String getAssetClass() {
        throwIfLink("assetClass");
        if (_sourceProto != null && !_sourceProto.getAssetClass().isEmpty()) {
            return _sourceProto.getAssetClass();
        }
        return "Unclassified";
    }

    public QuantityType getQuantityType() {
        return QuantityType.UNITS;
    }

    public List<Identifier> getIdentifiers() {
        throwIfLink("identifiers");
        return identifiers;
    }

    public Optional<Identifier> getIdentifierByType(IdentifierTypeProto type) {
        throwIfLink("identifierByType");
        if (type == null) return Optional.empty();
        for (Identifier id : identifiers) {
            if (id.getIdentifierType().name().equals(type.name())) {
                return Optional.of(id);
            }
        }
        return Optional.empty();
    }

    public void addIdentifier(Identifier identifier) {
        if (identifier == null) return;
        this.identifiers.add(identifier);
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
            case PRODUCT_TYPE -> getProductType().name();
            case IDENTIFIER -> identifiers.isEmpty() ? null : identifiers.get(0);
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
     * Reads the leaf productType from the source proto when present.
     * Specialized subclasses (TIPSBond, FloatingRateNote, EquitySecurity,
     * CashSecurity) override with a hardcoded value for legacy
     * non-proto-constructed paths. See ledger-models-protos/hierarchy.json
     * for the full product registry.
     */
    public ProductTypeProto getProductType() {
        throwIfLink("productType");
        if (_sourceProto != null && _sourceProto.getProductType() != ProductTypeProto.PRODUCT_TYPE_UNKNOWN) {
            return _sourceProto.getProductType();
        }
        return ProductTypeProto.PRODUCT_TYPE_UNKNOWN;
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


    /**
     * @return If an explicit description is set then it is return, otherwise a generic description is returned.
     * The description is subject to change and should NEVER be parsed. The goal is for this to be human-readable.
     */
    public String getDisplayDescription() {
        if (description != null) return description;
        if (!identifiers.isEmpty()) return identifiers.get(0).toString();
        return toString();
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
