// Note: Some classes and functions have been omitted or simplified due to lack of context.

import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionProto } from "../../../fintekkers/models/position/position_pb";
import { FieldMapEntry, MeasureMapEntry } from "../../../fintekkers/models/position/position_util_pb";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import Decimal from "decimal.js";
import { TransactionTypeProto } from "../../../fintekkers/models/transaction/transaction_type_pb";
import { v4 as uuidv4 } from 'uuid';

export class Position {
  proto: PositionProto;

  constructor(positionProto: PositionProto) {
    this.proto = positionProto;
  }

  public getFieldValue(field: FieldProto): any {
    switch (field) {
      case FieldProto.TRADE_DATE:
      case FieldProto.TRADE_DATE:
      case FieldProto.EFFECTIVE_DATE:
      case FieldProto.MATURITY_DATE:
      case FieldProto.TAX_LOT_OPEN_DATE:
      case FieldProto.TAX_LOT_CLOSE_DATE:
        const start = new Date(2024, 0, 1).getTime(); // January 1st of the startYear
        const now = new Date().getTime();
        const randomTime = start + Math.random() * (now - start);
        return new Date(randomTime);
      case FieldProto.PRODUCT_TYPE:
        let items = ['Bond', 'Equity']
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
      case FieldProto.ASSET_CLASS:
        let items2 = ['Equity', 'Fixed Income']
        const randomIndex2 = Math.floor(Math.random() * items2.length);
        return items2[randomIndex2];
      case FieldProto.TRANSACTION_TYPE:
        let items3 = [TransactionTypeProto.BUY, TransactionTypeProto.SELL, TransactionTypeProto.DEPOSIT, TransactionTypeProto.WITHDRAWAL, TransactionTypeProto.MATURATION];
        const randomIndex3 = Math.floor(Math.random() * items3.length);
        return items3[randomIndex3];
      case FieldProto.ID:
      case FieldProto.SECURITY_ID:
      case FieldProto.PORTFOLIO_ID:
        return uuidv4();
      default:
        throw new Error("No dummy data setup for this Field");
    }
  }

  public getField(fieldToGet: FieldMapEntry): any {
    throw Error("Do not cal this");
  }

  public getMeasureValue(measure: MeasureProto): string {
    switch (measure) {
      case MeasureProto.DIRECTED_QUANTITY:
        return new Decimal(Math.random() * 100000).toString();
      case MeasureProto.UNADJUSTED_COST_BASIS:
        return new Decimal(Math.random() * 100).toString();
      case MeasureProto.MARKET_VALUE:
        return new Decimal(Math.random() * 10000000).toString();
    }
  }

  private getMeasure(measureToGet: MeasureMapEntry): Decimal {
    throw new Error("Do not call this");
  }

  public getFieldDisplay(fieldToGet: FieldMapEntry): string {
    throw new Error("Do not call this");
  }

  public getMeasures(): MeasureProto[] {
    return [MeasureProto.DIRECTED_QUANTITY, MeasureProto.UNADJUSTED_COST_BASIS, MeasureProto.MARKET_VALUE];
  }

  public getFields(): FieldProto[] {
    return [FieldProto.SECURITY_ID, FieldProto.TRADE_DATE, FieldProto.ASSET_CLASS, FieldProto.TRANSACTION_TYPE];
  }
}
