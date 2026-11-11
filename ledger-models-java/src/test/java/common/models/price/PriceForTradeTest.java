package common.models.price;

import common.models.errors.ModelValidationException;
import common.models.errors.NoDefaultPriceTypeError;
import common.models.portfolio.Portfolio;
import common.models.security.BondSecurity;
import common.models.security.EquitySecurity;
import common.models.security.Security;
import common.models.strategy.StrategyAllocation;
import common.models.transaction.Transaction;
import common.models.transaction.TransactionType;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.transaction.CreateTransactionRequestProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-461: {@link Price#forTrade} gives a trade price a typed
 * {@code price_type} (default from hierarchy.json {@code default_price_types}),
 * checked through the {@code Transaction} it is passed to. Parity with Python
 * test_transaction_create.py, JS transaction_constructor.test.ts and Rust
 * create_transaction_test.rs.
 */
@SuppressWarnings("deprecation")
class PriceForTradeTest {

    private static final ZonedDateTime AS_OF = ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));
    private static final UUID SECURITY_ID = UUID.fromString("6f1c5a3e-1d2b-4c5d-8e9f-0a1b2c3d4e5f");
    private static final BigDecimal PRICE = new BigDecimal("99.5");

    private static BondSecurity treasuryNote() {
        return DummyBondObjects.getDummySecurity();
    }

    private static Security security(ProductTypeProto type) {
        return new Security(SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(SECURITY_ID))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(type)
                .build());
    }

    /** A BUY transaction (no derived children) on {@code security} at {@code price}. */
    private static Transaction buy(Security security, Price price) {
        return new Transaction(UUID.randomUUID(), new Portfolio(UUID.randomUUID(), "Fund", AS_OF), price,
                LocalDate.of(2024, 6, 15), LocalDate.of(2024, 6, 17), new BigDecimal("10000"), security,
                TransactionType.BUY, new StrategyAllocation(UUID.randomUUID(), AS_OF), AS_OF, null, null, null);
    }

    private static PriceProto tradePrice(Security security, PriceTypeProto explicit) {
        return buy(security, Price.forTrade(PRICE, security, AS_OF, explicit)).getProto().getPrice();
    }

    // ---------- metric 1 ----------

    @Test
    void treasuryNoteWithOnlyAPriceIsPercentage() {
        BondSecurity note = treasuryNote();
        PriceProto price = buy(note, Price.forTrade(PRICE, note, AS_OF)).getProto().getPrice();

        assertEquals(PriceTypeProto.PERCENTAGE, price.getPriceType());
        assertTrue(PriceRules.validate(price.toBuilder().setSecurity(note.getProto()).build()).isEmpty());
    }

    @Test
    void stockWithOnlyAPriceIsAbsolute() {
        Security stock = DummyEquityObjects.getDummySecurity();
        PriceProto price = buy(stock, Price.forTrade(PRICE, stock, AS_OF)).getProto().getPrice();

        assertEquals(PriceTypeProto.ABSOLUTE, price.getPriceType());
        assertTrue(PriceRules.validate(price.toBuilder().setSecurity(stock.getProto()).build()).isEmpty());
    }

    @Test
    void explicitPriceTypeOverridesTheDefault() {
        assertEquals(PriceTypeProto.ABSOLUTE, tradePrice(treasuryNote(), PriceTypeProto.ABSOLUTE).getPriceType());
    }

    @Test
    void priceTypeSurvivesTheWire() throws Exception {
        BondSecurity note = treasuryNote();
        Transaction txn = buy(note, Price.forTrade(PRICE, note, AS_OF));
        byte[] wire = CreateTransactionRequestProto.newBuilder()
                .setCreateTransactionInput(txn.getProto()).build().toByteArray();

        CreateTransactionRequestProto parsed = CreateTransactionRequestProto.parseFrom(wire);

        assertEquals(PriceTypeProto.PERCENTAGE, parsed.getCreateTransactionInput().getPrice().getPriceType());
    }

    @Test
    void priceNumberIsUnchanged() {
        PriceProto price = tradePrice(security(ProductTypeProto.TIPS), null);

        assertEquals(PRICE, ProtoSerializationUtil.deserializeBigDecimal(price.getPrice()));
    }

    // ---------- metric 2 ----------

    @Test
    void noDefaultAndNoPriceTypeThrowsNamingTheProductBeforeAnyTransaction() {
        Security fx = security(ProductTypeProto.FX_SPOT);
        Price[] built = new Price[1];

        NoDefaultPriceTypeError e = assertThrows(NoDefaultPriceTypeError.class,
                () -> built[0] = Price.forTrade(PRICE, fx, AS_OF));

        assertEquals(null, built[0]);
        assertInstanceOf(ModelValidationException.class, e);
        assertEquals("FX_SPOT", e.getProductType());
        assertEquals("price.price_type", e.getField());
        assertEquals(SECURITY_ID, e.getObjectId());
        assertTrue(e.getMessage().contains("FX_SPOT"), e.getMessage());
    }

    @Test
    void nullSecurityAndNoPriceTypeThrows() {
        NoDefaultPriceTypeError e = assertThrows(NoDefaultPriceTypeError.class,
                () -> Price.forTrade(PRICE, null, AS_OF));
        assertEquals("PRODUCT_TYPE_UNKNOWN", e.getProductType());
    }

    // ---------- guardrails ----------

    @Test
    void explicitPriceTypePassesThroughOnAProductWithNoDefault() {
        assertEquals(PriceTypeProto.RATE, tradePrice(security(ProductTypeProto.FX_SPOT), PriceTypeProto.RATE).getPriceType());
    }

    @Test
    void explicitUnknownPriceTypeCountsAsOmitted() {
        assertEquals(PriceTypeProto.ABSOLUTE,
                tradePrice(security(ProductTypeProto.COMMON_STOCK), PriceTypeProto.UNKNOWN_PRICE_TYPE).getPriceType());
        assertThrows(NoDefaultPriceTypeError.class,
                () -> Price.forTrade(PRICE, security(ProductTypeProto.FX_SPOT), AS_OF, PriceTypeProto.UNKNOWN_PRICE_TYPE));
    }

    /**
     * Derived legs: the maturation child reuses the parent's typed price and
     * the cash children copy the parent's type (LM-449), so none is UNKNOWN.
     */
    @Test
    void derivedLegsOfATypedBondBuyAreNeverUnknown() {
        BondSecurity note = treasuryNote();
        Transaction parent = buy(note, Price.forTrade(PRICE, note, AS_OF));
        Transaction.addCashImpact(parent);
        Transaction.addDerivedTransactions(parent);

        assertFalse(parent.getChildTransactionsRecursively().isEmpty());
        for (Transaction child : parent.getChildTransactionsRecursively()) {
            PriceTypeProto type = child.getProto().getPrice().getPriceType();
            assertNotEquals(PriceTypeProto.UNKNOWN_PRICE_TYPE, type, child.getTransactionType().name());
            if (child.getTransactionType() == TransactionType.MATURATION) {
                assertEquals(PriceTypeProto.PERCENTAGE, type);
            }
        }
    }
}
