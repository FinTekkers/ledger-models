// Note: Some classes and functions have been omitted or simplified due to lack of context.

import { Any } from "@grpc/grpc-js/build/src/generated/google/protobuf/Any";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionProto } from "../../../fintekkers/models/position/position_pb";
import { FieldMapEntry, MeasureMapEntry } from "../../../fintekkers/models/position/position_util_pb";
import Portfolio from "../portfolio/portfolio";
import Security from "../security/security";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { UUID } from "../utils/uuid";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import Decimal from "decimal.js";
import { ProtoSerializationUtil } from "../utils/serialization";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';

export class Position {
  proto: PositionProto;

  constructor(positionProto: PositionProto) {
    this.proto = positionProto;

    // //For each field, put into a map
    // this.proto.getFieldsList().forEach(field => {
    //   console.log(field);
    // });

  }

  public getFieldValue(field: FieldProto): any {
    return this.getField(new FieldMapEntry().setField(field));
  }

  public getField(fieldToGet: FieldMapEntry): any {
    for (const tmpField of this.proto.getFieldsList()) {
      if (tmpField.getField() === fieldToGet.getField()) {
        const unpackedValue = Position.unpackField(tmpField);

        if (unpackedValue.type === "enum") {
          throw new Error("Doh");
          // const descriptor = FieldProto.DESCRIPTOR.valuesByNumber[fieldToGet.field];
          // return new ProtoEnum(descriptor, unpackedValue.enumValue);
        }

        if (typeof unpackedValue === "string" || typeof unpackedValue === "number") {
          return unpackedValue;
        }

        return ProtoSerializationUtil.deserialize(unpackedValue);
      }
    }

    throw new Error("Could not find field in position");
  }

  public getMeasureValue(measure: MeasureProto): Decimal {
    return this.getMeasure(new MeasureMapEntry().setMeasure(measure));
  }

  private getMeasure(measureToGet: MeasureMapEntry): Decimal {
    for (const tmpMeasure of this.proto.getMeasuresList()) {
      if (tmpMeasure.getMeasure() === measureToGet.getMeasure()) {
        return ProtoSerializationUtil.deserialize(tmpMeasure.getMeasureDecimalValue());
      }
    }

    throw new Error("Could not find measure in position");
  }

  public getFieldDisplay(fieldToGet: FieldMapEntry): string {
    const fieldValue = this.getField(fieldToGet);
    return fieldValue.toString();
  }

  public getMeasures(): MeasureMapEntry[] {
    return this.proto.getMeasuresList();
  }

  public getFields(): FieldMapEntry[] {
    return this.proto.getFieldsList();
  }

  public toString(): string {
    let output = "";

    for (const field of this.getFields()) {
      output += `${FieldProto[field.getField()]},`;
      output += `${this.getFieldDisplay(field)};`;
    }

    for (const measure of this.getMeasures()) {
      output += `${MeasureProto[measure.getMeasure()]},`;
      const tmp: Decimal = this.getMeasure(measure);
      output += `${tmp.toString()};`;
    }

    return output;
  }

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

  public static unpackField(fieldToUnpack: FieldMapEntry): any {
    switch (fieldToUnpack.getField()) {
      case FieldProto.PORTFOLIO_ID:
      case FieldProto.SECURITY_ID:
      case FieldProto.ID:
        return UUIDProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.AS_OF:
        return LocalTimestampProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.TRADE_DATE:
      case FieldProto.MATURITY_DATE:
      case FieldProto.ISSUE_DATE:
      case FieldProto.SETTLEMENT_DATE:
      case FieldProto.TAX_LOT_OPEN_DATE:
      case FieldProto.TAX_LOT_CLOSE_DATE:
        return LocalDateProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.IDENTIFIER:
        return IdentifierProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.TRANSACTION_TYPE:
      case FieldProto.POSITION_STATUS:
        // Assuming ProtoEnum is properly defined elsewhere
        // const descriptor = FieldProto.DESCRIPTOR.valuesByNumber[fieldToUnpack.field];
        return null; //new ProtoEnum(descriptor, fieldToUnpack.enumValue);
      case FieldProto.PORTFOLIO_NAME:
      case FieldProto.SECURITY_DESCRIPTION:
      case FieldProto.PRODUCT_TYPE:
      case FieldProto.ASSET_CLASS:
        return StringValue.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.PORTFOLIO:
        return PortfolioProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.SECURITY:
        return SecurityProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      default:
        throw new Error(`Field not found. Could not unpack ${FieldProto[fieldToUnpack.getField()]}`);
    }
  }

  // public static unpackMeasure(measureToUnpack: MeasureProto): DecimalValueProto {
  //   if (measureToUnpack === MeasureProto.DIRECTED_QUANTITY) {
  //     return measureToUnpack.g;
  //   } else {
  //     throw new Error(`Field not found. Could not unpack ${MeasureProto.Name[measureToUnpack.measure]}`);
  //   }
  // }
}