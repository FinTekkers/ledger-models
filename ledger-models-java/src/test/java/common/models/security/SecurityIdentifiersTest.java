package common.models.security;

import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.IdentifierTypeProto;
import org.junit.jupiter.api.Test;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityIdentifiersTest {

    private static Security newSecurity() {
        return new Security(UUID.randomUUID(), "Issuer",
                ZonedDateTime.now(), CashSecurity.USD);
    }

    @Test
    public void getIdentifiers_returnsList() {
        Security s = newSecurity();
        s.addIdentifier(new Identifier(IdentifierType.CUSIP, "91282CEP2"));
        s.addIdentifier(new Identifier(IdentifierType.ISIN, "US91282CEP25"));

        List<Identifier> ids = s.getIdentifiers();
        assertEquals(2, ids.size());
        assertEquals(IdentifierType.CUSIP, ids.get(0).getIdentifierType());
        assertEquals("91282CEP2", ids.get(0).getIdentifier());
        assertEquals(IdentifierType.ISIN, ids.get(1).getIdentifierType());
        assertEquals("US91282CEP25", ids.get(1).getIdentifier());
    }

    @Test
    public void getIdentifierByType_findsMatch() {
        Security s = newSecurity();
        s.addIdentifier(new Identifier(IdentifierType.CUSIP, "91282CEP2"));
        s.addIdentifier(new Identifier(IdentifierType.ISIN, "US91282CEP25"));

        Optional<Identifier> isin = s.getIdentifierByType(IdentifierTypeProto.ISIN);
        assertTrue(isin.isPresent());
        assertEquals("US91282CEP25", isin.get().getIdentifier());

        Optional<Identifier> cusip = s.getIdentifierByType(IdentifierTypeProto.CUSIP);
        assertTrue(cusip.isPresent());
        assertEquals("91282CEP2", cusip.get().getIdentifier());
    }

    @Test
    public void getIdentifierByType_returnsEmptyOptionalWhenMissing() {
        Security s = newSecurity();
        s.addIdentifier(new Identifier(IdentifierType.CUSIP, "91282CEP2"));

        Optional<Identifier> figi = s.getIdentifierByType(IdentifierTypeProto.FIGI);
        assertFalse(figi.isPresent());

        Optional<Identifier> none = s.getIdentifierByType(null);
        assertFalse(none.isPresent());
    }
}
