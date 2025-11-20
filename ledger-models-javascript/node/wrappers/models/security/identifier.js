"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identifier = void 0;
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
class Identifier {
    constructor(proto) {
        this.proto = proto;
    }
    /**
     * Returns the identifier type name based on the enum value.
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum descriptor as the value.
     *
     * @returns IdentifierType as a string (e.g., "ISIN", "CUSIP", "EXCH_TICKER")
     */
    getIdentifierTypeName() {
        var _a;
        const identifierType = this.proto.getIdentifierType();
        return (_a = Identifier.identifierTypeEnumMap.get(identifierType)) !== null && _a !== void 0 ? _a : 'UNKNOWN_IDENTIFIER_TYPE';
    }
    /**
     * Returns the identifier value (e.g., "US0378331005" for an ISIN)
     */
    getIdentifierValue() {
        return this.proto.getIdentifierValue();
    }
    /**
     * Returns the identifier type enum value
     */
    getIdentifierType() {
        return this.proto.getIdentifierType();
    }
    /**
     * Returns a string representation in the format: "IDENTIFIER_TYPE:identifier_value"
     * Example: "ISIN:US0378331005" or "CUSIP:037833100"
     */
    toString() {
        const typeName = this.getIdentifierTypeName();
        const value = this.getIdentifierValue();
        return `${typeName}:${value}`;
    }
}
exports.Identifier = Identifier;
(() => {
    Identifier.identifierTypeEnumMap = new Map();
    Object.keys(identifier_type_pb_1.IdentifierTypeProto).forEach(key => {
        Identifier.identifierTypeEnumMap.set(identifier_type_pb_1.IdentifierTypeProto[key], key);
    });
})();
//# sourceMappingURL=identifier.js.map