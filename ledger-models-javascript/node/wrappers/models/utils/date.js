"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateToLocalDateProto = exports.localDateProtoToDate = exports.LocalDate = void 0;
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const serialization_1 = require("./serialization");
class LocalDate {
    constructor(proto) {
        this.proto = proto;
    }
    toDate() {
        //Use the deserialization class which correctly handles month indexing
        //mismatch between Javascript date and other languages, and the proto definition
        //In the Proto 2 means Februrary, but in Javascript it will be read as March
        return serialization_1.ProtoSerializationUtil.deserialize(this.proto);
    }
    toString() {
        return this.proto.getYear() + '-' + this.proto.getMonth() + '-' + this.proto.getDay();
    }
    toProto() {
        return this.proto;
    }
    static today() {
        const today = new Date();
        return this.from(today);
    }
    static from(date) {
        return new LocalDate(new local_date_pb_1.LocalDateProto().setYear(date.getFullYear()).setMonth(date.getMonth() + 1).setDay(date.getDate()));
    }
}
exports.LocalDate = LocalDate;
/**
 * Convert a LocalDateProto to a native Date, or null when the proto is
 * undefined/null. Hours/min/sec/ms are zeroed so equality comparisons across
 * accessors are deterministic. Months are translated from proto's 1-based
 * convention to JavaScript's 0-based Date constructor.
 */
function localDateProtoToDate(proto) {
    if (!proto)
        return null;
    const d = new Date(proto.getYear(), proto.getMonth() - 1, proto.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}
exports.localDateProtoToDate = localDateProtoToDate;
/**
 * Convert a native Date to a LocalDateProto. Translates JS's 0-based month
 * to the proto's 1-based convention; year/day pass through.
 */
function dateToLocalDateProto(d) {
    return new local_date_pb_1.LocalDateProto()
        .setYear(d.getFullYear())
        .setMonth(d.getMonth() + 1)
        .setDay(d.getDate());
}
exports.dateToLocalDateProto = dateToLocalDateProto;
//# sourceMappingURL=date.js.map