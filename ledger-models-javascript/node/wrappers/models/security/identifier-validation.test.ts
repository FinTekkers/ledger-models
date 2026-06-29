// Client-side identifier guard tests (FinTekkers/second-brain#347).
// Pins behaviour of the consumer-side reject so callers fail fast on the
// client before the gRPC round-trip, mirroring the server's
// SecurityAPIGRPCImpl.validateCreateRequest UNKNOWN_IDENTIFIER_TYPE check.

import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import {
    IdentifierValidationError,
    validateIdentifierProto,
    validateIdentifiersForCreate,
} from './identifier';

function makeIdentifier(type: IdentifierTypeProto, value: string): IdentifierProto {
    const p = new IdentifierProto();
    p.setIdentifierType(type);
    p.setIdentifierValue(value);
    return p;
}

// ---------- validateIdentifierProto ----------

describe('validateIdentifierProto', () => {
    test('rejects UNKNOWN_IDENTIFIER_TYPE with a helpful message', () => {
        const bad = makeIdentifier(
            IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
            'some-uuid-hex'
        );
        let err: Error | undefined;
        try {
            validateIdentifierProto(bad);
        } catch (e) {
            err = e as Error;
        }
        expect(err).toBeInstanceOf(IdentifierValidationError);
        expect(err!.message).toMatch(/UNKNOWN_IDENTIFIER_TYPE/);
        // Surfaces the valid alternatives so the caller can fix the typo
        expect(err!.message).toMatch(/EXCH_TICKER/);
        expect(err!.message).toMatch(/#347/);
    });

    test('rejects a default-constructed identifier (type=0, empty value)', () => {
        const bad = new IdentifierProto();
        expect(() => validateIdentifierProto(bad)).toThrow(IdentifierValidationError);
    });

    test('rejects empty identifier_value with the type name in the message', () => {
        const bad = makeIdentifier(IdentifierTypeProto.EXCH_TICKER, '');
        let err: Error | undefined;
        try {
            validateIdentifierProto(bad);
        } catch (e) {
            err = e as Error;
        }
        expect(err).toBeInstanceOf(IdentifierValidationError);
        expect(err!.message).toMatch(/empty/);
        expect(err!.message).toMatch(/EXCH_TICKER/);
    });

    test('rejects whitespace-only identifier_value', () => {
        const bad = makeIdentifier(IdentifierTypeProto.CUSIP, '   ');
        expect(() => validateIdentifierProto(bad)).toThrow(IdentifierValidationError);
    });

    test.each([
        ['EXCH_TICKER', IdentifierTypeProto.EXCH_TICKER, 'AAPL'],
        ['ISIN', IdentifierTypeProto.ISIN, 'US0378331005'],
        ['CUSIP', IdentifierTypeProto.CUSIP, '037833100'],
        ['FIGI', IdentifierTypeProto.FIGI, 'BBG000B9XRY4'],
        ['OSI', IdentifierTypeProto.OSI, 'AAPL 250620C00150000'],
        ['SERIES_ID', IdentifierTypeProto.SERIES_ID, 'GS10'],
        ['INDEX_NAME', IdentifierTypeProto.INDEX_NAME, 'SPX'],
        ['CASH', IdentifierTypeProto.CASH, 'USD'],
    ])('accepts every real identifier type (%s)', (_name, type, value) => {
        const good = makeIdentifier(type, value as string);
        expect(() => validateIdentifierProto(good)).not.toThrow();
    });

    test('IdentifierValidationError is an Error', () => {
        // Catch-by-Error still works for callers that don't import the
        // specific subclass.
        const err = new IdentifierValidationError('x');
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('IdentifierValidationError');
    });
});

// ---------- validateIdentifiersForCreate ----------

describe('validateIdentifiersForCreate', () => {
    test('passes when every identifier on the SecurityProto is well-typed', () => {
        const security = new SecurityProto();
        security.addIdentifiers(
            makeIdentifier(IdentifierTypeProto.EXCH_TICKER, 'AAPL')
        );
        security.addIdentifiers(
            makeIdentifier(IdentifierTypeProto.ISIN, 'US0378331005')
        );
        expect(() => validateIdentifiersForCreate(security)).not.toThrow();
    });

    test('rejects when any identifier in the list is UNKNOWN_IDENTIFIER_TYPE', () => {
        const security = new SecurityProto();
        security.addIdentifiers(
            makeIdentifier(IdentifierTypeProto.EXCH_TICKER, 'AAPL')
        );
        security.addIdentifiers(
            makeIdentifier(
                IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
                'stale-uuid'
            )
        );
        expect(() => validateIdentifiersForCreate(security)).toThrow(
            IdentifierValidationError
        );
    });

    test('skips link-mode securities (is_link=true)', () => {
        // Link-mode = reference handle (uuid + as_of only); no identifiers
        // attached. The guard must skip rather than over-trigger.
        const link = new SecurityProto();
        link.setIsLink(true);
        expect(() => validateIdentifiersForCreate(link)).not.toThrow();
    });

    test('passes on empty identifiers list (server enforces "at least one")', () => {
        // Our consumer-side check polices the *type* of every attached
        // identifier; the "must have ≥1 identifier" rule lives server-side.
        const security = new SecurityProto();
        expect(() => validateIdentifiersForCreate(security)).not.toThrow();
    });
});
