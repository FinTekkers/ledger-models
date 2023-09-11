"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var datetime_1 = require("../utils/datetime");
var uuid_1 = require("../utils/uuid");
var Portfolio = /** @class */ (function () {
    function Portfolio(proto) {
        this.proto = proto;
    }
    // getProto(): PortfolioProto {
    //     return this.proto;
    // }
    Portfolio.prototype.getID = function () {
        return uuid_1.UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    };
    Portfolio.prototype.getAsOf = function () {
        return new datetime_1.ZonedDateTime(this.proto.getAsOf());
    };
    Portfolio.prototype.getPortfolioName = function () {
        return this.proto.getPortfolioName();
    };
    Portfolio.prototype.getFields = function () {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.PORTFOLIO, field_pb_1.FieldProto.PORTFOLIO_ID, field_pb_1.FieldProto.PORTFOLIO_NAME];
    };
    Portfolio.prototype.getField = function (field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.PORTFOLIO_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.PORTFOLIO_NAME:
                return this.getPortfolioName();
            default:
                throw new Error("Field not mapped in Portfolio wrapper: ".concat(field));
        }
    };
    return Portfolio;
}());
exports.default = Portfolio;
//# sourceMappingURL=portfolio.js.map