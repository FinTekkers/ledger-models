import assert = require('assert');
import Transaction from './transaction';
import { TransactionType } from './transaction_type';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { PositionStatusProto } from '../../../fintekkers/models/position/position_status_pb';
import Security from '../security/security';
import Portfolio from '../portfolio/portfolio';
import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import { Decimal } from 'decimal.js';
import { ModelValidationError, NoDefaultPriceTypeError } from '../errors';
import { validate as validatePrice } from '../price/price_rules';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { CreateTransactionRequestProto } from '../../../fintekkers/requests/transaction/create_transaction_request_pb';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { dummyPortfolio } from '../portfolio/portfolio.test';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';

test('test Transaction constructor with parameters', () => {
    testTransactionConstructor();
});

function testTransactionConstructor(): void {
    // Create test data
    const tradeDate = new Date(2024, 0, 15);
    const settlementDate = new Date(2024, 0, 17);
    const asOfDate = new Date(2024, 0, 15, 10, 30, 0);
    const price = new Decimal('100.50');
    const quantity = new Decimal('1000.00');
    const security = dummySecurity();
    const portfolio = dummyPortfolio();
    const transactionType = dummyTransactionType();

    // Create Transaction using parameter-based constructor
    const transaction = new Transaction({
        tradeDate,
        settlementDate,
        asOfDate,
        price,
        security,
        transactionType,
        portfolio,
        quantity,
        priceType: PriceTypeProto.PERCENTAGE
    });

    // Verify all getters return expected values

    // getTradeDate() - should match input tradeDate
    const tradeDateFromTransaction = transaction.getTradeDate();
    assert(tradeDateFromTransaction !== null, 'TradeDate should not be null');
    assert(tradeDateFromTransaction!.getFullYear() === tradeDate.getFullYear());
    assert(tradeDateFromTransaction!.getMonth() === tradeDate.getMonth());
    assert(tradeDateFromTransaction!.getDate() === tradeDate.getDate());

    // getSettlementDate() - should match input settlementDate
    const settlementDateFromTransaction = transaction.getSettlementDate();
    assert(settlementDateFromTransaction !== null, 'SettlementDate should not be null');
    assert(settlementDateFromTransaction!.getFullYear() === settlementDate.getFullYear());
    assert(settlementDateFromTransaction!.getMonth() === settlementDate.getMonth());
    assert(settlementDateFromTransaction!.getDate() === settlementDate.getDate());

    // getAsOf() - should match input asOfDate (converted to ZonedDateTime)
    const asOfFromTransaction = transaction.getAsOf();
    const asOfDateTime = asOfFromTransaction.toDateTime().toJSDate();
    // Allow 1 second tolerance for timezone conversion
    const timeDiff = Math.abs(asOfDateTime.getTime() - asOfDate.getTime());
    assert(timeDiff < 1000, `AsOf time difference ${timeDiff}ms exceeds 1 second tolerance`);

    // getPrice() - should return PriceProto with correct price value
    const priceProto = transaction.getPrice();
    const priceValue = toCanonicalString(decodeDecimal(priceProto.getPrice()!));
    assert(priceValue === '100.5', `Expected price '100.5', got '${priceValue}'`);

    // getSecurity() - should return Security matching input security
    assert(transaction.getSecurity().getID().toString() === security.getID().toString(), 'Security IDs should match');

    // getTransactionType() - should return TransactionType matching input transactionType
    assert(transaction.getTransactionType().toString() === 'BUY', `Expected 'BUY', got '${transaction.getTransactionType().toString()}'`);
    assert(transaction.getTransactionType().proto === TransactionTypeProto.BUY, 'TransactionType proto should be BUY');

    // getPortfolio() - should return Portfolio matching input portfolio
    assert(transaction.getPortfolio().getPortfolioName() === 'Test Portfolio', `Expected 'Test Portfolio', got '${transaction.getPortfolio().getPortfolioName()}'`);
    assert(transaction.getPortfolio().getID().toString() === portfolio.getID().toString(), 'Portfolio IDs should match');

    // getQuantity() - should return Decimal matching input quantity
    assert(transaction.getQuantity().toString() === '1000', `Expected quantity '1000', got '${transaction.getQuantity().toString()}'`);
    assert(transaction.getQuantity().equals(quantity), 'Quantities should be equal');

    // getPositionStatus() - should return EXECUTED (default)
    assert(transaction.getPositionStatus() === PositionStatusProto.EXECUTED, `Expected EXECUTED, got ${transaction.getPositionStatus()}`);
}

function dummySecurity(): Security {
    const bond = new BondDetailsProto()
        .setFaceValue(encodeDecimal(parseDecimalString('1000.00')))
        .setCouponRate(encodeDecimal(parseDecimalString('0.05')))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    return Security.create(new SecurityProto()
        .setUuid(UUID.random().toUUIDProto())
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Test Issuer")
        .setBondDetails(bond)
        .setDescription("Test security")
    );
}

function dummyTransactionType(): TransactionType {
    return new TransactionType(TransactionTypeProto.BUY);
}

// LM-272: a non-link TransactionProto with no as_of, or a blank time zone,
// is rejected at construction with a typed error naming the field.
function constructionError(proto: TransactionProto): unknown {
    try {
        new Transaction(proto);
    } catch (e) {
        return e;
    }
    throw new Error('expected new Transaction(proto) to throw');
}

test('new Transaction(proto) with no as_of throws ModelValidationError naming transaction.as_of', () => {
    const proto = new TransactionProto()
        .setUuid(UUID.random().toUUIDProto());

    const e = constructionError(proto);
    expect(e).toBeInstanceOf(ModelValidationError);
    expect((e as ModelValidationError).field).toBe('transaction.as_of');
});

test.each(['', '   '])('new Transaction(proto) with blank time zone %j names transaction.as_of.time_zone', (zone) => {
    const asOf = ZonedDateTime.now().toProto().setTimeZone(zone);
    const proto = new TransactionProto()
        .setUuid(UUID.random().toUUIDProto())
        .setAsOf(asOf);

    const e = constructionError(proto);
    expect(e).toBeInstanceOf(ModelValidationError);
    expect((e as ModelValidationError).field).toBe('transaction.as_of.time_zone');
});

test('a link-mode TransactionProto with no as_of still builds', () => {
    const link = new TransactionProto().setIsLink(true).setUuid(UUID.random().toUUIDProto());

    const txn = new Transaction(link);
    expect(txn.proto.hasAsOf()).toBe(false);
});

// LM-271: a link portfolio with no as_of serializes, on its own and inside a
// Transaction, and as_of stays unset (never defaulted).
test('link portfolio with no as_of serializes', () => {
    const uuid = UUID.random();
    const link = new PortfolioProto();
    link.setUuid(uuid.toUUIDProto());
    link.setIsLink(true);
    const portfolio = new Portfolio(link);

    const copy = PortfolioProto.deserializeBinary(portfolio.proto.serializeBinary());
    assert(copy.getIsLink());
    assert(!copy.hasAsOf());

    const transaction = new Transaction({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new Decimal('100'),
        security: dummySecurity(),
        transactionType: dummyTransactionType(),
        portfolio,
        quantity: new Decimal('10'),
        priceType: PriceTypeProto.PERCENTAGE,
    });
    const txnCopy = TransactionProto.deserializeBinary(transaction.proto.serializeBinary());
    const txnPortfolio = txnCopy.getPortfolio()!;
    assert(txnPortfolio.getIsLink());
    assert(!txnPortfolio.hasAsOf());
    assert(UUID.fromU8Array(txnPortfolio.getUuid()!.getRawUuid_asU8()).toString() === uuid.toString());
});

// ---------- LM-461: the trade price carries a typed price_type ----------

const SECURITY_ID = '6f1c5a3e-1d2b-4c5d-8e9f-0a1b2c3d4e5f';

function securityOf(productType: ProductTypeProto): Security {
    const bond = new BondDetailsProto()
        .setFaceValue(encodeDecimal(parseDecimalString('1000.00')))
        .setCouponRate(encodeDecimal(parseDecimalString('0.05')))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setMaturityDate(new LocalDateProto().setYear(2034).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2024).setMonth(1).setDay(1));
    return Security.create(new SecurityProto()
        .setUuid(new UUID(UUID.fromString(SECURITY_ID)).toUUIDProto())
        .setProductType(productType)
        .setAsOf(ZonedDateTime.now().toProto())
        .setBondDetails(bond));
}

function trade(security: Security | null, priceType?: PriceTypeProto, type = TransactionTypeProto.BUY): Transaction {
    return new Transaction({
        tradeDate: new Date(2024, 5, 15),
        settlementDate: new Date(2024, 5, 17),
        asOfDate: new Date(2024, 5, 15, 10, 30, 0),
        price: new Decimal('99.5'),
        security: security as Security,
        transactionType: new TransactionType(type),
        portfolio: dummyPortfolio(),
        quantity: new Decimal('10000'),
        priceType,
    });
}

function thrown(build: () => unknown): unknown {
    let built: unknown;
    try {
        built = build();
    } catch (e) {
        return e;
    }
    throw new Error(`expected a throw, got ${built}`);
}

test('LM-461: a Treasury note with only a price is PERCENTAGE', () => {
    const price = trade(securityOf(ProductTypeProto.TREASURY_NOTE)).proto.getPrice()!;

    expect(price.getPriceType()).toBe(PriceTypeProto.PERCENTAGE);
    expect(validatePrice(price)).toEqual([]);
});

test('LM-461: a stock with only a price is ABSOLUTE', () => {
    const price = trade(securityOf(ProductTypeProto.COMMON_STOCK)).proto.getPrice()!;

    expect(price.getPriceType()).toBe(PriceTypeProto.ABSOLUTE);
    expect(validatePrice(price)).toEqual([]);
});

test('LM-461: an explicit priceType overrides the default', () => {
    const price = trade(securityOf(ProductTypeProto.TREASURY_NOTE), PriceTypeProto.ABSOLUTE).proto.getPrice()!;

    expect(price.getPriceType()).toBe(PriceTypeProto.ABSOLUTE);
});

test('LM-461: price_type survives the wire', () => {
    const request = new CreateTransactionRequestProto()
        .setCreateTransactionInput(trade(securityOf(ProductTypeProto.TREASURY_NOTE)).proto);

    const parsed = CreateTransactionRequestProto.deserializeBinary(request.serializeBinary());

    expect(parsed.getCreateTransactionInput()!.getPrice()!.getPriceType()).toBe(PriceTypeProto.PERCENTAGE);
});

test('LM-461: the price number is unchanged', () => {
    const price = trade(securityOf(ProductTypeProto.TIPS)).proto.getPrice()!;

    expect(toCanonicalString(decodeDecimal(price.getPrice()!))).toBe('99.5');
});

test('LM-461: no default and no priceType throws NoDefaultPriceTypeError naming the product', () => {
    const e = thrown(() => trade(securityOf(ProductTypeProto.FX_SPOT)));

    expect(e).toBeInstanceOf(NoDefaultPriceTypeError);
    expect(e).toBeInstanceOf(ModelValidationError);
    const err = e as NoDefaultPriceTypeError;
    expect(err.productType).toBe('FX_SPOT');
    expect(err.field).toBe('price.price_type');
    expect(err.objectId).toBe(SECURITY_ID);
    expect(err.message).toContain('FX_SPOT');
});

test('LM-461: a null security and no priceType throws NoDefaultPriceTypeError, not TypeError', () => {
    const e = thrown(() => trade(null));

    expect(e).toBeInstanceOf(NoDefaultPriceTypeError);
    expect((e as NoDefaultPriceTypeError).productType).toBe('PRODUCT_TYPE_UNKNOWN');
});

test('LM-461: an explicit priceType passes through on a product with no default', () => {
    const price = trade(securityOf(ProductTypeProto.FX_SPOT), PriceTypeProto.RATE).proto.getPrice()!;

    expect(price.getPriceType()).toBe(PriceTypeProto.RATE);
});

test('LM-461: an explicit UNKNOWN_PRICE_TYPE counts as omitted', () => {
    const price = trade(securityOf(ProductTypeProto.COMMON_STOCK), PriceTypeProto.UNKNOWN_PRICE_TYPE).proto.getPrice()!;
    expect(price.getPriceType()).toBe(PriceTypeProto.ABSOLUTE);

    expect(thrown(() => trade(securityOf(ProductTypeProto.FX_SPOT), PriceTypeProto.UNKNOWN_PRICE_TYPE)))
        .toBeInstanceOf(NoDefaultPriceTypeError);
});

test('LM-461: derived legs: cash is ABSOLUTE whatever the cash product, maturation is PERCENTAGE', () => {
    const parent = trade(securityOf(ProductTypeProto.TREASURY_NOTE));
    // A cash security with no product_type has no table default.
    const cash = Security.create(new SecurityProto()
        .setUuid(UUID.random().toUUIDProto())
        .setAsOf(ZonedDateTime.now().toProto()));

    Transaction.addDerivedTransactions(parent, cash);
    Transaction.addCashImpact(parent, cash);

    const children = parent.getChildrenTransactions();
    const maturation = children.find(c => c.getTransactionType() === TransactionTypeProto.MATURATION)!;
    expect(maturation.getPrice()!.getPriceType()).toBe(PriceTypeProto.PERCENTAGE);
    const cashLegs = [...children, ...maturation.getChildtransactionsList()]
        .filter(c => c.getSecurity()!.getUuid()!.getRawUuid_asU8().toString() === cash.proto.getUuid()!.getRawUuid_asU8().toString());
    expect(cashLegs.length).toBe(2);
    for (const leg of cashLegs) expect(leg.getPrice()!.getPriceType()).toBe(PriceTypeProto.ABSOLUTE);
});
