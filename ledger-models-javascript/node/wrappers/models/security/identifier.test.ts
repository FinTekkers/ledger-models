import assert = require('assert');
import { Identifier } from './identifier';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';

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

function testIsinIdentifier(): void {
    const identifierProto = new IdentifierProto();
    identifierProto.setIdentifierType(IdentifierTypeProto.ISIN);
    identifierProto.setIdentifierValue('US0378331005');

    const identifier = new Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'ISIN', 'Should return "ISIN"');
    assert(identifier.getIdentifierValue() === 'US0378331005', 'Should return the identifier value');
    assert(identifier.toString() === 'ISIN:US0378331005', 'Should return "ISIN:US0378331005"');
}

function testCusipIdentifier(): void {
    const identifierProto = new IdentifierProto();
    identifierProto.setIdentifierType(IdentifierTypeProto.CUSIP);
    identifierProto.setIdentifierValue('037833100');

    const identifier = new Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'CUSIP', 'Should return "CUSIP"');
    assert(identifier.getIdentifierValue() === '037833100', 'Should return the identifier value');
    assert(identifier.toString() === 'CUSIP:037833100', 'Should return "CUSIP:037833100"');
}

function testExchTickerIdentifier(): void {
    const identifierProto = new IdentifierProto();
    identifierProto.setIdentifierType(IdentifierTypeProto.EXCH_TICKER);
    identifierProto.setIdentifierValue('AAPL');

    const identifier = new Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'EXCH_TICKER', 'Should return "EXCH_TICKER"');
    assert(identifier.getIdentifierValue() === 'AAPL', 'Should return the identifier value');
    assert(identifier.toString() === 'EXCH_TICKER:AAPL', 'Should return "EXCH_TICKER:AAPL"');
}

function testUnknownIdentifier(): void {
    const identifierProto = new IdentifierProto();
    identifierProto.setIdentifierType(IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE);
    identifierProto.setIdentifierValue('UNKNOWN123');

    const identifier = new Identifier(identifierProto);
    assert(identifier.getIdentifierTypeName() === 'UNKNOWN_IDENTIFIER_TYPE', 'Should return "UNKNOWN_IDENTIFIER_TYPE"');
    assert(identifier.getIdentifierValue() === 'UNKNOWN123', 'Should return the identifier value');
    assert(identifier.toString() === 'UNKNOWN_IDENTIFIER_TYPE:UNKNOWN123', 'Should return "UNKNOWN_IDENTIFIER_TYPE:UNKNOWN123"');
}

