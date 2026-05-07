"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asset_class_1 = require("./asset_class");
const asset_class_pb_1 = require("../../../fintekkers/models/security/asset_class_pb");
describe('AssetClass.fromName', () => {
    test.each(asset_class_1.AssetClass.getAllTypeNames())('fromName("%s") returns the matching numeric enum value', (name) => {
        const value = asset_class_1.AssetClass.fromName(name);
        const expected = asset_class_pb_1.AssetClassProto[name];
        expect(value).toBe(expected);
    });
    test('throws on unknown name and lists valid names in the error', () => {
        let err;
        try {
            asset_class_1.AssetClass.fromName('COMMODITY');
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.message).toContain('COMMODITY');
        // Hint with valid entries
        expect(err.message).toContain('FIXED_INCOME');
        expect(err.message).toContain('EQUITY');
    });
    test('accepts UNKNOWN_ASSET_CLASS — sentinel is a valid enum key', () => {
        // Same pin as SecurityType / Identifier: excluded from getAllTypeNames
        // (no dropdown surface), but valid via fromName.
        expect(asset_class_1.AssetClass.fromName('UNKNOWN_ASSET_CLASS')).toBe(asset_class_pb_1.AssetClassProto.UNKNOWN_ASSET_CLASS);
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
        expect(asset_class_1.AssetClass.getAllTypeNames()).toEqual([
            'FIXED_INCOME',
            'EQUITY',
            'CASH_ASSET_CLASS',
            'INDEX',
        ]);
    });
    test('excludes the UNKNOWN_ASSET_CLASS sentinel', () => {
        expect(asset_class_1.AssetClass.getAllTypeNames()).not.toContain('UNKNOWN_ASSET_CLASS');
    });
});
//# sourceMappingURL=asset_class.test.js.map