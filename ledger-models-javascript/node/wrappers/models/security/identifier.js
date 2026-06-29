"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identifier = exports.validateIdentifiersForCreate = exports.validateIdentifierProto = exports.IdentifierValidationError = void 0;
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
/**
 * Raised when an IdentifierProto is rejected by the client-side guard
 * before being sent to SecurityService. See FinTekkers/second-brain#347.
 */
class IdentifierValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'IdentifierValidationError';
    }
}
exports.IdentifierValidationError = IdentifierValidationError;
/**
 * Client-side guard for a single IdentifierProto. Mirrors the server's
 * SecurityAPIGRPCImpl.validateCreateRequest reject so consumer SDKs fail
 * fast before the gRPC round-trip. See FinTekkers/second-brain#347.
 *
 * Rejects:
 *   - identifier_type == UNKNOWN_IDENTIFIER_TYPE (proto3 default — never a
 *     real identifier; equity loaders MUST pass EXCH_TICKER / CUSIP / ...)
 *   - identifier_value empty or whitespace-only
 */
function validateIdentifierProto(identifier) {
    var _a;
    const idType = identifier.getIdentifierType();
    if (idType === identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE) {
        throw new IdentifierValidationError(`Refusing to send Security with identifier_type=UNKNOWN_IDENTIFIER_TYPE. ` +
            `Pass a concrete IdentifierTypeProto (${Identifier.getAllTypeNames().join(', ')}). ` +
            `See FinTekkers/second-brain#347.`);
    }
    const value = identifier.getIdentifierValue();
    if (value === undefined || value === null || value.trim() === '') {
        const typeName = (_a = Identifier.identifierTypeEnumMap.get(idType)) !== null && _a !== void 0 ? _a : String(idType);
        throw new IdentifierValidationError(`Refusing to send Security identifier with empty identifier_value ` +
            `(identifier_type=${typeName}). See FinTekkers/second-brain#347.`);
    }
}
exports.validateIdentifierProto = validateIdentifierProto;
/**
 * Client-side guard for every identifier carried by a SecurityProto on the
 * create/upsert path. Skips link-mode securities (is_link=true) — those carry
 * only uuid+as_of and aren't entities being created. Throws on the first
 * offending identifier.
 */
function validateIdentifiersForCreate(security) {
    if (security.getIsLink()) {
        return;
    }
    security.getIdentifiersList().forEach(validateIdentifierProto);
}
exports.validateIdentifiersForCreate = validateIdentifiersForCreate;
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
    /**
     * Build an Identifier from the proto enum's NAME (e.g., "ISIN", "CUSIP",
     * "EXCH_TICKER") plus the identifier value. Saves callers from rolling
     * their own name->enum switch — adding a new enum variant on the proto
     * side propagates automatically.
     *
     * Throws if `name` isn't a known IdentifierTypeProto key. The error
     * lists the valid names so the caller can fix the typo without grepping.
     *
     * @param name proto enum key (e.g., "ISIN")
     * @param value the identifier value (e.g., "US0378331005")
     */
    static fromName(name, value) {
        const enumObj = identifier_type_pb_1.IdentifierTypeProto;
        const enumValue = enumObj[name];
        if (enumValue === undefined) {
            throw new Error(`Unknown IdentifierType name: '${name}'. Valid names: ${Identifier.getAllTypeNames().join(', ')}`);
        }
        const proto = new identifier_pb_1.IdentifierProto();
        proto.setIdentifierType(enumValue);
        proto.setIdentifierValue(value);
        // Client-side guard (#347): rejects UNKNOWN_IDENTIFIER_TYPE and empty
        // values here so misuse fails at construction time, not at send time.
        validateIdentifierProto(proto);
        return new Identifier(proto);
    }
    /**
     * Returns the names of all known IdentifierType enum values, EXCLUDING
     * the sentinel `UNKNOWN_IDENTIFIER_TYPE`. Drives UI dropdowns / pickers
     * so adding a new proto enum variant auto-propagates to consumers
     * without any UI-side code change.
     *
     * Order matches proto declaration order (Object.keys preserves
     * insertion order on the generated JS enum object).
     *
     * @returns string[] of identifier type names, e.g.
     *   ["EXCH_TICKER", "ISIN", "CUSIP", "OSI", "FIGI", "SERIES_ID", "CASH"]
     */
    static getAllTypeNames() {
        return Object.keys(identifier_type_pb_1.IdentifierTypeProto).filter(k => k !== 'UNKNOWN_IDENTIFIER_TYPE');
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