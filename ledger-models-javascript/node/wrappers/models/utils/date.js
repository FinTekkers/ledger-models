"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDate = void 0;
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
//# sourceMappingURL=date.js.map