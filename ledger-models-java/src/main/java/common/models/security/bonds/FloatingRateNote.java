package common.models.security.bonds;

import common.models.security.*;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.FrnExtensionProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.index.IndexTypeProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * A Floating rate bond issued by the US treasury. The coupon is based on the 13 week bill.
 */
public class FloatingRateNote extends BondSecurity implements IndexLinkedSecurity{
    private BigDecimal spread;
    private Security index;
    private BigDecimal couponRate;

    public FloatingRateNote(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    public BigDecimal getSpread() {
        return spread;
    }

    public void setSpread(BigDecimal spread) {
        this.spread = spread;
    }


    public Security getIndex() {
        throw new UnsupportedOperationException("Not supported yet. Need to think this through:" +
                "" +
                "1a/ Index could just be a security. E.g. Index = Treasury FRN Index. " +
                "Perhaps it would be an index security that has an identifier. It has the logic embedded " +
                "in it that knows how to look up other securities to resolve. In this case the index would have " +
                "to know to find securities with 13 week maturities, find the auction dates, resolve the data " +
                "and stitch it together. Perhaps makes sense to think through the response structure to the client " +
                "before modelling. " +
                "" +
                "Why do we need this:" +
                "* As the rate changes over time, we need the ability to query rates as of a point in time. This " +
                "is needed in turn to calculate interest" +
                "TODO: Given the Fed holdings of this are smaller than TIPS, perhaps we start with TIPS. "
                );
    }

    public void setIndex(Security index) {
        this.index = index;
    }

    @Override
    public void setCouponRate(BigDecimal couponRate) {
        this.couponRate = couponRate;
    }

    /**
     *
     * @return Returns the spread of the FRN
     */
    @Override
    public BigDecimal getCouponRate() {
        return getSpread();
    }

    public BigDecimal getCouponRate(LocalDate asOf) {
        throw new UnsupportedOperationException("Unsupported for FRNs currently. Need to implement");
    }

    @Override
    public CouponType getCouponType() {
        return CouponType.FLOAT;
    }

    @Override
    public ProductTypeProto getProductType() {
        return ProductTypeProto.TREASURY_FRN;
    }

    /**
     * Which floating-rate benchmark this note resets against (e.g. SOFR,
     * T_BILL_13_WEEK). Reads from the stashed proto's
     * {@code frn_extension.reference_rate_index}.
     */
    public IndexTypeProto getReferenceRateIndex() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasFrnExtension()) return IndexTypeProto.UNKNOWN_INDEX_TYPE;
        return proto.getFrnExtension().getReferenceRateIndex();
    }

    /**
     * How often the floating coupon rate resets. Reads from the stashed
     * proto's {@code frn_extension.reset_frequency}.
     */
    public CouponFrequencyProto getResetFrequency() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasFrnExtension()) return CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY;
        return proto.getFrnExtension().getResetFrequency();
    }

    /**
     * Build an FRN {@link SecurityProto} from the pricer's expected inputs.
     * Populates {@code bond_details} with the shared bond shape plus
     * {@code frn_extension} with the floating-rate extras, and sets
     * {@code product_type = TREASURY_FRN}.
     */
    public static SecurityProto fromPricerInputs(BigDecimal faceValue,
                                                 BigDecimal couponRate,
                                                 CouponTypeProto couponType,
                                                 CouponFrequencyProto couponFrequency,
                                                 LocalDate issueDate,
                                                 LocalDate maturityDate,
                                                 BigDecimal spread,
                                                 IndexTypeProto referenceRateIndex,
                                                 CouponFrequencyProto resetFrequency) {
        FrnExtensionProto.Builder frn = FrnExtensionProto.newBuilder();
        if (spread != null)
            frn.setSpread(ProtoSerializationUtil.serializeBigDecimal(spread));
        if (referenceRateIndex != null)
            frn.setReferenceRateIndex(referenceRateIndex);
        if (resetFrequency != null)
            frn.setResetFrequency(resetFrequency);

        return SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TREASURY_FRN)
                .setBondDetails(BondSecurity.buildBondDetails(faceValue, couponRate, couponType,
                        couponFrequency, issueDate, maturityDate))
                .setFrnExtension(frn.build())
                .build();
    }
}
