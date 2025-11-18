"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const date_1 = require("../utils/date");
const coupon_frequency_1 = require("./coupon_frequency");
const coupon_type_1 = require("./coupon_type");
const term_1 = require("./term");
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
class BondSecurity extends security_1.default {
    constructor(proto) {
        super(proto);
        if (proto.getSecurityType() !== security_type_pb_1.SecurityTypeProto.BOND_SECURITY) {
            throw new Error(`BondSecurity requires BOND_SECURITY type, got ${security_type_pb_1.SecurityTypeProto[proto.getSecurityType()]}`);
        }
    }
    /** Returns the tenor (term) of the bond as a Tenor object */
    getTenor() {
        const issueDate = this.getIssueDate().toDate();
        const maturityDate = this.getMaturityDate().toDate();
        // Calculate the period between issue date and maturity date
        const period = this.calculatePeriod(issueDate, maturityDate);
        return new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, period);
    }
    /**
     * Calculates the period between two dates in years, months, and days.
     * This method handles month and year boundaries correctly.
     */
    calculatePeriod(startDate, endDate) {
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();
        // Adjust for negative days (e.g., if end day is before start day)
        if (days < 0) {
            months--;
            // Get the number of days in the previous month
            const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
            days += lastDayOfPrevMonth;
        }
        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }
        return {
            years,
            months,
            days
        };
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
        const couponType = this.proto.getCouponType();
        if (!couponType)
            throw new Error("Coupon Type is required for bonds");
        return new coupon_type_1.CouponType(couponType);
    }
    getCouponFrequency() {
        const couponFrequency = this.proto.getCouponFrequency();
        if (!couponFrequency)
            throw new Error("Coupon Frequency is required for bonds");
        return new coupon_frequency_1.CouponFrequency(couponFrequency);
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