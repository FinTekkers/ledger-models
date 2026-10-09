package common.models.transaction;

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
 * LM-281: {@code Transaction.isMatch} delegates to
 * {@code PositionFilter.matches}, so {@code ASSET_CLASS} filters use the
 * shared {@code assetClassMatches} rule while ordering operators keep their
 * {@code compareTo} behaviour.
 */
class TransactionIsMatchTest {

    private static Transaction txnWithAssetClass(String assetClass) {
        SecurityProto securityProto = SecurityProto.newBuilder()
                .setObjectClass("Security")
                .setVersion("0.0.1")
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(ZonedDateTime.now()))
                .setIssuerName("Test Issuer")
                .setAssetClass(assetClass)
                .build();
        Security security = new Security(securityProto);
        return new Transaction(UUID.randomUUID(), DummyEquityObjects.getDummyPortfolio(),
                Price.getPrice(BigDecimal.TEN, security),
                LocalDate.of(2024, 6, 15), LocalDate.of(2024, 6, 17),
                BigDecimal.TEN, security, TransactionType.BUY, null,
                ZonedDateTime.now(), null, "No Trade Name", EXECUTED);
    }

    @Test
    void assetClassEqualsFixedIncomeMatchesRatesSecurity() {
        Transaction txn = txnWithAssetClass("RATES");

        PositionFilter filter = PositionFilter.from(Field.ASSET_CLASS,
                PositionFilter.Operator.EQUALS, "FIXED_INCOME");

        assertTrue(txn.isMatch(filter));
    }

    @Test
    void assetClassNotEqualsFixedIncomeKeepsEquitySecurity() {
        Transaction equityTxn = txnWithAssetClass("EQUITY");
        Transaction ratesTxn = txnWithAssetClass("RATES");

        PositionFilter filter = PositionFilter.from(Field.ASSET_CLASS,
                PositionFilter.Operator.NOT_EQUALS, "FIXED_INCOME");

        assertTrue(equityTxn.isMatch(filter));
        assertFalse(ratesTxn.isMatch(filter));
    }

    @Test
    void orderingOperatorOnTradeDateKeepsCompareToBehaviour() {
        Transaction txn = txnWithAssetClass("RATES");

        PositionFilter after = PositionFilter.from(Field.TRADE_DATE,
                PositionFilter.Operator.MORE_THAN, LocalDate.of(2024, 1, 1));
        assertTrue(txn.isMatch(after));

        PositionFilter before = PositionFilter.from(Field.TRADE_DATE,
                PositionFilter.Operator.MORE_THAN, LocalDate.of(2024, 12, 31));
        assertFalse(txn.isMatch(before));
    }
}
