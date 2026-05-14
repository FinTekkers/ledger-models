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
 * TIPS bonds are issued by the US Treasury and pay a regular coupon. The par value
 * is adjusted according to changes in CPI though the coupon rate is fixed through the life
 * of the bond. From Pimco:
 *
 * "It works like this: Suppose you invest $1,000 in a new 10-year TIPS with a 2% coupon rate.
 * If inflation is 3% over the next year, the face value will be changed to $1,030 and the annual
 * interest payment would be $20.60, or 2% (the coupon rate) of the adjusted principal and so on.
 * In a deflationary environment, the reverse would be true: the face value and interest payments
 * would decrease, but still keep pace with the now lower cost of goods and services."
 *
 * Note: 'Real' yields show the par-value-adjusted-yield, assuming the bond is held to maturity.
 */
public class TIPSBond extends BondSecurity implements IndexLinkedSecurity {
    private BigDecimal spread;
    private Security index;

    public TIPSBond(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
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
    public ProductTypeProto getProductType() {
        return ProductTypeProto.TIPS;
    }

    /**
     * Reference CPI at bond issuance. Reads from the stashed proto's
     * {@code tips_extension.base_cpi}; null if unset.
     */
    public BigDecimal getBaseCpi() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasTipsExtension()) return null;
        TipsExtensionProto tips = proto.getTipsExtension();
        if (!tips.hasBaseCpi()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(tips.getBaseCpi());
    }

    /**
     * The date the base CPI was observed. Reads from the stashed proto's
     * {@code tips_extension.index_date}; null if unset.
     */
    public LocalDate getIndexDate() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasTipsExtension()) return null;
        TipsExtensionProto tips = proto.getTipsExtension();
        if (!tips.hasIndexDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(tips.getIndexDate());
    }

    /**
     * Which inflation index drives par-value adjustment (e.g. CPI_U). Reads
     * from the stashed proto's {@code tips_extension.inflation_index_type}.
     */
    public IndexTypeProto getInflationIndexType() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasTipsExtension()) return IndexTypeProto.UNKNOWN_INDEX_TYPE;
        return proto.getTipsExtension().getInflationIndexType();
    }

    /**
     * Build a TIPS {@link SecurityProto} from the pricer's expected inputs.
     * Populates {@code bond_details} with the shared bond shape plus
     * {@code tips_extension} with the inflation-linked extras, and sets
     * {@code product_type = TIPS}.
     */
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
