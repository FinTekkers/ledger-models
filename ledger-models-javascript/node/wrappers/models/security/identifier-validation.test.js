"use strict";
// Client-side identifier guard tests (FinTekkers/second-brain#347).
// Pins behaviour of the consumer-side reject so callers fail fast on the
// client before the gRPC round-trip, mirroring the server's
// SecurityAPIGRPCImpl.validateCreateRequest UNKNOWN_IDENTIFIER_TYPE check.
Object.defineProperty(exports, "__esModule", { value: true });
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const identifier_1 = require("./identifier");
function makeIdentifier(type, value) {
    const p = new identifier_pb_1.IdentifierProto();
    p.setIdentifierType(type);
    p.setIdentifierValue(value);
    return p;
}
// ---------- validateIdentifierProto ----------
describe('validateIdentifierProto', () => {
    test('rejects UNKNOWN_IDENTIFIER_TYPE with a helpful message', () => {
        const bad = makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, 'some-uuid-hex');
        let err;
        try {
            (0, identifier_1.validateIdentifierProto)(bad);
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(identifier_1.IdentifierValidationError);
        expect(err.message).toMatch(/UNKNOWN_IDENTIFIER_TYPE/);
        // Surfaces the valid alternatives so the caller can fix the typo
        expect(err.message).toMatch(/EXCH_TICKER/);
        expect(err.message).toMatch(/#347/);
    });
    test('rejects a default-constructed identifier (type=0, empty value)', () => {
        const bad = new identifier_pb_1.IdentifierProto();
        expect(() => (0, identifier_1.validateIdentifierProto)(bad)).toThrow(identifier_1.IdentifierValidationError);
    });
    test('rejects empty identifier_value with the type name in the message', () => {
        const bad = makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, '');
        let err;
        try {
            (0, identifier_1.validateIdentifierProto)(bad);
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(identifier_1.IdentifierValidationError);
        expect(err.message).toMatch(/empty/);
        expect(err.message).toMatch(/EXCH_TICKER/);
    });
    test('rejects whitespace-only identifier_value', () => {
        const bad = makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.CUSIP, '   ');
        expect(() => (0, identifier_1.validateIdentifierProto)(bad)).toThrow(identifier_1.IdentifierValidationError);
    });
    test.each([
        ['EXCH_TICKER', identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, 'AAPL'],
        ['ISIN', identifier_type_pb_1.IdentifierTypeProto.ISIN, 'US0378331005'],
        ['CUSIP', identifier_type_pb_1.IdentifierTypeProto.CUSIP, '037833100'],
        ['FIGI', identifier_type_pb_1.IdentifierTypeProto.FIGI, 'BBG000B9XRY4'],
        ['OSI', identifier_type_pb_1.IdentifierTypeProto.OSI, 'AAPL 250620C00150000'],
        ['SERIES_ID', identifier_type_pb_1.IdentifierTypeProto.SERIES_ID, 'GS10'],
        ['INDEX_NAME', identifier_type_pb_1.IdentifierTypeProto.INDEX_NAME, 'SPX'],
        ['CASH', identifier_type_pb_1.IdentifierTypeProto.CASH, 'USD'],
    ])('accepts every real identifier type (%s)', (_name, type, value) => {
        const good = makeIdentifier(type, value);
        expect(() => (0, identifier_1.validateIdentifierProto)(good)).not.toThrow();
    });
    test('IdentifierValidationError is an Error', () => {
        // Catch-by-Error still works for callers that don't import the
        // specific subclass.
        const err = new identifier_1.IdentifierValidationError('x');
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('IdentifierValidationError');
    });
});
// ---------- validateIdentifiersForCreate ----------
describe('validateIdentifiersForCreate', () => {
    test('passes when every identifier on the SecurityProto is well-typed', () => {
        const security = new security_pb_1.SecurityProto();
        security.addIdentifiers(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, 'AAPL'));
        security.addIdentifiers(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.ISIN, 'US0378331005'));
        expect(() => (0, identifier_1.validateIdentifiersForCreate)(security)).not.toThrow();
    });
    test('rejects when any identifier in the list is UNKNOWN_IDENTIFIER_TYPE', () => {
        const security = new security_pb_1.SecurityProto();
        security.addIdentifiers(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, 'AAPL'));
        security.addIdentifiers(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, 'stale-uuid'));
        expect(() => (0, identifier_1.validateIdentifiersForCreate)(security)).toThrow(identifier_1.IdentifierValidationError);
    });
    test('skips link-mode securities (is_link=true)', () => {
        // Link-mode = reference handle (uuid + as_of only); no identifiers
        // attached. The guard must skip rather than over-trigger.
        const link = new security_pb_1.SecurityProto();
        link.setIsLink(true);
        expect(() => (0, identifier_1.validateIdentifiersForCreate)(link)).not.toThrow();
    });
    test('passes on empty identifiers list (server enforces "at least one")', () => {
        // Our consumer-side check polices the *type* of every attached
        // identifier; the "must have ≥1 identifier" rule lives server-side.
        const security = new security_pb_1.SecurityProto();
        expect(() => (0, identifier_1.validateIdentifiersForCreate)(security)).not.toThrow();
    });
});
//# sourceMappingURL=identifier-validation.test.js.map