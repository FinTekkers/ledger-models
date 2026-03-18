import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { TransactionType } from "./transaction_type";
import { StrategyAllocationProto } from "../../../fintekkers/models/strategy/strategy_allocation_pb";
import { TransactionProto } from "../../../fintekkers/models/transaction/transaction_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionStatusProto } from "../../../fintekkers/models/position/position_status_pb";
import Security from "../security/security";
import Portfolio from "../portfolio/portfolio";
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
declare class Transaction {
    proto: TransactionProto;
    constructor(protoOrParams: TransactionProto | TransactionConstructorParams);
    /**
     * Builds a complete TransactionProto from constructor parameters
     */
    private buildProtoFromParams;
    toString(): string;
    getFields(): FieldProto[];
    getField(field: FieldProto): any;
    getID(): UUID;
    getAsOf(): ZonedDateTime;
    getPortfolio(): Portfolio;
    getSecurity(): Security;
    getStrategyAllocation(): StrategyAllocationProto;
    getPrice(): PriceProto;
    getQuantity(): Decimal;
    getIssuerName(): string;
    getDirectedQuantity(): Decimal;
    getTradeDate(): LocalDate;
    getSettlementDate(): LocalDate;
    getTransactionType(): TransactionType;
    getTradeName(): string;
    getPositionStatus(): PositionStatusProto;
    getChildrenTransactions(): TransactionProto[];
    /**
     * Adds a child transaction to this transaction's proto
     * @param child - The child transaction to add
     */
    addChildTransaction(child: Transaction): void;
    /**
     * Checks if this transaction's security is cash
     * @returns true if the security is cash, false otherwise
     */
    isCashSecurity(): boolean;
    /**
     * Searches child transactions for a cash transaction
     * @returns The cash transaction if found, null otherwise
     */
    getCashTransaction(): Transaction | null;
    equals(other: Transaction): boolean;
    /**
     * Creates a cash transaction associated with a parent transaction.
     * The cash transaction represents the cash impact of the parent transaction.
     * @param cashSecurity - The cash security (e.g., USD)
     * @param parentTransaction - The parent transaction for which to create the cash transaction
     * @returns The created cash transaction
     */
    static createCashTransaction(cashSecurity: Security, parentTransaction: Transaction): Transaction;
    /**
     * Creates a maturation transaction for a bond.
     * @param transaction - The parent transaction (must be for a bond security)
     * @param transactionType - The transaction type (MATURATION or MATURATION_OFFSET)
     * @param cashSecurity - The cash security to use for the cash impact
     */
    static addMaturationTransaction(transaction: Transaction, transactionType: TransactionType, cashSecurity: Security): void;
    /**
     * Generates additional transactions associated with this transaction.
     * For instance, a Buy transaction on a bond will also create the maturation transaction.
     * @param transaction - The parent transaction
     * @param cashSecurity - The cash security to use for cash impacts
     */
    static addDerivedTransactions(transaction: Transaction, cashSecurity: Security): void;
    /**
     * Adds a cash impact transaction to this transaction.
     * If the transaction's security is not cash, creates a cash transaction.
     * @param transaction - The transaction to add cash impact to
     * @param cashSecurity - The cash security (e.g., USD) to use for the cash transaction
     */
    static addCashImpact(transaction: Transaction, cashSecurity: Security): void;
}
export default Transaction;
