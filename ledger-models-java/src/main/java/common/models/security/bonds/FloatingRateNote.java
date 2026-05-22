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
 * A Floating rate bond issued by the US treasury. Post-#338 refactor: thin
 * proto wrapper; FRN extras live on the active proto's {@code frn_extension}.
 */
public class FloatingRateNote extends BondSecurity implements IndexLinkedSecurity {

    /** Primary constructor — wraps a SecurityProto. */
    public FloatingRateNote(SecurityProto proto) {
        super(proto);
    }

    /** @deprecated Field-by-field test helper. */
    @Deprecated
    public FloatingRateNote(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    private FrnExtensionProto.Builder currentFrnExtensionForWrite() {
        SecurityProto.Builder o = ensureOverlay();
        if (o.hasFrnExtension()) {
            return o.getFrnExtension().toBuilder();
        }
        return FrnExtensionProto.newBuilder();
    }

    private void commitFrnExtension(FrnExtensionProto.Builder frn) {
        ensureOverlay().setFrnExtension(frn.build());
    }

    /** Fixed spread over the reference rate, in basis points. */
    public BigDecimal getSpread() {
        SecurityProto active = getProto();
        if (!active.hasFrnExtension() || !active.getFrnExtension().hasSpread()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(active.getFrnExtension().getSpread());
    }

    public void setSpread(BigDecimal spread) {
        FrnExtensionProto.Builder frn = currentFrnExtensionForWrite();
        if (spread == null) {
            frn.clearSpread();
        } else {
            frn.setSpread(ProtoSerializationUtil.serializeBigDecimal(spread));
        }
        commitFrnExtension(frn);
    }

    public Security getIndex() {
        throw new UnsupportedOperationException("Not supported yet. Need to think this through.");
    }

    public void setIndex(Security index) {
        // No-op; index reference not yet wired through the FRN proto extension.
    }

    @Override
    public void setCouponRate(BigDecimal couponRate) {
        super.setCouponRate(couponRate);
    }

    /** FRN treats spread as the effective coupon rate. */
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

    @Override
    protected ProductTypeProto getSubclassProductType() {
        return ProductTypeProto.TREASURY_FRN;
    }

    public IndexTypeProto getReferenceRateIndex() {
        SecurityProto active = getProto();
        if (!active.hasFrnExtension()) return IndexTypeProto.UNKNOWN_INDEX_TYPE;
        return active.getFrnExtension().getReferenceRateIndex();
    }

    public CouponFrequencyProto getResetFrequency() {
        SecurityProto active = getProto();
        if (!active.hasFrnExtension()) return CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY;
        return active.getFrnExtension().getResetFrequency();
    }

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
