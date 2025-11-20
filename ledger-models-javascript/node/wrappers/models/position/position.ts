//Models
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { PositionProto } from "../../../fintekkers/models/position/position_pb";
import { FieldMapEntry, MeasureMapEntry } from "../../../fintekkers/models/position/position_util_pb";
import Portfolio from "../portfolio/portfolio";
import Security from "../security/security";
import { MeasureProto } from "../../../fintekkers/models/position/measure_pb";
import Decimal from "decimal.js";
import { ProtoSerializationUtil } from "../utils/serialization";
import { ProtoEnum } from "../utils/protoEnum";
import { Field } from "./field";
import { UUID } from "../utils/uuid";
import { ZonedDateTime } from "../utils/datetime";
import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import Transaction from "../transaction/transaction";
import { DateTime } from 'luxon';
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { StrategyProto } from "../../../fintekkers/models/strategy/strategy_pb";
import { TenorProto } from "../../../fintekkers/models/security/tenor_pb";
import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";

import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { Tenor } from "../security/term";
import { Identifier } from "../security/identifier";
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

  public getField(fieldToGet: FieldMapEntry): string | ProtoEnum | Security | Identifier | Portfolio | UUID | Date | ZonedDateTime | number | PriceProto | Tenor {
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

        if (FieldProto.PRICE == fieldToGet.getField()) {
          return unpackedValue; //instanceof PriceProto
        }

        if (FieldProto.TENOR == fieldToGet.getField()) {
          const tenorProto = unpackedValue as TenorProto;
          const tenorType = tenorProto.getTenorType();
          const termValue = tenorProto.getTermValue();
          if (termValue && termValue.length > 0) {
            return new Tenor(tenorType, termValue);
          } else {
            return new Tenor(tenorType);
          }
        }

        if (FieldProto.SECURITY == fieldToGet.getField()) {
          return Security.create(unpackedValue);
        }

        if (FieldProto.PORTFOLIO == fieldToGet.getField()) {
          return new Portfolio(unpackedValue);
        }

        return ProtoSerializationUtil.deserialize(unpackedValue) as string | number | Identifier | Date | ZonedDateTime | UUID | ProtoEnum | Security | Tenor | Portfolio | PriceProto;
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
    const value = this.getField(fieldToGet);

    switch (typeof value) {
      case 'string':
        return value;
      case 'number':
        return "" + value;
      case 'object':
        if (value instanceof Security) {
          return value.toString();
        } else if (value instanceof Portfolio) {
          return value.getPortfolioName();
        } else if (value instanceof PriceProto) {
          const uuid = value.getUuid();
          if (!uuid) throw new Error("Price UUID is required");
          return UUID.fromU8Array(uuid.getRawUuid_asU8()).toString();
        } else if (value instanceof Transaction) {
          return value.toString();
        } else if (value instanceof UUID) {
          return value.toString();
        } else if (value instanceof Date) {
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11, so add 1
          const day = String(value.getDate()).padStart(2, '0'); // getDate() returns day of month (1-31)
          return `${year}-${month}-${day}`;
        } else if (value instanceof ZonedDateTime) {
          const tmpDateTime: DateTime = value.toDateTime();
          return tmpDateTime.toFormat('yyyy/MM/dd hh:mm:ss');
        } else if (value instanceof ProtoEnum) {
          return value.toString();
        } else if (value instanceof Tenor) {
          return value.toString();
        }
        break;
      default:
        return "Can't display this field: " + fieldToGet.getField();
    }
    return "Unknown field type";
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
    const packedValue = fieldToUnpack.getFieldValuePacked();
    if (!packedValue) throw new Error("Field value is required");
    const binaryValue = packedValue.getValue() as Uint8Array;

    switch (fieldToUnpack.getField()) {
      case FieldProto.PORTFOLIO_ID:
      case FieldProto.SECURITY_ID:
      case FieldProto.PRICE_ID:
      case FieldProto.ID:
        return UUIDProto.deserializeBinary(binaryValue);
      case FieldProto.AS_OF:
        return LocalTimestampProto.deserializeBinary(binaryValue);
      case FieldProto.TRADE_DATE:
      case FieldProto.MATURITY_DATE:
      case FieldProto.ISSUE_DATE:
      case FieldProto.SETTLEMENT_DATE:
      case FieldProto.TAX_LOT_OPEN_DATE:
      case FieldProto.TAX_LOT_CLOSE_DATE:
      case FieldProto.EFFECTIVE_DATE:
        return LocalDateProto.deserializeBinary(binaryValue);
      case FieldProto.IDENTIFIER:
        return IdentifierProto.deserializeBinary(binaryValue);
      case FieldProto.STRATEGY:
        return StrategyProto.deserializeBinary(binaryValue);
      case FieldProto.TENOR:
        return TenorProto.deserializeBinary(binaryValue);
      case FieldProto.PRICE:
        return PriceProto.deserializeBinary(binaryValue);
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
        return StringValue.deserializeBinary(binaryValue);
      case FieldProto.PORTFOLIO:
        return PortfolioProto.deserializeBinary(binaryValue);
      case FieldProto.SECURITY:
      case FieldProto.CASH_IMPACT_SECURITY:
        return SecurityProto.deserializeBinary(binaryValue);
      case FieldProto.IS_CANCELLED:
        console.log("Need to check that IS_CANCELLED IS SUPPORTED CORRECTLY");
        return packedValue;
      default:
        throw new Error(`Field not found. Could not unpack ${FieldProto[fieldToUnpack.getField()]}. Mapping missing`);
    }
  }
}