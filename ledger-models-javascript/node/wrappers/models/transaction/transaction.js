"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_type_1 = require("./transaction_type");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const strategy_allocation_pb_1 = require("../../../fintekkers/models/strategy/strategy_allocation_pb");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_status_pb_1 = require("../../../fintekkers/models/position/position_status_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_1 = __importDefault(require("../security/security"));
const portfolio_1 = __importDefault(require("../portfolio/portfolio"));
const Price_1 = __importDefault(require("../price/Price"));
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
//Model Utils
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const date_1 = require("../utils/date");
const decimal_js_1 = require("decimal.js");
class Transaction {
    constructor(protoOrParams) {
        if (protoOrParams instanceof transaction_pb_1.TransactionProto) {
            this.proto = protoOrParams;
        }
        else {
            this.proto = this.buildProtoFromParams(protoOrParams);
        }
    }
    /**
     * Builds a complete TransactionProto from constructor parameters
     */
    buildProtoFromParams(params) {
        const transactionProto = new transaction_pb_1.TransactionProto();
        transactionProto.setObjectClass('Transaction');
        transactionProto.setVersion('0.0.1');
        transactionProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        // Convert asOfDate to ZonedDateTime and set on transaction
        const asOfZonedDateTime = datetime_1.ZonedDateTime.from(params.asOfDate);
        transactionProto.setAsOf(asOfZonedDateTime.toProto());
        // Convert tradeDate and settlementDate to LocalDateProto
        transactionProto.setTradeDate(date_1.LocalDate.from(params.tradeDate).toProto());
        transactionProto.setSettlementDate(date_1.LocalDate.from(params.settlementDate).toProto());
        // Create Price using Price.create() factory method
        const price = Price_1.default.create(params.price, params.security, asOfZonedDateTime);
        transactionProto.setPrice(price.proto);
        // Set security, transaction type, and portfolio from their protos
        transactionProto.setSecurity(params.security.proto);
        transactionProto.setTransactionType(params.transactionType.proto);
        transactionProto.setPortfolio(params.portfolio.proto);
        // Convert quantity to DecimalValueProto
        const quantityDecimal = new decimal_value_pb_1.DecimalValueProto();
        quantityDecimal.setArbitraryPrecisionValue(params.quantity.toString());
        transactionProto.setQuantity(quantityDecimal);
        // Create and set an empty StrategyAllocationProto
        const strategyAllocationProto = new strategy_allocation_pb_1.StrategyAllocationProto();
        strategyAllocationProto.setObjectClass('StrategyAllocation');
        strategyAllocationProto.setVersion('0.0.1');
        transactionProto.setStrategyAllocation(strategyAllocationProto);
        // Set default position status
        transactionProto.setPositionStatus(position_status_pb_1.PositionStatusProto.EXECUTED);
        return transactionProto;
    }
    toString() {
        var _a, _b, _c, _d, _e, _f;
        try {
            const validTo = (_b = (_a = this.proto.getValidTo()) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "NULL";
            const validFrom = (_d = (_c = this.proto.getValidFrom()) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "NULL";
            const strategyAllocation = (_f = (_e = this.proto.getStrategyAllocation()) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "NULL";
            return `${ /*this.proto.isCancelled()*/false ? "INVALIDATED: " : ""}TXN[${this.getID().toString()}], ` +
                `TradeDate[${this.getTradeDate().toString()}], TxnType[${this.getTransactionType()}], Price[${this.getPrice()}], Quantity[${this.getQuantity()}], ` +
                `AsOf[${this.getAsOf().toString()}], Portfolio[${this.getPortfolio().getPortfolioName()}], Issuer[${this.getSecurity().getIssuerName()}], ` +
                `ValidFrom[${validFrom}], ValidTo[${validTo}], Strategy[${strategyAllocation}]`;
        }
        catch (e) {
            console.error(e);
            return `Transaction toString() serialization failed: ${e}`;
        }
    }
    getFields() {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    }
    getField(field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.SECURITY_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.ASSET_CLASS:
                return this.getSecurity().getAssetClass();
            case field_pb_1.FieldProto.PRODUCT_CLASS:
                return this.getSecurity().getProductClass();
            case field_pb_1.FieldProto.PRODUCT_TYPE:
                return this.getSecurity().getProductType();
            case field_pb_1.FieldProto.IDENTIFIER:
                return this.getSecurity().getSecurityID();
            case field_pb_1.FieldProto.TENOR:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
                throw new Error('Not implemented yet');
            case field_pb_1.FieldProto.MATURITY_DATE:
                throw new Error('Not implemented yet');
            default:
                throw new Error(`Field not mapped in Security wrapper: ${field}`);
        }
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error("UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error("AsOf is required");
        return new datetime_1.ZonedDateTime(asOf);
    }
    getPortfolio() {
        const portfolio = this.proto.getPortfolio();
        if (!portfolio)
            throw new Error("Portfolio is required");
        return new portfolio_1.default(portfolio);
    }
    getSecurity() {
        const security = this.proto.getSecurity();
        if (!security)
            throw new Error("Security is required");
        return security_1.default.create(security);
    }
    getStrategyAllocation() {
        const allocation = this.proto.getStrategyAllocation();
        if (!allocation)
            throw new Error("StrategyAllocation is required");
        return allocation;
    }
    getPrice() {
        const price = this.proto.getPrice();
        if (!price)
            throw new Error("Price is required");
        return price;
    }
    getQuantity() {
        const quantity = this.proto.getQuantity();
        if (!quantity)
            throw new Error("Quantity is required");
        return new decimal_js_1.Decimal(quantity.getArbitraryPrecisionValue());
    }
    getIssuerName() {
        return this.getSecurity().getIssuerName();
    }
    getDirectedQuantity() {
        return this.getQuantity().mul(this.getTransactionType().getDirectionMultiplier());
    }
    getTradeDate() {
        const tradeDate = this.proto.getTradeDate();
        if (!tradeDate)
            throw new Error("TradeDate is required");
        return new date_1.LocalDate(tradeDate);
    }
    getSettlementDate() {
        const settlementDate = this.proto.getSettlementDate();
        if (!settlementDate)
            throw new Error("SettlementDate is required");
        return new date_1.LocalDate(settlementDate);
    }
    getTransactionType() {
        return new transaction_type_1.TransactionType(this.proto.getTransactionType());
    }
    getTradeName() {
        return this.proto.getTradeName();
    }
    getPositionStatus() {
        return this.proto.getPositionStatus();
    }
    getChildrenTransactions() {
        return this.proto.getChildtransactionsList();
    }
    /**
     * Adds a child transaction to this transaction's proto
     * @param child - The child transaction to add
     */
    addChildTransaction(child) {
        this.proto.addChildtransactions(child.proto);
    }
    /**
     * Checks if this transaction's security is cash
     * @returns true if the security is cash, false otherwise
     */
    isCashSecurity() {
        return this.getSecurity().proto.getSecurityType() === security_type_pb_1.SecurityTypeProto.CASH_SECURITY;
    }
    /**
     * Searches child transactions for a cash transaction
     * @returns The cash transaction if found, null otherwise
     */
    getCashTransaction() {
        const children = this.getChildrenTransactions();
        for (const childProto of children) {
            const child = new Transaction(childProto);
            if (child.isCashSecurity()) {
                return child;
            }
        }
        return null;
    }
    equals(other) {
        if (other instanceof Transaction) {
            return this.getID().equals(other.getID());
        }
        else {
            return false;
        }
    }
    /**
     * Creates a cash transaction associated with a parent transaction.
     * The cash transaction represents the cash impact of the parent transaction.
     * @param cashSecurity - The cash security (e.g., USD)
     * @param parentTransaction - The parent transaction for which to create the cash transaction
     * @returns The created cash transaction
     */
    static createCashTransaction(cashSecurity, parentTransaction) {
        var _a, _b;
        // Determine transaction type based on parent
        let cashTransactionType;
        const parentType = parentTransaction.getTransactionType().proto;
        if (parentType === transaction_type_pb_1.TransactionTypeProto.BUY || parentType === transaction_type_pb_1.TransactionTypeProto.MATURATION_OFFSET) {
            cashTransactionType = new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.WITHDRAWAL);
        }
        else if (parentType === transaction_type_pb_1.TransactionTypeProto.SELL || parentType === transaction_type_pb_1.TransactionTypeProto.MATURATION) {
            cashTransactionType = new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.DEPOSIT);
        }
        else {
            throw new Error(`Cannot create cash transaction for transaction type: ${transaction_type_pb_1.TransactionTypeProto[parentType]}`);
        }
        // Calculate book amount
        let bookAmount;
        const securityType = parentTransaction.getSecurity().proto.getSecurityType();
        if (securityType === security_type_pb_1.SecurityTypeProto.BOND_SECURITY ||
            securityType === security_type_pb_1.SecurityTypeProto.TIPS ||
            securityType === security_type_pb_1.SecurityTypeProto.FRN) {
            // For bond securities
            if (parentType === transaction_type_pb_1.TransactionTypeProto.MATURATION || parentType === transaction_type_pb_1.TransactionTypeProto.MATURATION_OFFSET) {
                // For maturation transactions, use quantity directly
                bookAmount = parentTransaction.getQuantity();
            }
            else {
                // For other bond transactions, calculate: (quantity / faceValue) * (price * priceScaleFactor)
                // Lazy import to avoid circular dependency
                const BondSecurity = require('../security/BondSecurity').default;
                const bondSecurity = new BondSecurity(parentTransaction.getSecurity().proto);
                const priceScaleFactor = bondSecurity.getPriceScaleFactor();
                const faceValueProto = bondSecurity.getFaceValue();
                const faceValue = new decimal_js_1.Decimal(faceValueProto.getArbitraryPrecisionValue());
                const priceProto = parentTransaction.getPrice();
                const priceValue = new decimal_js_1.Decimal(((_a = priceProto.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()) || '0');
                const scaledPrice = priceValue.mul(priceScaleFactor);
                const quantity = parentTransaction.getQuantity();
                const numberBondUnits = quantity.div(faceValue);
                bookAmount = numberBondUnits.mul(scaledPrice);
            }
        }
        else {
            // For other securities: quantity * price
            const priceProto = parentTransaction.getPrice();
            const priceValue = new decimal_js_1.Decimal(((_b = priceProto.getPrice()) === null || _b === void 0 ? void 0 : _b.getArbitraryPrecisionValue()) || '0');
            bookAmount = parentTransaction.getQuantity().mul(priceValue);
        }
        // Get asOf ZonedDateTime
        const asOf = parentTransaction.getAsOf();
        // Create cash transaction using parameter-based constructor
        const cashTransaction = new Transaction({
            tradeDate: parentTransaction.getTradeDate().toDate(),
            settlementDate: parentTransaction.getSettlementDate().toDate(),
            asOfDate: asOf.toDateTime().toJSDate(),
            price: new decimal_js_1.Decimal('1.0'),
            security: cashSecurity,
            transactionType: cashTransactionType,
            portfolio: parentTransaction.getPortfolio(),
            quantity: bookAmount
        });
        // Set additional fields from parent
        cashTransaction.proto.setPositionStatus(parentTransaction.getPositionStatus());
        cashTransaction.proto.setStrategyAllocation(parentTransaction.getStrategyAllocation());
        cashTransaction.proto.setTradeName(parentTransaction.getTradeName());
        // Add as child to parent
        parentTransaction.addChildTransaction(cashTransaction);
        return cashTransaction;
    }
    /**
     * Creates a maturation transaction for a bond.
     * @param transaction - The parent transaction (must be for a bond security)
     * @param transactionType - The transaction type (MATURATION or MATURATION_OFFSET)
     * @param cashSecurity - The cash security to use for the cash impact
     */
    static addMaturationTransaction(transaction, transactionType, cashSecurity) {
        var _a;
        // Lazy import to avoid circular dependency
        const BondSecurity = require('../security/BondSecurity').default;
        // Cast security to BondSecurity
        const bondSecurity = new BondSecurity(transaction.getSecurity().proto);
        // Get maturity date
        const maturityDate = bondSecurity.getMaturityDate();
        // Calculate settlement date: maturity date + 2 days
        const maturityDateObj = maturityDate.toDate();
        maturityDateObj.setDate(maturityDateObj.getDate() + 2);
        const settlementDate = date_1.LocalDate.from(maturityDateObj);
        // Get price as Decimal
        const priceProto = transaction.getPrice();
        const priceValue = new decimal_js_1.Decimal(((_a = priceProto.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()) || '0');
        // Get asOf ZonedDateTime
        const asOf = transaction.getAsOf();
        // Create maturation transaction
        const maturation = new Transaction({
            tradeDate: maturityDate.toDate(),
            settlementDate: settlementDate.toDate(),
            asOfDate: asOf.toDateTime().toJSDate(),
            price: priceValue,
            security: transaction.getSecurity(),
            transactionType: transactionType,
            portfolio: transaction.getPortfolio(),
            quantity: transaction.getQuantity()
        });
        // Set additional fields from parent
        maturation.proto.setPositionStatus(transaction.getPositionStatus());
        maturation.proto.setStrategyAllocation(transaction.getStrategyAllocation());
        maturation.proto.setTradeName(transaction.getTradeName());
        // Add as child transaction
        transaction.addChildTransaction(maturation);
        // Add cash impact to the maturation transaction
        Transaction.addCashImpact(maturation, cashSecurity);
    }
    /**
     * Generates additional transactions associated with this transaction.
     * For instance, a Buy transaction on a bond will also create the maturation transaction.
     * @param transaction - The parent transaction
     * @param cashSecurity - The cash security to use for cash impacts
     */
    static addDerivedTransactions(transaction, cashSecurity) {
        const securityType = transaction.getSecurity().proto.getSecurityType();
        const isBond = securityType === security_type_pb_1.SecurityTypeProto.BOND_SECURITY ||
            securityType === security_type_pb_1.SecurityTypeProto.FRN ||
            securityType === security_type_pb_1.SecurityTypeProto.TIPS;
        const transactionType = transaction.getTransactionType().proto;
        const isABuyTransaction = transactionType === transaction_type_pb_1.TransactionTypeProto.BUY;
        const isASellTransaction = transactionType === transaction_type_pb_1.TransactionTypeProto.SELL;
        const isaMaturationTransaction = transactionType !== transaction_type_pb_1.TransactionTypeProto.MATURATION &&
            transactionType !== transaction_type_pb_1.TransactionTypeProto.MATURATION_OFFSET;
        if (isBond && isASellTransaction && isaMaturationTransaction) {
            Transaction.addMaturationTransaction(transaction, new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.MATURATION_OFFSET), cashSecurity);
        }
        if (isBond && isABuyTransaction && isaMaturationTransaction) {
            Transaction.addMaturationTransaction(transaction, new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.MATURATION), cashSecurity);
        }
    }
    /**
     * Adds a cash impact transaction to this transaction.
     * If the transaction's security is not cash, creates a cash transaction.
     * @param transaction - The transaction to add cash impact to
     * @param cashSecurity - The cash security (e.g., USD) to use for the cash transaction
     */
    static addCashImpact(transaction, cashSecurity) {
        // Check if cash transaction already exists
        if (transaction.getCashTransaction() != null) {
            throw new Error("This transaction already has a cash impact");
        }
        // If security is not cash, create cash transaction
        if (!transaction.isCashSecurity()) {
            Transaction.createCashTransaction(cashSecurity, transaction);
        }
    }
}
exports.default = Transaction;
// private static Transaction createCashTransaction(CashSecurity cashSecurity, Transaction parentTransaction) {
//   TransactionType transactionType = null;
//   switch(parentTransaction.getTransactionType()) {
//       case BUY:
//       case MATURATION_OFFSET:
//           transactionType = TransactionType.WITHDRAWAL;
//           break;
//       case SELL:
//       case MATURATION:
//           transactionType = TransactionType.DEPOSIT;
//           break;
//       default:
//           throw new RuntimeException("SHOULDN'T GET HERE");
//   }
//   BigDecimal bookAmount = null;
//   switch(parentTransaction.getSecurity().getSecurityType()) {
//       case BOND_SECURITY:
//           if(TransactionType.MATURATION.equals(parentTransaction.getTransactionType())
//               || TransactionType.MATURATION_OFFSET.equals(parentTransaction.getTransactionType())) {
//               bookAmount = parentTransaction.getQuantity();
//           } else {
//               //E.g. if you bought 50 bonds with face value of $1000 @ $99.
//               // The face amount is $50k
//               // The book amount is: $49.5k  (i.e. 50 * (99 * scaled price))
//               BigDecimal priceScaleFactor = ((BondSecurity) parentTransaction.getSecurity()).getPriceScaleFactor();
//               BigDecimal faceValue = ((BondSecurity) parentTransaction.getSecurity()).getFaceValue();
//               BigDecimal scaledPrice = parentTransaction.getPrice().getPrice().multiply(priceScaleFactor);
//               BigDecimal numberBondUnits = parentTransaction.getQuantity().divide(faceValue);
//               bookAmount = numberBondUnits.multiply(scaledPrice);
//           }
//           break;
//       default:
//           bookAmount = parentTransaction.getQuantity().multiply(parentTransaction.getPrice().getPrice());
//   }
//   Transaction cashTransaction = new Transaction(
//           UUID.randomUUID(), parentTransaction.getPortfolio(),
//           Price.getCashPrice(),
//           parentTransaction.getTradeDate(),
//           parentTransaction.getSettlementDate(),
//           bookAmount,
//           cashSecurity,
//           transactionType,
//           null,
//           parentTransaction.getAsOf(),
//           parentTransaction,
//           parentTransaction.getTradeName(),
//           parentTransaction.getPositionStatus());
//   cashTransaction.setPositionStatus(parentTransaction.getPositionStatus());
//   //Cash transactions will have the originating transaction ID associated with it.
//   parentTransaction.addChildTransaction(cashTransaction);
//   return  cashTransaction;
// }
// /**
// * Generates additional transactions associated with this transaction. For instance a Buy transaction on
// * a bond will also create the maturation transaction.
// *
// * @param transaction The parent transaction
// */
// public static void addDerivedTransactions(Transaction transaction) {
//   //TODO: Best to co-locate this with the transaction instantiator where we calculate the cash impacts, right?!
//   boolean isBond = SecurityTypeProto.BOND_SECURITY.equals(transaction.getSecurity().getSecurityType())
//           || SecurityTypeProto.FRN.equals(transaction.getSecurity().getSecurityType())
//           || SecurityTypeProto.TIPS.equals(transaction.getSecurity().getSecurityType());
//   boolean isABuyTransaction = TransactionType.BUY.equals(transaction.getTransactionType());
//   boolean isASellTransaction = TransactionType.SELL.equals(transaction.getTransactionType());
//   boolean isaMaturationTransaction = !TransactionType.MATURATION.equals(transaction.getTransactionType())
//           && !TransactionType.MATURATION_OFFSET.equals(transaction.getTransactionType());
//   if(isBond && isASellTransaction && isaMaturationTransaction) {
//       addMaturationTransaction(transaction, TransactionType.MATURATION_OFFSET);
//   }
//   if(isBond && isABuyTransaction && isaMaturationTransaction) {
//       addMaturationTransaction(transaction, TransactionType.MATURATION);
//       /*
//       Example:
//       (A) Parent transaction BUY bond. Child transaction MATURE bond
//       (B) Parent transaction links to the children (and vice - versa)
//       (C) All transactions indexed in the in-memory layer, so are searchable
//       (D) We create tax lot modifiers at that point in time
//       TODO: We need to create multi-level tax lots, i.e. the ability to have a form of tax lot that are proposed
//       but not concrete. For example, if there is a SELL transaction then the mature transaction needs to be down
//       sized.
//       Buy 100 bond ($100), face value $10k, mature 2032.
//           Mature bond of -100, 'trade date' of 2032
//       Sell 20 bond ($100), face value -$2k, mature 2032
//           Mature bond of -80, trade-date of 2032 needs to be created
//       Do that via modifiers? I.e. there will be a mature of -100, and a mature of 20. Makese, sense right?
//       When un-doing a transaction, we'll need to traverse the parent/child transactions and remove the associated
//       tax lots.
//        */
//   }
// }
// private static void addMaturationTransaction(Transaction transaction, TransactionType transactionType) {
//   BondSecurity bondSecurity = (BondSecurity) transaction.getSecurity();
//   Transaction maturation = new Transaction(
//           UUID.randomUUID(), transaction.getPortfolio(), transaction.getPrice(),
//           bondSecurity.getMaturityDate(),
//           bondSecurity.getMaturityDate().plusDays(2),
//           transaction.getQuantity(), transaction.getSecurity(),
//           transactionType, transaction.getStrategyAllocation(),
//           transaction.getAsOf(),
// //                bondSecurity.getMaturityDate().atStartOfDay(ZonedDateTime.now().getZone()),
//           transaction, transaction.getTradeName(), transaction.getPositionStatus()
//   );
//   transaction.addChildTransaction(maturation);
//   addCashImpact(maturation);
// }
// public static void addCashImpact(Transaction transaction) {
//   if(transaction.getCashTransaction() != null){
//       throw new RuntimeException("This transaction already has a cash impact");
//   }
//   //Probably need to create a higher level transaction concept?
//   if(!transaction.getSecurity().isCash()) {
//       Transaction cashTxn = Transaction.createCashTransaction(CashSecurity.USD, transaction);
// //            assert transaction.getCashTransaction().equals(cashTxn);
//       assert cashTxn.getParentTransaction().equals(transaction);
//   }
// }
//# sourceMappingURL=transaction.js.map