package protos.serializers.security;

import common.models.security.*;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.TIPSBond;
import fintekkers.models.security.*;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;

public class BondSerializer {

    public Security deserializeBondSecurity(SecurityProto proto, UUID id, ZonedDateTime asOf, String issuer, CashSecurity settlementCurrency) {
        final BondSecurity bondSecurity = initiatlize(proto, id, asOf, issuer, settlementCurrency);

        // Prefer oneof sub-messages if set, fall back to flat fields for backward compat
        if (proto.hasBondDetails() || proto.hasTipsDetails() || proto.hasFrnDetails()) {
            deserializeFromOneof(proto, bondSecurity);
        } else {
            deserializeFromFlatFields(proto, bondSecurity);
        }

        return bondSecurity;
    }

    /**
     * Deserialize bond fields from the oneof product_details sub-messages.
     * Reads the shared bond fields from whichever sub-message is set,
     * then reads product-specific fields (TIPS: base_cpi, FRN: spread).
     */
    private void deserializeFromOneof(SecurityProto proto, BondSecurity bondSecurity) {
        // All three sub-messages share the same bond base fields at tags 1-8
        DecimalValueProto couponRate = null;
        DecimalValueProto faceValue = null;
        LocalDateProto datedDate = null;
        LocalDateProto issueDate = null;
        LocalDateProto maturityDate = null;
        CouponTypeProto couponType = CouponTypeProto.UNKNOWN_COUPON_TYPE;
        CouponFrequencyProto couponFrequency = CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY;

        if (proto.hasBondDetails()) {
            BondDetailsProto bond = proto.getBondDetails();
            couponRate = bond.hasCouponRate() ? bond.getCouponRate() : null;
            faceValue = bond.hasFaceValue() ? bond.getFaceValue() : null;
            datedDate = bond.hasDatedDate() ? bond.getDatedDate() : null;
            issueDate = bond.hasIssueDate() ? bond.getIssueDate() : null;
            maturityDate = bond.hasMaturityDate() ? bond.getMaturityDate() : null;
            couponType = bond.getCouponType();
            couponFrequency = bond.getCouponFrequency();
        } else if (proto.hasTipsDetails()) {
            TipsDetailsProto tips = proto.getTipsDetails();
            couponRate = tips.hasCouponRate() ? tips.getCouponRate() : null;
            faceValue = tips.hasFaceValue() ? tips.getFaceValue() : null;
            datedDate = tips.hasDatedDate() ? tips.getDatedDate() : null;
            issueDate = tips.hasIssueDate() ? tips.getIssueDate() : null;
            maturityDate = tips.hasMaturityDate() ? tips.getMaturityDate() : null;
            couponType = tips.getCouponType();
            couponFrequency = tips.getCouponFrequency();
        } else if (proto.hasFrnDetails()) {
            FrnDetailsProto frn = proto.getFrnDetails();
            couponRate = frn.hasCouponRate() ? frn.getCouponRate() : null;
            faceValue = frn.hasFaceValue() ? frn.getFaceValue() : null;
            datedDate = frn.hasDatedDate() ? frn.getDatedDate() : null;
            issueDate = frn.hasIssueDate() ? frn.getIssueDate() : null;
            maturityDate = frn.hasMaturityDate() ? frn.getMaturityDate() : null;
            couponType = frn.getCouponType();
            couponFrequency = frn.getCouponFrequency();

            // FRN-specific: spread
            if (bondSecurity instanceof FloatingRateNote && frn.hasSpread()) {
                ((FloatingRateNote) bondSecurity).setSpread(
                        ProtoSerializationUtil.deserializeBigDecimal(frn.getSpread()));
            }
        }

        if (couponRate != null)
            bondSecurity.setCouponRate(ProtoSerializationUtil.deserializeBigDecimal(couponRate));
        if (faceValue != null)
            bondSecurity.setFaceValue(ProtoSerializationUtil.deserializeBigDecimal(faceValue));
        if (datedDate != null)
            bondSecurity.setDatedDate(ProtoSerializationUtil.deserializeLocalDate(datedDate));
        if (issueDate != null)
            bondSecurity.setIssueDate(ProtoSerializationUtil.deserializeLocalDate(issueDate));
        if (maturityDate != null)
            bondSecurity.setMaturityDate(ProtoSerializationUtil.deserializeLocalDate(maturityDate));
        if (!CouponTypeProto.UNKNOWN_COUPON_TYPE.equals(couponType))
            bondSecurity.setCouponType(CouponType.valueOf(couponType.name()));
        if (!CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY.equals(couponFrequency))
            bondSecurity.setCouponFrequency(CouponFrequency.valueOf(couponFrequency.name()));
    }

    /**
     * Deserialize bond fields from the legacy flat fields on SecurityProto.
     * Used when no oneof sub-message is set (backward compatibility with old data).
     */
    private void deserializeFromFlatFields(SecurityProto proto, BondSecurity bondSecurity) {
        if(proto.hasCouponRate())
            bondSecurity.setCouponRate(ProtoSerializationUtil.deserializeBigDecimal(proto.getCouponRate()));

        if(proto.hasFaceValue())
            bondSecurity.setFaceValue(ProtoSerializationUtil.deserializeBigDecimal(proto.getFaceValue()));

        if(proto.hasDatedDate())
            bondSecurity.setDatedDate(ProtoSerializationUtil.deserializeLocalDate(proto.getDatedDate()));

        if(proto.hasIssueDate())
            bondSecurity.setIssueDate(ProtoSerializationUtil.deserializeLocalDate(proto.getIssueDate()));

        if(proto.hasMaturityDate())
            bondSecurity.setMaturityDate(ProtoSerializationUtil.deserializeLocalDate(proto.getMaturityDate()));

        if(!CouponTypeProto.UNKNOWN_COUPON_TYPE.equals(proto.getCouponType()))
            bondSecurity.setCouponType(CouponType.valueOf(proto.getCouponType().name()));

        if(!CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY.equals(proto.getCouponFrequency()))
            bondSecurity.setCouponFrequency(CouponFrequency.valueOf(proto.getCouponFrequency().name()));
    }


    private BondSecurity initiatlize(SecurityProto proto, UUID id, ZonedDateTime asOf,
                                     String issuer, CashSecurity settlementCurrency) {
        SecurityTypeProto securityType = proto.getSecurityType();

        switch (securityType) {
            case BOND_SECURITY:
                return new BondSecurity(id, issuer, asOf, settlementCurrency);
            case TIPS:
                return new TIPSBond(id, issuer, asOf, settlementCurrency);
            case FRN:
                return new FloatingRateNote(id, issuer, asOf, settlementCurrency);
            default:
                throw new RuntimeException(String.format("The security type is not supported %s", securityType.name()));
        }
    }

}
