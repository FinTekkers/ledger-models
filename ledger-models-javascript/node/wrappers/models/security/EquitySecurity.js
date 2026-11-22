"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const decimal_1 = require("../utils/decimal");
/**
 * Wrapper for Security messages whose product_type is a descendant of
 * STOCK in hierarchy.json (COMMON_STOCK, PREFERRED_STOCK, ADR, ETF, etc.).
 * The equity-specific fields live in the equity_details sub-message (one of
 * the non_bond_details oneof variants). See docs/adr/equity_shares_outstanding.md.
 */
class EquitySecurity extends security_1.default {
    constructor(proto) {
        super(proto);
    }
    /** Whole-number count of shares outstanding at this version's as_of.
     * Undefined when unknown (no equity_details, field absent or an empty
     * decimal), never 0. */
    getSharesOutstanding() {
        const details = this.proto.getEquityDetails();
        if (!details || !details.hasSharesOutstanding())
            return undefined;
        const p = details.getSharesOutstanding();
        if ((0, decimal_1.isUnsetDecimal)(p))
            return undefined;
        return (0, decimal_1.toDecimalJs)((0, decimal_1.withField)('equity_details.shares_outstanding', () => (0, decimal_1.decodeDecimal)(p)));
    }
}
exports.default = EquitySecurity;
//# sourceMappingURL=EquitySecurity.js.map