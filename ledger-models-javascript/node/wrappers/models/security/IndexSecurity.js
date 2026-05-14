"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
/**
 * Wrapper for Security messages whose product_type is a descendant of
 * INDEX in hierarchy.json (CPI_SERIES, SOFR_SERIES, EQUITY_INDEX, etc.).
 * The index-specific fields live in the index_details sub-message (one of
 * the non_bond_details oneof variants).
 */
class IndexSecurity extends security_1.default {
    constructor(proto) {
        super(proto);
    }
    /** Which index family this security represents. Defaults to
     * UNKNOWN_INDEX_TYPE when index_details is not populated. */
    getIndexType() {
        const details = this.proto.getIndexDetails();
        return details ? details.getIndexType() : index_type_pb_1.IndexTypeProto.UNKNOWN_INDEX_TYPE;
    }
}
exports.default = IndexSecurity;
//# sourceMappingURL=IndexSecurity.js.map