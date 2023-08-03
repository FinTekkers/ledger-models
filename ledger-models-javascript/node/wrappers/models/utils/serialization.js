import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { LocalDateProto } from "../../../fintekkers/models/util/local_date_pb";
import { UUIDProto } from "../../../fintekkers/models/util/uuid_pb";
import { UUID } from "./uuid";
var ProtoSerializationUtil = /** @class */ (function () {
    function ProtoSerializationUtil() {
    }
    ProtoSerializationUtil.serialize = function (obj) {
        if (obj instanceof UUID) {
            return obj.toUUIDProto();
        }
        if (obj instanceof Date) {
            return new LocalDateProto()
                .setYear(obj.getUTCFullYear())
                .setMonth(obj.getUTCMonth() + 1)
                .setDay(obj.getUTCDate());
        }
        if (typeof obj === "number") {
            return new DecimalValueProto().setArbitraryPrecisionValue(obj.toString());
        }
        throw new Error("Could not serialize object of type ".concat(typeof obj, ". Value: ").concat(obj));
    };
    ProtoSerializationUtil.deserialize = function (obj) {
        if (obj instanceof UUIDProto) {
            return UUID.fromU8Array(obj.getRawUuid_asU8());
        }
        if (obj instanceof LocalDateProto) {
            return new Date(Date.UTC(obj.getYear(), obj.getMonth() - 1, obj.getDay()));
        }
        if (obj.enum_name && obj.enum_name === "TRANSACTION_TYPE") {
            return null; // new TransactionType(obj.enum_value);
        }
        if (obj instanceof DecimalValueProto) {
            return parseFloat(obj.getArbitraryPrecisionValue());
        }
        throw new Error("Could not deserialize object of type ".concat(typeof obj, ". Value: ").concat(obj));
    };
    return ProtoSerializationUtil;
}());
export { ProtoSerializationUtil };
//# sourceMappingURL=serialization.js.map