"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const identifier_1 = require("./identifier");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
test('test Identifier.ISIN returns correct type name and toString', () => {
    testIsinIdentifier();
});
test('test Identifier.CUSIP returns correct type name and toString', () => {
    testCusipIdentifier();
});
test('test Identifier.EXCH_TICKER returns correct type name and toString', () => {
    testExchTickerIdentifier();
});
test('test Identifier.UNKNOWN returns correct type name and toString', () => {
    testUnknownIdentifier();
});
function testIsinIdentifier() {
    const identifierProto = new identifier_pb_1.IdentifierProto();
    identifierProto.setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.ISIN);
    identifierProto.setIdentifierValue('US0378331005');
    const identifier = new identifier_1.Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'ISIN', 'Should return "ISIN"');
    assert(identifier.getIdentifierValue() === 'US0378331005', 'Should return the identifier value');
    assert(identifier.toString() === 'ISIN:US0378331005', 'Should return "ISIN:US0378331005"');
}
function testCusipIdentifier() {
    const identifierProto = new identifier_pb_1.IdentifierProto();
    identifierProto.setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.CUSIP);
    identifierProto.setIdentifierValue('037833100');
    const identifier = new identifier_1.Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'CUSIP', 'Should return "CUSIP"');
    assert(identifier.getIdentifierValue() === '037833100', 'Should return the identifier value');
    assert(identifier.toString() === 'CUSIP:037833100', 'Should return "CUSIP:037833100"');
}
function testExchTickerIdentifier() {
    const identifierProto = new identifier_pb_1.IdentifierProto();
    identifierProto.setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER);
    identifierProto.setIdentifierValue('AAPL');
    const identifier = new identifier_1.Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'EXCH_TICKER', 'Should return "EXCH_TICKER"');
    assert(identifier.getIdentifierValue() === 'AAPL', 'Should return the identifier value');
    assert(identifier.toString() === 'EXCH_TICKER:AAPL', 'Should return "EXCH_TICKER:AAPL"');
}
function testUnknownIdentifier() {
    const identifierProto = new identifier_pb_1.IdentifierProto();
    identifierProto.setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE);
    identifierProto.setIdentifierValue('UNKNOWN123');
    const identifier = new identifier_1.Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'UNKNOWN_IDENTIFIER_TYPE', 'Should return "UNKNOWN_IDENTIFIER_TYPE"');
    assert(identifier.getIdentifierValue() === 'UNKNOWN123', 'Should return the identifier value');
    assert(identifier.toString() === 'UNKNOWN_IDENTIFIER_TYPE:UNKNOWN123', 'Should return "UNKNOWN_IDENTIFIER_TYPE:UNKNOWN123"');
}
// ---------- fromName / getAllTypeNames ----------
describe('Identifier.fromName', () => {
    // Round-trip: every name returned by getAllTypeNames must construct a
    // wrapper whose getIdentifierTypeName echoes the same name back.
    test.each(identifier_1.Identifier.getAllTypeNames())('fromName("%s") round-trips through getIdentifierTypeName', (name) => {
        const id = identifier_1.Identifier.fromName(name, 'value-for-' + name);
        expect(id.getIdentifierTypeName()).toBe(name);
        expect(id.getIdentifierValue()).toBe('value-for-' + name);
        expect(id.toString()).toBe(`${name}:value-for-${name}`);
    });
    test('throws on unknown name and lists valid names in the error', () => {
        let err;
        try {
            identifier_1.Identifier.fromName('NOT_A_REAL_TYPE', 'x');
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.message).toContain('NOT_A_REAL_TYPE');
        // Error message names a few known valid entries so a typo is fixable
        // without grepping for the proto.
        expect(err.message).toContain('ISIN');
        expect(err.message).toContain('CUSIP');
    });
    test('throws on UNKNOWN_IDENTIFIER_TYPE — sentinel is not a public name', () => {
        // It IS a valid proto enum value, but getAllTypeNames excludes it,
        // so fromName accepting it would be inconsistent with the dropdown
        // contract. Guard explicitly.
        // (Currently fromName allows it because it IS a key on
        // IdentifierTypeProto. This test pins the EXISTING behavior so a
        // future tightening is a deliberate choice. If the policy changes,
        // flip this assertion.)
        const id = identifier_1.Identifier.fromName('UNKNOWN_IDENTIFIER_TYPE', 'whatever');
        expect(id.getIdentifierType()).toBe(identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE);
    });
});
describe('Identifier.getAllTypeNames', () => {
    test('returns the expected set in proto-declaration order, excluding UNKNOWN', () => {
        // Proto-declared order in identifier_type.proto:
        //   UNKNOWN_IDENTIFIER_TYPE = 0;  (excluded)
        //   EXCH_TICKER = 1;
        //   ISIN = 2;
        //   CUSIP = 3;
        //   OSI = 4;
        //   FIGI = 5;
        //   SERIES_ID = 6;
        //   INDEX_NAME = 7;
        //   CASH = 50;
        expect(identifier_1.Identifier.getAllTypeNames()).toEqual([
            'EXCH_TICKER',
            'ISIN',
            'CUSIP',
            'OSI',
            'FIGI',
            'SERIES_ID',
            'INDEX_NAME',
            'CASH',
        ]);
    });
    test('excludes the UNKNOWN_IDENTIFIER_TYPE sentinel', () => {
        expect(identifier_1.Identifier.getAllTypeNames()).not.toContain('UNKNOWN_IDENTIFIER_TYPE');
    });
});
//# sourceMappingURL=identifier.test.js.map