"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const transaction_1 = __importDefault(require("./transaction"));
const transaction_type_1 = require("./transaction_type");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const position_status_pb_1 = require("../../../fintekkers/models/position/position_status_pb");
const security_1 = __importDefault(require("../security/security"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const uuid_1 = require("../utils/uuid");
const decimal_js_1 = require("decimal.js");
const portfolio_test_1 = require("../portfolio/portfolio.test");
test('test Transaction constructor with parameters', () => {
    testTransactionConstructor();
});
function testTransactionConstructor() {
    var _a;
    // Create test data
    const tradeDate = new Date(2024, 0, 15);
    const settlementDate = new Date(2024, 0, 17);
    const asOfDate = new Date(2024, 0, 15, 10, 30, 0);
    const price = new decimal_js_1.Decimal('100.50');
    const quantity = new decimal_js_1.Decimal('1000.00');
    const security = dummySecurity();
    const portfolio = (0, portfolio_test_1.dummyPortfolio)();
    const transactionType = dummyTransactionType();
    // Create Transaction using parameter-based constructor
    const transaction = new transaction_1.default({
        tradeDate,
        settlementDate,
        asOfDate,
        price,
        security,
        transactionType,
        portfolio,
        quantity
    });
    // Verify all getters return expected values
    // getTradeDate() - should match input tradeDate
    const tradeDateFromTransaction = transaction.getTradeDate().toDate();
    assert(tradeDateFromTransaction.getFullYear() === tradeDate.getFullYear());
    assert(tradeDateFromTransaction.getMonth() === tradeDate.getMonth());
    assert(tradeDateFromTransaction.getDate() === tradeDate.getDate());
    // getSettlementDate() - should match input settlementDate
    const settlementDateFromTransaction = transaction.getSettlementDate().toDate();
    assert(settlementDateFromTransaction.getFullYear() === settlementDate.getFullYear());
    assert(settlementDateFromTransaction.getMonth() === settlementDate.getMonth());
    assert(settlementDateFromTransaction.getDate() === settlementDate.getDate());
    // getAsOf() - should match input asOfDate (converted to ZonedDateTime)
    const asOfFromTransaction = transaction.getAsOf();
    const asOfDateTime = asOfFromTransaction.toDateTime().toJSDate();
    // Allow 1 second tolerance for timezone conversion
    const timeDiff = Math.abs(asOfDateTime.getTime() - asOfDate.getTime());
    assert(timeDiff < 1000, `AsOf time difference ${timeDiff}ms exceeds 1 second tolerance`);
    // getPrice() - should return PriceProto with correct price value
    const priceProto = transaction.getPrice();
    const priceValue = (_a = priceProto.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue();
    assert(priceValue === '100.5', `Expected price '100.5', got '${priceValue}'`);
    // getSecurity() - should return Security matching input security
    assert(transaction.getSecurity().getID().toString() === security.getID().toString(), 'Security IDs should match');
    // getTransactionType() - should return TransactionType matching input transactionType
    assert(transaction.getTransactionType().toString() === 'BUY', `Expected 'BUY', got '${transaction.getTransactionType().toString()}'`);
    assert(transaction.getTransactionType().proto === transaction_type_pb_1.TransactionTypeProto.BUY, 'TransactionType proto should be BUY');
    // getPortfolio() - should return Portfolio matching input portfolio
    assert(transaction.getPortfolio().getPortfolioName() === 'Test Portfolio', `Expected 'Test Portfolio', got '${transaction.getPortfolio().getPortfolioName()}'`);
    assert(transaction.getPortfolio().getID().toString() === portfolio.getID().toString(), 'Portfolio IDs should match');
    // getQuantity() - should return Decimal matching input quantity
    assert(transaction.getQuantity().toString() === '1000', `Expected quantity '1000', got '${transaction.getQuantity().toString()}'`);
    assert(transaction.getQuantity().equals(quantity), 'Quantities should be equal');
    // getPositionStatus() - should return EXECUTED (default)
    assert(transaction.getPositionStatus() === position_status_pb_1.PositionStatusProto.EXECUTED, `Expected EXECUTED, got ${transaction.getPositionStatus()}`);
}
function dummySecurity() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Test Issuer")
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Test security"));
}
function dummyTransactionType() {
    return new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.BUY);
}
//# sourceMappingURL=transaction_constructor.test.js.map