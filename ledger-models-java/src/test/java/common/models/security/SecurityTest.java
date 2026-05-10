package common.models.security;

import common.models.postion.Field;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.ProductTypeProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

class SecurityTest {
    @Test
    public void testDescription() {
        CashSecurity settlementCurrency = DummyEquityObjects.getDummySecurity().getSettlementCurrency();
        Assertions.assertTrue(settlementCurrency.getDisplayDescription().contains("USD"));
        Assertions.assertTrue(settlementCurrency.getIssuer().contains("USD"));

        Security equitySecurity = DummyEquityObjects.getDummySecurity();
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains(equitySecurity.getSecurityId().getIdentifier()));
        Assertions.assertTrue(equitySecurity.getIssuer().contains("dummy"));
        Assertions.assertTrue(equitySecurity.getField(Field.SECURITY_ISSUER_NAME).toString().contains("dummy"));

        equitySecurity.setSecurityId(null);
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains("EquitySecurity[dummy issuer]"));

        equitySecurity.setSecurityId(new Identifier(IdentifierType.EXCH_TICKER, "MSFT"));
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains("MSFT"));

        Security bondSecurity = DummyBondObjects.getDummySecurity();
        Assertions.assertTrue(bondSecurity.getDisplayDescription().contains(bondSecurity.getSecurityId().getIdentifier()));

        bondSecurity.setSecurityId(null);
        Assertions.assertTrue(bondSecurity.getDisplayDescription().startsWith("Bond: No Security Id"));
    }

    @Test
    public void testSecurityType() {
        Security equitySecurity = DummyEquityObjects.getDummySecurity();
        Assertions.assertEquals(ProductTypeProto.COMMON_STOCK, equitySecurity.getProductType());

        BondSecurity bondSecurity = DummyBondObjects.getDummySecurity();
        Assertions.assertEquals(ProductTypeProto.TREASURY_NOTE, bondSecurity.getProductType());

        Assertions.assertEquals(ProductTypeProto.CURRENCY, CashSecurity.USD.getProductType());

        Security security = new Security(null, null, null, null);
        Assertions.assertEquals(ProductTypeProto.PRODUCT_TYPE_UNKNOWN, security.getProductType());
    }
}