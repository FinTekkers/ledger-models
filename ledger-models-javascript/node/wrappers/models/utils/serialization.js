"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoSerializationUtil = void 0;
var decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
var uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
var uuid_1 = require("./uuid");
var ProtoSerializationUtil = /** @class */ (function () {
    function ProtoSerializationUtil() {
    }
    ProtoSerializationUtil.serialize = function (obj) {
        if (obj instanceof uuid_1.UUID) {
            return obj.toUUIDProto();
        }
        if (obj instanceof Date) {
            return new local_date_pb_1.LocalDateProto()
                .setYear(obj.getUTCFullYear())
                .setMonth(obj.getUTCMonth() + 1)
                .setDay(obj.getUTCDate());
        }
        if (typeof obj === "number") {
            return new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue(obj.toString());
        }
        throw new Error("Could not serialize object of type ".concat(typeof obj, ". Value: ").concat(obj));
    };
    ProtoSerializationUtil.deserialize = function (obj) {
        if (obj instanceof uuid_pb_1.UUIDProto) {
            return uuid_1.UUID.fromU8Array(obj.getRawUuid_asU8());
        }
        if (obj instanceof local_date_pb_1.LocalDateProto) {
            return new Date(Date.UTC(obj.getYear(), obj.getMonth() - 1, obj.getDay()));
        }
        if (obj.enum_name && obj.enum_name === "TRANSACTION_TYPE") {
            return null; // new TransactionType(obj.enum_value);
        }
        if (obj instanceof decimal_value_pb_1.DecimalValueProto) {
            return parseFloat(obj.getArbitraryPrecisionValue());
        }
        throw new Error("Could not deserialize object of type ".concat(typeof obj, ". Value: ").concat(obj));
    };
    return ProtoSerializationUtil;
}());
exports.ProtoSerializationUtil = ProtoSerializationUtil;
//# sourceMappingURL=serialization.js.map