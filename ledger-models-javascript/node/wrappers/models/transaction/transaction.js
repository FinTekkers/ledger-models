"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
//Model Utils
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const date_1 = require("../utils/date");
const decimal_js_1 = require("decimal.js");
const LinkCacheModule = __importStar(require("../../util/link-cache"));
const link_resolver_1 = __importDefault(require("../../util/link-resolver"));
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
        transactionProto.setTradeDate((0, date_1.dateToLocalDateProto)(params.tradeDate));
        transactionProto.setSettlementDate((0, date_1.dateToLocalDateProto)(params.settlementDate));
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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            const validTo = (_b = (_a = this.proto.getValidTo()) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "NULL";
            const validFrom = (_d = (_c = this.proto.getValidFrom()) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "NULL";
            const strategyAllocation = (_f = (_e = this.proto.getStrategyAllocation()) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "NULL";
            return `${ /*this.proto.isCancelled()*/false ? "INVALIDATED: " : ""}TXN[${this.getID().toString()}], ` +
                `TradeDate[${(_h = (_g = this.getTradeDate()) === null || _g === void 0 ? void 0 : _g.toString()) !== null && _h !== void 0 ? _h : "NULL"}], TxnType[${this.getTransactionType()}], Price[${this.getPrice()}], Quantity[${this.getQuantity()}], ` +
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
            case field_pb_1.FieldProto.IDENTIFIER: {
                const ids = this.getSecurity().getIdentifiers();
                return ids.length > 0 ? ids[0] : null;
            }
            case field_pb_1.FieldProto.TENOR:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
                throw new Error('Not implemented yet');
            case field_pb_1.FieldProto.MATURITY_DATE:
                throw new Error('Not implemented yet');
            default:
                throw new Error(`Field not mapped in Security wrapper: ${field}`);
        }
    }
    isLink() {
        return this.proto.getIsLink();
    }
    /**
     * Async hydration via `LinkResolver`. Mirrors `Security.hydrate()` and
     * `Portfolio.hydrate()`. Returns `this` so it can be chained:
     *
     *   const t = await new Transaction(linkProto).hydrate();
     *   console.log(t.getPortfolio().getPortfolioName());
     */
    hydrate(resolver) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proto.getIsLink())
                return this;
            const uuidProto = this.proto.getUuid();
            if (!uuidProto) {
                throw new Error("Cannot hydrate a link-mode Transaction with no UUID set.");
            }
            const uuid = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8());
            const asOfProto = (_a = this.proto.getAsOf()) !== null && _a !== void 0 ? _a : undefined;
            const r = resolver !== null && resolver !== void 0 ? resolver : link_resolver_1.default.getDefault();
            const resolved = yield r.getTransaction(uuid, asOfProto);
            this.proto = resolved.proto;
            return this;
        });
    }
    /**
     * Lazy hydration. On a link-mode proto, swap in the resolved proto from
     * LinkCache. On cache miss, throws — caller must pre-warm via
     * `await transaction.hydrate()` or LinkResolver. Cache-only by design
     * (sync getter API mirrors Security/Portfolio).
     * See docs/adr/lazy-link-hydration.md.
     */
    ensureHydrated() {
        if (!this.proto.getIsLink())
            return;
        const uuidProto = this.proto.getUuid();
        if (!uuidProto)
            throw new Error("Cannot read fields on link-mode Transaction with no UUID set.");
        const uuidKey = uuid_1.UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        const asOfProto = this.proto.getAsOf();
        const asOf = asOfProto ? new datetime_1.ZonedDateTime(asOfProto) : null;
        const cached = LinkCacheModule.TRANSACTION.get(uuidKey, asOf);
        if (cached) {
            this.proto = cached;
            return;
        }
        throw new Error(`Cannot read fields on link-mode Transaction uuid=${uuidKey} `
            + `— LinkCache miss. Call \`await transaction.hydrate()\` first, `
            + `or pre-warm via LinkResolver. `
            + `See docs/adr/lazy-link-hydration.md.`);
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
        this.ensureHydrated();
        const portfolio = this.proto.getPortfolio();
        if (!portfolio)
            throw new Error("Portfolio is required");
        return new portfolio_1.default(portfolio);
    }
    getSecurity() {
        this.ensureHydrated();
        const security = this.proto.getSecurity();
        if (!security)
            throw new Error("Security is required");
        return security_1.default.create(security);
    }
    getStrategyAllocation() {
        this.ensureHydrated();
        const allocation = this.proto.getStrategyAllocation();
        if (!allocation)
            throw new Error("StrategyAllocation is required");
        return allocation;
    }
    getPrice() {
        this.ensureHydrated();
        const price = this.proto.getPrice();
        if (!price)
            throw new Error("Price is required");
        return price;
    }
    getQuantity() {
        this.ensureHydrated();
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
        this.ensureHydrated();
        return (0, date_1.localDateProtoToDate)(this.proto.getTradeDate());
    }
    getSettlementDate() {
        this.ensureHydrated();
        return (0, date_1.localDateProtoToDate)(this.proto.getSettlementDate());
    }
    getTransactionType() {
        this.ensureHydrated();
        return new transaction_type_1.TransactionType(this.proto.getTransactionType());
    }
    getTradeName() {
        this.ensureHydrated();
        return this.proto.getTradeName();
    }
    getPositionStatus() {
        this.ensureHydrated();
        return this.proto.getPositionStatus();
    }
    getChildrenTransactions() {
        this.ensureHydrated();
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
        return this.getSecurity().proto.getProductType() === product_type_pb_1.ProductTypeProto.CURRENCY;
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
        const securityType = parentTransaction.getSecurity().proto.getProductType();
        if (securityType === product_type_pb_1.ProductTypeProto.TREASURY_NOTE ||
            securityType === product_type_pb_1.ProductTypeProto.TIPS ||
            securityType === product_type_pb_1.ProductTypeProto.TREASURY_FRN) {
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
                const faceValue = bondSecurity.getFaceValue();
                if (!faceValue)
                    throw new Error("Face value is required for bond cash impact calculation");
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
        const tradeDate = parentTransaction.getTradeDate();
        const settlementDate = parentTransaction.getSettlementDate();
        if (!tradeDate)
            throw new Error("TradeDate is required to derive a cash transaction");
        if (!settlementDate)
            throw new Error("SettlementDate is required to derive a cash transaction");
        // Create cash transaction using parameter-based constructor
        const cashTransaction = new Transaction({
            tradeDate,
            settlementDate,
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
        if (!maturityDate)
            throw new Error("Maturity date is required to derive a maturation transaction");
        // Calculate settlement date: maturity date + 2 days
        const settlementDate = new Date(maturityDate.getTime());
        settlementDate.setDate(settlementDate.getDate() + 2);
        // Get price as Decimal
        const priceProto = transaction.getPrice();
        const priceValue = new decimal_js_1.Decimal(((_a = priceProto.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()) || '0');
        // Get asOf ZonedDateTime
        const asOf = transaction.getAsOf();
        // Create maturation transaction
        const maturation = new Transaction({
            tradeDate: maturityDate,
            settlementDate,
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
        const securityType = transaction.getSecurity().proto.getProductType();
        const isBond = securityType === product_type_pb_1.ProductTypeProto.TREASURY_NOTE ||
            securityType === product_type_pb_1.ProductTypeProto.TREASURY_FRN ||
            securityType === product_type_pb_1.ProductTypeProto.TIPS;
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
//   switch(parentTransaction.getSecurity().getProductType()) {
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
//   boolean isBond = ProductTypeProto.TREASURY_NOTE.equals(transaction.getSecurity().getProductType())
//           || ProductTypeProto.TREASURY_FRN.equals(transaction.getSecurity().getProductType())
//           || ProductTypeProto.TIPS.equals(transaction.getSecurity().getProductType());
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