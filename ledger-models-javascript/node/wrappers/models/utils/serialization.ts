import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { TransactionType } from "../transaction/transaction_type";
import { ZonedDateTime } from "./datetime";
import { ProtoEnum } from "./protoEnum";
import { UUID } from "./uuid";
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

export class ProtoSerializationUtil {
  static serialize(obj: any) { //}: UUIDProto | LocalDateProto | LocalTimestampProto | DecimalValueProto | StringValue {
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
    if (typeof obj === "number") {
      return new DecimalValueProto().setArbitraryPrecisionValue(obj.toString());
    }
    if (obj instanceof String) {
      return new StringValue().setValue(obj.toString());
    }

    throw new Error(`Could not serialize object of type ${typeof obj}. Value: ${obj}`);
  }

  static deserialize(obj: any) { //}: UUID | Date | ZonedDateTime | number | string {
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
      return Identifier obj.getIdentifierType() + ":" + obj.getIdentifierValue();
    }
    if (obj instanceof DecimalValueProto) {
      return parseFloat(obj.getArbitraryPrecisionValue());
    }
    if (obj instanceof StringValue) {
      return obj.toString();
    }
    if (obj !== null && 'enum_name' in obj && typeof obj.enum_name !== 'undefined' && obj.enum_name !== null) {
      return new ProtoEnum(obj.descriptor, obj.enum_value);
    }

    throw new Error(`Could not deserialize object of type ${typeof obj}. Value: ${obj}`);
  }
}
