"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDate = void 0;
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
var serialization_1 = require("./serialization");
var LocalDate = /** @class */ (function () {
    function LocalDate(proto) {
        this.proto = proto;
    }
    LocalDate.prototype.toDate = function () {
        //Use the deserialization class which correctly handles month indexing
        //mismatch between Javascript date and other languages, and the proto definition
        //In the Proto 2 means Februrary, but in Javascript it will be read as March
        return serialization_1.ProtoSerializationUtil.deserialize(this.proto);
    };
    LocalDate.prototype.toString = function () {
        return this.proto.getYear() + '-' + this.proto.getMonth() + '-' + this.proto.getDay();
    };
    LocalDate.prototype.toProto = function () {
        return this.proto;
    };
    LocalDate.today = function () {
        var today = new Date();
        return this.from(today);
    };
    LocalDate.from = function (date) {
        return new LocalDate(new local_date_pb_1.LocalDateProto().setYear(date.getFullYear()).setMonth(date.getMonth() + 1).setDay(date.getDate()));
    };
    return LocalDate;
}());
exports.LocalDate = LocalDate;
//# sourceMappingURL=date.js.map