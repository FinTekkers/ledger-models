package protos.serializers.security;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import common.models.JSONFieldNames;
import common.models.security.*;
import common.models.security.identifier.Identifier;
import fintekkers.models.security.*;
import org.apache.commons.lang3.StringUtils;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

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

        builder.setSecurityType(security.getSecurityType());

        if(security.getDescription() != null)
            builder.setDescription(security.getDescription());

        serializeCashAttributes(security, builder);

        if(security instanceof EquitySecurity) {
            //Nothing so far
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

        return builder.build();
    }

    @Override
    public Security deserialize(SecurityProto proto) {
        Security security;

        UUID id = ProtoSerializationUtil.deserializeUUID(proto.getUuid());
        ZonedDateTime asOf = ProtoSerializationUtil.deserializeTimestamp(proto.getAsOf());
        String issuer = proto.getIssuerName();

        CashSecurity settlementCurrency = proto.hasSettlementCurrency() ?
                (CashSecurity) this.deserialize(proto.getSettlementCurrency()) : null;

        SecurityTypeProto securityType = proto.getSecurityType();

        switch (securityType) {
            case CASH_SECURITY:
                security = new CashSecurity(id, issuer, asOf);
                break;
            case BOND_SECURITY:
            case TIPS:
            case FRN:
                security = new BondSerializer().deserializeBondSecurity(proto, id, asOf, issuer, settlementCurrency);
                break;
            case EQUITY_SECURITY:
                security = deserializeEquitySecurity(id, asOf, issuer, settlementCurrency);
                break;
            default:
                security = new Security(id, issuer, asOf, settlementCurrency);
                break;
        }

        if(!StringUtils.isEmpty(proto.getDescription())) {
            security.setDescription(proto.getDescription());
        }

        if(proto.hasIdentifier()) {
            Identifier identifier = IdentifierSerializer.getInstance().deserialize(proto.getIdentifier());
            security.setSecurityId(identifier);
        }

        //Adding the security proto so we move other fields around too like the issuance info.
        security.setSecurityProto(proto);

        return security;
    }

    private void serializeBondSecurityAttributes(BondSecurity security, SecurityProto.Builder builder) {
        if(security.getIssueDate() != null)
            builder.setIssueDate(ProtoSerializationUtil.serializeLocalDate(security.getIssueDate()));
        if(security.getDatedDate() != null)
            builder.setDatedDate(ProtoSerializationUtil.serializeLocalDate(security.getDatedDate()));
        if(security.getMaturityDate() != null)
            builder.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(security.getMaturityDate()));
        if(security.getCouponRate() != null)
            builder.setCouponRate(ProtoSerializationUtil.serializeBigDecimal(security.getCouponRate()));;
        if(security.getFaceValue() != null)
            builder.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(security.getFaceValue()));
        if(security.getCouponType() != null)
            builder.setCouponType(CouponTypeProto.valueOf(security.getCouponType().name()));
        if(security.getCouponFrequency() != null)
            builder.setCouponFrequency(CouponFrequencyProto.valueOf(security.getCouponFrequency().name()));
    }

    private void serializeCashAttributes(Security security, SecurityProto.Builder builder) {
        if(security instanceof CashSecurity) {
            builder.setCashId(((CashSecurity) security).getCashId());
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

        SecurityTypeProto securityType = SecurityTypeProto.forNumber(securityJsonObject.get(SECURITY_TYPE).getAsInt());
        securityJsonObject.add(SECURITY_TYPE, new JsonPrimitive(securityType.name()));

        SecurityQuantityTypeProto quantityType = SecurityQuantityTypeProto.forNumber(securityJsonObject.get(QUANTITY_TYPE).getAsInt());
        securityJsonObject.add(QUANTITY_TYPE, new JsonPrimitive(quantityType.name()));

        switch (proto.getSecurityType()) {
            case BOND_SECURITY:
            case FRN:
            case TIPS:
                CouponTypeProto couponType = CouponTypeProto.forNumber(securityJsonObject.get(COUPON_TYPE).getAsInt());
                securityJsonObject.add(COUPON_TYPE, new JsonPrimitive(couponType.name()));
                CouponFrequencyProto frequencyProto = CouponFrequencyProto.forNumber(securityJsonObject.get(COUPON_FREQUENCY).getAsInt());
                securityJsonObject.add(COUPON_FREQUENCY, new JsonPrimitive(frequencyProto.name()));
                break;
            default:
                securityJsonObject.remove(COUPON_FREQUENCY);
                securityJsonObject.remove(COUPON_TYPE);
        }

        securityJsonObject.add(JSONFieldNames.DESCRIPTION, new JsonPrimitive(proto.getDescription()));

        if(!SecurityTypeProto.CASH_SECURITY.equals(proto.getSecurityType())) {
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

        String securityTypeString = securityJsonObject.get(SECURITY_TYPE).getAsString();
        SecurityTypeProto securityType = SecurityTypeProto.valueOf(securityTypeString);

        if(securityJsonObject.has(IDENTIFIER)) {
            String idType = securityJsonObject.get(IDENTIFIER).getAsJsonObject().get(IDENTIFIER_TYPE).getAsString();
            IdentifierTypeProto identifierTypeProto = IdentifierTypeProto.valueOf(idType);
            securityJsonObject.get(IDENTIFIER).getAsJsonObject().add(IDENTIFIER_TYPE,
                    new JsonPrimitive(identifierTypeProto.getNumber()));
        }

        SecurityProto settlementSecurityProto = null;

        if(!SecurityTypeProto.CASH_SECURITY.equals(securityType)) {
            JsonObject settlementSecurityJsonObject = securityJsonObject.getAsJsonObject(SETTLEMENT_CURRENCY);
            settlementSecurityProto = deserializeFromJson(settlementSecurityJsonObject.toString());
            securityJsonObject.remove(SETTLEMENT_CURRENCY);
        }

        securityJsonObject.add(SECURITY_TYPE,
                new JsonPrimitive(securityType.getNumber()));

        String quantityTypeString = securityJsonObject.get(QUANTITY_TYPE).getAsString();
        securityJsonObject.add(QUANTITY_TYPE,
                new JsonPrimitive(SecurityQuantityTypeProto.valueOf(quantityTypeString).getNumber()));

        //Will need to refactor this as number of securities grow
        switch (securityType) {
            case BOND_SECURITY:
            case TIPS:
            case FRN:
                serializeBondCouponInformation(securityJsonObject);
                break;
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
