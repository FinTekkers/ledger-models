//Models
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionProto } from "../../../fintekkers/models/position/position_pb";
import { FieldMapEntry, MeasureMapEntry } from "../../../fintekkers/models/position/position_util_pb";
import Portfolio from "../portfolio/portfolio";
import Security from "../security/security";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import Decimal from "decimal.js";
import { ProtoSerializationUtil } from "../utils/serialization";
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { ProtoEnum } from "../utils/protoEnum";
import { Field } from "./field";
import { UUID } from "../utils/uuid";
import { ZonedDateTime } from "../utils/datetime";
import { StrategyProto } from "../../../fintekkers/models/strategy/strategy_pb";
import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { TenorProto } from "../../../fintekkers/models/security/tenor_pb";

export class Position {
  proto: PositionProto;

  constructor(positionProto: PositionProto) {
    this.proto = positionProto;
  }

  /*** */
  toJSON(): any {
    return {
      proto: this.proto.serializeBinary(), // Serialize Age object to binary buffer
    };
  }

  /**
   * Experimental impelementaiton
   * @param binary An array which is the raw binary of the proto object
   * @returns A Position object with the deserialized binary inside it
   */
  static fromJSON(json: any): Position {
    return new Position(PositionProto.deserializeBinary(json['proto']));
  }

  public getFieldValue(field: FieldProto): any {
    return this.getField(new FieldMapEntry().setField(field));
  }

  public getField(fieldToGet: FieldMapEntry): string | ProtoEnum | Security | Portfolio | UUID | Date | ZonedDateTime | number | PriceProto {
    for (const tmpField of this.proto.getFieldsList()) {
      if (tmpField.getField() === fieldToGet.getField()) {

        if (tmpField.getStringValue() !== undefined && tmpField.getStringValue().length > 0) {
          return tmpField.getStringValue();
        }

        if (tmpField.getEnumValue() > 0) {
          let fieldName: string = new Field(fieldToGet.getField()).getName();
          let proto: ProtoEnum = ProtoEnum.fromEnumName(fieldName, tmpField.getEnumValue());
          return proto;
        } else if (tmpField.getEnumValue() == 0 && !tmpField.getStringValue() &&
          !tmpField.getFieldValuePacked()) {
          console.log("Warning: this position has an undefined enum value, which should be fixed in upstream data");
          let fieldName: string = new Field(fieldToGet.getField()).getName();
          let proto: ProtoEnum = ProtoEnum.fromEnumName(fieldName, 0);
          return proto;
        }

        const unpackedValue = Position.unpackField(tmpField);

        if (FieldProto.PRICE == fieldToGet.getField()
          || FieldProto.TENOR == fieldToGet.getField()) {
          return unpackedValue; //instanceof PriceProto || TenorProto
        }

        if (FieldProto.SECURITY == fieldToGet.getField()) {
          return new Security(unpackedValue);
        }

        if (FieldProto.PORTFOLIO == fieldToGet.getField()) {
          return new Portfolio(unpackedValue);
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
        return ProtoSerializationUtil.deserialize(tmpMeasure.getMeasureDecimalValue()) as unknown as Decimal;
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

  public static unpackField(fieldToUnpack: FieldMapEntry): any {
    switch (fieldToUnpack.getField()) {
      case FieldProto.PORTFOLIO_ID:
      case FieldProto.SECURITY_ID:
      case FieldProto.PRICE_ID:
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
      case FieldProto.EFFECTIVE_DATE:
        return LocalDateProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.IDENTIFIER:
        return IdentifierProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.STRATEGY:
        return StrategyProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.TENOR:
        return TenorProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.PRICE:
        return PriceProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.TRANSACTION_TYPE:
      case FieldProto.POSITION_STATUS:
        return fieldToUnpack;
      case FieldProto.PORTFOLIO_NAME:
      case FieldProto.SECURITY_DESCRIPTION:
      case FieldProto.SECURITY_ISSUER_NAME:
      case FieldProto.ADJUSTED_TENOR:
      case FieldProto.PRODUCT_TYPE:
      case FieldProto.PRODUCT_CLASS:
      case FieldProto.ASSET_CLASS:
        return StringValue.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
      case FieldProto.PORTFOLIO:
      case FieldProto.SECURITY:
      case FieldProto.CASH_IMPACT_SECURITY:
        return fieldToUnpack.getFieldValuePacked();
      case FieldProto.IS_CANCELLED:
        console.log("Need to check that IS_CANCELLED IS SUPPORTED CORRECTLY");
        return fieldToUnpack.getFieldValuePacked();
      default:
        throw new Error(`Field not found. Could not unpack ${FieldProto[fieldToUnpack.getField()]}. Mapping missing`);
    }
  }
}