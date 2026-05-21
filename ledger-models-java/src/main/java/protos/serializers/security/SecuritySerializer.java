package protos.serializers.security;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.JSONFieldNames;
import common.models.security.*;
import common.models.security.ProductHierarchy;
import common.models.security.identifier.Identifier;
import fintekkers.models.security.*;
import org.apache.commons.lang3.StringUtils;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

import fintekkers.models.util.LocalDate.LocalDateProto;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

import static common.models.JSONFieldNames.*;

public class SecuritySerializer implements IRawDataModelObjectSerializer<SecurityProto, Security> {

    private static final class InstanceHolder {
        private static final SecuritySerializer INSTANCE = new SecuritySerializer();
    }

    public static SecuritySerializer getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private SecuritySerializer() {
    }

    @Override
    public SecurityProto serialize(Security security) {
        SecurityProto.Builder builder = SecurityProto.newBuilder()
                .setObjectClass(Security.class.getSimpleName())
                .setVersion("0.0.1")
                //Primary key
                .setUuid(ProtoSerializationUtil.serializeUUID(security.getID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(security.getAsOf()))

                //Business fields
                .setIssuerName(security.getIssuer())
                .setAssetClass(security.getAssetClass())
                .setQuantityType(SecurityQuantityTypeProto.valueOf(security.getQuantityType().name()));

        builder.setProductType(security.getProductType());

        if(security.getDescription() != null)
            builder.setDescription(security.getDescription());

        serializeCashAttributes(security, builder);

        if(security instanceof EquitySecurity) {
            // Dual-write: set the oneof equity_details
            builder.setEquityDetails(EquityDetailsProto.newBuilder().build());
        } else if(security instanceof BondSecurity) {
            serializeBondSecurityAttributes((BondSecurity) security, builder);
        }

        // Promote the domain identifiers into `identifiers` (tag 42, repeated).
        // The first entry on the domain side is the primary; any additional
        // identifiers (e.g. CUSIP + ISIN) round-trip via the stashed proto
        // path below.
        if (!security.getIdentifiers().isEmpty()) {
            Identifier primary = security.getIdentifiers().get(0);
            IdentifierProto proto = IdentifierSerializer.getInstance().serialize(primary);
            builder.addIdentifiers(proto);
        }

        // The structured home for index_type is IndexDetailsProto.index_type via
        // the non_bond_details oneof. Preserve when set on the stashed source proto.
        if (security.getSecurityProto() != null
                && security.getSecurityProto().hasIndexDetails()
                && security.getSecurityProto().getIndexDetails().getIndexType().getNumber() > 0) {
            builder.setIndexDetails(security.getSecurityProto().getIndexDetails());
        }

        // Preserve repeated identifiers (e.g. ISIN) from the raw proto round-trip.
        // The primary identifier added above appears first; any others from the
        // stashed proto append after.
        if (security.getSecurityProto() != null && security.getSecurityProto().getIdentifiersCount() > 0) {
            builder.addAllIdentifiers(security.getSecurityProto().getIdentifiersList());
        }

        // Preserve four fields from the stashed source proto that have no
        // domain-level getter/setter on the Security object, so without this
        // copy they drop on round-trip.
        if (security.getSecurityProto() != null) {
            SecurityProto stash = security.getSecurityProto();

            // instrument_type (tag 16). proto3 enum default is 0 = UNKNOWN;
            // preserve when explicitly set.
            if (stash.getInstrumentType() != InstrumentTypeProto.INSTRUMENT_TYPE_UNKNOWN) {
                builder.setInstrumentType(stash.getInstrumentType());
            }

            // legs (tag 17, repeated SecurityProto in link mode) —
            // multi-leg strategy packages. Domain object has no leg
            // accessors today, so the stash is the only source.
            if (stash.getLegsCount() > 0) {
                builder.addAllLegs(stash.getLegsList());
            }

            // asset_class: the domain subclasses (BondSecurity, EquitySecurity,
            // CashSecurity) still hardcode legacy free-form strings ("Fixed
            // Income", "Equity", "Cash") in their getAssetClass() overrides,
            // so without this copy the canonical registry string ("RATES",
            // "EQUITY", "CASH") set by the client gets overwritten on the
            // way out. Until the domain subclasses are aligned with the
            // registry, the stash is the truth.
            String stashedAssetClass = stash.getAssetClass();
            if (stashedAssetClass != null && !stashedAssetClass.isEmpty()) {
                builder.setAssetClass(stashedAssetClass);
            }

            // product_type: EquitySecurity hardcodes getProductType() →
            // COMMON_STOCK so PREFERRED_STOCK / ADR / ETF all collapse to
            // COMMON_STOCK on the upstream serialize. Same fix shape as
            // asset_class — the stashed proto's value is the source of
            // truth. Removable once the domain subclasses dispatch to the
            // registry.
            ProductTypeProto stashedProductType = stash.getProductType();
            if (stashedProductType != ProductTypeProto.PRODUCT_TYPE_UNKNOWN
                    && stashedProductType != builder.getProductType()) {
                builder.setProductType(stashedProductType);
            }

            // Bitemporal fields (valid_from tag 8, valid_to tag 9). The domain
            // object's lazy getters now decode these from the stashed proto
            // (FinTekkers/second-brain#338); preserving them on serialize is the
            // symmetric write-side fix so a round-trip is lossless.
            //
            // setValidTo() takes precedence over the stash when explicitly
            // set, including setValidTo(null) for resurrection per #316 §2.2.
            // The Security wrapper's getValidTo() already honors that priority.
            ZonedDateTime explicitValidTo = security.getValidTo();
            if (explicitValidTo != null) {
                builder.setValidTo(ProtoSerializationUtil.serializeTimestamp(explicitValidTo));
            } else if (stash.hasValidTo()) {
                // No explicit set AND no proto-decoded value would mean
                // getValidTo() returned null. But if stash.hasValidTo() is true,
                // getValidTo() lazy-decoded it; the null branch above runs only
                // for the explicit-clear-via-setValidTo(null) resurrection case.
                // In that resurrection case, we deliberately do NOT propagate
                // the stale stash value — the explicit clear wins.
                //
                // Unreachable in practice today: if stash has valid_to AND
                // setValidTo(null) was NOT called, getValidTo() returns the
                // decoded value (non-null) so we hit the first branch above.
                // Kept for clarity around the resurrection semantics.
            }

            // valid_from has no domain setter (parent's field is final) so
            // the stash is the only source.
            if (stash.hasValidFrom()) {
                builder.setValidFrom(stash.getValidFrom());
            }

            // Unknown fields — preserve any proto3 unknown bytes (e.g. a future
            // ledger-models release adds a field at a tag this build doesn't
            // know about; the bytes must survive round-trip). See
            // FinTekkers/second-brain#338.
            builder.setUnknownFields(stash.getUnknownFields());
        }

        return builder.build();
    }

    @Override
    public Security deserialize(SecurityProto proto) {
        Security security;

        UUID id = proto.hasUuid()
                ? ProtoSerializationUtil.deserializeUUID(proto.getUuid())
                : null;
        if (id == null) {
            id = UUID.randomUUID();
        }
        ZonedDateTime asOf = ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf());
        String issuer = proto.getIssuerName();

        CashSecurity settlementCurrency = null;
        if (proto.hasSettlementCurrency()) {
            SecurityProto settlementProto = proto.getSettlementCurrency();
            if (settlementProto.getIsLink()) {
                // UUID-only link reference — cannot deserialize to a full CashSecurity without a
                // store lookup. Leave null rather than throwing ClassCastException.
            } else {
                settlementCurrency = (CashSecurity) this.deserialize(settlementProto);
            }
        }

        // bond_details / tips_extension / frn_extension are top-level;
        // the oneof is non_bond_details (Cash/Equity/Index/FxSpot only).
        ProductTypeProto productType = proto.getProductType();
        SecurityProto.NonBondDetailsCase nonBondCase = proto.getNonBondDetailsCase();

        if (productType == ProductTypeProto.PRODUCT_TYPE_UNKNOWN) {
            // Infer from structured shape when product_type is missing.
            if (proto.hasTipsExtension()) {
                productType = ProductTypeProto.TIPS;
            } else if (proto.hasFrnExtension()) {
                productType = ProductTypeProto.TREASURY_FRN;
            } else if (proto.hasBondDetails()) {
                // BOND descendant is ambiguous (TBILL / TREASURY_NOTE / etc.);
                // default to TREASURY_NOTE as the bond-guess.
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
            security = new CashSecurity(id, issuer, asOf);
        } else if (ProductHierarchy.isDescendantOf(productType, "BOND")) {
            validateBondDates(proto);
            security = new BondSerializer().deserializeBondSecurity(proto, id, asOf, issuer, settlementCurrency);
        } else if (ProductHierarchy.isDescendantOf(productType, "STOCK")) {
            security = deserializeEquitySecurity(id, asOf, issuer, settlementCurrency);
        } else if (ProductHierarchy.isDescendantOf(productType, "INDEX")) {
            security = new IndexSecurity(id, issuer, asOf, settlementCurrency);
        } else {
            security = new Security(id, issuer, asOf, settlementCurrency);
        }

        if(!StringUtils.isEmpty(proto.getDescription())) {
            security.setDescription(proto.getDescription());
        }

        // Read the primary entry from the `identifiers` repeated field (tag 42)
        // and surface it on the domain object. Additional identifiers remain
        // on the stashed proto and round-trip via the serialize path. Clear
        // first because some subclass constructors (e.g. CashSecurity) seed
        // an identifier — the wire copy is authoritative on deserialize.
        if (proto.getIdentifiersCount() > 0) {
            Identifier identifier = IdentifierSerializer.getInstance().deserialize(proto.getIdentifiers(0));
            security.getIdentifiers().clear();
            security.addIdentifier(identifier);
        }

        //Adding the security proto so we move other fields around too like the issuance info.
        security.setSecurityProto(proto);

        return security;
    }

    /**
     * Validates that maturity_date is strictly after issue_date for bond-type securities.
     * Reads from the canonical bond_details sub-message.
     * Throws IllegalArgumentException (maps to gRPC INVALID_ARGUMENT at the service layer).
     */
    public void validateBondDates(SecurityProto proto) {
        LocalDateProto issueDate = null;
        LocalDateProto maturityDate = null;

        if (proto.hasBondDetails()) {
            BondDetailsProto bond = proto.getBondDetails();
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

    private void serializeBondSecurityAttributes(BondSecurity security, SecurityProto.Builder builder) {
        ProductTypeProto pt = security.getProductType();
        if (ProductHierarchy.isDescendantOf(pt, "BOND")) {
            builder.setBondDetails(buildBondDetailsProto(security));
        }

        if (pt == ProductTypeProto.TIPS) {
            builder.setTipsExtension(buildTipsExtensionProto(security));
        } else if (pt == ProductTypeProto.TREASURY_FRN) {
            builder.setFrnExtension(buildFrnExtensionProto(security));
        } else if (pt == ProductTypeProto.MORTGAGE_BACKED) {
            builder.setMbsExtension(buildMbsExtensionProto(security));
        }
    }

    private BondDetailsProto buildBondDetailsProto(BondSecurity security) {
        BondDetailsProto.Builder b = BondDetailsProto.newBuilder();
        if (security.getCouponRate() != null)
            b.setCouponRate(ProtoSerializationUtil.serializeBigDecimal(security.getCouponRate()));
        if (security.getCouponType() != null)
            b.setCouponType(CouponTypeProto.valueOf(security.getCouponType().name()));
        if (security.getCouponFrequency() != null)
            b.setCouponFrequency(CouponFrequencyProto.valueOf(security.getCouponFrequency().name()));
        if (security.getFaceValue() != null)
            b.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(security.getFaceValue()));
        if (security.getIssueDate() != null)
            b.setIssueDate(ProtoSerializationUtil.serializeLocalDate(security.getIssueDate()));
        if (security.getDatedDate() != null)
            b.setDatedDate(ProtoSerializationUtil.serializeLocalDate(security.getDatedDate()));
        if (security.getMaturityDate() != null)
            b.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(security.getMaturityDate()));
        // Preserve issuance_info from the stashed bond_details if present.
        if (security.getSecurityProto() != null
                && security.getSecurityProto().hasBondDetails()
                && security.getSecurityProto().getBondDetails().getIssuanceInfoCount() > 0) {
            b.addAllIssuanceInfo(security.getSecurityProto().getBondDetails().getIssuanceInfoList());
        }
        return b.build();
    }

    private TipsExtensionProto buildTipsExtensionProto(BondSecurity security) {
        TipsExtensionProto.Builder b = TipsExtensionProto.newBuilder();
        // TIPS extras live exclusively on tips_extension on the stashed proto.
        if (security.getSecurityProto() != null && security.getSecurityProto().hasTipsExtension()) {
            TipsExtensionProto stashed = security.getSecurityProto().getTipsExtension();
            if (stashed.hasBaseCpi()) b.setBaseCpi(stashed.getBaseCpi());
            if (stashed.hasIndexDate()) b.setIndexDate(stashed.getIndexDate());
            if (stashed.getInflationIndexType().getNumber() > 0)
                b.setInflationIndexType(stashed.getInflationIndexType());
        }
        return b.build();
    }

    private FrnExtensionProto buildFrnExtensionProto(BondSecurity security) {
        FrnExtensionProto.Builder b = FrnExtensionProto.newBuilder();
        // FRN extras live exclusively on frn_extension on the stashed proto.
        if (security.getSecurityProto() != null && security.getSecurityProto().hasFrnExtension()) {
            FrnExtensionProto stashed = security.getSecurityProto().getFrnExtension();
            if (stashed.hasSpread()) b.setSpread(stashed.getSpread());
            if (stashed.getReferenceRateIndex().getNumber() > 0)
                b.setReferenceRateIndex(stashed.getReferenceRateIndex());
            if (stashed.getResetFrequency().getNumber() > 0)
                b.setResetFrequency(stashed.getResetFrequency());
        }
        return b.build();
    }

    private MbsExtensionProto buildMbsExtensionProto(BondSecurity security) {
        MbsExtensionProto.Builder b = MbsExtensionProto.newBuilder();
        // MBS extras live exclusively on mbs_extension on the stashed proto.
        if (security.getSecurityProto() != null && security.getSecurityProto().hasMbsExtension()) {
            MbsExtensionProto stashed = security.getSecurityProto().getMbsExtension();
            if (stashed.getPoolNumber() != null && !stashed.getPoolNumber().isEmpty())
                b.setPoolNumber(stashed.getPoolNumber());
            if (stashed.getAgency().getNumber() > 0)
                b.setAgency(stashed.getAgency());
            if (stashed.hasWac()) b.setWac(stashed.getWac());
            if (stashed.getWam() != 0) b.setWam(stashed.getWam());
            if (stashed.hasPassThroughRate()) b.setPassThroughRate(stashed.getPassThroughRate());
            if (stashed.hasCurrentFactor()) b.setCurrentFactor(stashed.getCurrentFactor());
            if (stashed.hasOriginalFaceValue()) b.setOriginalFaceValue(stashed.getOriginalFaceValue());
            if (stashed.hasCurrentUpb()) b.setCurrentUpb(stashed.getCurrentUpb());
            if (stashed.hasPsaSpeed()) b.setPsaSpeed(stashed.getPsaSpeed());
        }
        return b.build();
    }

    private void serializeCashAttributes(Security security, SecurityProto.Builder builder) {
        // CashDetailsProto on the non_bond_details oneof is the single canonical
        // home for cash_id.
        if(security instanceof CashSecurity) {
            String cashId = ((CashSecurity) security).getCashId();
            builder.setCashDetails(CashDetailsProto.newBuilder().setCashId(cashId).build());
        } else {
            builder.setSettlementCurrency(this.serialize(security.getSettlementCurrency()));
        }
    }

    private Security deserializeEquitySecurity(UUID id, ZonedDateTime asOf, String issuer, CashSecurity settlementCurrency) {
        return new EquitySecurity(id, issuer, asOf, settlementCurrency);
    }

    /**
     * Returns a JSON serialization of a proto.
     *
     * Enum values are serialized as text (more readable) rather than the number (more efficient), so text and
     *     numbers have to be converted. Non-cash securities have to do a nested serialization of the cash security.
     *
     * @param proto The proto representation of the security
     * @return A human-readable JSON representation that can be deserialized
     */
    @Override
    public String serializeToJson(SecurityProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        String json = gson.toJson(proto);

        JsonObject securityJsonObject = gson.fromJson(json, JsonObject.class);

        ProductTypeProto productType = ProductTypeProto.forNumber(securityJsonObject.get(PRODUCT_TYPE).getAsInt());
        securityJsonObject.add(PRODUCT_TYPE, new JsonPrimitive(productType.name()));

        SecurityQuantityTypeProto quantityType = SecurityQuantityTypeProto.forNumber(securityJsonObject.get(QUANTITY_TYPE).getAsInt());
        securityJsonObject.add(QUANTITY_TYPE, new JsonPrimitive(quantityType.name()));

        // coupon_type / coupon_frequency live inside bond_details; the JSON
        // path doesn't try to round-trip the nested message (the structured
        // shape is consumed via the binary proto path instead).

        securityJsonObject.add(JSONFieldNames.DESCRIPTION, new JsonPrimitive(proto.getDescription()));

        if(!ProductTypeProto.CURRENCY.equals(proto.getProductType())) {
            String cashSecurityJson = serializeToJson(proto.getSettlementCurrency());
            JsonObject cashSecurityJsonObject = gson.fromJson(cashSecurityJson, JsonObject.class);
            securityJsonObject.add(SETTLEMENT_CURRENCY, cashSecurityJsonObject);
        }

        // bond_details / tips_extension / frn_extension are top-level proto
        // fields (not oneof variants) — Gson can round-trip them as nested
        // JSON objects. Only the non_bond_details oneof discriminator needs
        // stripping; Gson serializes oneof variants as separate top-level keys
        // plus a *_case field that doesn't deserialize cleanly.
        securityJsonObject.remove("index_details");
        securityJsonObject.remove("equity_details");
        securityJsonObject.remove("cash_details");
        securityJsonObject.remove("fx_spot_details");
        securityJsonObject.remove("non_bond_details_case");
        securityJsonObject.remove("non_bond_details");

        return securityJsonObject.toString();
    }

    /**
     * Returns a proto from a JSON string.
     *
     * Enum values are serialized as text (more readable) rather than the number (more efficient), so text and
     *     numbers have to be converted. Non-cash securities have to do a nested deserialization of the cash security.
     *
     * @param json JSON
     * @return A security proto
     */
    @Override
    public SecurityProto deserializeFromJson(String json) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();
        JsonObject securityJsonObject = gson.fromJson(json, JsonObject.class);

        String productTypeString = securityJsonObject.get(PRODUCT_TYPE).getAsString();
        ProductTypeProto productType = ProductTypeProto.valueOf(productTypeString);

        SecurityProto settlementSecurityProto = null;

        if(!ProductTypeProto.CURRENCY.equals(productType)) {
            JsonObject settlementSecurityJsonObject = securityJsonObject.getAsJsonObject(SETTLEMENT_CURRENCY);
            settlementSecurityProto = deserializeFromJson(settlementSecurityJsonObject.toString());
            securityJsonObject.remove(SETTLEMENT_CURRENCY);
        }

        securityJsonObject.add(PRODUCT_TYPE,
                new JsonPrimitive(productType.getNumber()));

        String quantityTypeString = securityJsonObject.get(QUANTITY_TYPE).getAsString();
        securityJsonObject.add(QUANTITY_TYPE,
                new JsonPrimitive(SecurityQuantityTypeProto.valueOf(quantityTypeString).getNumber()));

        // Bond fields are nested inside bond_details (a sub-message); the
        // JSON path doesn't attempt to translate nested enum names.

        return serializeSettlementCurrencySecurity(gson, securityJsonObject, settlementSecurityProto);
    }

    private SecurityProto serializeSettlementCurrencySecurity(Gson gson, JsonObject securityJsonObject, SecurityProto settlementSecurityProto) {
        try {
            SecurityProto securityProto = null;

            try {
                securityProto = gson.fromJson(securityJsonObject.toString(), SecurityProto.class);
            }catch (Exception e) {
                System.out.println("");
                throw e;
            }
            if (settlementSecurityProto != null) {
                SecurityProto.Builder builder = SecurityProto.newBuilder(securityProto);
                builder.setSettlementCurrency(settlementSecurityProto);
                securityProto = builder.build();
            }

            return securityProto;
        } catch (Exception e) {
            System.out.println("Problem with: \n"+ securityJsonObject);
            throw e;
        }
    }

}
