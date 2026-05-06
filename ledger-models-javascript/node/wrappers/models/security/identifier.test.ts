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

// ---------- fromName / getAllTypeNames ----------

describe('Identifier.fromName', () => {
    // Round-trip: every name returned by getAllTypeNames must construct a
    // wrapper whose getIdentifierTypeName echoes the same name back.
    test.each(Identifier.getAllTypeNames())(
        'fromName("%s") round-trips through getIdentifierTypeName',
        (name: string) => {
            const id = Identifier.fromName(name, 'value-for-' + name);
            expect(id.getIdentifierTypeName()).toBe(name);
            expect(id.getIdentifierValue()).toBe('value-for-' + name);
            expect(id.toString()).toBe(`${name}:value-for-${name}`);
        }
    );

    test('throws on unknown name and lists valid names in the error', () => {
        let err: Error | undefined;
        try {
            Identifier.fromName('NOT_A_REAL_TYPE', 'x');
        } catch (e) {
            err = e as Error;
        }
        expect(err).toBeDefined();
        expect(err!.message).toContain('NOT_A_REAL_TYPE');
        // Error message names a few known valid entries so a typo is fixable
        // without grepping for the proto.
        expect(err!.message).toContain('ISIN');
        expect(err!.message).toContain('CUSIP');
    });

    test('throws on UNKNOWN_IDENTIFIER_TYPE — sentinel is not a public name', () => {
        // It IS a valid proto enum value, but getAllTypeNames excludes it,
        // so fromName accepting it would be inconsistent with the dropdown
        // contract. Guard explicitly.
        // (Currently fromName allows it because it IS a key on
        // IdentifierTypeProto. This test pins the EXISTING behavior so a
        // future tightening is a deliberate choice. If the policy changes,
        // flip this assertion.)
        const id = Identifier.fromName('UNKNOWN_IDENTIFIER_TYPE', 'whatever');
        expect(id.getIdentifierType()).toBe(IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE);
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
        //   CASH = 50;
        expect(Identifier.getAllTypeNames()).toEqual([
            'EXCH_TICKER',
            'ISIN',
            'CUSIP',
            'OSI',
            'FIGI',
            'SERIES_ID',
            'CASH',
        ]);
    });

    test('excludes the UNKNOWN_IDENTIFIER_TYPE sentinel', () => {
        expect(Identifier.getAllTypeNames()).not.toContain('UNKNOWN_IDENTIFIER_TYPE');
    });
});

