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

        // v0.3.0: shared bond fields live in proto.bond_details; subtype extras
        // co-exist in proto.tips_extension / frn_extension. Fall back to the
        // legacy flat fields when bond_details isn't populated.
        if (proto.hasBondDetails()) {
            deserializeFromBondDetails(proto, bondSecurity);
        } else {
            deserializeFromFlatFields(proto, bondSecurity);
        }

        if (bondSecurity instanceof FloatingRateNote && proto.hasFrnExtension()) {
            FrnExtensionProto frn = proto.getFrnExtension();
            if (frn.hasSpread()) {
                ((FloatingRateNote) bondSecurity).setSpread(
                        ProtoSerializationUtil.deserializeBigDecimal(frn.getSpread()));
            }
        }

        return bondSecurity;
    }

    /**
     * Deserialize bond fields from the single canonical bond_details message.
     */
    private void deserializeFromBondDetails(SecurityProto proto, BondSecurity bondSecurity) {
        BondDetailsProto bond = proto.getBondDetails();
        if (bond.hasCouponRate())
            bondSecurity.setCouponRate(ProtoSerializationUtil.deserializeBigDecimal(bond.getCouponRate()));
        if (bond.hasFaceValue())
            bondSecurity.setFaceValue(ProtoSerializationUtil.deserializeBigDecimal(bond.getFaceValue()));
        if (bond.hasDatedDate())
            bondSecurity.setDatedDate(ProtoSerializationUtil.deserializeLocalDate(bond.getDatedDate()));
        if (bond.hasIssueDate())
            bondSecurity.setIssueDate(ProtoSerializationUtil.deserializeLocalDate(bond.getIssueDate()));
        if (bond.hasMaturityDate())
            bondSecurity.setMaturityDate(ProtoSerializationUtil.deserializeLocalDate(bond.getMaturityDate()));
        if (!CouponTypeProto.UNKNOWN_COUPON_TYPE.equals(bond.getCouponType()))
            bondSecurity.setCouponType(CouponType.valueOf(bond.getCouponType().name()));
        if (!CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY.equals(bond.getCouponFrequency()))
            bondSecurity.setCouponFrequency(CouponFrequency.valueOf(bond.getCouponFrequency().name()));
    }

    /**
     * Deserialize bond fields from the legacy flat fields on SecurityProto.
     * Used when bond_details isn't populated (backward compatibility with
     * the flat-only fixtures still used in some tests).
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
        ProductTypeProto productType = proto.getProductType();

        switch (productType) {
            case TBILL:
            case TREASURY_NOTE:
            case TREASURY_BOND:
            case STRIPS:
            case SOVEREIGN_BOND:
            case CORP_BOND:
            case MUNI_BOND:
                // Bond-shape product types without specialized subclasses share
                // the generic BondSecurity wrapper today. M1.6 collapses this
                // wrapper into the base Security; until then BondSecurity is
                // the bond-fields container. Specialized subclasses below.
                return new BondSecurity(id, issuer, asOf, settlementCurrency);
            case TIPS:
                return new TIPSBond(id, issuer, asOf, settlementCurrency);
            case TREASURY_FRN:
                return new FloatingRateNote(id, issuer, asOf, settlementCurrency);
            default:
                throw new RuntimeException(String.format("The product type is not supported %s", productType.name()));
        }
    }

}
