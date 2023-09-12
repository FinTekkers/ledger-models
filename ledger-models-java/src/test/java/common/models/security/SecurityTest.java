package common.models.security;

import common.models.postion.Field;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

class SecurityTest {
    @Test
    public void testDescription() {
        CashSecurity settlementCurrency = DummyEquityObjects.getDummySecurity().getSettlementCurrency();
        Assertions.assertTrue(settlementCurrency.getDisplayDescription().contains("USD"));
        Assertions.assertTrue(settlementCurrency.getIssuerName().contains("US Government"));

        Security equitySecurity = DummyEquityObjects.getDummySecurity();
        String issuerName = "Tesla";
        equitySecurity.setIssuerName(issuerName);
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains(equitySecurity.getSecurityId().getIdentifier()));
        Assertions.assertTrue(equitySecurity.getIssuerName().contains(issuerName));
        Assertions.assertTrue(equitySecurity.getField(Field.SECURITY_ISSUER_NAME).toString().contains(issuerName));

        equitySecurity.setSecurityId(null);
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains("EquitySecurity[dummy issuer]"));

        equitySecurity.setSecurityId(new Identifier(IdentifierType.EXCH_TICKER, "MSFT"));
        Assertions.assertTrue(equitySecurity.getDisplayDescription().contains("MSFT"));

        Security bondSecurity = DummyBondObjects.getDummySecurity();
        Assertions.assertTrue(bondSecurity.getDisplayDescription().contains(bondSecurity.getSecurityId().getIdentifier()));

        bondSecurity.setSecurityId(null);
        Assertions.assertTrue(bondSecurity.getDisplayDescription().startsWith("Bond: No Security Id"));
    }
}