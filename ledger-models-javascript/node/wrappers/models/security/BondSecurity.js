"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const date_1 = require("../utils/date");
const coupon_frequency_1 = require("./coupon_frequency");
const coupon_type_1 = require("./coupon_type");
const term_1 = require("./term");
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
const decimal_js_1 = require("decimal.js");
const product_hierarchy_1 = require("./product_hierarchy");
class BondSecurity extends security_1.default {
    constructor(proto) {
        super(proto);
        // Bond-shape membership uses the registry: any product_type that is
        // a descendant of "BOND" in hierarchy.json (TBILL, TREASURY_NOTE,
        // TREASURY_BOND, TIPS, TREASURY_FRN, STRIPS, SOVEREIGN_BOND,
        // CORP_BOND, MUNI_BOND, plus future planned leaves under
        // CREDIT_BOND / STRUCTURED_BOND) is accepted.
        const ptName = Object.keys(product_type_pb_1.ProductTypeProto)
            .find(k => product_type_pb_1.ProductTypeProto[k] === proto.getProductType());
        if (!ptName || !(0, product_hierarchy_1.isDescendantOf)(ptName, 'BOND')) {
            throw new Error(`BondSecurity requires a bond-shape product type (descendant of BOND in hierarchy.json), got ${ptName !== null && ptName !== void 0 ? ptName : 'unknown'}`);
        }
    }
    /** Returns the tenor (term) of the bond as a Tenor object.
     *
     * If an 'as of date' is provided the term will be based on
     * maturity date - as of date, instead of maturity date - issue date.
     * @param asOfDate - [Optional]The 'as of date' to use for the tenor calculation.
     * @returns The tenor (term) of the bond as a Tenor object.
     */
    getTenor(asOfDate) {
        const startDate = asOfDate ? asOfDate : this.getIssueDate().toDate();
        const maturityDate = this.getMaturityDate().toDate();
        // Calculate the period between issue date and maturity date
        const period = this.calculatePeriod(startDate, maturityDate);
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
        const bond = this.getBondLikeDetails();
        const rate = bond ? bond.getCouponRate() : this.proto.getCouponRate();
        if (!rate)
            throw new Error("Coupon rate is required for bonds");
        return rate;
    }
    getFaceValue() {
        const bond = this.getBondLikeDetails();
        const faceValue = bond ? bond.getFaceValue() : this.proto.getFaceValue();
        if (!faceValue)
            throw new Error("Face value is required for bonds");
        return faceValue;
    }
    getCouponType() {
        const bond = this.getBondLikeDetails();
        const couponType = bond ? bond.getCouponType() : this.proto.getCouponType();
        if (!couponType)
            throw new Error("Coupon Type is required for bonds");
        return new coupon_type_1.CouponType(couponType);
    }
    getCouponFrequency() {
        const bond = this.getBondLikeDetails();
        const couponFrequency = bond ? bond.getCouponFrequency() : this.proto.getCouponFrequency();
        if (!couponFrequency)
            throw new Error("Coupon Frequency is required for bonds");
        return new coupon_frequency_1.CouponFrequency(couponFrequency);
    }
    getDatedDate() {
        const bond = this.getBondLikeDetails();
        const datedDate = bond ? bond.getDatedDate() : this.proto.getDatedDate();
        return datedDate ? new date_1.LocalDate(datedDate) : undefined;
    }
    getIssuanceInfo() {
        const bond = this.getBondLikeDetails();
        return bond ? bond.getIssuanceInfoList() : this.proto.getIssuanceInfoList();
    }
    /**
     * Returns the price scale factor for bonds.
     * Bonds are typically priced as percentages (e.g., 99.5 means 99.5%),
     * so the price scale factor converts percentage to decimal (0.01).
     * @returns The price scale factor as a Decimal (0.01)
     */
    getPriceScaleFactor() {
        return new decimal_js_1.Decimal('0.01');
    }
    /**
     * Bond issue date is the auction date and is required for bonds.
     * Overrides Security.getIssueDate (which returns LocalDate | null on the
     * base) with a non-nullable return type — for a properly-formed bond,
     * issue date is always present, and TS callers narrowed via isBond()
     * shouldn't have to null-check.
     */
    getIssueDate() {
        const date = super.getIssueDate();
        if (!date)
            throw new Error("Issue date is required for bonds");
        return date;
    }
    getProductType() {
        // Only BondSecurity has getTenor implemented
        // Check if getTenor method exists (it's only in BondSecurity)
        if (typeof this.getTenor !== 'function') {
            throw new Error('getProductType() is only supported for BondSecurity');
        }
        const tenor = this.getTenor();
        if (!tenor) {
            throw new Error('Tenor is required to determine product type');
        }
        const period = tenor.getTenor();
        if (!period) {
            throw new Error('Period is required to determine product type');
        }
        const years = period.years;
        const months = period.months;
        if (years < 1 || (years === 1 && months === 0)) {
            return 'BILL';
        }
        else if (years > 19) {
            return 'BOND';
        }
        else {
            return 'NOTE';
        }
    }
}
exports.default = BondSecurity;
//# sourceMappingURL=BondSecurity.js.map