package common.models.transaction;

import common.models.price.Price;
import common.models.security.CashSecurity;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-449: a bond BUY/SELL whose trade price has no {@code security} (the
 * LS-217 request shape) derives its maturation and cash children without an
 * NPE, and the children keep the parent price's {@code price_type}. The
 * missing security stays absent: it is never filled from the transaction.
 */
class TransactionPriceNoSecurityTest {

    private static final LocalTimestampProto AS_OF = ProtoSerializationUtil.serializeTimestamp(
            ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York")));
    private static final UUID PRICE_ID = UUID.fromString("5d1f3c2a-7b8e-4f60-9a1b-2c3d4e5f6a7b");
    private static final BigDecimal PRICE = new BigDecimal("99.5");

    private static SecurityProto bond() {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(AS_OF)
                .setProductType(ProductTypeProto.CORP_BOND)
                .setAssetClass("Fixed Income")
                .setIssuerName("ACME Corp")
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setCouponRate(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal("6.25")))
                        .setCouponType(CouponTypeProto.FIXED)
                        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
                        .setFaceValue(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal("1000")))
                        .setIssueDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2020, 1, 15)))
                        .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2030, 1, 15))))
                .build();
    }

    /** LS-217: price {uuid, as_of, price, price_type} and no price.security. */
    private static TransactionProto ls217(TransactionTypeProto type) {
        return TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(AS_OF)
                .setTransactionType(type)
                .setSecurity(bond())
                .setPortfolio(PortfolioProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                        .setAsOf(AS_OF)
                        .setPortfolioName("Fund"))
                .setTradeDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 6, 15)))
                .setSettlementDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 6, 17)))
                .setQuantity(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal("10000")))
                .setPrice(PriceProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(PRICE_ID))
                        .setAsOf(AS_OF)
                        .setPrice(ProtoSerializationUtil.serializeBigDecimal(PRICE))
                        .setPriceType(PriceTypeProto.PERCENTAGE))
                .build();
    }

    private static Transaction derived(TransactionTypeProto type) {
        Transaction parent = new Transaction(ls217(type));
        Transaction.addDerivedTransactions(parent);
        return parent;
    }

    private static Transaction childOfType(Transaction parent, TransactionType type) {
        return parent.getChildTransactions().stream()
                .filter(c -> type.equals(c.getTransactionType()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no " + type + " child"));
    }

    private static Transaction cashChild(Transaction parent) {
        List<Transaction> cash = parent.getChildTransactions().stream()
                .filter(c -> c.getSecurity().isCash()).toList();
        assertEquals(1, cash.size(), "exactly one cash child");
        return cash.get(0);
    }

    @ParameterizedTest
    @CsvSource({"BUY, MATURATION", "SELL, MATURATION_OFFSET"})
    void bondBuyAndSell_priceWithoutSecurity_addDerivedTransactionsAddsMaturationAndCash(
            TransactionTypeProto type, TransactionType maturationType) {
        Transaction parent = assertDoesNotThrow(() -> derived(type));

        Transaction maturation = childOfType(parent, maturationType);
        cashChild(maturation);

        // What ledger-service stores next: the parent and every child serialize.
        TransactionSerializer serializer = TransactionSerializer.getInstance();
        assertDoesNotThrow(() -> serializer.serialize(parent));
        for (Transaction child : parent.getChildTransactionsRecursively()) {
            assertDoesNotThrow(() -> serializer.serialize(child), child.getTransactionType().name());
        }
    }

    @ParameterizedTest
    @CsvSource({"BUY, MATURATION", "SELL, MATURATION_OFFSET"})
    void maturationChild_keepsParentPriceUuidValueAndPriceType(
            TransactionTypeProto type, TransactionType maturationType) {
        Transaction maturation = childOfType(derived(type), maturationType);

        Price price = maturation.getPrice();
        assertEquals(PRICE_ID, price.getID());
        assertEquals(0, PRICE.compareTo(price.getPrice()));
        assertEquals(PriceTypeProto.PERCENTAGE, price.getPriceType());
        assertNull(price.getSecurity());

        PriceProto proto = maturation.getProto().getPrice();
        assertEquals(PriceTypeProto.PERCENTAGE, proto.getPriceType());
        // Never filled from the transaction's own security.
        assertFalse(proto.hasSecurity());
        assertTrue(maturation.getProto().hasSecurity());
    }

    @ParameterizedTest
    @CsvSource({"BUY, MATURATION", "SELL, MATURATION_OFFSET"})
    void cashChild_priceKeepsParentPriceType(TransactionTypeProto type, TransactionType maturationType) {
        Transaction maturation = childOfType(derived(type), maturationType);

        Price cash = cashChild(maturation).getPrice();
        assertEquals(PriceTypeProto.PERCENTAGE, cash.getPriceType());
        assertEquals(PriceTypeProto.PERCENTAGE, cashChild(maturation).getProto().getPrice().getPriceType());
        // Still the 1 USD cash price otherwise.
        assertEquals(Price.getCashPrice().getID(), cash.getID());
        assertEquals(0, BigDecimal.ONE.compareTo(cash.getPrice()));
        assertEquals(CashSecurity.USD.getID(), cash.getSecurity().getID());
    }

    @Test
    void cashChild_untypedParent_isTheCashPrice() {
        TransactionProto untyped = ls217(TransactionTypeProto.BUY).toBuilder()
                .setPrice(ls217(TransactionTypeProto.BUY).getPrice().toBuilder().clearPriceType())
                .build();
        Transaction parent = new Transaction(untyped);
        Transaction.addDerivedTransactions(parent);

        Transaction maturation = childOfType(parent, TransactionType.MATURATION);
        assertSame(Price.getCashPrice(), cashChild(maturation).getPrice());
    }
}
