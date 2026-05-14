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
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const decimal_js_1 = require("decimal.js");
/**
 * FRN-specific accessors layered on top of BondSecurity. The floating-rate
 * fields live in the parallel frn_extension sub-message; bond_details
 * still carries face value / dates / etc.
 */
class FloatingRateNote extends BondSecurity_1.default {
    constructor(proto) {
        super(proto);
    }
    getFrnExtension() {
        var _a;
        return (_a = this.proto.getFrnExtension()) !== null && _a !== void 0 ? _a : undefined;
    }
    /** Spread added on top of the reference rate at each reset. */
    getSpread() {
        const ext = this.getFrnExtension();
        const v = ext ? ext.getSpread() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** Which index the coupon resets off (SOFR on a US TREASURY_FRN). */
    getReferenceRateIndex() {
        const ext = this.getFrnExtension();
        return ext ? ext.getReferenceRateIndex() : index_type_pb_1.IndexTypeProto.UNKNOWN_INDEX_TYPE;
    }
    /** Reset cadence (e.g. QUARTERLY). */
    getResetFrequency() {
        const ext = this.getFrnExtension();
        return ext ? ext.getResetFrequency() : coupon_frequency_pb_1.CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY;
    }
    /**
     * Build a fresh SecurityProto for a floating-rate note. product_type is
     * set to TREASURY_FRN so Security.create routes back to this wrapper.
     */
    static fromPricerInputs(args) {
        const bond = (0, BondSecurity_1.buildBondDetails)(args);
        const frn = new security_pb_1.FrnExtensionProto()
            .setSpread((0, BondSecurity_1.decimalToProto)(args.spread))
            .setReferenceRateIndex(args.referenceRateIndex)
            .setResetFrequency(args.resetFrequency);
        return new security_pb_1.SecurityProto()
            .setProductType(product_type_pb_1.ProductTypeProto.TREASURY_FRN)
            .setBondDetails(bond)
            .setFrnExtension(frn);
    }
}
exports.default = FloatingRateNote;
//# sourceMappingURL=FloatingRateNote.js.map