"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const transaction_1 = __importDefault(require("./transaction"));
const transaction_type_1 = require("./transaction_type");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const security_1 = __importDefault(require("../security/security"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const decimal_js_1 = require("decimal.js");
const portfolio_test_1 = require("../portfolio/portfolio.test");
test('test Transaction createCashTransaction', () => {
    testCreateCashTransaction();
});
test('test Transaction addMaturationTransaction', () => {
    testAddMaturationTransaction();
});
test('test Transaction addDerivedTransactions', () => {
    testAddDerivedTransactions();
});
test('test Transaction addCashImpact', () => {
    testAddCashImpact();
});
test('test Transaction helper methods', () => {
    testHelperMethods();
});
function testCreateCashTransaction() {
    // Test BUY transaction -> WITHDRAWAL
    const buyTransaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.BUY);
    const cashSecurity = createCashSecurity();
    const cashTransaction = transaction_1.default.createCashTransaction(cashSecurity, buyTransaction);
    assert(cashTransaction.getTransactionType().proto === transaction_type_pb_1.TransactionTypeProto.WITHDRAWAL, 'BUY transaction should create WITHDRAWAL cash transaction');
    assert(cashTransaction.getSecurity().proto.getSecurityType() === security_type_pb_1.SecurityTypeProto.CASH_SECURITY, 'Cash transaction should have cash security');
    assert(buyTransaction.getChildrenTransactions().length === 1, 'Parent transaction should have one child');
    const foundCash = buyTransaction.getCashTransaction();
    assert(foundCash !== null && foundCash.getID().toString() === cashTransaction.getID().toString(), 'getCashTransaction should return the created cash transaction');
    // Test SELL transaction -> DEPOSIT
    const sellTransaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.SELL);
    const cashTransaction2 = transaction_1.default.createCashTransaction(cashSecurity, sellTransaction);
    assert(cashTransaction2.getTransactionType().proto === transaction_type_pb_1.TransactionTypeProto.DEPOSIT, 'SELL transaction should create DEPOSIT cash transaction');
}
function testAddMaturationTransaction() {
    const bondTransaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.BUY);
    const maturationType = new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.MATURATION);
    const cashSecurity = createCashSecurity();
    transaction_1.default.addMaturationTransaction(bondTransaction, maturationType, cashSecurity);
    const children = bondTransaction.getChildrenTransactions();
    assert(children.length === 1, 'Should have one child transaction');
    const maturation = new transaction_1.default(children[0]);
    assert(maturation.getTransactionType().proto === transaction_type_pb_1.TransactionTypeProto.MATURATION, 'Child should be MATURATION transaction');
    assert(maturation.getSecurity().getID().toString() === bondTransaction.getSecurity().getID().toString(), 'Maturation should have same security');
    assert(maturation.getQuantity().equals(bondTransaction.getQuantity()), 'Maturation should have same quantity');
}
function testAddDerivedTransactions() {
    const cashSecurity = createCashSecurity();
    // Test BUY bond transaction -> should add MATURATION
    const buyTransaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.BUY);
    transaction_1.default.addDerivedTransactions(buyTransaction, cashSecurity);
    const children = buyTransaction.getChildrenTransactions();
    assert(children.length === 1, 'BUY bond should have one derived transaction');
    const maturation = new transaction_1.default(children[0]);
    assert(maturation.getTransactionType().proto === transaction_type_pb_1.TransactionTypeProto.MATURATION, 'BUY bond should create MATURATION transaction');
    // Test SELL bond transaction -> should add MATURATION_OFFSET
    const sellTransaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.SELL);
    transaction_1.default.addDerivedTransactions(sellTransaction, cashSecurity);
    const children2 = sellTransaction.getChildrenTransactions();
    assert(children2.length === 1, 'SELL bond should have one derived transaction');
    const maturationOffset = new transaction_1.default(children2[0]);
    assert(maturationOffset.getTransactionType().proto === transaction_type_pb_1.TransactionTypeProto.MATURATION_OFFSET, 'SELL bond should create MATURATION_OFFSET transaction');
    // Test non-bond transaction -> should not add derived transactions
    const equityTransaction = createEquityTransaction();
    transaction_1.default.addDerivedTransactions(equityTransaction, cashSecurity);
    assert(equityTransaction.getChildrenTransactions().length === 0, 'Non-bond transaction should not have derived transactions');
}
function testAddCashImpact() {
    const bondTransaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.BUY);
    const cashSecurity = createCashSecurity();
    transaction_1.default.addCashImpact(bondTransaction, cashSecurity);
    assert(bondTransaction.getCashTransaction() !== null, 'Transaction should have cash transaction after addCashImpact');
    // Test that adding cash impact twice throws error
    try {
        transaction_1.default.addCashImpact(bondTransaction, cashSecurity);
        assert(false, 'Should throw error when cash transaction already exists');
    }
    catch (e) {
        assert(e instanceof Error && e.message.includes('already has a cash impact'), 'Should throw error about existing cash impact');
    }
    // Test that cash security transaction doesn't create cash impact
    const cashTransaction = createCashTransaction();
    transaction_1.default.addCashImpact(cashTransaction, cashSecurity);
    assert(cashTransaction.getChildrenTransactions().length === 0, 'Cash security transaction should not create cash impact');
}
function testHelperMethods() {
    const transaction = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.BUY);
    // Test isCashSecurity
    assert(!transaction.isCashSecurity(), 'Bond transaction should not be cash security');
    const cashTransaction = createCashTransaction();
    assert(cashTransaction.isCashSecurity(), 'Cash transaction should be cash security');
    // Test addChildTransaction
    const child = createBondTransaction(transaction_type_pb_1.TransactionTypeProto.SELL);
    transaction.addChildTransaction(child);
    assert(transaction.getChildrenTransactions().length === 1, 'Should have one child after addChildTransaction');
    // Test getCashTransaction
    const cashSecurity = createCashSecurity();
    const cashTxn = transaction_1.default.createCashTransaction(cashSecurity, transaction);
    const foundCash = transaction.getCashTransaction();
    assert(foundCash !== null && foundCash.getID().toString() === cashTxn.getID().toString(), 'getCashTransaction should find the cash child transaction');
}
function createBondTransaction(transactionType) {
    const security = createBondSecurity();
    const portfolio = (0, portfolio_test_1.dummyPortfolio)();
    const tradeDate = new Date(2024, 0, 15);
    const settlementDate = new Date(2024, 0, 17);
    const asOfDate = new Date(2024, 0, 15, 10, 30, 0);
    const price = new decimal_js_1.Decimal('99.50');
    const quantity = new decimal_js_1.Decimal('1000.00');
    return new transaction_1.default({
        tradeDate,
        settlementDate,
        asOfDate,
        price,
        security,
        transactionType: new transaction_type_1.TransactionType(transactionType),
        portfolio,
        quantity
    });
}
function createBondSecurity() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY)
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass('FixedIncome')
        .setIssuerName('Test Issuer')
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2034).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2024).setMonth(1).setDay(1))
        .setAsOf(datetime_1.ZonedDateTime.now().toProto())
        .setDescription('Test bond security'));
}
function createEquityTransaction() {
    const security = security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setSecurityType(security_type_pb_1.SecurityTypeProto.EQUITY_SECURITY)
        .setAssetClass('Equity')
        .setAsOf(datetime_1.ZonedDateTime.now().toProto()));
    const portfolio = (0, portfolio_test_1.dummyPortfolio)();
    return new transaction_1.default({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('100.00'),
        security,
        transactionType: new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.BUY),
        portfolio,
        quantity: new decimal_js_1.Decimal('100.00')
    });
}
function createCashSecurity() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setSecurityType(security_type_pb_1.SecurityTypeProto.CASH_SECURITY)
        .setAssetClass('Cash')
        .setAsOf(datetime_1.ZonedDateTime.now().toProto()));
}
function createCashTransaction() {
    const cashSecurity = createCashSecurity();
    const portfolio = (0, portfolio_test_1.dummyPortfolio)();
    return new transaction_1.default({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('1.0'),
        security: cashSecurity,
        transactionType: new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.DEPOSIT),
        portfolio,
        quantity: new decimal_js_1.Decimal('1000.00')
    });
}
//# sourceMappingURL=transaction.derived.test.js.map