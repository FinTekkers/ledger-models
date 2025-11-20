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
//# sourceMappingURL=identifier.test.js.map