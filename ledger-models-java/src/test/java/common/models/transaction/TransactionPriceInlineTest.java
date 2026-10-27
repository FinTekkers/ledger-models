package common.models.transaction;

import common.models.price.Price;
import common.util.LinkCache;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.LocalTimestamp.LocalTimestampProto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-394: a trade price is a fact of the transaction, not a link to market
 * data. {@link Transaction#getProto()} keeps the Price inline (decimal, uuid,
 * as_of) and strips only its nested Security to a link, so a consumer that
 * persists the proto reads the price back after a cold start with no
 * {@code LinkCache.PRICE} lookup. Security and Portfolio stay links.
 */
class TransactionPriceInlineTest {

    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2024, 6, 15, 10, 30, 0, 0, ZoneId.of("America/New_York"));
    private static final ZonedDateTime PRICE_AS_OF =
            ZonedDateTime.of(2024, 6, 14, 16, 0, 0, 0, ZoneId.of("Europe/London"));
    private static final LocalTimestampProto SECURITY_AS_OF = ProtoSerializationUtil.serializeTimestamp(
            ZonedDateTime.of(2024, 1, 2, 9, 0, 0, 0, ZoneId.of("America/New_York")));

    @BeforeEach
    void clearCaches() {
        LinkCache.PRICE.clear();
        LinkCache.SECURITY.clear();
    }

    private static SecurityProto security() {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(SECURITY_AS_OF)
                .setProductType(ProductTypeProto.COMMON_STOCK)
                .setIssuerName("ACME")
                .build();
    }

    private static PriceProto fullPrice(SecurityProto security, String decimal) {
        return PriceProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(PRICE_AS_OF))
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal(decimal)))
                .setSecurity(security)
                .build();
    }

    private static TransactionProto.Builder txn(SecurityProto security, PriceProto price) {
        return TransactionProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setTransactionType(TransactionTypeProto.BUY)
                .setSecurity(security)
                .setPortfolio(PortfolioProto.newBuilder()
                        .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                        .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                        .setPortfolioName("Fund"))
                .setPrice(price);
    }

    private static void assertInlinePrice(PriceProto original, PriceProto out) {
        assertFalse(out.getIsLink(), "price must stay inline");
        assertEquals(original.getPrice(), out.getPrice());
        assertEquals(original.getUuid(), out.getUuid());
        assertEquals(original.getAsOf(), out.getAsOf());
        assertTrue(out.getSecurity().getIsLink(), "price security must be a link");
        assertEquals(original.getSecurity().getUuid(), out.getSecurity().getUuid());
        assertEquals(original.getSecurity().getAsOf(), out.getSecurity().getAsOf());
    }

    // ---- metric 1

    @Test
    void getProto_keepsPriceInline_andLinksPriceSecurity() {
        SecurityProto security = security();
        PriceProto parentPrice = fullPrice(security, "101.25");
        PriceProto childPrice = fullPrice(security, "1");
        TransactionProto child = txn(security, childPrice).build();
        Transaction t = new Transaction(txn(security, parentPrice).addChildTransactions(child).build());

        TransactionProto out = t.getProto();

        assertInlinePrice(parentPrice, out.getPrice());
        assertEquals(1, out.getChildTransactionsCount());
        assertInlinePrice(childPrice, out.getChildTransactions(0).getPrice());
    }

    // ---- metric 2

    @Test
    void coldStart_getPrice_readsInline_withZeroPriceLookups() throws Exception {
        SecurityProto security = security();
        PriceProto price = fullPrice(security, "101.25");
        byte[] bytes = new Transaction(txn(security, price).build()).getProto().toByteArray();

        // Cold start: nothing this process wrote is cached.
        LinkCache.PRICE.clear();
        LinkCache.SECURITY.clear();
        Price read = new Transaction(TransactionProto.parseFrom(bytes)).getPrice();

        assertEquals(0, read.getPrice().compareTo(new BigDecimal("101.25")));
        assertEquals(ProtoSerializationUtil.deserializeUUID(price.getUuid()), read.getID());
        assertTrue(PRICE_AS_OF.isEqual(read.getAsOf()));
        assertEquals(ProtoSerializationUtil.deserializeUUID(security.getUuid()),
                assertDoesNotThrow(() -> read.getSecurity().getID()));
        assertEquals(0, LinkCache.PRICE.lookupCount());
    }

    @Test
    void lookupCount_countsHitsAndMisses_andClearResets() {
        PriceProto link = PriceProto.newBuilder()
                .setIsLink(true)
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(PRICE_AS_OF))
                .build();
        Transaction t = new Transaction(txn(security(), link).build());

        LinkCache.PRICE.clear();
        assertThrows(IllegalStateException.class, t::getPrice);
        assertEquals(1, LinkCache.PRICE.lookupCount(), "a miss counts");

        LinkCache.PRICE.put(ProtoSerializationUtil.deserializeUUID(link.getUuid()),
                fullPrice(security(), "7").toBuilder().setUuid(link.getUuid()).build(), PRICE_AS_OF);
        assertEquals(0, t.getPrice().getPrice().compareTo(new BigDecimal("7")));
        assertEquals(2, LinkCache.PRICE.lookupCount(), "a hit counts");

        LinkCache.PRICE.clear();
        assertEquals(0, LinkCache.PRICE.lookupCount(), "clear() resets the count");
    }

    // ---- metric 3

    @Test
    void getProto_stillLinksSecurityAndPortfolio() {
        SecurityProto security = security();
        TransactionProto out = new Transaction(txn(security, fullPrice(security, "101.25")).build()).getProto();

        assertTrue(out.getSecurity().getIsLink());
        assertTrue(out.getPortfolio().getIsLink());
    }

    // ---- metric 4 / guardrail 3

    @Test
    void getProto_passesLinkPriceThroughUnchanged() {
        PriceProto link = PriceProto.newBuilder()
                .setIsLink(true)
                .setUuid(ProtoSerializationUtil.serializeUUID(UUID.randomUUID()))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(PRICE_AS_OF))
                .build();
        Transaction t = new Transaction(txn(security(), link).build());

        assertEquals(link, t.getProto().getPrice());

        LinkCache.PRICE.clear();
        IllegalStateException e = assertThrows(IllegalStateException.class, t::getPrice);
        assertTrue(e.getMessage().contains("LinkCache.PRICE miss"), e.getMessage());
        assertFalse(e.getMessage().contains("resolvePricesOnTransactions"), e.getMessage());
    }
}
