import assert = require('assert');
import Transaction from './transaction';
import { TransactionType } from './transaction_type';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { PositionStatusProto } from '../../../fintekkers/models/position/position_status_pb';
import Security from '../security/security';
import Portfolio from '../portfolio/portfolio';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import { Decimal } from 'decimal.js';
import { dummyPortfolio } from '../portfolio/portfolio.test';

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

function testCreateCashTransaction(): void {
    // Test BUY transaction -> WITHDRAWAL
    const buyTransaction = createBondTransaction(TransactionTypeProto.BUY);
    const cashSecurity = createCashSecurity();
    
    const cashTransaction = Transaction.createCashTransaction(cashSecurity, buyTransaction);
    
    assert(cashTransaction.getTransactionType().proto === TransactionTypeProto.WITHDRAWAL,
        'BUY transaction should create WITHDRAWAL cash transaction');
    assert(cashTransaction.getSecurity().proto.getSecurityType() === SecurityTypeProto.CASH_SECURITY,
        'Cash transaction should have cash security');
    assert(buyTransaction.getChildrenTransactions().length === 1,
        'Parent transaction should have one child');
    const foundCash = buyTransaction.getCashTransaction();
    assert(foundCash !== null && foundCash.getID().toString() === cashTransaction.getID().toString(),
        'getCashTransaction should return the created cash transaction');
    
    // Test SELL transaction -> DEPOSIT
    const sellTransaction = createBondTransaction(TransactionTypeProto.SELL);
    const cashTransaction2 = Transaction.createCashTransaction(cashSecurity, sellTransaction);
    
    assert(cashTransaction2.getTransactionType().proto === TransactionTypeProto.DEPOSIT,
        'SELL transaction should create DEPOSIT cash transaction');
}

function testAddMaturationTransaction(): void {
    const bondTransaction = createBondTransaction(TransactionTypeProto.BUY);
    const maturationType = new TransactionType(TransactionTypeProto.MATURATION);
    const cashSecurity = createCashSecurity();
    
    Transaction.addMaturationTransaction(bondTransaction, maturationType, cashSecurity);
    
    const children = bondTransaction.getChildrenTransactions();
    assert(children.length === 1, 'Should have one child transaction');
    
    const maturation = new Transaction(children[0]);
    assert(maturation.getTransactionType().proto === TransactionTypeProto.MATURATION,
        'Child should be MATURATION transaction');
    assert(maturation.getSecurity().getID().toString() === bondTransaction.getSecurity().getID().toString(),
        'Maturation should have same security');
    assert(maturation.getQuantity().equals(bondTransaction.getQuantity()),
        'Maturation should have same quantity');
}

function testAddDerivedTransactions(): void {
    const cashSecurity = createCashSecurity();
    
    // Test BUY bond transaction -> should add MATURATION
    const buyTransaction = createBondTransaction(TransactionTypeProto.BUY);
    Transaction.addDerivedTransactions(buyTransaction, cashSecurity);
    
    const children = buyTransaction.getChildrenTransactions();
    assert(children.length === 1, 'BUY bond should have one derived transaction');
    const maturation = new Transaction(children[0]);
    assert(maturation.getTransactionType().proto === TransactionTypeProto.MATURATION,
        'BUY bond should create MATURATION transaction');
    
    // Test SELL bond transaction -> should add MATURATION_OFFSET
    const sellTransaction = createBondTransaction(TransactionTypeProto.SELL);
    Transaction.addDerivedTransactions(sellTransaction, cashSecurity);
    
    const children2 = sellTransaction.getChildrenTransactions();
    assert(children2.length === 1, 'SELL bond should have one derived transaction');
    const maturationOffset = new Transaction(children2[0]);
    assert(maturationOffset.getTransactionType().proto === TransactionTypeProto.MATURATION_OFFSET,
        'SELL bond should create MATURATION_OFFSET transaction');
    
    // Test non-bond transaction -> should not add derived transactions
    const equityTransaction = createEquityTransaction();
    Transaction.addDerivedTransactions(equityTransaction, cashSecurity);
    assert(equityTransaction.getChildrenTransactions().length === 0,
        'Non-bond transaction should not have derived transactions');
}

function testAddCashImpact(): void {
    const bondTransaction = createBondTransaction(TransactionTypeProto.BUY);
    const cashSecurity = createCashSecurity();
    
    Transaction.addCashImpact(bondTransaction, cashSecurity);
    
    assert(bondTransaction.getCashTransaction() !== null,
        'Transaction should have cash transaction after addCashImpact');
    
    // Test that adding cash impact twice throws error
    try {
        Transaction.addCashImpact(bondTransaction, cashSecurity);
        assert(false, 'Should throw error when cash transaction already exists');
    } catch (e) {
        assert(e instanceof Error && e.message.includes('already has a cash impact'),
            'Should throw error about existing cash impact');
    }
    
    // Test that cash security transaction doesn't create cash impact
    const cashTransaction = createCashTransaction();
    Transaction.addCashImpact(cashTransaction, cashSecurity);
    assert(cashTransaction.getChildrenTransactions().length === 0,
        'Cash security transaction should not create cash impact');
}

function testHelperMethods(): void {
    const transaction = createBondTransaction(TransactionTypeProto.BUY);
    
    // Test isCashSecurity
    assert(!transaction.isCashSecurity(), 'Bond transaction should not be cash security');
    
    const cashTransaction = createCashTransaction();
    assert(cashTransaction.isCashSecurity(), 'Cash transaction should be cash security');
    
    // Test addChildTransaction
    const child = createBondTransaction(TransactionTypeProto.SELL);
    transaction.addChildTransaction(child);
    assert(transaction.getChildrenTransactions().length === 1,
        'Should have one child after addChildTransaction');
    
    // Test getCashTransaction
    const cashSecurity = createCashSecurity();
    const cashTxn = Transaction.createCashTransaction(cashSecurity, transaction);
    const foundCash = transaction.getCashTransaction();
    assert(foundCash !== null && foundCash.getID().toString() === cashTxn.getID().toString(),
        'getCashTransaction should find the cash child transaction');
}

function createBondTransaction(transactionType: TransactionTypeProto): Transaction {
    const security = createBondSecurity();
    const portfolio = dummyPortfolio();
    const tradeDate = new Date(2024, 0, 15);
    const settlementDate = new Date(2024, 0, 17);
    const asOfDate = new Date(2024, 0, 15, 10, 30, 0);
    const price = new Decimal('99.50');
    const quantity = new Decimal('1000.00');
    
    return new Transaction({
        tradeDate,
        settlementDate,
        asOfDate,
        price,
        security,
        transactionType: new TransactionType(transactionType),
        portfolio,
        quantity
    });
}

function createBondSecurity(): Security {
    return Security.create(new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setSecurityType(SecurityTypeProto.BOND_SECURITY)
        .setFaceValue(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass('FixedIncome')
        .setIssuerName('Test Issuer')
        .setCouponRate(new DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(CouponTypeProto.FIXED)
        .setMaturityDate(new LocalDateProto().setYear(2034).setMonth(1).setDay(1))
        .setIssueDate(new LocalDateProto().setYear(2024).setMonth(1).setDay(1))
        .setAsOf(ZonedDateTime.now().toProto())
        .setDescription('Test bond security')
    );
}

function createEquityTransaction(): Transaction {
    const security = Security.create(new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setSecurityType(SecurityTypeProto.EQUITY_SECURITY)
        .setAssetClass('Equity')
        .setAsOf(ZonedDateTime.now().toProto())
    );
    const portfolio = dummyPortfolio();
    
    return new Transaction({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new Decimal('100.00'),
        security,
        transactionType: new TransactionType(TransactionTypeProto.BUY),
        portfolio,
        quantity: new Decimal('100.00')
    });
}

function createCashSecurity(): Security {
    return Security.create(new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setSecurityType(SecurityTypeProto.CASH_SECURITY)
        .setAssetClass('Cash')
        .setAsOf(ZonedDateTime.now().toProto())
    );
}

function createCashTransaction(): Transaction {
    const cashSecurity = createCashSecurity();
    const portfolio = dummyPortfolio();
    
    return new Transaction({
        tradeDate: new Date(2024, 0, 15),
        settlementDate: new Date(2024, 0, 17),
        asOfDate: new Date(2024, 0, 15, 10, 30, 0),
        price: new Decimal('1.0'),
        security: cashSecurity,
        transactionType: new TransactionType(TransactionTypeProto.DEPOSIT),
        portfolio,
        quantity: new Decimal('1000.00')
    });
}
