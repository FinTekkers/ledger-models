package common.models.security;

import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;

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
        return ASSET_CLASS;
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
