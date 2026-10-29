package protos.serializers;

import com.google.protobuf.InvalidProtocolBufferException;
import fintekkers.models.position.TaxLotProto;
import fintekkers.models.security.MbsExtensionProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.requests.valuation.CashInput;
import fintekkers.requests.valuation.CostBasisInput;
import fintekkers.requests.valuation.EquityInput;
import fintekkers.requests.valuation.MbsInput;
import fintekkers.requests.valuation.ProductInput;
import org.junit.jupiter.api.Test;
import testutil.Decimals;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-408 — the mbs (13), equity (14) and cash (15) ProductInput arms each
 * round-trip through bytes as the same arm, with the security, the price
 * and, for mbs, a non-default cost_basis.
 */
class ProductInputArmsRoundtripTest {

    private static ProductInput roundtrip(ProductInput original) throws InvalidProtocolBufferException {
        return ProductInput.parseFrom(original.toByteArray());
    }

    private static SecurityProto security(ProductTypeProto productType, String issuerName) {
        return SecurityProto.newBuilder()
                .setProductType(productType)
                .setIssuerName(issuerName)
                .build();
    }

    @Test
    void mbsArmRoundTrips() throws InvalidProtocolBufferException {
        SecurityProto security = security(ProductTypeProto.MORTGAGE_BACKED, "FNMA").toBuilder()
                .setMbsExtension(MbsExtensionProto.newBuilder()
                        .setPoolNumber("FN AS1234")
                        .setCurrentFactor(Decimals.decimal("0.8125")))
                .build();
        ProductInput original = ProductInput.newBuilder()
                .setMbs(MbsInput.newBuilder()
                        .setSecurity(security)
                        .setCleanPrice(Decimals.decimal("101.5"))
                        .setCostBasis(CostBasisInput.newBuilder()
                                .addLots(TaxLotProto.newBuilder()
                                        .setOpenDate(LocalDateProto.newBuilder().setYear(2025).setMonth(6).setDay(2))
                                        .setOpenQuantity(Decimals.decimal("250000"))
                                        .setPrice(Decimals.decimal("99.50")))))
                .build();

        ProductInput parsed = roundtrip(original);

        assertEquals(original, parsed);
        assertEquals(ProductInput.InputCase.MBS, parsed.getInputCase());
        MbsInput mbs = parsed.getMbs();
        assertTrue(mbs.hasSecurity());
        assertEquals(ProductTypeProto.MORTGAGE_BACKED, mbs.getSecurity().getProductType());
        assertEquals("FN AS1234", mbs.getSecurity().getMbsExtension().getPoolNumber());
        assertEquals("101.5", Decimals.text(mbs.getCleanPrice()));
        assertTrue(mbs.hasCostBasis());
        assertEquals(1, mbs.getCostBasis().getLotsCount());
        assertEquals("250000", Decimals.text(mbs.getCostBasis().getLots(0).getOpenQuantity()));
        assertEquals("99.50", Decimals.text(mbs.getCostBasis().getLots(0).getPrice()));
    }

    @Test
    void equityArmRoundTrips() throws InvalidProtocolBufferException {
        ProductInput original = ProductInput.newBuilder()
                .setEquity(EquityInput.newBuilder()
                        .setSecurity(security(ProductTypeProto.COMMON_STOCK, "equity"))
                        .setUnitPrice(Decimals.decimal("187.25")))
                .build();

        ProductInput parsed = roundtrip(original);

        assertEquals(original, parsed);
        assertEquals(ProductInput.InputCase.EQUITY, parsed.getInputCase());
        EquityInput equity = parsed.getEquity();
        assertTrue(equity.hasSecurity());
        assertEquals(ProductTypeProto.COMMON_STOCK, equity.getSecurity().getProductType());
        assertEquals("equity", equity.getSecurity().getIssuerName());
        assertEquals("187.25", Decimals.text(equity.getUnitPrice()));
    }

    @Test
    void cashArmRoundTrips() throws InvalidProtocolBufferException {
        ProductInput original = ProductInput.newBuilder()
                .setCash(CashInput.newBuilder()
                        .setSecurity(security(ProductTypeProto.MONEY_MARKET_FUND, "cash"))
                        .setUnitPrice(Decimals.decimal("1.00")))
                .build();

        ProductInput parsed = roundtrip(original);

        assertEquals(original, parsed);
        assertEquals(ProductInput.InputCase.CASH, parsed.getInputCase());
        CashInput cash = parsed.getCash();
        assertTrue(cash.hasSecurity());
        assertEquals(ProductTypeProto.MONEY_MARKET_FUND, cash.getSecurity().getProductType());
        assertEquals("cash", cash.getSecurity().getIssuerName());
        assertEquals("1.00", Decimals.text(cash.getUnitPrice()));
    }
}
