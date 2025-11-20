import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { LocalTimestampProto } from "../../../fintekkers/models/util/local_timestamp_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { ZonedDateTime } from "./datetime";
import { ProtoEnum } from "./protoEnum";
import { UUID } from "./uuid";
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { Identifier } from "../security/identifier";
export declare class ProtoSerializationUtil {
    static serialize(obj: any): UUIDProto | LocalDateProto | LocalTimestampProto | DecimalValueProto | StringValue | IdentifierProto;
    static deserialize(obj: any): UUID | Date | ZonedDateTime | Identifier | string | number | ProtoEnum;
}
