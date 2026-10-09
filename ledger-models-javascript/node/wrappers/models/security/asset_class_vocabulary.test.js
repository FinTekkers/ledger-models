"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LM-275: one asset-class vocabulary (hierarchy.json), a shared match helper
 * and labels for every enum the UI shows.
 *
 * The match cases live in ledger-models-protos/fixtures/asset_class_matches.json,
 * shared with the Java and Python tests.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const product_hierarchy_1 = require("./product_hierarchy");
const asset_class_pb_1 = require("../../../fintekkers/models/security/asset_class_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const instrument_type_pb_1 = require("../../../fintekkers/models/security/instrument_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');
const rows = JSON.parse(fs.readFileSync(path.join(PROTOS, 'fixtures/asset_class_matches.json'), 'utf-8')).cases;
// LM-282: instrument-type code labels, shared with the Java, Python and Rust tests.
const instrumentTypeFixture = JSON.parse(fs.readFileSync(path.join(PROTOS, 'fixtures/instrument_type_labels.json'), 'utf-8'));
const hierarchy = JSON.parse(fs.readFileSync(path.join(PROTOS, 'hierarchy.json'), 'utf-8'));
describe('assetClassMatches shared fixture', () => {
    test.each(rows)('assetClassMatches($filter, $stored) === $expected', ({ filter, stored, expected }) => {
        expect((0, product_hierarchy_1.assetClassMatches)(filter, stored)).toBe(expected);
    });
    test('fixture has the required rows', () => {
        expect(rows.length).toBeGreaterThanOrEqual(7);
        const found = new Map(rows.map((r) => [`${r.filter}|${r.stored}`, r.expected]));
        const required = [
            ['FIXED_INCOME|RATES', true],
            ['FIXED_INCOME|CREDIT', true],
            ['FIXED_INCOME|Fixed Income', true],
            ['EQUITY|Equity', true],
            ['CASH|Cash', true],
            ['EQUITY|RATES', false],
            ['EQUITY|NOT_AN_ASSET_CLASS', false],
        ];
        for (const [key, expected] of required) {
            expect([key, found.get(key)]).toEqual([key, expected]);
        }
    });
});
describe('the tree comes from hierarchy.json', () => {
    test('every asset_classes entry matches its parent, label and aliases', () => {
        var _a;
        const entries = Object.entries(hierarchy.asset_classes);
        expect(entries.length).toBeGreaterThan(0);
        for (const [code, entry] of entries) {
            if (entry.parent)
                expect([entry.parent, code, (0, product_hierarchy_1.assetClassMatches)(entry.parent, code)]).toEqual([entry.parent, code, true]);
            expect([code, entry.label, (0, product_hierarchy_1.assetClassMatches)(code, entry.label)]).toEqual([code, entry.label, true]);
            for (const alias of (_a = entry.aliases) !== null && _a !== void 0 ? _a : []) {
                expect([code, alias, (0, product_hierarchy_1.assetClassMatches)(code, alias)]).toEqual([code, alias, true]);
            }
        }
    });
    test('an ambiguous label fails at load', () => {
        expect(() => (0, product_hierarchy_1.buildAssetClassLookup)({ A: { parent: null, label: 'Shared' }, B: { parent: null, label: 'shared' } })).toThrow();
    });
});
describe('labels for every enum value', () => {
    const enums = [
        ['IdentifierTypeProto', identifier_type_pb_1.IdentifierTypeProto, product_hierarchy_1.identifierTypeLabelOf],
        ['InstrumentTypeProto', instrument_type_pb_1.InstrumentTypeProto, product_hierarchy_1.instrumentTypeLabelOf],
        ['ProductTypeProto', product_type_pb_1.ProductTypeProto, product_hierarchy_1.productTypeLabelOf],
        ['AssetClassProto', asset_class_pb_1.AssetClassProto, product_hierarchy_1.assetClassProtoLabelOf],
    ];
    test.each(enums)('every %s value has a non-empty label', (name, enumObj, labelOf) => {
        var _a;
        const values = Object.entries(enumObj);
        expect(values.length).toBeGreaterThan(0);
        let checked = 0;
        for (const [valueName, v] of values) {
            expect([`${name}.${valueName}`, ((_a = labelOf(v)) !== null && _a !== void 0 ? _a : '').trim() !== '']).toEqual([`${name}.${valueName}`, true]);
            checked++;
        }
        expect(checked).toBe(values.length);
    });
    test('every IdentifierTypeProto value has a non-empty placeholder', () => {
        var _a;
        const values = Object.entries(identifier_type_pb_1.IdentifierTypeProto);
        for (const [valueName, v] of values) {
            expect([valueName, ((_a = (0, product_hierarchy_1.identifierTypePlaceholderOf)(v)) !== null && _a !== void 0 ? _a : '').trim() !== '']).toEqual([valueName, true]);
        }
        expect(values.length).toBeGreaterThan(0);
    });
    test('CASH_ASSET_CLASS is labelled Cash', () => {
        expect((0, product_hierarchy_1.assetClassProtoLabelOf)(asset_class_pb_1.AssetClassProto.CASH_ASSET_CLASS)).toBe('Cash');
    });
    test('out-of-range numbers return null', () => {
        expect((0, product_hierarchy_1.identifierTypeLabelOf)(9999)).toBeNull();
        expect((0, product_hierarchy_1.identifierTypePlaceholderOf)(9999)).toBeNull();
        expect((0, product_hierarchy_1.instrumentTypeLabelOf)(9999)).toBeNull();
        expect((0, product_hierarchy_1.productTypeLabelOf)(9999)).toBeNull();
        expect((0, product_hierarchy_1.assetClassProtoLabelOf)(9999)).toBeNull();
    });
});
describe('the published (compiled) product_hierarchy.js', () => {
    // npm publish runs no tsc: the tracked .js is what consumers get.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const compiled = require('./product_hierarchy.js');
    test('exports the asset-class match helper', () => {
        expect(typeof compiled.assetClassMatches).toBe('function');
        expect(typeof compiled.resolveAssetClass).toBe('function');
        expect(compiled.assetClassMatches('FIXED_INCOME', 'RATES')).toBe(true);
        expect(compiled.assetClassMatches('EQUITY', 'RATES')).toBe(false);
    });
    test('exports the label and placeholder helpers', () => {
        for (const fn of [
            'identifierTypeLabelOf',
            'identifierTypePlaceholderOf',
            'instrumentTypeLabelOf',
            'productTypeLabelOf',
            'assetClassProtoLabelOf',
        ]) {
            expect([fn, typeof compiled[fn]]).toEqual([fn, 'function']);
        }
        expect(compiled.identifierTypeLabelOf(identifier_type_pb_1.IdentifierTypeProto.ISIN)).toBe('ISIN');
        expect(compiled.identifierTypePlaceholderOf(identifier_type_pb_1.IdentifierTypeProto.ISIN)).toBeTruthy();
        expect(compiled.instrumentTypeLabelOf(instrument_type_pb_1.InstrumentTypeProto.INSTRUMENT_TYPE_CASH)).toBeTruthy();
        expect(compiled.productTypeLabelOf(product_type_pb_1.ProductTypeProto.TBILL)).toBe('Treasury Bill');
        expect(compiled.assetClassProtoLabelOf(asset_class_pb_1.AssetClassProto.CASH_ASSET_CLASS)).toBe('Cash');
    });
    test('instrument-type code labels match the .ts results', () => {
        expect(compiled.allInstrumentTypes()).toEqual((0, product_hierarchy_1.allInstrumentTypes)());
        for (const code of [...instrumentTypeFixture.codes, ...instrumentTypeFixture.unknown]) {
            expect([code, compiled.instrumentTypeCodeLabelOf(code)]).toEqual([code, (0, product_hierarchy_1.instrumentTypeCodeLabelOf)(code)]);
        }
    });
});
describe('LM-282: instrument-type code labels', () => {
    test('allInstrumentTypes() is the fixture codes, in order', () => {
        expect(instrumentTypeFixture.codes).toEqual(['CASH', 'DERIVATIVE', 'REFERENCE_INDEX']);
        expect((0, product_hierarchy_1.allInstrumentTypes)()).toEqual(instrumentTypeFixture.codes);
    });
    test('every code has a label; unknown codes and prototype keys get null', () => {
        var _a;
        for (const code of instrumentTypeFixture.codes) {
            expect([code, ((_a = (0, product_hierarchy_1.instrumentTypeCodeLabelOf)(code)) !== null && _a !== void 0 ? _a : '').trim().length > 0]).toEqual([code, true]);
        }
        for (const code of [...instrumentTypeFixture.unknown, '__proto__', 'toString', 'constructor']) {
            expect([code, (0, product_hierarchy_1.instrumentTypeCodeLabelOf)(code)]).toEqual([code, null]);
        }
        expect((0, product_hierarchy_1.instrumentTypeCodeLabelOf)(null)).toBeNull();
        expect((0, product_hierarchy_1.instrumentTypeCodeLabelOf)(undefined)).toBeNull();
    });
    test('each code label equals instrumentTypeLabelOf(INSTRUMENT_TYPE_<CODE>)', () => {
        for (const code of instrumentTypeFixture.codes) {
            const v = instrument_type_pb_1.InstrumentTypeProto[`INSTRUMENT_TYPE_${code}`];
            expect(v).toBeDefined();
            expect([code, (0, product_hierarchy_1.instrumentTypeCodeLabelOf)(code)]).toEqual([code, (0, product_hierarchy_1.instrumentTypeLabelOf)(v)]);
        }
    });
    test('INSTRUMENT_TYPE_UNKNOWN keeps its label', () => {
        expect((0, product_hierarchy_1.instrumentTypeLabelOf)(instrument_type_pb_1.InstrumentTypeProto.INSTRUMENT_TYPE_UNKNOWN)).toBe('Unknown');
    });
});
//# sourceMappingURL=asset_class_vocabulary.test.js.map