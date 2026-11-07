package common.models.transaction;

import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.CouponFrequency;
import common.models.security.CouponType;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import common.models.security.bonds.TIPSBond;
import common.models.strategy.Strategy;
import common.models.strategy.StrategyAllocation;
import common.util.ObjectTypes;
import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.transaction.TransactionProto;
import fintekkers.models.transaction.TransactionTypeProto;
import fintekkers.models.util.ObjectTypeProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * LM-444: the transactions behind the golden fixtures in
 * {@code src/test/resources/fixtures/txn_*_lm444.bin}. Every UUID and
 * timestamp is fixed so the same builder gives the same bytes on every run.
 * Uses only public API that exists both before and after LM-444, so
 * {@link GoldenFixtureCapture} ran it against the #340 wrapper and
 * {@code TransactionGoldenBytesTest} runs it against the plain object.
 */
final class TransactionGoldenFixtures {

    static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2026, 11, 6, 9, 30, 15, 123_456_789, ZoneId.of("America/New_York"));
    static final ZonedDateTime VALID_FROM =
            ZonedDateTime.of(2026, 11, 6, 9, 30, 16, 0, ZoneId.of("America/New_York"));
    static final ZonedDateTime VALID_TO =
            ZonedDateTime.of(2026, 11, 7, 11, 0, 0, 500_000_000, ZoneId.of("America/New_York"));
    static final LocalDate TRADE_DATE = LocalDate.of(2026, 11, 6);
    static final LocalDate SETTLEMENT_DATE = LocalDate.of(2026, 11, 9);

    static final UUID PORTFOLIO_ID = UUID.fromString("5f0e6c1a-1b2c-4d3e-8f40-516273849500");
    static final UUID STRATEGY_ALLOCATION_ID = UUID.fromString("5f0e6c1a-1b2c-4d3e-8f40-516273849501");
    static final UUID STRATEGY_ID = UUID.fromString("5f0e6c1a-1b2c-4d3e-8f40-516273849502");

    static final UUID NOTE_ID = UUID.fromString("a1000000-0000-4000-8000-000000000001");
    static final UUID TIPS_ID = UUID.fromString("a1000000-0000-4000-8000-000000000002");
    static final UUID FRN_ID = UUID.fromString("a1000000-0000-4000-8000-000000000003");

    static final UUID BUY_ID = UUID.fromString("b1000000-0000-4000-8000-000000000001");
    static final UUID BUY_CASH_ID = UUID.fromString("b1000000-0000-4000-8000-000000000002");
    static final UUID BUY_MATURITY_ID = UUID.fromString("b1000000-0000-4000-8000-000000000003");
    static final UUID BUY_MATURITY_CASH_ID = UUID.fromString("b1000000-0000-4000-8000-000000000004");

    static final UUID SELL_ID = UUID.fromString("c1000000-0000-4000-8000-000000000001");
    static final UUID SELL_CASH_ID = UUID.fromString("c1000000-0000-4000-8000-000000000002");
    static final UUID SELL_MATURITY_ID = UUID.fromString("c1000000-0000-4000-8000-000000000003");

    static final UUID TIPS_TXN_ID = UUID.fromString("d1000000-0000-4000-8000-000000000001");
    static final UUID TIPS_CASH_ID = UUID.fromString("d1000000-0000-4000-8000-000000000002");
    static final UUID TIPS_MATURITY_ID = UUID.fromString("d1000000-0000-4000-8000-000000000003");

    static final UUID FRN_TXN_ID = UUID.fromString("e1000000-0000-4000-8000-000000000001");
    static final UUID FRN_CASH_ID = UUID.fromString("e1000000-0000-4000-8000-000000000002");
    static final UUID FRN_MATURITY_ID = UUID.fromString("e1000000-0000-4000-8000-000000000003");

    static final UUID PRICE_ID = UUID.fromString("f1000000-0000-4000-8000-000000000001");
    static final UUID CASH_PRICE_ID = UUID.fromString("f1000000-0000-4000-8000-000000000002");

    static final LocalDate NOTE_MATURITY = LocalDate.of(2031, 11, 15);
    static final LocalDate TIPS_MATURITY = LocalDate.of(2034, 7, 15);
    static final LocalDate FRN_MATURITY = LocalDate.of(2027, 10, 31);

    private TransactionGoldenFixtures() {}

    static Portfolio portfolio() {
        return new Portfolio(PORTFOLIO_ID, "SOMA Treasuries", AS_OF);
    }

    static StrategyAllocation strategy() {
        StrategyAllocation allocation = new StrategyAllocation(STRATEGY_ALLOCATION_ID, AS_OF);
        allocation.addAllocation(new Strategy(STRATEGY_ID, "Rates", null, AS_OF), BigDecimal.ONE);
        return allocation;
    }

    /** Built field by field, so its proto starts with no product_type. */
    static BondSecurity note() {
        return withBondFields(new BondSecurity(NOTE_ID, "US Treasury", AS_OF, CashSecurity.USD),
                "91282CJL6", NOTE_MATURITY);
    }

    static TIPSBond tips() {
        return withBondFields(new TIPSBond(TIPS_ID, "US Treasury", AS_OF, CashSecurity.USD),
                "91282CKX7", TIPS_MATURITY);
    }

    private static <T extends BondSecurity> T withBondFields(T bond, String cusip, LocalDate maturity) {
        bond.setCouponFrequency(CouponFrequency.SEMIANNUALLY);
        bond.setCouponType(CouponType.FIXED);
        bond.setCouponRate(new BigDecimal("4.125"));
        bond.addIdentifier(new Identifier(IdentifierType.CUSIP, cusip));
        bond.setFaceValue(BigDecimal.valueOf(1000));
        bond.setDatedDate(LocalDate.of(2024, 11, 15));
        bond.setIssueDate(LocalDate.of(2024, 11, 15));
        bond.setMaturityDate(maturity);
        return bond;
    }

    static Price cashPrice() {
        return new Price(CASH_PRICE_ID, BigDecimal.ONE, CashSecurity.USD, AS_OF);
    }

    /** BUY of a Treasury note: a cash child, and a maturity child with its own cash child. */
    static Transaction buy() {
        BondSecurity note = note();
        return withBondChildren(pojo(BUY_ID, note, new Price(PRICE_ID, new BigDecimal("99.015625"), note, AS_OF),
                        new BigDecimal("1000000.00"), TransactionType.BUY, "LM-444 BUY", PositionStatusProto.EXECUTED),
                BUY_CASH_ID, new BigDecimal("990156.2500000"), TransactionType.WITHDRAWAL,
                BUY_MATURITY_ID, NOTE_MATURITY, TransactionType.MATURATION,
                BUY_MATURITY_CASH_ID);
    }

    /** SELL: no trade name and no position status, so both take the constructor defaults. */
    static Transaction sell() {
        BondSecurity note = note();
        return withBondChildren(pojo(SELL_ID, note, new Price(PRICE_ID, new BigDecimal("100.5"), note, AS_OF),
                        new BigDecimal("500000"), TransactionType.SELL, null, null),
                SELL_CASH_ID, new BigDecimal("502500.0"), TransactionType.DEPOSIT,
                SELL_MATURITY_ID, NOTE_MATURITY, TransactionType.MATURATION_OFFSET,
                null);
    }

    static Transaction tipsBuy() {
        TIPSBond tips = tips();
        return withBondChildren(pojo(TIPS_TXN_ID, tips, new Price(PRICE_ID, new BigDecimal("101.25"), tips, AS_OF),
                        new BigDecimal("250000.00"), TransactionType.BUY, "LM-444 TIPS", PositionStatusProto.INTENDED),
                TIPS_CASH_ID, new BigDecimal("253125.0000"), TransactionType.WITHDRAWAL,
                TIPS_MATURITY_ID, TIPS_MATURITY, TransactionType.MATURATION,
                null);
    }

    @SuppressWarnings("deprecation")
    private static Transaction pojo(UUID id, BondSecurity bond, Price price, BigDecimal quantity,
                                    TransactionType type, String tradeName, PositionStatusProto status) {
        return new Transaction(id, portfolio(), price, TRADE_DATE, SETTLEMENT_DATE, quantity, bond, type,
                strategy(), AS_OF, null, tradeName, status);
    }

    @SuppressWarnings("deprecation")
    private static Transaction withBondChildren(Transaction parent,
                                                UUID cashId, BigDecimal cashAmount, TransactionType cashType,
                                                UUID maturityId, LocalDate maturity, TransactionType maturityType,
                                                UUID maturityCashId) {
        Transaction cash = new Transaction(cashId, parent.getPortfolio(), cashPrice(), TRADE_DATE, SETTLEMENT_DATE,
                cashAmount, CashSecurity.USD, cashType, parent.getStrategyAllocation(), AS_OF, parent,
                parent.getTradeName(), parent.getPositionStatus());
        cash.setPositionStatus(parent.getPositionStatus());
        parent.addChildTransaction(cash);

        Transaction maturation = new Transaction(maturityId, parent.getPortfolio(), parent.getPrice(), maturity,
                maturity.plusDays(2), parent.getQuantity(), parent.getSecurity(), maturityType,
                parent.getStrategyAllocation(), AS_OF, parent, parent.getTradeName(), parent.getPositionStatus());
        parent.addChildTransaction(maturation);

        if (maturityCashId != null) {
            Transaction maturityCash = new Transaction(maturityCashId, parent.getPortfolio(), cashPrice(), maturity,
                    maturity.plusDays(2), parent.getQuantity(), CashSecurity.USD, TransactionType.DEPOSIT,
                    parent.getStrategyAllocation(), AS_OF, maturation, parent.getTradeName(),
                    parent.getPositionStatus());
            maturation.addChildTransaction(maturityCash);
        }
        return parent;
    }

    // ---- FRN: built from a proto with every TransactionProto field set ----

    static SecurityProto frnSecurityProto() {
        return ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY)
                .setUuid(ProtoSerializationUtil.serializeUUID(FRN_ID))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(ProductTypeProto.TREASURY_FRN)
                .setIssuerName("US Treasury")
                .setSettlementCurrency(CashSecurity.USD.getProto())
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setCouponType(CouponTypeProto.FLOAT)
                        .setCouponFrequency(CouponFrequencyProto.QUARTERLY)
                        .setFaceValue(ProtoSerializationUtil.serializeBigDecimal(BigDecimal.valueOf(100)))
                        .setDatedDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2025, 10, 31)))
                        .setIssueDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2025, 10, 31)))
                        .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(FRN_MATURITY)))
                .build();
    }

    private static PortfolioProto portfolioProto() {
        return ObjectTypes.stamp(PortfolioProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PORTFOLIO)
                .setUuid(ProtoSerializationUtil.serializeUUID(PORTFOLIO_ID))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setPortfolioName("SOMA Treasuries")
                .build();
    }

    private static PriceProto priceProto(UUID id, String value, SecurityProto security) {
        return ObjectTypes.stamp(PriceProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_PRICE)
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setPrice(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal(value)))
                .setSecurity(security)
                .build();
    }

    private static TransactionProto.Builder frnNode(UUID id, SecurityProto security, PriceProto price,
                                                    TransactionTypeProto type, String quantity,
                                                    LocalDate tradeDate, LocalDate settlementDate) {
        return ObjectTypes.stamp(TransactionProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_TRANSACTION)
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setValidFrom(ProtoSerializationUtil.serializeTimestamp(VALID_FROM))
                .setValidTo(ProtoSerializationUtil.serializeTimestamp(VALID_TO))
                .setPortfolio(portfolioProto())
                .setSecurity(security)
                .setTransactionType(type)
                .setQuantity(ProtoSerializationUtil.serializeBigDecimal(new BigDecimal(quantity)))
                .setPrice(price)
                .setTradeDate(ProtoSerializationUtil.serializeLocalDate(tradeDate))
                .setSettlementDate(ProtoSerializationUtil.serializeLocalDate(settlementDate))
                .setPositionStatus(PositionStatusProto.EXECUTED)
                .setTradeName("LM-444 FRN")
                .setStrategyAllocation(strategy().getProto())
                .setIsCancelled(true);
    }

    /** Every TransactionProto field set, including valid_from, valid_to, is_cancelled and version. */
    static TransactionProto frnProto() {
        SecurityProto frn = frnSecurityProto();
        SecurityProto usd = CashSecurity.USD.getProto();
        PriceProto price = priceProto(PRICE_ID, "99.984375", frn);
        TransactionProto cash = frnNode(FRN_CASH_ID, usd, priceProto(CASH_PRICE_ID, "1", usd),
                TransactionTypeProto.WITHDRAWAL, "1999687.50000000", TRADE_DATE, SETTLEMENT_DATE).build();
        TransactionProto maturity = frnNode(FRN_MATURITY_ID, frn, price,
                TransactionTypeProto.MATURATION, "2000000.00", FRN_MATURITY, FRN_MATURITY.plusDays(2)).build();
        return frnNode(FRN_TXN_ID, frn, price, TransactionTypeProto.BUY, "2000000.00", TRADE_DATE, SETTLEMENT_DATE)
                .addChildTransactions(cash)
                .addChildTransactions(maturity)
                .build();
    }

    static Transaction frnBuy() {
        return new Transaction(frnProto());
    }
}
