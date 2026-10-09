package common.models.taxLot;

import common.models.postion.Field;
import common.models.postion.PositionFilter;
import common.models.price.Price;
import common.models.security.Security;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

import static fintekkers.models.position.PositionStatusProto.EXECUTED;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-281: {@code TaxLotDelta.isMatch} delegates to
 * {@code PositionFilter.matches}, so {@code ASSET_CLASS} filters use the
 * shared {@code assetClassMatches} rule while ordering operators keep their
 * {@code compareTo} behaviour.
 */
class TaxLotDeltaIsMatchTest {

    private static TaxLotDelta taxLotWithAssetClass(String assetClass) {
        SecurityProto securityProto = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(ZonedDateTime.now()))
                .setIssuerName("Test Issuer")
                .setAssetClass(assetClass)
                .build();
        Security security = new Security(securityProto);
        return new TaxLotDelta(UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(),
                TaxLotDelta.TaxLotStatus.Open, Price.getPrice(BigDecimal.TEN, security),
                LocalDate.of(2024, 6, 15), null, BigDecimal.TEN, security,
                ZonedDateTime.now(), null, EXECUTED);
    }

    @Test
    void assetClassEqualsFixedIncomeMatchesRatesSecurity() {
        TaxLotDelta taxLot = taxLotWithAssetClass("RATES");

        PositionFilter filter = PositionFilter.from(Field.ASSET_CLASS,
                PositionFilter.Operator.EQUALS, "FIXED_INCOME");

        assertTrue(taxLot.isMatch(filter));
    }

    @Test
    void assetClassNotEqualsFixedIncomeKeepsEquitySecurity() {
        TaxLotDelta equityTaxLot = taxLotWithAssetClass("EQUITY");
        TaxLotDelta ratesTaxLot = taxLotWithAssetClass("RATES");

        PositionFilter filter = PositionFilter.from(Field.ASSET_CLASS,
                PositionFilter.Operator.NOT_EQUALS, "FIXED_INCOME");

        assertTrue(equityTaxLot.isMatch(filter));
        assertFalse(ratesTaxLot.isMatch(filter));
    }

    @Test
    void orderingOperatorOnOpenDateKeepsCompareToBehaviour() {
        TaxLotDelta taxLot = taxLotWithAssetClass("RATES");

        PositionFilter after = PositionFilter.from(Field.TAX_LOT_OPEN_DATE,
                PositionFilter.Operator.LESS_THAN, LocalDate.of(2024, 12, 31));
        assertTrue(taxLot.isMatch(after));

        PositionFilter before = PositionFilter.from(Field.TAX_LOT_OPEN_DATE,
                PositionFilter.Operator.LESS_THAN, LocalDate.of(2024, 1, 1));
        assertFalse(taxLot.isMatch(before));
    }
}
