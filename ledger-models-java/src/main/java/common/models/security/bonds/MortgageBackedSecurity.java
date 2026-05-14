package common.models.security.bonds;

import common.models.security.*;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.MbsExtensionProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.bond.AgencyProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * An agency mortgage-backed security (MBS). Pass-through securities issued by
 * FNMA, FHLMC, or GNMA whose cash flows are driven by a pool of underlying
 * mortgages. Pool-specific data (WAC, WAM, current factor, original face,
 * current UPB, PSA speed) lives on {@code mbs_extension}; the shared bond
 * shape (face value, coupon, dates, frequency) lives on {@code bond_details}.
 */
public class MortgageBackedSecurity extends BondSecurity {

    public MortgageBackedSecurity(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    @Override
    public ProductTypeProto getProductType() {
        return ProductTypeProto.MORTGAGE_BACKED;
    }

    /**
     * Issuer-assigned pool identifier (e.g. "FN AS1234"). Reads from the
     * stashed proto's {@code mbs_extension.pool_number}; empty string when
     * {@code mbs_extension} is unset.
     */
    public String getPoolNumber() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return "";
        return proto.getMbsExtension().getPoolNumber();
    }

    /**
     * Issuing agency (FNMA / FHLMC / GNMA). Reads from the stashed proto's
     * {@code mbs_extension.agency}; {@code AGENCY_UNKNOWN} when unset.
     */
    public AgencyProto getAgency() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return AgencyProto.AGENCY_UNKNOWN;
        return proto.getMbsExtension().getAgency();
    }

    /**
     * Weighted average coupon of the underlying mortgages. Reads from the
     * stashed proto's {@code mbs_extension.wac}; null when unset.
     */
    public BigDecimal getWac() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return null;
        MbsExtensionProto mbs = proto.getMbsExtension();
        if (!mbs.hasWac()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(mbs.getWac());
    }

    /**
     * Weighted average maturity (in months) of the underlying mortgages.
     * Reads from the stashed proto's {@code mbs_extension.wam}; 0 when unset.
     */
    public int getWam() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return 0;
        return proto.getMbsExtension().getWam();
    }

    /**
     * Net pass-through rate paid to MBS holders (WAC less servicing and
     * guarantee fees). Reads from the stashed proto's
     * {@code mbs_extension.pass_through_rate}; null when unset.
     */
    public BigDecimal getPassThroughRate() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return null;
        MbsExtensionProto mbs = proto.getMbsExtension();
        if (!mbs.hasPassThroughRate()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(mbs.getPassThroughRate());
    }

    /**
     * Pool factor: ratio of current outstanding principal to original face.
     * Reads from the stashed proto's {@code mbs_extension.current_factor};
     * null when unset.
     */
    public BigDecimal getCurrentFactor() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return null;
        MbsExtensionProto mbs = proto.getMbsExtension();
        if (!mbs.hasCurrentFactor()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(mbs.getCurrentFactor());
    }

    /**
     * Original face value of the pool at issuance. Reads from the stashed
     * proto's {@code mbs_extension.original_face_value}; null when unset.
     */
    public BigDecimal getOriginalFaceValue() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return null;
        MbsExtensionProto mbs = proto.getMbsExtension();
        if (!mbs.hasOriginalFaceValue()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(mbs.getOriginalFaceValue());
    }

    /**
     * Current unpaid principal balance of the pool. Reads from the stashed
     * proto's {@code mbs_extension.current_upb}; null when unset.
     */
    public BigDecimal getCurrentUpb() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return null;
        MbsExtensionProto mbs = proto.getMbsExtension();
        if (!mbs.hasCurrentUpb()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(mbs.getCurrentUpb());
    }

    /**
     * PSA prepayment speed assumption (100 PSA = baseline curve). Reads from
     * the stashed proto's {@code mbs_extension.psa_speed}; null when unset.
     */
    public BigDecimal getPsaSpeed() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasMbsExtension()) return null;
        MbsExtensionProto mbs = proto.getMbsExtension();
        if (!mbs.hasPsaSpeed()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(mbs.getPsaSpeed());
    }

    /**
     * Build an MBS {@link SecurityProto} from the pricer's expected inputs.
     * Populates {@code bond_details} with the shared bond shape plus
     * {@code mbs_extension} with the pool-specific extras, and sets
     * {@code product_type = MORTGAGE_BACKED}.
     */
    public static SecurityProto fromPricerInputs(BigDecimal faceValue,
                                                 BigDecimal couponRate,
                                                 CouponTypeProto couponType,
                                                 CouponFrequencyProto couponFrequency,
                                                 LocalDate issueDate,
                                                 LocalDate maturityDate,
                                                 String poolNumber,
                                                 AgencyProto agency,
                                                 BigDecimal wac,
                                                 int wam,
                                                 BigDecimal passThroughRate,
                                                 BigDecimal currentFactor,
                                                 BigDecimal originalFaceValue,
                                                 BigDecimal currentUpb,
                                                 BigDecimal psaSpeed) {
        MbsExtensionProto.Builder mbs = MbsExtensionProto.newBuilder();
        if (poolNumber != null)
            mbs.setPoolNumber(poolNumber);
        if (agency != null)
            mbs.setAgency(agency);
        if (wac != null)
            mbs.setWac(ProtoSerializationUtil.serializeBigDecimal(wac));
        mbs.setWam(wam);
        if (passThroughRate != null)
            mbs.setPassThroughRate(ProtoSerializationUtil.serializeBigDecimal(passThroughRate));
        if (currentFactor != null)
            mbs.setCurrentFactor(ProtoSerializationUtil.serializeBigDecimal(currentFactor));
        if (originalFaceValue != null)
            mbs.setOriginalFaceValue(ProtoSerializationUtil.serializeBigDecimal(originalFaceValue));
        if (currentUpb != null)
            mbs.setCurrentUpb(ProtoSerializationUtil.serializeBigDecimal(currentUpb));
        if (psaSpeed != null)
            mbs.setPsaSpeed(ProtoSerializationUtil.serializeBigDecimal(psaSpeed));

        return SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.MORTGAGE_BACKED)
                .setBondDetails(BondSecurity.buildBondDetails(faceValue, couponRate, couponType,
                        couponFrequency, issueDate, maturityDate))
                .setMbsExtension(mbs.build())
                .build();
    }
}
