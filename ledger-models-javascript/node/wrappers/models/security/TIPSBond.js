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
const date_1 = require("../utils/date");
const decimal_js_1 = require("decimal.js");
/**
 * TIPS-specific accessors layered on top of BondSecurity. The inflation
 * fields live in the parallel tips_extension sub-message; bond_details
 * (coupon, maturity, etc.) still carries the rest.
 */
class TIPSBond extends BondSecurity_1.default {
    constructor(proto) {
        super(proto);
    }
    getTipsExtension() {
        var _a;
        return (_a = this.proto.getTipsExtension()) !== null && _a !== void 0 ? _a : undefined;
    }
    /** Base CPI value at issue, used to scale inflation-adjusted principal. */
    getBaseCpi() {
        const ext = this.getTipsExtension();
        const v = ext ? ext.getBaseCpi() : undefined;
        if (!v)
            return null;
        return new decimal_js_1.Decimal(v.getArbitraryPrecisionValue());
    }
    /** Reference date for the base CPI fixing. */
    getIndexDate() {
        const ext = this.getTipsExtension();
        const d = ext ? ext.getIndexDate() : undefined;
        if (!d)
            return null;
        return new date_1.LocalDate(d);
    }
    /** Which inflation index drives accruals (CPI_U on US TIPS). */
    getInflationIndexType() {
        const ext = this.getTipsExtension();
        return ext ? ext.getInflationIndexType() : index_type_pb_1.IndexTypeProto.UNKNOWN_INDEX_TYPE;
    }
    /**
     * Build a fresh SecurityProto for a TIPS bond. product_type is set to
     * TIPS so Security.create routes back to this wrapper.
     */
    static fromPricerInputs(args) {
        const bond = (0, BondSecurity_1.buildBondDetails)(args);
        const tips = new security_pb_1.TipsExtensionProto()
            .setBaseCpi((0, BondSecurity_1.decimalToProto)(args.baseCpi))
            .setIndexDate((0, BondSecurity_1.localDateToProto)(args.indexDate))
            .setInflationIndexType(args.inflationIndexType);
        return new security_pb_1.SecurityProto()
            .setProductType(product_type_pb_1.ProductTypeProto.TIPS)
            .setBondDetails(bond)
            .setTipsExtension(tips);
    }
}
exports.default = TIPSBond;
//# sourceMappingURL=TIPSBond.js.map