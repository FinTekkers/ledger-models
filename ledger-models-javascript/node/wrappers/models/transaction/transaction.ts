//Models
import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { TransactionType } from "./transaction_type";
import { StrategyAllocationProto } from "../../../fintekkers/models/strategy/strategy_allocation_pb";
import { TransactionProto } from "../../../fintekkers/models/transaction/transaction_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionStatusProto } from "../../../fintekkers/models/position/position_status_pb";

import Security from "../security/security";
import Portfolio from "../portfolio/portfolio";

//Model Utils
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { LocalDate } from "../utils/date";
import { Decimal } from "decimal.js";

class Transaction {
  proto: TransactionProto;

  constructor(proto: TransactionProto) {
    this.proto = proto;
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


  equals(other: Transaction): boolean {
    if (other instanceof Transaction) {
      return this.getID().equals(other.getID());
    } else {
      return false;
    }
  }
}

export default Transaction;
