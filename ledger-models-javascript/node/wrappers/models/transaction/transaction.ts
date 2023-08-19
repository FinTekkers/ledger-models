import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionStatusProto } from "../../../fintekkers/models/position/position_status_pb";
import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { TransactionType } from "./transaction_type";
import { StrategyAllocationProto } from "../../../fintekkers/models/strategy/strategy_allocation_pb";
import { TransactionProto } from "../../../fintekkers/models/transaction/transaction_pb";
import { TransactionTypeProto } from "../../../fintekkers/models/transaction/transaction_type_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import Security from "../security/security";
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
        this.proto.getValidFrom() !== null ? this.proto.getValidTo().toString() : "NULL";
    
        return `${/*this.proto.isCancelled()*/ false ? "INVALIDATED: " : ""}TXN[${this.getID().toString()}], ` +
        `TradeDate[${this.getTradeDate().toString()}], TxnType[${this.getTransactionType()}], Price[${this.getPrice()}], Quantity[${this.getQuantity()}], ` +
        `AsOf[${this.getAsOf().toString()}], Portfolio[${this.getPortfolio().getPortfolioName()}], Issuer[${this.getSecurity().getIssuerName()}], ` +
        `ValidFrom[${this.proto.getValidFrom().toString()}], ValidTo[${validTo}], Strategy[${this.getStrategyAllocation().toString()}]`;
    } catch (e) {
        console.error(e);
        return "WHOOPS";
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
    return UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
  }

  getAsOf(): ZonedDateTime {
    return new ZonedDateTime(this.proto.getAsOf());
  }

  //TODO: Create Portfolio wrapper
  getPortfolio(): PortfolioProto {
    return this.proto.getPortfolio();
  }

  getSecurity(): Security {
    return new Security(this.proto.getSecurity());
  }

  getStrategyAllocation(): StrategyAllocationProto {
    return this.proto.getStrategyAllocation();
  }

  getPrice(): PriceProto {
    return this.proto.getPrice();
  }

  getQuantity(): Decimal {
    return new Decimal(this.proto.getQuantity().getArbitraryPrecisionValue());
  }

  getIssuerName(): string {
    return this.getSecurity().getIssuerName();
  }

  getDirectedQuantity(): Decimal {
    return this.getQuantity().mul(this.getTransactionType().getDirectionMultiplier());
}

  getTradeDate(): LocalDate {
    return new LocalDate(this.proto.getTradeDate());
  }

  getSettlementDate() : LocalDate {
    return new LocalDate(this.proto.getSettlementDate());
  }

    getTransactionType() : TransactionType {
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
