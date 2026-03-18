//Models
import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { TransactionType } from "./transaction_type";
import { TransactionTypeProto } from "../../../fintekkers/models/transaction/transaction_type_pb";
import { StrategyAllocationProto } from "../../../fintekkers/models/strategy/strategy_allocation_pb";
import { TransactionProto } from "../../../fintekkers/models/transaction/transaction_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionStatusProto } from "../../../fintekkers/models/position/position_status_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";

import Security from "../security/security";
import Portfolio from "../portfolio/portfolio";
import Price from "../price/Price";
import { SecurityTypeProto } from "../../../fintekkers/models/security/security_type_pb";

//Model Utils
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { LocalDate } from "../utils/date";
import { Decimal } from "decimal.js";

interface TransactionConstructorParams {
  tradeDate: Date;
  settlementDate: Date;
  asOfDate: Date;
  price: Decimal;
  security: Security;
  transactionType: TransactionType;
  portfolio: Portfolio;
  quantity: Decimal;
}

class Transaction {
  proto: TransactionProto;

  constructor(protoOrParams: TransactionProto | TransactionConstructorParams) {
    if (protoOrParams instanceof TransactionProto) {
      this.proto = protoOrParams;
    } else {
      this.proto = this.buildProtoFromParams(protoOrParams);
    }
  }

  /**
   * Builds a complete TransactionProto from constructor parameters
   */
  private buildProtoFromParams(params: TransactionConstructorParams): TransactionProto {
    const transactionProto = new TransactionProto();
    transactionProto.setObjectClass('Transaction');
    transactionProto.setVersion('0.0.1');
    transactionProto.setUuid(UUID.random().toUUIDProto());

    // Convert asOfDate to ZonedDateTime and set on transaction
    const asOfZonedDateTime = ZonedDateTime.from(params.asOfDate);
    transactionProto.setAsOf(asOfZonedDateTime.toProto());

    // Convert tradeDate and settlementDate to LocalDateProto
    transactionProto.setTradeDate(LocalDate.from(params.tradeDate).toProto());
    transactionProto.setSettlementDate(LocalDate.from(params.settlementDate).toProto());

    // Create Price using Price.create() factory method
    const price = Price.create(params.price, params.security, asOfZonedDateTime);
    transactionProto.setPrice(price.proto);

    // Set security, transaction type, and portfolio from their protos
    transactionProto.setSecurity(params.security.proto);
    transactionProto.setTransactionType(params.transactionType.proto);
    transactionProto.setPortfolio(params.portfolio.proto);

    // Convert quantity to DecimalValueProto
    const quantityDecimal = new DecimalValueProto();
    quantityDecimal.setArbitraryPrecisionValue(params.quantity.toString());
    transactionProto.setQuantity(quantityDecimal);

    // Create and set an empty StrategyAllocationProto
    const strategyAllocationProto = new StrategyAllocationProto();
    strategyAllocationProto.setObjectClass('StrategyAllocation');
    strategyAllocationProto.setVersion('0.0.1');
    transactionProto.setStrategyAllocation(strategyAllocationProto);

    // Set default position status
    transactionProto.setPositionStatus(PositionStatusProto.EXECUTED);

    return transactionProto;
  }

  toString(): string {
    try {
      const validTo: string =
        this.proto.getValidTo()?.toString() ?? "NULL";

      const validFrom: string =
        this.proto.getValidFrom()?.toString() ?? "NULL";

      const strategyAllocation =
        this.proto.getStrategyAllocation()?.toString() ?? "NULL";

      return `${/*this.proto.isCancelled()*/ false ? "INVALIDATED: " : ""}TXN[${this.getID().toString()}], ` +
        `TradeDate[${this.getTradeDate().toString()}], TxnType[${this.getTransactionType()}], Price[${this.getPrice()}], Quantity[${this.getQuantity()}], ` +
        `AsOf[${this.getAsOf().toString()}], Portfolio[${this.getPortfolio().getPortfolioName()}], Issuer[${this.getSecurity().getIssuerName()}], ` +
        `ValidFrom[${validFrom}], ValidTo[${validTo}], Strategy[${strategyAllocation}]`;
    } catch (e) {
      console.error(e);
      return `Transaction toString() serialization failed: ${e}`;
    }
  }

  getFields(): FieldProto[] {
    return [FieldProto.ID, FieldProto.SECURITY_ID, FieldProto.AS_OF, FieldProto.ASSET_CLASS, FieldProto.IDENTIFIER];
  }

  getField(field: FieldProto): any {
    switch (field) {
      case FieldProto.ID:
      case FieldProto.SECURITY_ID:
        return this.getID();
      case FieldProto.AS_OF:
        return this.getAsOf();
      case FieldProto.ASSET_CLASS:
        return this.getSecurity().getAssetClass();
      case FieldProto.PRODUCT_CLASS:
        return this.getSecurity().getProductClass();
      case FieldProto.PRODUCT_TYPE:
        return this.getSecurity().getProductType();
      case FieldProto.IDENTIFIER:
        return this.getSecurity().getSecurityID();
      case FieldProto.TENOR:
      case FieldProto.ADJUSTED_TENOR:
        throw new Error('Not implemented yet');
      case FieldProto.MATURITY_DATE:
        throw new Error('Not implemented yet');
      default:
        throw new Error(`Field not mapped in Security wrapper: ${field}`);
    }
  }

  getID(): UUID {
    const uuid = this.proto.getUuid();
    if (!uuid) throw new Error("UUID is required");
    return UUID.fromU8Array(uuid.getRawUuid_asU8());
  }

  getAsOf(): ZonedDateTime {
    const asOf = this.proto.getAsOf();
    if (!asOf) throw new Error("AsOf is required");
    return new ZonedDateTime(asOf);
  }

  getPortfolio(): Portfolio {
    const portfolio = this.proto.getPortfolio();
    if (!portfolio) throw new Error("Portfolio is required");
    return new Portfolio(portfolio);
  }

  getSecurity(): Security {
    const security = this.proto.getSecurity();
    if (!security) throw new Error("Security is required");
    return Security.create(security);
  }

  getStrategyAllocation(): StrategyAllocationProto {
    const allocation = this.proto.getStrategyAllocation();
    if (!allocation) throw new Error("StrategyAllocation is required");
    return allocation;
  }

  getPrice(): PriceProto {
    const price = this.proto.getPrice();
    if (!price) throw new Error("Price is required");
    return price;
  }

  getQuantity(): Decimal {
    const quantity = this.proto.getQuantity();
    if (!quantity) throw new Error("Quantity is required");
    return new Decimal(quantity.getArbitraryPrecisionValue());
  }

  getIssuerName(): string {
    return this.getSecurity().getIssuerName();
  }

  getDirectedQuantity(): Decimal {
    return this.getQuantity().mul(this.getTransactionType().getDirectionMultiplier());
  }

  getTradeDate(): LocalDate {
    const tradeDate = this.proto.getTradeDate();
    if (!tradeDate) throw new Error("TradeDate is required");
    return new LocalDate(tradeDate);
  }

  getSettlementDate(): LocalDate {
    const settlementDate = this.proto.getSettlementDate();
    if (!settlementDate) throw new Error("SettlementDate is required");
    return new LocalDate(settlementDate);
  }

  getTransactionType(): TransactionType {
    return new TransactionType(this.proto.getTransactionType());
  }

  getTradeName(): string {
    return this.proto.getTradeName();
  }

  getPositionStatus(): PositionStatusProto {
    return this.proto.getPositionStatus();
  }

  getChildrenTransactions(): TransactionProto[] {
    return this.proto.getChildtransactionsList();
  }

  /**
   * Adds a child transaction to this transaction's proto
   * @param child - The child transaction to add
   */
  addChildTransaction(child: Transaction): void {
    this.proto.addChildtransactions(child.proto);
  }

  /**
   * Checks if this transaction's security is cash
   * @returns true if the security is cash, false otherwise
   */
  isCashSecurity(): boolean {
    return this.getSecurity().proto.getSecurityType() === SecurityTypeProto.CASH_SECURITY;
  }

  /**
   * Searches child transactions for a cash transaction
   * @returns The cash transaction if found, null otherwise
   */
  getCashTransaction(): Transaction | null {
    const children = this.getChildrenTransactions();
    for (const childProto of children) {
      const child = new Transaction(childProto);
      if (child.isCashSecurity()) {
        return child;
      }
    }
    return null;
  }

  equals(other: Transaction): boolean {
    if (other instanceof Transaction) {
      return this.getID().equals(other.getID());
    } else {
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
  static createCashTransaction(cashSecurity: Security, parentTransaction: Transaction): Transaction {
    // Determine transaction type based on parent
    let cashTransactionType: TransactionType;
    const parentType = parentTransaction.getTransactionType().proto;

    if (parentType === TransactionTypeProto.BUY || parentType === TransactionTypeProto.MATURATION_OFFSET) {
      cashTransactionType = new TransactionType(TransactionTypeProto.WITHDRAWAL);
    } else if (parentType === TransactionTypeProto.SELL || parentType === TransactionTypeProto.MATURATION) {
      cashTransactionType = new TransactionType(TransactionTypeProto.DEPOSIT);
    } else {
      throw new Error(`Cannot create cash transaction for transaction type: ${TransactionTypeProto[parentType]}`);
    }

    // Calculate book amount
    let bookAmount: Decimal;
    const securityType = parentTransaction.getSecurity().proto.getSecurityType();

    if (securityType === SecurityTypeProto.BOND_SECURITY ||
      securityType === SecurityTypeProto.TIPS ||
      securityType === SecurityTypeProto.FRN) {
      // For bond securities
      if (parentType === TransactionTypeProto.MATURATION || parentType === TransactionTypeProto.MATURATION_OFFSET) {
        // For maturation transactions, use quantity directly
        bookAmount = parentTransaction.getQuantity();
      } else {
        // For other bond transactions, calculate: (quantity / faceValue) * (price * priceScaleFactor)
        // Lazy import to avoid circular dependency
        const BondSecurity = require('../security/BondSecurity').default;
        const bondSecurity = new BondSecurity(parentTransaction.getSecurity().proto);

        const priceScaleFactor = bondSecurity.getPriceScaleFactor();
        const faceValueProto = bondSecurity.getFaceValue();
        const faceValue = new Decimal(faceValueProto.getArbitraryPrecisionValue());

        const priceProto = parentTransaction.getPrice();
        const priceValue = new Decimal(priceProto.getPrice()?.getArbitraryPrecisionValue() || '0');
        const scaledPrice = priceValue.mul(priceScaleFactor);

        const quantity = parentTransaction.getQuantity();
        const numberBondUnits = quantity.div(faceValue);

        bookAmount = numberBondUnits.mul(scaledPrice);
      }
    } else {
      // For other securities: quantity * price
      const priceProto = parentTransaction.getPrice();
      const priceValue = new Decimal(priceProto.getPrice()?.getArbitraryPrecisionValue() || '0');
      bookAmount = parentTransaction.getQuantity().mul(priceValue);
    }

    // Get asOf ZonedDateTime
    const asOf = parentTransaction.getAsOf();

    // Create cash transaction using parameter-based constructor
    const cashTransaction = new Transaction({
      tradeDate: parentTransaction.getTradeDate().toDate(),
      settlementDate: parentTransaction.getSettlementDate().toDate(),
      asOfDate: asOf.toDateTime().toJSDate(),
      price: new Decimal('1.0'), // Cash price is always 1.0
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
  static addMaturationTransaction(transaction: Transaction, transactionType: TransactionType, cashSecurity: Security): void {
    // Lazy import to avoid circular dependency
    const BondSecurity = require('../security/BondSecurity').default;

    // Cast security to BondSecurity
    const bondSecurity = new BondSecurity(transaction.getSecurity().proto);

    // Get maturity date
    const maturityDate = bondSecurity.getMaturityDate();

    // Calculate settlement date: maturity date + 2 days
    const maturityDateObj = maturityDate.toDate();
    maturityDateObj.setDate(maturityDateObj.getDate() + 2);
    const settlementDate = LocalDate.from(maturityDateObj);

    // Get price as Decimal
    const priceProto = transaction.getPrice();
    const priceValue = new Decimal(priceProto.getPrice()?.getArbitraryPrecisionValue() || '0');

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
  static addDerivedTransactions(transaction: Transaction, cashSecurity: Security): void {
    const securityType = transaction.getSecurity().proto.getSecurityType();
    const isBond = securityType === SecurityTypeProto.BOND_SECURITY ||
      securityType === SecurityTypeProto.FRN ||
      securityType === SecurityTypeProto.TIPS;

    const transactionType = transaction.getTransactionType().proto;
    const isABuyTransaction = transactionType === TransactionTypeProto.BUY;
    const isASellTransaction = transactionType === TransactionTypeProto.SELL;
    const isaMaturationTransaction = transactionType !== TransactionTypeProto.MATURATION &&
      transactionType !== TransactionTypeProto.MATURATION_OFFSET;

    if (isBond && isASellTransaction && isaMaturationTransaction) {
      Transaction.addMaturationTransaction(transaction, new TransactionType(TransactionTypeProto.MATURATION_OFFSET), cashSecurity);
    }

    if (isBond && isABuyTransaction && isaMaturationTransaction) {
      Transaction.addMaturationTransaction(transaction, new TransactionType(TransactionTypeProto.MATURATION), cashSecurity);
    }
  }

  /**
   * Adds a cash impact transaction to this transaction.
   * If the transaction's security is not cash, creates a cash transaction.
   * @param transaction - The transaction to add cash impact to
   * @param cashSecurity - The cash security (e.g., USD) to use for the cash transaction
   */
  static addCashImpact(transaction: Transaction, cashSecurity: Security): void {
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

export default Transaction;


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