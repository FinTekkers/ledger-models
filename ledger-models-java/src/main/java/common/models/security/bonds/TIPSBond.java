package common.models.security.bonds;

import common.models.security.*;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.TipsExtensionProto;
import fintekkers.models.security.index.IndexTypeProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * TIPS bonds. Post-#338 refactor: thin proto wrapper; TIPS extras live on the
 * active proto's {@code tips_extension}.
 */
public class TIPSBond extends BondSecurity implements IndexLinkedSecurity {

    /** Primary constructor — wraps a SecurityProto. */
    public TIPSBond(SecurityProto proto) {
        super(proto);
    }

    /** @deprecated Field-by-field test helper. */
    @Deprecated
    public TIPSBond(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    public Security getIndex() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public void setIndex(Security index) {
        // No-op; not yet wired.
    }

    @Override
    public ProductTypeProto getProductType() {
        return ProductTypeProto.TIPS;
    }

    @Override
    protected ProductTypeProto getSubclassProductType() {
        return ProductTypeProto.TIPS;
    }

    public BigDecimal getBaseCpi() {
        SecurityProto active = getProto();
        if (!active.hasTipsExtension()) return null;
        TipsExtensionProto tips = active.getTipsExtension();
        if (!tips.hasBaseCpi()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(tips.getBaseCpi());
    }

    public LocalDate getIndexDate() {
        SecurityProto active = getProto();
        if (!active.hasTipsExtension()) return null;
        TipsExtensionProto tips = active.getTipsExtension();
        if (!tips.hasIndexDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(tips.getIndexDate());
    }

    public IndexTypeProto getInflationIndexType() {
        SecurityProto active = getProto();
        if (!active.hasTipsExtension()) return IndexTypeProto.UNKNOWN_INDEX_TYPE;
        return active.getTipsExtension().getInflationIndexType();
    }

    public static SecurityProto fromPricerInputs(BigDecimal faceValue,
                                                 BigDecimal couponRate,
                                                 CouponTypeProto couponType,
                                                 CouponFrequencyProto couponFrequency,
                                                 LocalDate issueDate,
                                                 LocalDate maturityDate,
                                                 BigDecimal baseCpi,
                                                 LocalDate indexDate,
                                                 IndexTypeProto inflationIndexType) {
        TipsExtensionProto.Builder tips = TipsExtensionProto.newBuilder();
        if (baseCpi != null)
            tips.setBaseCpi(ProtoSerializationUtil.serializeBigDecimal(baseCpi));
        if (indexDate != null)
            tips.setIndexDate(ProtoSerializationUtil.serializeLocalDate(indexDate));
        if (inflationIndexType != null)
            tips.setInflationIndexType(inflationIndexType);

        return SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TIPS)
                .setBondDetails(BondSecurity.buildBondDetails(faceValue, couponRate, couponType,
                        couponFrequency, issueDate, maturityDate))
                .setTipsExtension(tips.build())
                .build();
    }
}
