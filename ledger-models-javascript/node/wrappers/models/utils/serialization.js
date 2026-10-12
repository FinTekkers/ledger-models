"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoSerializationUtil = void 0;
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const strategy_allocation_pb_1 = require("../../../fintekkers/models/strategy/strategy_allocation_pb");
const datetime_1 = require("./datetime");
const protoEnum_1 = require("./protoEnum");
const uuid_1 = require("./uuid");
const wrappers_pb_1 = require("google-protobuf/google/protobuf/wrappers_pb");
const identifier_1 = require("../security/identifier");
const decimal_js_1 = require("decimal.js");
const errors_1 = require("../errors");
const decimal_1 = require("./decimal");
class ProtoSerializationUtil {
    static serialize(obj) {
        if (obj instanceof uuid_1.UUID) {
            return obj.toUUIDProto();
        }
        if (obj instanceof Date) {
            return new local_date_pb_1.LocalDateProto()
                .setYear(obj.getFullYear())
                .setMonth(obj.getMonth() + 1)
                .setDay(obj.getDate());
        }
        if (obj instanceof datetime_1.ZonedDateTime) {
            return obj.toProto();
        }
        if (obj instanceof decimal_js_1.Decimal) {
            return (0, decimal_1.encodeDecimal)((0, decimal_1.fromDecimalJs)(obj));
        }
        if (typeof obj === "number") {
            // Lossless (LM-306): only a safe integer is exact as a JS number.
            if (!Number.isSafeInteger(obj)) {
                throw new errors_1.ModelValidationError([(0, errors_1.violation)('', undefined, `decimal ${obj} is not a safe integer: pass a Decimal for an exact value`)]);
            }
            return (0, decimal_1.encodeDecimal)({ unscaled: BigInt(obj), scale: 0 });
        }
        if (obj instanceof String) {
            return new wrappers_pb_1.StringValue().setValue(obj.toString());
        }
        if (obj instanceof identifier_1.Identifier) {
            return obj.proto;
        }
        throw new Error(`Could not serialize object of type ${typeof obj}. Value: ${obj}`);
    }
    static deserialize(obj) {
        if (obj instanceof uuid_pb_1.UUIDProto) {
            return uuid_1.UUID.fromU8Array(obj.getRawUuid_asU8());
        }
        if (obj instanceof local_date_pb_1.LocalDateProto) {
            const date = new Date(obj.getYear(), obj.getMonth() - 1, obj.getDay());
            date.setHours(0, 0, 0, 0);
            return date;
        }
        if (obj instanceof local_timestamp_pb_1.LocalTimestampProto) {
            return new datetime_1.ZonedDateTime(obj);
        }
        if (obj instanceof identifier_pb_1.IdentifierProto) {
            return new identifier_1.Identifier(obj);
        }
        if (obj instanceof decimal_value_pb_1.DecimalValueProto) {
            return (0, decimal_1.toDecimalJs)((0, decimal_1.decodeDecimal)(obj));
        }
        if (obj instanceof wrappers_pb_1.StringValue) {
            return obj.toString();
        }
        if (obj !== null && 'enum_name' in obj && typeof obj.enum_name !== 'undefined' && obj.enum_name !== null) {
            return new protoEnum_1.ProtoEnum(obj.descriptor, obj.enum_value);
        }
        if (obj instanceof strategy_allocation_pb_1.StrategyAllocationProto) {
            return obj;
        }
        throw new Error(`Could not deserialize object of type ${typeof obj}. Value: ${obj}`);
    }
}
exports.ProtoSerializationUtil = ProtoSerializationUtil;
//# sourceMappingURL=serialization.js.map