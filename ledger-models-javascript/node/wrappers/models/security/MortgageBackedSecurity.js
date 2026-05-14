"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const BondSecurity_1 = __importStar(require("./BondSecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const agency_pb_1 = require("../../../fintekkers/models/security/bond/agency_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const decimal_js_1 = require("decimal.js");
/**
 * MBS-specific accessors layered on top of BondSecurity. Pool-level fields
 * (agency, WAC, WAM, pass-through rate, factors, balances, PSA) live in
 * the parallel mbs_extension sub-message; bond_details still carries the
 * canonical coupon/dates/face value.
 */
class MortgageBackedSecurity extends BondSecurity_1.default {
    constructor(proto) {
        super(proto);
    }
    getMbsExtension() {
        var _a;
        return (_a = this.proto.getMbsExtension()) !== null && _a !== void 0 ? _a : undefined;
    }
    /** Pool identifier (e.g. "FN AS1234"). */
    getPoolNumber() {
        const ext = this.getMbsExtension();
        return ext ? ext.getPoolNumber() : '';
    }
    /** Issuing agency (FNMA / FHLMC / GNMA). */
    getAgency() {
        const ext = this.getMbsExtension();
        return ext ? ext.getAgency() : agency_pb_1.AgencyProto.AGENCY_UNKNOWN;
    }
    /** Weighted Average Coupon across underlying loans. */
    getWac() {
        const ext = this.getMbsExtension();
        const v = ext ? ext.getWac() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** Weighted Average Maturity, in months. */
    getWam() {
        const ext = this.getMbsExtension();
        return ext ? ext.getWam() : 0;
    }
    /** Pass-through rate paid to investors (net of servicing/guarantee fees). */
    getPassThroughRate() {
        const ext = this.getMbsExtension();
        const v = ext ? ext.getPassThroughRate() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** Current pool factor (remaining UPB / original face). */
    getCurrentFactor() {
        const ext = this.getMbsExtension();
        const v = ext ? ext.getCurrentFactor() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** Original face value at issuance. */
    getOriginalFaceValue() {
        const ext = this.getMbsExtension();
        const v = ext ? ext.getOriginalFaceValue() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** Current Unpaid Principal Balance. */
    getCurrentUpb() {
        const ext = this.getMbsExtension();
        const v = ext ? ext.getCurrentUpb() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** PSA prepayment speed assumption. */
    getPsaSpeed() {
        const ext = this.getMbsExtension();
        const v = ext ? ext.getPsaSpeed() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /**
     * Build a fresh SecurityProto for an agency MBS pass-through. product_type
     * is set to MORTGAGE_BACKED so Security.create routes back to this wrapper.
     */
    static fromPricerInputs(args) {
        const bond = (0, BondSecurity_1.buildBondDetails)(args);
        const mbs = new security_pb_1.MbsExtensionProto()
            .setPoolNumber(args.poolNumber)
            .setAgency(args.agency)
            .setWac((0, BondSecurity_1.decimalToProto)(args.wac))
            .setWam(args.wam)
            .setPassThroughRate((0, BondSecurity_1.decimalToProto)(args.passThroughRate))
            .setCurrentFactor((0, BondSecurity_1.decimalToProto)(args.currentFactor))
            .setOriginalFaceValue((0, BondSecurity_1.decimalToProto)(args.originalFaceValue))
            .setCurrentUpb((0, BondSecurity_1.decimalToProto)(args.currentUpb))
            .setPsaSpeed((0, BondSecurity_1.decimalToProto)(args.psaSpeed));
        return new security_pb_1.SecurityProto()
            .setProductType(product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED)
            .setBondDetails(bond)
            .setMbsExtension(mbs);
    }
}
exports.default = MortgageBackedSecurity;
//# sourceMappingURL=MortgageBackedSecurity.js.map