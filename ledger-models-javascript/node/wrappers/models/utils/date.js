"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDate = void 0;
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
var LocalDate = /** @class */ (function () {
    function LocalDate(proto) {
        this.proto = proto;
    }
    LocalDate.prototype.toDate = function () {
        return new Date(this.proto.getYear(), this.proto.getMonth(), this.proto.getDay());
    };
    LocalDate.prototype.toString = function () {
        return this.proto.getYear() + '-' + this.proto.getMonth() + '-' + this.proto.getDay();
    };
    LocalDate.prototype.toProto = function () {
        return this.proto;
    };
    LocalDate.today = function () {
        var today = new Date();
        return new LocalDate(new local_date_pb_1.LocalDateProto().setYear(today.getFullYear()).setMonth(today.getMonth()).setDay(today.getDate()));
    };
    return LocalDate;
}());
exports.LocalDate = LocalDate;
//# sourceMappingURL=date.js.map