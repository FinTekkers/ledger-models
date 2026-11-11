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
const portfolio_1 = __importDefault(require("../portfolio/portfolio"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const decimal_js_1 = require("decimal.js");
const errors_1 = require("../errors");
const price_rules_1 = require("../price/price_rules");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const create_transaction_request_pb_1 = require("../../../fintekkers/requests/transaction/create_transaction_request_pb");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const portfolio_test_1 = require("../portfolio/portfolio.test");
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const decimal_1 = require("../utils/decimal");
test('test Transaction constructor with parameters', () => {
    testTransactionConstructor();
});
function testTransactionConstructor() {
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
        quantity,
        priceType: price_type_pb_1.PriceTypeProto.PERCENTAGE
    });
    // Verify all getters return expected values
    // getTradeDate() - should match input tradeDate
    const tradeDateFromTransaction = transaction.getTradeDate();
    assert(tradeDateFromTransaction !== null, 'TradeDate should not be null');
    assert(tradeDateFromTransaction.getFullYear() === tradeDate.getFullYear());
    assert(tradeDateFromTransaction.getMonth() === tradeDate.getMonth());
    assert(tradeDateFromTransaction.getDate() === tradeDate.getDate());
    // getSettlementDate() - should match input settlementDate
    const settlementDateFromTransaction = transaction.getSettlementDate();
    assert(settlementDateFromTransaction !== null, 'SettlementDate should not be null');
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
    const priceValue = (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(priceProto.getPrice()));
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
    const bond = new security_pb_1.BondDetailsProto()
        .setFaceValue((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('1000.00')))
        .setCouponRate((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('0.05')))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Test Issuer")
        .setBondDetails(bond)
        .setDescription("Test security"));
}
function dummyTransactionType() {
    return new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.BUY);
}
// LM-272: a non-link TransactionProto with no as_of, or a blank time zone,
// is rejected at construction with a typed error naming the field.
function constructionError(proto) {
    try {
        new transaction_1.default(proto);
    }
    catch (e) {
        return e;
    }
    throw new Error('expected new Transaction(proto) to throw');
}
test('new Transaction(proto) with no as_of throws ModelValidationError naming transaction.as_of', () => {
    const proto = new transaction_pb_1.TransactionProto()
        .setUuid(uuid_1.UUID.random().toUUIDProto());
    const e = constructionError(proto);
    expect(e).toBeInstanceOf(errors_1.ModelValidationError);
    expect(e.field).toBe('transaction.as_of');
});
test.each(['', '   '])('new Transaction(proto) with blank time zone %j names transaction.as_of.time_zone', (zone) => {
    const asOf = datetime_1.ZonedDateTime.now().toProto().setTimeZone(zone);
    const proto = new transaction_pb_1.TransactionProto()
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAsOf(asOf);
    const e = constructionError(proto);
    expect(e).toBeInstanceOf(errors_1.ModelValidationError);
    expect(e.field).toBe('transaction.as_of.time_zone');
});
test('a link-mode TransactionProto with no as_of still builds', () => {
    const link = new transaction_pb_1.TransactionProto().setIsLink(true).setUuid(uuid_1.UUID.random().toUUIDProto());
    const txn = new transaction_1.default(link);
    expect(txn.proto.hasAsOf()).toBe(false);
});
// LM-271: a link portfolio with no as_of serializes, on its own and inside a
// Transaction, and as_of stays unset (never defaulted).
test('link portfolio with no as_of serializes', () => {
    const uuid = uuid_1.UUID.random();
    const link = new portfolio_pb_1.PortfolioProto();
    link.setUuid(uuid.toUUIDProto());
    link.setIsLink(true);
    const portfolio = new portfolio_1.default(link);
    const copy = portfolio_pb_1.PortfolioProto.deserializeBinary(portfolio.proto.serializeBinary());
    assert(copy.getIsLink());
    assert(!copy.hasAsOf());
    const transaction = new transaction_1.default({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('100'),
        security: dummySecurity(),
        transactionType: dummyTransactionType(),
        portfolio,
        quantity: new decimal_js_1.Decimal('10'),
        priceType: price_type_pb_1.PriceTypeProto.PERCENTAGE,
    });
    const txnCopy = transaction_pb_1.TransactionProto.deserializeBinary(transaction.proto.serializeBinary());
    const txnPortfolio = txnCopy.getPortfolio();
    assert(txnPortfolio.getIsLink());
    assert(!txnPortfolio.hasAsOf());
    assert(uuid_1.UUID.fromU8Array(txnPortfolio.getUuid().getRawUuid_asU8()).toString() === uuid.toString());
});
// ---------- LM-461: the trade price carries a typed price_type ----------
const SECURITY_ID = '6f1c5a3e-1d2b-4c5d-8e9f-0a1b2c3d4e5f';
function securityOf(productType) {
    const bond = new security_pb_1.BondDetailsProto()
        .setFaceValue((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('1000.00')))
        .setCouponRate((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('0.05')))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2034).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2024).setMonth(1).setDay(1));
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(SECURITY_ID)).toUUIDProto())
        .setProductType(productType)
        .setAsOf(datetime_1.ZonedDateTime.now().toProto())
        .setBondDetails(bond));
}
function trade(security, priceType, type = transaction_type_pb_1.TransactionTypeProto.BUY) {
    return new transaction_1.default({
        tradeDate: new Date(2024, 5, 15),
        settlementDate: new Date(2024, 5, 17),
        asOfDate: new Date(2024, 5, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('99.5'),
        security: security,
        transactionType: new transaction_type_1.TransactionType(type),
        portfolio: (0, portfolio_test_1.dummyPortfolio)(),
        quantity: new decimal_js_1.Decimal('10000'),
        priceType,
    });
}
function thrown(build) {
    let built;
    try {
        built = build();
    }
    catch (e) {
        return e;
    }
    throw new Error(`expected a throw, got ${built}`);
}
test('LM-461: a Treasury note with only a price is PERCENTAGE', () => {
    const price = trade(securityOf(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)).proto.getPrice();
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.PERCENTAGE);
    expect((0, price_rules_1.validate)(price)).toEqual([]);
});
test('LM-461: a stock with only a price is ABSOLUTE', () => {
    const price = trade(securityOf(product_type_pb_1.ProductTypeProto.COMMON_STOCK)).proto.getPrice();
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.ABSOLUTE);
    expect((0, price_rules_1.validate)(price)).toEqual([]);
});
test('LM-461: an explicit priceType overrides the default', () => {
    const price = trade(securityOf(product_type_pb_1.ProductTypeProto.TREASURY_NOTE), price_type_pb_1.PriceTypeProto.ABSOLUTE).proto.getPrice();
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.ABSOLUTE);
});
test('LM-461: price_type survives the wire', () => {
    const request = new create_transaction_request_pb_1.CreateTransactionRequestProto()
        .setCreateTransactionInput(trade(securityOf(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)).proto);
    const parsed = create_transaction_request_pb_1.CreateTransactionRequestProto.deserializeBinary(request.serializeBinary());
    expect(parsed.getCreateTransactionInput().getPrice().getPriceType()).toBe(price_type_pb_1.PriceTypeProto.PERCENTAGE);
});
test('LM-461: the price number is unchanged', () => {
    const price = trade(securityOf(product_type_pb_1.ProductTypeProto.TIPS)).proto.getPrice();
    expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(price.getPrice()))).toBe('99.5');
});
test('LM-461: no default and no priceType throws NoDefaultPriceTypeError naming the product', () => {
    const e = thrown(() => trade(securityOf(product_type_pb_1.ProductTypeProto.FX_SPOT)));
    expect(e).toBeInstanceOf(errors_1.NoDefaultPriceTypeError);
    expect(e).toBeInstanceOf(errors_1.ModelValidationError);
    const err = e;
    expect(err.productType).toBe('FX_SPOT');
    expect(err.field).toBe('price.price_type');
    expect(err.objectId).toBe(SECURITY_ID);
    expect(err.message).toContain('FX_SPOT');
});
test('LM-461: a null security and no priceType throws NoDefaultPriceTypeError, not TypeError', () => {
    const e = thrown(() => trade(null));
    expect(e).toBeInstanceOf(errors_1.NoDefaultPriceTypeError);
    expect(e.productType).toBe('PRODUCT_TYPE_UNKNOWN');
});
test('LM-461: an explicit priceType passes through on a product with no default', () => {
    const price = trade(securityOf(product_type_pb_1.ProductTypeProto.FX_SPOT), price_type_pb_1.PriceTypeProto.RATE).proto.getPrice();
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.RATE);
});
test('LM-461: an explicit UNKNOWN_PRICE_TYPE counts as omitted', () => {
    const price = trade(securityOf(product_type_pb_1.ProductTypeProto.COMMON_STOCK), price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE).proto.getPrice();
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.ABSOLUTE);
    expect(thrown(() => trade(securityOf(product_type_pb_1.ProductTypeProto.FX_SPOT), price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE)))
        .toBeInstanceOf(errors_1.NoDefaultPriceTypeError);
});
test('LM-461: derived legs: cash is ABSOLUTE whatever the cash product, maturation is PERCENTAGE', () => {
    const parent = trade(securityOf(product_type_pb_1.ProductTypeProto.TREASURY_NOTE));
    // A cash security with no product_type has no table default.
    const cash = security_1.default.create(new security_pb_1.SecurityProto()
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAsOf(datetime_1.ZonedDateTime.now().toProto()));
    transaction_1.default.addDerivedTransactions(parent, cash);
    transaction_1.default.addCashImpact(parent, cash);
    const children = parent.getChildrenTransactions();
    const maturation = children.find(c => c.getTransactionType() === transaction_type_pb_1.TransactionTypeProto.MATURATION);
    expect(maturation.getPrice().getPriceType()).toBe(price_type_pb_1.PriceTypeProto.PERCENTAGE);
    const cashLegs = [...children, ...maturation.getChildtransactionsList()]
        .filter(c => c.getSecurity().getUuid().getRawUuid_asU8().toString() === cash.proto.getUuid().getRawUuid_asU8().toString());
    expect(cashLegs.length).toBe(2);
    for (const leg of cashLegs)
        expect(leg.getPrice().getPriceType()).toBe(price_type_pb_1.PriceTypeProto.ABSOLUTE);
});
//# sourceMappingURL=transaction_constructor.test.js.map