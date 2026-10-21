package common.models.security;

import common.models.postion.Field;
import common.models.postion.PositionFilter;
import common.models.security.bonds.TIPSBond;
import common.util.LinkCache;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-361: the Bond / Equity / Cash {@code getAssetClass()} overrides return the
 * stored proto {@code asset_class}, falling back to their class constant only
 * when it is empty. So an {@code ASSET_CLASS = RATES} filter matches a bond
 * stored as RATES.
 */
class SecurityAssetClassOverrideTest {

    private UUID id;
    private ZonedDateTime asOf;

    @BeforeEach
    void setup() {
        id = UUID.randomUUID();
        asOf = ZonedDateTime.now().minusHours(1);
        LinkCache.SECURITY.evict(id);
        Security.setFetcher(null);
    }

    @AfterEach
    void teardown() {
        LinkCache.SECURITY.evict(id);
        Security.setFetcher(null);
    }

    private SecurityProto proto(ProductTypeProto productType, String assetClass) {
        SecurityProto.Builder b = SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf))
                .setProductType(productType);
        if (assetClass != null) b.setAssetClass(assetClass);
        return b.build();
    }

    private static boolean filterMatches(String filterCode, Object storedValue) {
        PositionFilter.PositionComparator comparator = PositionFilter
                .from(Field.ASSET_CLASS, PositionFilter.Operator.EQUALS, filterCode)
                .getFilters().get(Field.ASSET_CLASS);
        return PositionFilter.matches(Field.ASSET_CLASS, comparator, storedValue);
    }

    @Test
    void tipsStoredAsRates_returnsRatesAndMatchesHierarchy() {
        TIPSBond tips = new TIPSBond(proto(ProductTypeProto.TIPS, "RATES"));

        String assetClass = tips.getAssetClass();

        assertEquals("RATES", assetClass);
        assertTrue(ProductHierarchy.assetClassMatches("RATES", assetClass));
        assertTrue(ProductHierarchy.assetClassMatches("FIXED_INCOME", assetClass));
        assertFalse(ProductHierarchy.assetClassMatches("CREDIT", assetClass));
    }

    @Test
    void tipsStoredAsRates_filterPathMatchesRatesAndFixedIncome() {
        TIPSBond tips = new TIPSBond(proto(ProductTypeProto.TIPS, "RATES"));

        Object value = tips.getField(Field.ASSET_CLASS);

        assertTrue(filterMatches("RATES", value));
        assertTrue(filterMatches("FIXED_INCOME", value));
        assertFalse(filterMatches("CREDIT", value));
    }

    @Test
    void linkModeBond_hydratesAndReturnsStoredClass() {
        LinkCache.SECURITY.put(id, proto(ProductTypeProto.TREASURY_BOND, "RATES"), asOf);
        BondSecurity link = new BondSecurity(Security.linkOf(id, asOf));

        assertEquals("RATES", link.getAssetClass());
    }

    @Test
    void emptyAssetClass_fallsBackToClassConstant() {
        assertEquals("Fixed Income",
                new BondSecurity(proto(ProductTypeProto.TREASURY_BOND, null)).getAssetClass());
        assertEquals("Equity",
                new EquitySecurity(proto(ProductTypeProto.COMMON_STOCK, null)).getAssetClass());
        assertEquals("Cash",
                new CashSecurity(proto(ProductTypeProto.CURRENCY, null)).getAssetClass());
    }

    @Test
    void bondStoredAsCredit_returnsCredit() {
        String assetClass = new BondSecurity(proto(ProductTypeProto.CORP_BOND, "CREDIT")).getAssetClass();

        assertEquals("CREDIT", assetClass);
        assertTrue(ProductHierarchy.assetClassMatches("CREDIT", assetClass));
        assertFalse(ProductHierarchy.assetClassMatches("RATES", assetClass));
    }

    @Test
    void equityAndCashStoredValue_winsOverConstant() {
        assertEquals("RATES",
                new EquitySecurity(proto(ProductTypeProto.COMMON_STOCK, "RATES")).getAssetClass());
        assertEquals("CREDIT",
                new CashSecurity(proto(ProductTypeProto.CURRENCY, "CREDIT")).getAssetClass());
    }
}
