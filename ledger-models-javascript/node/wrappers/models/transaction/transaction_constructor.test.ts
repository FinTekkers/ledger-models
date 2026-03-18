import assert = require('assert');
import Transaction from './transaction';
import { TransactionType } from './transaction_type';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { PositionStatusProto } from '../../../fintekkers/models/position/position_status_pb';
import Security from '../security/security';
import Portfolio from '../portfolio/portfolio';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import { Decimal } from 'decimal.js';
import { dummyPortfolio } from '../portfolio/portfolio.test';

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
    const priceValue = priceProto.getPrice()?.getArbitraryPrecisionValue();
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
    return Security.create(new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Test Issuer")
        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Test security")
    );
}

function dummyTransactionType(): TransactionType {
    return new TransactionType(TransactionTypeProto.BUY);
}
