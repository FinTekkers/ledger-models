import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { ZonedDateTime } from "./datetime";
import { UUID } from "./uuid";
  
  interface EnumValueDescriptor {
    name: string;
    values_by_number: { [key: number]: { name: string } };
  }
  
  export class ProtoSerializationUtil {
    static serialize(obj: any): any {
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
  
      throw new Error(`Could not serialize object of type ${typeof obj}. Value: ${obj}`);
    }
  
    static deserialize(obj: any): any {
      if (obj instanceof UUIDProto) {
        return UUID.fromU8Array(obj.getRawUuid_asU8());
      }
      if (obj instanceof LocalDateProto) {
        const date = new Date(obj.getYear(), obj.getMonth() - 1, obj.getDay());
        date.setHours(0,0,0,0);
        return date;
      }
      if (obj instanceof LocalTimestampProto) {
        return new ZonedDateTime(obj);
      }
      if (obj.enum_name && obj.enum_name === "TRANSACTION_TYPE") {
        return null;// new TransactionType(obj.enum_value);
      }
      if (obj instanceof DecimalValueProto) {
        return parseFloat(obj.getArbitraryPrecisionValue());
      }
  
      throw new Error(`Could not deserialize object of type ${typeof obj}. Value: ${obj}`);
    }
  }
