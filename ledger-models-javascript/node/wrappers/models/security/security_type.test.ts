import { SecurityType } from './security_type';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';

describe('SecurityType.fromName', () => {
    // Round-trip: every name returned by getAllTypeNames must resolve to
    // a numeric enum value that maps back to the same name.
    test.each(SecurityType.getAllTypeNames())(
        'fromName("%s") returns the matching numeric enum value',
        (name: string) => {
            const value = SecurityType.fromName(name);
            // The proto-generated enum is bidirectionally indexable
            // (Object.keys / numeric-key lookups both work in google-protobuf JS).
            const expected = (SecurityTypeProto as unknown as Record<string, number>)[name];
            expect(value).toBe(expected);
        }
    );

    test('throws on unknown name and lists valid names in the error', () => {
        let err: Error | undefined;
        try {
            SecurityType.fromName('NOT_A_REAL_TYPE');
        } catch (e) {
            err = e as Error;
        }
        expect(err).toBeDefined();
        expect(err!.message).toContain('NOT_A_REAL_TYPE');
        // Error message should hint with known valid entries.
        expect(err!.message).toContain('BOND_SECURITY');
        expect(err!.message).toContain('EQUITY_SECURITY');
    });

    test('accepts UNKNOWN_SECURITY_TYPE — sentinel is a valid enum key', () => {
        // It's excluded from getAllTypeNames (so it doesn't appear in
        // dropdowns), but it IS a valid proto enum value, so fromName
        // accepts it. Pinning the existing behavior — flip if policy
        // ever tightens.
        expect(SecurityType.fromName('UNKNOWN_SECURITY_TYPE')).toBe(
            SecurityTypeProto.UNKNOWN_SECURITY_TYPE
        );
    });
});

describe('SecurityType.getAllTypeNames', () => {
    test('returns the expected set in proto-declaration order, excluding UNKNOWN', () => {
        // Proto-declared order in security_type.proto:
        //   UNKNOWN_SECURITY_TYPE = 0;  (excluded)
        //   CASH_SECURITY = 1;
        //   EQUITY_SECURITY = 2;
        //   BOND_SECURITY = 3;
        //   TIPS = 4;
        //   FRN = 5;
        //   INDEX_SECURITY = 6;
        //   FX_SPOT = 7;
        //   EQUITY_INDEX_SECURITY = 8;
        //   STRIPS_SECURITY = 9;          (added in #246)
        //   T_BILL = 10;                  (added in #246)
        //   CRYPTOCURRENCY = 11;          (added in #237)
        expect(SecurityType.getAllTypeNames()).toEqual([
            'CASH_SECURITY',
            'EQUITY_SECURITY',
            'BOND_SECURITY',
            'TIPS',
            'FRN',
            'INDEX_SECURITY',
            'FX_SPOT',
            'EQUITY_INDEX_SECURITY',
            'STRIPS_SECURITY',
            'T_BILL',
            'CRYPTOCURRENCY',
        ]);
    });

    test('excludes the UNKNOWN_SECURITY_TYPE sentinel', () => {
        expect(SecurityType.getAllTypeNames()).not.toContain('UNKNOWN_SECURITY_TYPE');
    });
});
