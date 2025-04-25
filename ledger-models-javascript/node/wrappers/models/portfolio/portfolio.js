"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
class Portfolio {
    constructor(proto) {
        this.proto = proto;
    }
    toString() {
        return this.getPortfolioName();
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error('Portfolio UUID is undefined');
        return uuid_1.UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error('Portfolio AsOf is undefined');
        return new datetime_1.ZonedDateTime(asOf);
    }
    getPortfolioName() {
        return this.proto.getPortfolioName();
    }
    getFields() {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.PORTFOLIO, field_pb_1.FieldProto.PORTFOLIO_ID, field_pb_1.FieldProto.PORTFOLIO_NAME];
    }
    getField(field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.PORTFOLIO_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.PORTFOLIO_NAME:
                return this.getPortfolioName();
            default:
                throw new Error(`Field not mapped in Portfolio wrapper: ${field}`);
        }
    }
}
exports.default = Portfolio;
//# sourceMappingURL=portfolio.js.map