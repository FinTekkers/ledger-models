// Note: Some classes and functions have been omitted or simplified due to lack of context.

import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionProto } from "../../../fintekkers/models/position/position_pb";
import { FieldMapEntry, MeasureMapEntry } from "../../../fintekkers/models/position/position_util_pb";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import Decimal from "decimal.js";
import { TransactionTypeProto } from "../../../fintekkers/models/transaction/transaction_type_pb";

export class Position {
  proto: PositionProto;

  constructor(positionProto: PositionProto) {
    this.proto = positionProto;
  }

  public getFieldValue(field: FieldProto): any {
    switch (field) {
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
      case FieldProto.ASSET_CLASS:
        let items3 = [TransactionTypeProto.BUY, TransactionTypeProto.SELL, TransactionTypeProto.DEPOSIT, TransactionTypeProto.WITHDRAWAL, TransactionTypeProto.MATURATION];
        const randomIndex3 = Math.floor(Math.random() * items3.length);
        return items3[randomIndex3];
      default:
        throw new Error("No dummy data setup for this Field");
    }
  }

  public getField(fieldToGet: FieldMapEntry): any {
    throw Error("Do not cal this");
  }

  public getMeasureValue(measure: MeasureProto): Decimal {
    switch (measure) {
      case MeasureProto.DIRECTED_QUANTITY:
        return new Decimal(Math.random() * 100000);
      case MeasureProto.UNADJUSTED_COST_BASIS:
        return new Decimal(Math.random() * 100);
      case MeasureProto.MARKET_VALUE:
        return new Decimal(Math.random() * 10000000);
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

  // public toString(): string {
  //   let output = "";

  //   for (const field of this.getFields()) {
  //     output += `${FieldProto[field.getField()]},`;
  //     output += `${this.getFieldDisplay(field)};`;
  //   }

  //   for (const measure of this.getMeasures()) {
  //     output += `${MeasureProto[measure.getMeasure()]},`;
  //     const tmp: Decimal = this.getMeasure(measure);
  //     output += `${tmp.toString()};`;
  //   }

  //   return output;
  // }

  // private static wrapStringToAny(myString: string): Any {
  //     const myAny = new Any();
  //     myAny.pack(wrappers.StringValue.create({ value: myString }));
  //     return myAny;
  // }

  // private static packField(fieldToPack: any): Any {
  //     const myAny = new Any();
  //     myAny.pack(fieldToPack);
  //     return myAny;
  // }

  // public static unpackField(fieldToUnpack: FieldMapEntry): any {
  //   switch (fieldToUnpack.getField()) {
  //     case FieldProto.PORTFOLIO_ID:
  //     case FieldProto.SECURITY_ID:
  //     case FieldProto.ID:
  //       return UUIDProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     case FieldProto.AS_OF:
  //       return LocalTimestampProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     case FieldProto.TRADE_DATE:
  //     case FieldProto.MATURITY_DATE:
  //     case FieldProto.ISSUE_DATE:
  //     case FieldProto.SETTLEMENT_DATE:
  //     case FieldProto.TAX_LOT_OPEN_DATE:
  //     case FieldProto.TAX_LOT_CLOSE_DATE:
  //       return LocalDateProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     case FieldProto.IDENTIFIER:
  //       return IdentifierProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     case FieldProto.TRANSACTION_TYPE:
  //     case FieldProto.POSITION_STATUS:
  //       // Assuming ProtoEnum is properly defined elsewhere
  //       // const descriptor = FieldProto.DESCRIPTOR.valuesByNumber[fieldToUnpack.field];
  //       return null; //new ProtoEnum(descriptor, fieldToUnpack.enumValue);
  //     case FieldProto.PORTFOLIO_NAME:
  //     case FieldProto.SECURITY_DESCRIPTION:
  //     case FieldProto.PRODUCT_TYPE:
  //     case FieldProto.ASSET_CLASS:
  //       return StringValue.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     case FieldProto.PORTFOLIO:
  //       return PortfolioProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     case FieldProto.SECURITY:
  //       return SecurityProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
  //     default:
  //       throw new Error(`Field not found. Could not unpack ${FieldProto[fieldToUnpack.getField()]}`);
  //   }
  // }

  // public static unpackMeasure(measureToUnpack: MeasureProto): DecimalValueProto {
  //   if (measureToUnpack === MeasureProto.DIRECTED_QUANTITY) {
  //     return measureToUnpack.g;
  //   } else {
  //     throw new Error(`Field not found. Could not unpack ${MeasureProto.Name[measureToUnpack.measure]}`);
  //   }
  // }
}