package protos.serializers.security;

import common.models.security.*;
import common.models.security.bonds.FloatingRateNote;
import common.models.security.bonds.TIPSBond;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Bond / FRN / TIPS wrapper round-trip tests.
 *
 * <p>Post-#338 refactor: renamed from {@code BondSerializerTest}.
 * Serialize/deserialize entry points are now {@code security.getProto()} and
 * {@code Security.fromProto(proto)} — no separate BondSerializer indirection.
 */
class BondWrapperTest {

    @Test
    public void testBond() {
        BondSecurity bond = new BondSecurity(UUID.randomUUID(), "Issuer", ZonedDateTime.now(),
                CashSecurity.USD);
        setBondFields(bond);

        SecurityProto proto = bond.getProto();
        BondSecurity securityCopy = (BondSecurity) Security.fromProto(proto);

        Assertions.assertEquals(bond, securityCopy);
        Assertions.assertEquals(bond.getCouponFrequency(), securityCopy.getCouponFrequency());
        Assertions.assertEquals(bond.getCouponType(), securityCopy.getCouponType());
        Assertions.assertEquals(bond.getCouponRate(), securityCopy.getCouponRate());
        Assertions.assertEquals(bond.getCouponCurrency(), securityCopy.getCouponCurrency());

        Assertions.assertEquals(bond.getIssueDate(), securityCopy.getIssueDate());
        Assertions.assertEquals(bond.getMaturityDate(), securityCopy.getMaturityDate());
        Assertions.assertEquals(bond.getTenor().getTenor(), securityCopy.getTenor().getTenor());
    }

    private void setBondFields(BondSecurity bond) {
        bond.setIssueDate(LocalDate.now());
        bond.setMaturityDate(LocalDate.now().plusYears(10));
        bond.setFaceValue(BigDecimal.valueOf(1000));
        bond.setCouponFrequency(CouponFrequency.SEMIANNUALLY);
        bond.setCouponType(CouponType.FIXED);
        bond.setCouponRate(BigDecimal.valueOf(.5));
    }

    @Test
    public void testFRN() {
        FloatingRateNote bond = new FloatingRateNote(UUID.randomUUID(), "Issuer", ZonedDateTime.now(),
                CashSecurity.USD);
        setBondFields(bond);
        bond.setCouponType(CouponType.FLOAT);

        SecurityProto proto = bond.getProto();
        FloatingRateNote securityCopy = (FloatingRateNote) Security.fromProto(proto);

        Assertions.assertEquals(bond, securityCopy);
        Assertions.assertEquals(bond.getCouponFrequency(), securityCopy.getCouponFrequency());
        Assertions.assertEquals(bond.getCouponType(), securityCopy.getCouponType());
        Assertions.assertEquals(bond.getCouponCurrency(), securityCopy.getCouponCurrency());

        Assertions.assertEquals(bond.getIssueDate(), securityCopy.getIssueDate());
        Assertions.assertEquals(bond.getMaturityDate(), securityCopy.getMaturityDate());
        Assertions.assertEquals(bond.getTenor().getTenor(), securityCopy.getTenor().getTenor());
    }

    @Test
    public void testTIPS() {
        TIPSBond bond = new TIPSBond(UUID.randomUUID(), "Issuer", ZonedDateTime.now(),
                CashSecurity.USD);
        setBondFields(bond);

        SecurityProto proto = bond.getProto();
        TIPSBond securityCopy = (TIPSBond) Security.fromProto(proto);

        Assertions.assertEquals(bond, securityCopy);
        Assertions.assertEquals(bond.getCouponFrequency(), securityCopy.getCouponFrequency());
        Assertions.assertEquals(bond.getCouponType(), securityCopy.getCouponType());
        Assertions.assertEquals(bond.getCouponRate(), securityCopy.getCouponRate());
        Assertions.assertEquals(bond.getCouponCurrency(), securityCopy.getCouponCurrency());

        Assertions.assertEquals(bond.getIssueDate(), securityCopy.getIssueDate());
        Assertions.assertEquals(bond.getMaturityDate(), securityCopy.getMaturityDate());
        Assertions.assertEquals(bond.getTenor().getTenor(), securityCopy.getTenor().getTenor());
    }
}
