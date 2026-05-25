package common.models.security;

import common.models.IFinancialModelObject;
import common.models.RawDataModelObject;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.security.identifier.Identifier;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

/***
 * Generally shouldn't be used except for tests, or absolute emergencies.
 *
 * <p>Phase 1 / sub-issue FinTekkers/second-brain#338 refactor: Security is now
 * a thin wrapper around a {@link SecurityProto}. The proto is the single source
 * of truth; field accessors forward to {@code proto.getXxx()} with light type
 * conversion (BigDecimal, ZonedDateTime) where needed. Mutations write into a
 * lazily-allocated {@code overlay} {@link SecurityProto.Builder}; {@link #getProto()}
 * returns the overlay-merged result so re-serialize is correct without any
 * separate SecuritySerializer indirection. Mirrors Rust / Python / JS wrappers.
 */
public class Security extends RawDataModelObject implements Comparable, IFinancialModelObject {

    /** Original immutable baseline. */
    private final SecurityProto proto;

    /** Lazy mutation overlay; {@code null} until first setter. */
    private SecurityProto.Builder overlay;

    /** Primary constructor — wraps a SecurityProto. */
    public Security(SecurityProto proto) {
        super(extractId(proto), extractAsOf(proto));
        Objects.requireNonNull(proto, "SecurityProto must not be null");
        // FinTekkers/ledger-service PR #65 Regression A: when the input
        // proto has no UUID, extractId() synthesizes one via
        // UUID.randomUUID() and stores it on the parent. We must ALSO
        // reflect that synthesized UUID into the stored proto so
        // getProto() exposes it — otherwise the response proto returned
        // to clients is missing the server-assigned UUID.
        if (!proto.hasUuid() && this.getID() != null) {
            this.proto = proto.toBuilder()
                    .setUuid(ProtoSerializationUtil.serializeUUID(this.getID()))
                    .build();
        } else {
            this.proto = proto;
        }
        // Mirror the proto's identifiers into the subclass-visible list so
        // getIdentifiers().clear() and similar legacy mutations behave as
        // expected. The mirror is authoritative; overlay's identifiers list
        // is rebuilt from it on each getProto() call when mutations have
        // occurred. See SecurityTest.testDescription.
        for (IdentifierProto p : this.proto.getIdentifiersList()) {
            this.identifiers.add(IdentifierSerializer.getInstance().deserialize(p));
        }
    }

    /**
     * @deprecated Field-by-field test helper. Builds an equivalent
     *             {@link SecurityProto} from the args. New code should use
     *             {@link #Security(SecurityProto)}.
     *
     * <p>Note: asOf is passed directly to the parent constructor rather than
     * round-tripped through the proto, to avoid a pre-existing timezone
     * conversion quirk in {@link ProtoSerializationUtil#deserializeTimestamp}
     * that would shift the wall-clock time by the local timezone offset.
     * The wire proto carries the same asOf; only the in-memory wrapper field
     * skips the round-trip.
     */
    @Deprecated
    public Security(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id != null ? id : UUID.randomUUID(), asOf);
        // Use the parent's id (post-super) so the proto carries the same
        // UUID as the wrapper — including the synthesized one when the
        // caller passed null. Same fix shape as Regression A on the
        // SecurityProto-based primary constructor (FinTekkers/ledger-service
        // PR #65).
        this.proto = buildBaselineProto(this.getID(), issuer, asOf, settlementCurrency);
        for (IdentifierProto p : this.proto.getIdentifiersList()) {
            this.identifiers.add(IdentifierSerializer.getInstance().deserialize(p));
        }
    }

    // ---- Static factories ------------------------------------------------

    /**
     * Subclass dispatcher. Inspects {@code proto.getProductType()} (or infers
     * from structured shape when product_type is UNKNOWN) and returns the
     * appropriate concrete subclass instance. Replaces the old
     * {@code SecuritySerializer.deserialize} dispatch. See #338.
     */
    public static Security fromProto(SecurityProto proto) {
        Objects.requireNonNull(proto, "SecurityProto must not be null");

        ProductTypeProto productType = proto.getProductType();
        SecurityProto.NonBondDetailsCase nonBondCase = proto.getNonBondDetailsCase();

        if (productType == ProductTypeProto.PRODUCT_TYPE_UNKNOWN) {
            if (proto.hasTipsExtension()) {
                productType = ProductTypeProto.TIPS;
            } else if (proto.hasFrnExtension()) {
                productType = ProductTypeProto.TREASURY_FRN;
            } else if (proto.hasMbsExtension()) {
                productType = ProductTypeProto.MORTGAGE_BACKED;
            } else if (proto.hasBondDetails()) {
                productType = ProductTypeProto.TREASURY_NOTE;
            } else if (nonBondCase != SecurityProto.NonBondDetailsCase.NONBONDDETAILS_NOT_SET) {
                switch (nonBondCase) {
                    case CASH_DETAILS:   productType = ProductTypeProto.CURRENCY; break;
                    case EQUITY_DETAILS: productType = ProductTypeProto.COMMON_STOCK; break;
                    case INDEX_DETAILS:  productType = ProductTypeProto.EQUITY_INDEX; break;
                    default: break;
                }
            }
        }

        if (productType == ProductTypeProto.CURRENCY) {
            return new CashSecurity(proto);
        }
        if (ProductHierarchy.isDescendantOf(productType, "BOND")) {
            validateBondDates(proto);
            if (productType == ProductTypeProto.TIPS) {
                return new common.models.security.bonds.TIPSBond(proto);
            }
            if (productType == ProductTypeProto.TREASURY_FRN) {
                return new common.models.security.bonds.FloatingRateNote(proto);
            }
            if (productType == ProductTypeProto.MORTGAGE_BACKED) {
                return new common.models.security.bonds.MortgageBackedSecurity(proto);
            }
            return new BondSecurity(proto);
        }
        if (ProductHierarchy.isDescendantOf(productType, "STOCK")) {
            return new EquitySecurity(proto);
        }
        if (ProductHierarchy.isDescendantOf(productType, "INDEX")) {
            return new IndexSecurity(proto);
        }
        return new Security(proto);
    }

    public static SecurityProto linkOf(UUID uuid, ZonedDateTime asOf) {
        Objects.requireNonNull(uuid, "uuid is required for linkOf");
        Objects.requireNonNull(asOf, "asOf is required for linkOf; use linkOfLatest(uuid) for latest-version semantics");
        return SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(ProtoSerializationUtil.serializeUUID(uuid))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .build();
    }

    public static SecurityProto linkOfLatest(UUID uuid) {
        Objects.requireNonNull(uuid, "uuid is required for linkOfLatest");
        return SecurityProto.newBuilder()
                .setIsLink(true)
                .setUuid(ProtoSerializationUtil.serializeUUID(uuid))
                .build();
    }

    /**
     * Carried forward from the deleted SecuritySerializer.deserialize:
     * maturity_date must be strictly after issue_date for bond-type securities.
     * Throws IllegalArgumentException (maps to gRPC INVALID_ARGUMENT at the
     * service layer).
     */
    private static void validateBondDates(SecurityProto proto) {
        fintekkers.models.util.LocalDate.LocalDateProto issueDate = null;
        fintekkers.models.util.LocalDate.LocalDateProto maturityDate = null;
        if (proto.hasBondDetails()) {
            fintekkers.models.security.BondDetailsProto bond = proto.getBondDetails();
            if (bond.hasIssueDate()) issueDate = bond.getIssueDate();
            if (bond.hasMaturityDate()) maturityDate = bond.getMaturityDate();
        }
        if (issueDate != null && maturityDate != null) {
            LocalDate issue = ProtoSerializationUtil.deserializeLocalDate(issueDate);
            LocalDate maturity = ProtoSerializationUtil.deserializeLocalDate(maturityDate);
            if (!maturity.isAfter(issue)) {
                throw new IllegalArgumentException(
                        "maturity_date must be after issue_date: maturity=" + maturity + ", issue=" + issue);
            }
        }
    }

    // ---- Internal helpers -----------------------------------------------

    private static UUID extractId(SecurityProto proto) {
        if (proto.hasUuid()) {
            // FinTekkers/ledger-service PR #65 Regression B: explicitly
            // validate the UUID byte length here so a short/malformed
            // raw_uuid is rejected at wrapper construction time (pre-#338
            // SecuritySerializer.deserialize did this; the new code path
            // must preserve the same validation for gRPC INVALID_ARGUMENT
            // semantics). deserializeUUID already throws on 1-15 bytes
            // and returns null on 0 bytes — we add a length-pre-check
            // so the failure mode is consistent regardless of where it
            // lives.
            com.google.protobuf.ByteString raw = proto.getUuid().getRawUuid();
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

    private static ZonedDateTime extractAsOf(SecurityProto proto) {
        if (proto.hasAsOf()) {
            return ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf());
        }
        return null;
    }

    private static SecurityProto buildBaselineProto(UUID id, String issuer, ZonedDateTime asOf,
                                                    CashSecurity settlementCurrency) {
        SecurityProto.Builder b = SecurityProto.newBuilder();
        if (id != null) b.setUuid(ProtoSerializationUtil.serializeUUID(id));
        if (asOf != null) b.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        if (issuer != null) b.setIssuerName(issuer);
        if (settlementCurrency != null) b.setSettlementCurrency(settlementCurrency.getProto());
        return b.build();
    }

    protected SecurityProto.Builder ensureOverlay() {
        if (overlay == null) {
            overlay = proto.toBuilder();
        }
        return overlay;
    }

    /**
     * Returns the active view of the proto: the overlay-built result if any
     * mutation has occurred, else the original immutable proto. Replaces
     * {@code SecuritySerializer.getInstance().serialize(security)}.
     *
     * <p>If the subclass-visible {@code identifiers} mirror was mutated
     * (legacy {@code getIdentifiers().clear()} / {@code addIdentifier}
     * call sites), the rebuilt proto reflects the mirror's contents.
     */
    public SecurityProto getProto() {
        // Sync the mirror's identifiers into the overlay if they diverge.
        if (identifiersDifferFromProto()) {
            SecurityProto.Builder o = ensureOverlay();
            o.clearIdentifiers();
            for (Identifier id : identifiers) {
                o.addIdentifiers(IdentifierSerializer.getInstance().serialize(id));
            }
        }
        // Materialize the subclass's hardcoded product_type into the proto
        // when the active proto is UNKNOWN. This preserves legacy behavior
        // where SecuritySerializer.serialize set product_type from the
        // domain object — needed for SerializerFactoryTest and any consumer
        // that round-trips a field-by-field-built subclass through the wire.
        ProductTypeProto activeProductType = (overlay != null)
                ? overlay.getProductType()
                : proto.getProductType();
        if (activeProductType == ProductTypeProto.PRODUCT_TYPE_UNKNOWN) {
            ProductTypeProto subclassDefault = getSubclassProductType();
            if (subclassDefault != ProductTypeProto.PRODUCT_TYPE_UNKNOWN) {
                ensureOverlay().setProductType(subclassDefault);
            }
        }
        if (overlay != null) {
            return overlay.build();
        }
        return proto;
    }

    /**
     * Hook for subclasses to provide their hardcoded product type for the
     * UNKNOWN-in-proto fallback path used by {@link #getProto()}. Base
     * Security returns UNKNOWN (no hardcoded type); BondSecurity returns
     * TREASURY_NOTE; EquitySecurity returns COMMON_STOCK; etc.
     */
    protected ProductTypeProto getSubclassProductType() {
        return ProductTypeProto.PRODUCT_TYPE_UNKNOWN;
    }

    private boolean identifiersDifferFromProto() {
        SecurityProto active = (overlay != null) ? overlay.build() : proto;
        List<IdentifierProto> protoIds = active.getIdentifiersList();
        if (protoIds.size() != identifiers.size()) return true;
        for (int i = 0; i < identifiers.size(); i++) {
            IdentifierProto serialized = IdentifierSerializer.getInstance().serialize(identifiers.get(i));
            if (!serialized.equals(protoIds.get(i))) return true;
        }
        return false;
    }

    // ---- is_link semantics ----------------------------------------------

    public boolean isLink() {
        return proto.getIsLink();
    }

    private void throwIfLink(String accessor) {
        if (isLink()) {
            throw new IllegalStateException(
                    "Cannot read " + accessor + " on a link-mode Security (is_link=true). "
                    + "Resolve via SecurityService.GetByIds first. "
                    + "See docs/adr/is_link_pattern.md.");
        }
    }

    // ---- Legacy serializer-compat accessors -----------------------------

    /**
     * Legacy compat — returns the active proto view. Equivalent to
     * {@link #getProto()}. Retained for source-compat with consumers that
     * still call {@code security.getSecurityProto()}; prefer
     * {@link #getProto()} in new code.
     */
    public SecurityProto getSecurityProto() {
        return getProto();
    }

    /**
     * @deprecated Construct via {@link #Security(SecurityProto)} or
     *             {@link #fromProto(SecurityProto)} instead. Retained as an
     *             overlay-rebind hook so any straggler caller doesn't break.
     */
    @Deprecated
    public void setSecurityProto(SecurityProto proto) {
        if (proto != this.proto && !this.proto.equals(proto)) {
            this.overlay = proto.toBuilder();
        }
    }

    // ---- Bitemporal accessors (proto-backed) -----------------------------

    @Override
    public ZonedDateTime getValidTo() {
        ZonedDateTime explicitlySet = super.getValidTo();
        if (explicitlySet != null) {
            return explicitlySet;
        }
        SecurityProto active = getProto();
        if (active.hasValidTo()) {
            return ProtoSerializationUtil.deserializeTimestamp(active.getValidTo());
        }
        return null;
    }

    @Override
    public ZonedDateTime getValidFrom() {
        SecurityProto active = getProto();
        if (active.hasValidFrom()) {
            return ProtoSerializationUtil.deserializeTimestamp(active.getValidFrom());
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

    // ---- Business-field accessors (proto-backed) ------------------------

    public CashSecurity getSettlementCurrency() {
        throwIfLink("settlementCurrency");
        SecurityProto active = getProto();
        if (!active.hasSettlementCurrency()) return null;
        SecurityProto sc = active.getSettlementCurrency();
        if (sc.getIsLink()) {
            // UUID-only link reference — caller resolves via SecurityService.
            return null;
        }
        return new CashSecurity(sc);
    }

    public boolean isCash() {
        return false;
    }

    public boolean isDeleted() {
        return isDeleted(ZonedDateTime.now());
    }

    public boolean isDeleted(ZonedDateTime asOf) {
        return getValidTo() != null && getValidTo().isBefore(asOf);
    }

    public String getIssuer() {
        throwIfLink("issuer");
        return getProto().getIssuerName();
    }

    public String getAssetClass() {
        throwIfLink("assetClass");
        String assetClass = getProto().getAssetClass();
        return assetClass.isEmpty() ? "Unclassified" : assetClass;
    }

    public QuantityType getQuantityType() {
        return QuantityType.UNITS;
    }

    /**
     * Subclass-visible mirror of the identifiers list. Subclass {@code toString}
     * implementations and field-by-field test helpers read this directly.
     * Kept in sync with the active proto's {@code identifiers} via
     * {@link #addIdentifier(Identifier)}.
     */
    protected List<Identifier> identifiers = new ArrayList<>();

    public List<Identifier> getIdentifiers() {
        throwIfLink("identifiers");
        // Mirror is authoritative (populated from proto on construction and
        // mutated via addIdentifier / list.clear()). Returns the live list so
        // legacy {@code getIdentifiers().clear()} call sites still work.
        return identifiers;
    }

    public Optional<Identifier> getIdentifierByType(IdentifierTypeProto type) {
        throwIfLink("identifierByType");
        if (type == null) return Optional.empty();
        for (Identifier id : getIdentifiers()) {
            if (id.getIdentifierType().name().equals(type.name())) {
                return Optional.of(id);
            }
        }
        return Optional.empty();
    }

    public void addIdentifier(Identifier identifier) {
        if (identifier == null) return;
        // Mirror is authoritative — getProto() syncs into the overlay.
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
            case IDENTIFIER -> {
                List<Identifier> ids = getIdentifiers();
                yield ids.isEmpty() ? null : ids.get(0);
            }
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

    private String getProductClass() {
        return getClass().getSimpleName();
    }

    public ProductTypeProto getProductType() {
        throwIfLink("productType");
        ProductTypeProto pt = getProto().getProductType();
        return pt;
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


    public String getDisplayDescription() {
        String desc = getDescription();
        if (desc != null && !desc.isEmpty()) return desc;
        List<Identifier> ids = getIdentifiers();
        if (!ids.isEmpty()) return ids.get(0).toString();
        return toString();
    }

    public String getDescription() {
        String d = getProto().getDescription();
        return d.isEmpty() ? null : d;
    }

    public void setDescription(String description) {
        if (description == null) {
            ensureOverlay().clearDescription();
        } else {
            ensureOverlay().setDescription(description);
        }
    }
}
