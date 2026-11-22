package common.models.security;

import fintekkers.models.security.EquityDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

public class EquitySecurity extends Security {
    public final static String ASSET_CLASS = "Equity";

    /** Primary constructor — wraps a SecurityProto. */
    public EquitySecurity(SecurityProto proto) {
        super(proto);
    }

    /** @deprecated Field-by-field test helper. */
    @Deprecated
    public EquitySecurity(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementSecurity) {
        super(id, issuer, asOf, settlementSecurity);
    }

    @Override
    public String getAssetClass() {
        String stored = super.getAssetClass(); // hydrates link-mode wrappers
        return getProto().getAssetClass().isEmpty() ? ASSET_CLASS : stored;
    }

    /**
     * Whole-number count of shares outstanding at this version's as_of.
     * Returns {@code null} when unknown: no equity_details, the field is absent
     * or the decimal is empty. Never 0 for absent.
     * See docs/adr/equity_shares_outstanding.md.
     */
    public BigDecimal getSharesOutstanding() {
        SecurityProto active = getProto();
        if (!active.hasEquityDetails()) {
            return null;
        }
        EquityDetailsProto details = active.getEquityDetails();
        if (!details.hasSharesOutstanding()
                || ProtoSerializationUtil.isUnsetDecimal(details.getSharesOutstanding())) {
            return null;
        }
        return ProtoSerializationUtil.deserializeBigDecimal(details.getSharesOutstanding());
    }

    @Override
    public QuantityType getQuantityType() {
        return QuantityType.UNITS;
    }

    @Override
    public ProductTypeProto getProductType() {
        return ProductTypeProto.COMMON_STOCK;
    }

    @Override
    protected ProductTypeProto getSubclassProductType() {
        return ProductTypeProto.COMMON_STOCK;
    }
}
