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

        if(security.getSecurityId() != null) {
            Identifier securityId = security.getSecurityId();
            IdentifierProto proto = IdentifierSerializer.getInstance().serialize(securityId);
            builder.setIdentifier(proto);
        }

        //Preserving the auction data on the issuance proto.
        if(security.getSecurityProto() != null && security.getSecurityProto().getIssuanceInfoCount() > 0) {
            builder.addAllIssuanceInfo(security.getSecurityProto().getIssuanceInfoList());
        }

        //Preserve index_type for INDEX_SECURITY types
        if(security.getSecurityProto() != null && security.getSecurityProto().getIndexType().getNumber() > 0) {
            // Flat field (legacy)
            builder.setIndexType(security.getSecurityProto().getIndexType());
            // oneof (new)
            builder.setIndexDetails(IndexDetailsProto.newBuilder()
                    .setIndexType(security.getSecurityProto().getIndexType())
                    .build());
        }

        // Preserve repeated identifiers (e.g. ISIN) from the raw proto round-trip
        if (security.getSecurityProto() != null && security.getSecurityProto().getIdentifiersCount() > 0) {
            builder.addAllIdentifiers(security.getSecurityProto().getIdentifiersList());
        }

        // Preserve soft-delete marker (deleted_at) — see #188.
        // null/unset = active record, non-null = soft-deleted at this timestamp.
        if (security.getSecurityProto() != null && security.getSecurityProto().hasDeletedAt()) {
            builder.setDeletedAt(security.getSecurityProto().getDeletedAt());
        }

        // v0.2.1: preserve four fields from the stashed source proto that
        // have no domain-level getter/setter on the Security object, so
        // without this copy they drop on round-trip. Same shape as the
        // deleted_at preservation just above. See second-brain#258 for
        // history.
        if (security.getSecurityProto() != null) {
            SecurityProto stash = security.getSecurityProto();

            // instrument_type (tag 16). proto3 enum default is 0 = UNKNOWN;
            // preserve when explicitly set.
            if (stash.getInstrumentType() != InstrumentTypeProto.INSTRUMENT_TYPE_UNKNOWN) {
                builder.setInstrumentType(stash.getInstrumentType());
            }

            // legs (tag 17, repeated SecurityIdProto) — multi-leg strategy
            // packages. Domain object has no leg accessors today, so the
            // stash is the only source.
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

        // Determine type: prefer oneof if set, fall back to product_type enum
        ProductTypeProto productType = proto.getProductType();
        SecurityProto.ProductDetailsCase detailsCase = proto.getProductDetailsCase();

        // If oneof is set but product_type is missing/unknown, infer from oneof.
        // BOND_DETAILS isn't unambiguous (could be TBILL / TREASURY_NOTE /
        // TREASURY_BOND / STRIPS / SOVEREIGN_BOND / CORP_BOND / MUNI_BOND);
        // pick TREASURY_NOTE as the default-bond guess.
        if (productType == ProductTypeProto.PRODUCT_TYPE_UNKNOWN
                && detailsCase != SecurityProto.ProductDetailsCase.PRODUCTDETAILS_NOT_SET) {
            switch (detailsCase) {
                case BOND_DETAILS:   productType = ProductTypeProto.TREASURY_NOTE; break;
                case TIPS_DETAILS:   productType = ProductTypeProto.TIPS; break;
                case FRN_DETAILS:    productType = ProductTypeProto.TREASURY_FRN; break;
                case CASH_DETAILS:   productType = ProductTypeProto.CURRENCY; break;
                case EQUITY_DETAILS: productType = ProductTypeProto.COMMON_STOCK; break;
                case INDEX_DETAILS:  productType = ProductTypeProto.EQUITY_INDEX; break;
            }
        }

        if (productType == ProductTypeProto.CURRENCY) {
            security = new CashSecurity(id, issuer, asOf);
        } else if (ProductHierarchy.isDescendantOf(productType, "BOND")) {
            validateBondDates(proto);
            security = new BondSerializer().deserializeBondSecurity(proto, id, asOf, issuer, settlementCurrency);
        } else if (ProductHierarchy.isDescendantOf(productType, "STOCK")) {
            security = deserializeEquitySecurity(id, asOf, issuer, settlementCurrency);
        } else {
            security = new Security(id, issuer, asOf, settlementCurrency);
        }

        if(!StringUtils.isEmpty(proto.getDescription())) {
            security.setDescription(proto.getDescription());
        }

        if(proto.hasIdentifier()) {
            Identifier identifier = IdentifierSerializer.getInstance().deserialize(proto.getIdentifier());
            security.setSecurityId(identifier);
        } else if (proto.getIdentifiersCount() > 0) {
            // No singular primary identifier — promote the first entry from the repeated list
            Identifier identifier = IdentifierSerializer.getInstance().deserialize(proto.getIdentifiers(0));
            security.setSecurityId(identifier);
        }

        //Adding the security proto so we move other fields around too like the issuance info.
        security.setSecurityProto(proto);

        return security;
    }

    /**
     * Validates that maturity_date is strictly after issue_date for bond-type securities.
     * Reads from the oneof sub-message if present (new path), falls back to flat fields.
     * Throws IllegalArgumentException (maps to gRPC INVALID_ARGUMENT at the service layer).
     */
    public void validateBondDates(SecurityProto proto) {
        LocalDateProto issueDate = null;
        LocalDateProto maturityDate = null;

        // Prefer oneof sub-messages (new path), fall back to flat fields (legacy path)
        if (proto.hasBondDetails()) {
            BondDetailsProto bond = proto.getBondDetails();
            if (bond.hasIssueDate()) issueDate = bond.getIssueDate();
            if (bond.hasMaturityDate()) maturityDate = bond.getMaturityDate();
        } else if (proto.hasTipsDetails()) {
            TipsDetailsProto tips = proto.getTipsDetails();
            if (tips.hasIssueDate()) issueDate = tips.getIssueDate();
            if (tips.hasMaturityDate()) maturityDate = tips.getMaturityDate();
        } else if (proto.hasFrnDetails()) {
            FrnDetailsProto frn = proto.getFrnDetails();
            if (frn.hasIssueDate()) issueDate = frn.getIssueDate();
            if (frn.hasMaturityDate()) maturityDate = frn.getMaturityDate();
        } else {
            // Flat fields (backward compat)
            if (proto.hasIssueDate()) issueDate = proto.getIssueDate();
            if (proto.hasMaturityDate()) maturityDate = proto.getMaturityDate();
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
        // DUAL-WRITE: populate both flat fields (legacy) AND oneof sub-message (new)

        // 1. Flat fields (legacy path — consumed by old clients)
        if(security.getIssueDate() != null)
            builder.setIssueDate(ProtoSerializationUtil.serializeLocalDate(security.getIssueDate()));
        if(security.getDatedDate() != null)
            builder.setDatedDate(ProtoSerializationUtil.serializeLocalDate(security.getDatedDate()));
        if(security.getMaturityDate() != null)
            builder.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(security.getMaturityDate()));
        if(security.getCouponRate() != null)
            builder.setCouponRate(ProtoSerializationUtil.serializeBigDecimal(security.getCouponRate()));
        if(security.getFaceValue() != null)
            builder.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(security.getFaceValue()));
        if(security.getCouponType() != null)
            builder.setCouponType(CouponTypeProto.valueOf(security.getCouponType().name()));
        if(security.getCouponFrequency() != null)
            builder.setCouponFrequency(CouponFrequencyProto.valueOf(security.getCouponFrequency().name()));

        // 2. oneof product_details sub-message (new path)
        ProductTypeProto pt = security.getProductType();
        if (pt == ProductTypeProto.TIPS) {
            builder.setTipsDetails(buildTipsDetailsProto(security));
        } else if (pt == ProductTypeProto.TREASURY_FRN) {
            builder.setFrnDetails(buildFrnDetailsProto(security));
        } else if (ProductHierarchy.isDescendantOf(pt, "BOND")) {
            builder.setBondDetails(buildBondDetailsProto(security));
        }
        // Non-bond product types skip the oneof bond sub-messages.
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
        if (security.getSecurityProto() != null && security.getSecurityProto().getIssuanceInfoCount() > 0)
            b.addAllIssuanceInfo(security.getSecurityProto().getIssuanceInfoList());
        return b.build();
    }

    private TipsDetailsProto buildTipsDetailsProto(BondSecurity security) {
        TipsDetailsProto.Builder b = TipsDetailsProto.newBuilder();
        // Bond base fields
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
        if (security.getSecurityProto() != null && security.getSecurityProto().getIssuanceInfoCount() > 0)
            b.addAllIssuanceInfo(security.getSecurityProto().getIssuanceInfoList());
        // TIPS-specific: read from the flat fields on the source proto
        if (security.getSecurityProto() != null) {
            if (security.getSecurityProto().hasBaseCpi())
                b.setBaseCpi(security.getSecurityProto().getBaseCpi());
            if (security.getSecurityProto().hasIndexDate())
                b.setIndexDate(security.getSecurityProto().getIndexDate());
            if (security.getSecurityProto().getInflationIndexType().getNumber() > 0)
                b.setInflationIndexType(security.getSecurityProto().getInflationIndexType());
        }
        return b.build();
    }

    private FrnDetailsProto buildFrnDetailsProto(BondSecurity security) {
        FrnDetailsProto.Builder b = FrnDetailsProto.newBuilder();
        // Bond base fields
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
        if (security.getSecurityProto() != null && security.getSecurityProto().getIssuanceInfoCount() > 0)
            b.addAllIssuanceInfo(security.getSecurityProto().getIssuanceInfoList());
        // FRN-specific: read from the flat fields on the source proto
        if (security.getSecurityProto() != null) {
            if (security.getSecurityProto().hasSpread())
                b.setSpread(security.getSecurityProto().getSpread());
            if (security.getSecurityProto().getReferenceRateIndex().getNumber() > 0)
                b.setReferenceRateIndex(security.getSecurityProto().getReferenceRateIndex());
            if (security.getSecurityProto().getResetFrequency().getNumber() > 0)
                b.setResetFrequency(security.getSecurityProto().getResetFrequency());
        }
        return b.build();
    }

    private void serializeCashAttributes(Security security, SecurityProto.Builder builder) {
        if(security instanceof CashSecurity) {
            String cashId = ((CashSecurity) security).getCashId();
            // Flat field (legacy)
            builder.setCashId(cashId);
            // oneof (new)
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

        if (ProductHierarchy.isDescendantOf(proto.getProductType(), "BOND")) {
            CouponTypeProto couponType = CouponTypeProto.forNumber(securityJsonObject.get(COUPON_TYPE).getAsInt());
            securityJsonObject.add(COUPON_TYPE, new JsonPrimitive(couponType.name()));
            CouponFrequencyProto frequencyProto = CouponFrequencyProto.forNumber(securityJsonObject.get(COUPON_FREQUENCY).getAsInt());
            securityJsonObject.add(COUPON_FREQUENCY, new JsonPrimitive(frequencyProto.name()));
        } else {
            securityJsonObject.remove(COUPON_FREQUENCY);
            securityJsonObject.remove(COUPON_TYPE);
        }

        securityJsonObject.add(JSONFieldNames.DESCRIPTION, new JsonPrimitive(proto.getDescription()));

        if(!ProductTypeProto.CURRENCY.equals(proto.getProductType())) {
            String cashSecurityJson = serializeToJson(proto.getSettlementCurrency());
            JsonObject cashSecurityJsonObject = gson.fromJson(cashSecurityJson, JsonObject.class);
            securityJsonObject.add(SETTLEMENT_CURRENCY, cashSecurityJsonObject);
        }

        if(securityJsonObject.has(IDENTIFIER)) {
            int idType = securityJsonObject.get(IDENTIFIER).getAsJsonObject().get(IDENTIFIER_TYPE).getAsInt();
            IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.forNumber(idType);
            securityJsonObject.get(IDENTIFIER).getAsJsonObject().add(IDENTIFIER_TYPE,
                    new JsonPrimitive(identifierTypeProto.name()));
        }

        // Strip oneof sub-message fields from JSON output — Gson can't round-trip protobuf oneofs.
        // The JSON path is a legacy human-readable format; the binary proto path handles oneof correctly.
        securityJsonObject.remove("bond_details");
        securityJsonObject.remove("tips_details");
        securityJsonObject.remove("frn_details");
        securityJsonObject.remove("index_details");
        securityJsonObject.remove("equity_details");
        securityJsonObject.remove("cash_details");
        securityJsonObject.remove("product_details_case");
        securityJsonObject.remove("product_details");

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

        if(securityJsonObject.has(IDENTIFIER)) {
            String idType = securityJsonObject.get(IDENTIFIER).getAsJsonObject().get(IDENTIFIER_TYPE).getAsString();
            IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.valueOf(idType);
            securityJsonObject.get(IDENTIFIER).getAsJsonObject().add(IDENTIFIER_TYPE,
                    new JsonPrimitive(identifierTypeProto.getNumber()));
        }

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

        if (ProductHierarchy.isDescendantOf(productType, "BOND")) {
            serializeBondCouponInformation(securityJsonObject);
        }

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

    private void serializeBondCouponInformation(JsonObject securityJsonObject) {
        if(securityJsonObject.has(COUPON_TYPE)) {
            CouponTypeProto couponType = CouponTypeProto.valueOf(securityJsonObject.get(COUPON_TYPE).getAsString());
            securityJsonObject.add(COUPON_TYPE, new JsonPrimitive(couponType.getNumber()));
            CouponFrequencyProto frequencyProto = CouponFrequencyProto.valueOf(securityJsonObject.get(COUPON_FREQUENCY).getAsString());
            securityJsonObject.add(COUPON_FREQUENCY, new JsonPrimitive(frequencyProto.getNumber()));

            if (CouponType.ZERO.name().equals(securityJsonObject.get(COUPON_TYPE).getAsString()) &&
                    securityJsonObject.has(COUPON_RATE)
            ) {
                securityJsonObject.remove(COUPON_RATE);
                //If the coupon type is zero, then there should be no coupon rate, and therefore we
                // remove it. We should change the serialization to not use JSON.
            }
        } else {
            System.out.println("");
        }
    }
}
