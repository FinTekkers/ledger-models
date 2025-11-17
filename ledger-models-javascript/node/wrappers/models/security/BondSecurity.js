"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const date_1 = require("../utils/date");
class BondSecurity extends security_1.default {
    constructor(proto) {
        super(proto);
        if (proto.getSecurityType() !== security_type_pb_1.SecurityTypeProto.BOND_SECURITY) {
            throw new Error(`BondSecurity requires BOND_SECURITY type, got ${security_type_pb_1.SecurityTypeProto[proto.getSecurityType()]}`);
        }
    }
    getCouponRate() {
        const rate = this.proto.getCouponRate();
        if (!rate)
            throw new Error("Coupon rate is required for bonds");
        return rate;
    }
    getFaceValue() {
        const faceValue = this.proto.getFaceValue();
        if (!faceValue)
            throw new Error("Face value is required for bonds");
        return faceValue;
    }
    getCouponType() {
        return this.proto.getCouponType();
    }
    getCouponFrequency() {
        return this.proto.getCouponFrequency();
    }
    getDatedDate() {
        const datedDate = this.proto.getDatedDate();
        return datedDate ? new date_1.LocalDate(datedDate) : undefined;
    }
    getIssuanceInfo() {
        return this.proto.getIssuanceInfoList();
    }
}
exports.default = BondSecurity;
//# sourceMappingURL=BondSecurity.js.map