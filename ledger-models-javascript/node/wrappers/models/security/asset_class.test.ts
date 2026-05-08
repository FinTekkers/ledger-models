import { AssetClass } from './asset_class';
import { AssetClassProto } from '../../../fintekkers/models/security/asset_class_pb';

describe('AssetClass.fromName', () => {
    test.each(AssetClass.getAllTypeNames())(
        'fromName("%s") returns the matching numeric enum value',
        (name: string) => {
            const value = AssetClass.fromName(name);
            const expected = (AssetClassProto as unknown as Record<string, number>)[name];
            expect(value).toBe(expected);
        }
    );

    test('throws on unknown name and lists valid names in the error', () => {
        let err: Error | undefined;
        try {
            AssetClass.fromName('COMMODITY');
        } catch (e) {
            err = e as Error;
        }
        expect(err).toBeDefined();
        expect(err!.message).toContain('COMMODITY');
        // Hint with valid entries
        expect(err!.message).toContain('FIXED_INCOME');
        expect(err!.message).toContain('EQUITY');
    });

    test('accepts UNKNOWN_ASSET_CLASS — sentinel is a valid enum key', () => {
        // Same pin as SecurityType / Identifier: excluded from getAllTypeNames
        // (no dropdown surface), but valid via fromName.
        expect(AssetClass.fromName('UNKNOWN_ASSET_CLASS')).toBe(
            AssetClassProto.UNKNOWN_ASSET_CLASS
        );
    });
});

describe('AssetClass.getAllTypeNames', () => {
    test('returns the expected set in proto-declaration order, excluding UNKNOWN', () => {
        // Proto-declared order in asset_class.proto:
        //   UNKNOWN_ASSET_CLASS = 0;     (excluded)
        //   FIXED_INCOME = 1;
        //   EQUITY = 2;
        //   CASH_ASSET_CLASS = 3;        (suffixed to avoid name collision
        //                                 with IdentifierTypeProto.CASH per
        //                                 proto3 package-wide uniqueness)
        //   INDEX = 4;
        //   VOLATILITY = 5;              (added in #236 for VIX support)
        expect(AssetClass.getAllTypeNames()).toEqual([
            'FIXED_INCOME',
            'EQUITY',
            'CASH_ASSET_CLASS',
            'INDEX',
            'VOLATILITY',
        ]);
    });

    test('excludes the UNKNOWN_ASSET_CLASS sentinel', () => {
        expect(AssetClass.getAllTypeNames()).not.toContain('UNKNOWN_ASSET_CLASS');
    });
});
