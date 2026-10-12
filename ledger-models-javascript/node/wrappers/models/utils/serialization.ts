import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { StrategyAllocationProto } from "../../../fintekkers/models/strategy/strategy_allocation_pb";
import { ZonedDateTime } from "./datetime";
import { ProtoEnum } from "./protoEnum";
import { UUID } from "./uuid";
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { Identifier } from "../security/identifier";
import { Decimal } from "decimal.js";
import { ModelValidationError, violation } from "../errors";
import { decodeDecimal, encodeDecimal, fromDecimalJs, toDecimalJs } from "./decimal";

export class ProtoSerializationUtil {
  static serialize(obj: any): UUIDProto | LocalDateProto | LocalTimestampProto | DecimalValueProto | StringValue | IdentifierProto { //}: UUIDProto | LocalDateProto | LocalTimestampProto | DecimalValueProto | StringValue {
    if (obj instanceof UUID) {
      return obj.toUUIDProto();
    }
    if (obj instanceof Date) {
      return new LocalDateProto()
        .setYear(obj.getFullYear())
        .setMonth(obj.getMonth() + 1)
        .setDay(obj.getDate());
    }
    if (obj instanceof ZonedDateTime) {
      return obj.toProto();
    }
    if (obj instanceof Decimal) {
      return encodeDecimal(fromDecimalJs(obj));
    }
    if (typeof obj === "number") {
      // Lossless (LM-306): only a safe integer is exact as a JS number.
      if (!Number.isSafeInteger(obj)) {
        throw new ModelValidationError([violation('', undefined,
          `decimal ${obj} is not a safe integer: pass a Decimal for an exact value`)]);
      }
      return encodeDecimal({ unscaled: BigInt(obj), scale: 0 });
    }
    if (obj instanceof String) {
      return new StringValue().setValue(obj.toString());
    }
    if (obj instanceof Identifier) {
      return obj.proto as IdentifierProto;
    }

    throw new Error(`Could not serialize object of type ${typeof obj}. Value: ${obj}`);
  }

  static deserialize(obj: any): UUID | Date | ZonedDateTime | Identifier | string | Decimal | ProtoEnum | StrategyAllocationProto { //}: UUID | Date | ZonedDateTime | number | string {
    if (obj instanceof UUIDProto) {
      return UUID.fromU8Array(obj.getRawUuid_asU8());
    }
    if (obj instanceof LocalDateProto) {
      const date = new Date(obj.getYear(), obj.getMonth() - 1, obj.getDay());
      date.setHours(0, 0, 0, 0);
      return date;
    }
    if (obj instanceof LocalTimestampProto) {
      return new ZonedDateTime(obj);
    }
    if (obj instanceof IdentifierProto) {
      return new Identifier(obj);
    }
    if (obj instanceof DecimalValueProto) {
      return toDecimalJs(decodeDecimal(obj));
    }
    if (obj instanceof StringValue) {
      return obj.toString();
    }
    if (obj !== null && 'enum_name' in obj && typeof obj.enum_name !== 'undefined' && obj.enum_name !== null) {
      return new ProtoEnum(obj.descriptor, obj.enum_value);
    }
    if (obj instanceof StrategyAllocationProto) {
      return obj;
    }

    throw new Error(`Could not deserialize object of type ${typeof obj}. Value: ${obj}`);
  }
}
