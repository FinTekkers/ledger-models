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
 * LM-461: default trade-price type by product, from hierarchy.json
 * default_price_types. Parity with Python test_default_price_types.py, Java
 * DefaultPriceTypesTest and Rust default_price_types_test.rs.
 *
 * The shared cases live in ledger-models-protos/fixtures/default_price_types_cases.json;
 * expected values come from that file only, never from the resolver under test.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const default_price_types_1 = require("./default_price_types");
const errors_1 = require("../errors");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');
const CASES = JSON.parse(fs.readFileSync(path.join(PROTOS, 'fixtures/default_price_types_cases.json'), 'utf-8')).cases;
function sourceSection() {
    return JSON.parse(fs.readFileSync(path.join(PROTOS, 'hierarchy.json'), 'utf-8')).default_price_types;
}
const PRODUCT_TYPES = product_type_pb_1.ProductTypeProto;
const PRICE_TYPES = price_type_pb_1.PriceTypeProto;
// ---------- metric 3: every product resolves to the fixture, never UNKNOWN ----------
test('the fixture lists every ProductTypeProto enum value', () => {
    expect(Object.keys(CASES).sort()).toEqual(Object.keys(product_type_pb_1.ProductTypeProto).sort());
});
test('the fixture covers deepest-node-wins', () => {
    expect(CASES.SOFR_SERIES).toBe('RATE');
    expect(CASES.T_BILL_13_WEEK_SERIES).toBe('RATE');
    expect(CASES.CPI_SERIES).toBe('INDEX_LEVEL');
});
test.each(Object.entries(CASES))('%s resolves as the fixture says (%s)', (productType, expected) => {
    const security = new security_pb_1.SecurityProto().setProductType(PRODUCT_TYPES[productType]);
    if (expected === 'raises') {
        expect((0, default_price_types_1.defaultPriceTypeFor)(security)).toBeNull();
        expect(() => (0, default_price_types_1.resolveTradePriceType)(security)).toThrow(errors_1.NoDefaultPriceTypeError);
    }
    else {
        const resolved = (0, default_price_types_1.resolveTradePriceType)(security);
        expect(resolved).toBe(PRICE_TYPES[expected]);
        expect(resolved).not.toBe(price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE);
    }
});
test('each table key resolves to its own entry', () => {
    const section = sourceSection();
    expect(Object.keys(section).length).toBeGreaterThan(0);
    for (const [node, name] of Object.entries(section)) {
        expect((0, default_price_types_1.shippedDefaultPriceTypes)().defaultFor(node)).toBe(PRICE_TYPES[name]);
    }
});
test('the shipped entries are read-only', () => {
    const entries = (0, default_price_types_1.shippedDefaultPriceTypes)().entries;
    expect(() => entries.set('BOND', price_type_pb_1.PriceTypeProto.ABSOLUTE)).toThrow(TypeError);
    expect((0, default_price_types_1.shippedDefaultPriceTypes)().defaultFor('BOND')).toBe(price_type_pb_1.PriceTypeProto.PERCENTAGE);
});
test('the source section parses to the shipped table', () => {
    expect([...(0, default_price_types_1.parseDefaultPriceTypes)(sourceSection()).entries])
        .toEqual([...(0, default_price_types_1.shippedDefaultPriceTypes)().entries]);
});
// ---------- guardrail 3: a broken section throws at load ----------
test.each([
    ['an unknown node', { NOT_A_NODE: 'PERCENTAGE' }, 'NOT_A_NODE'],
    ['an unknown type name', { BOND: 'PERCENT' }, 'PERCENT'],
    ['an UNKNOWN_PRICE_TYPE value', { BOND: 'UNKNOWN_PRICE_TYPE' }, 'UNKNOWN_PRICE_TYPE'],
    ['an inherited key as a type name', { BOND: 'toString' }, 'toString'],
    ['a non-string value', { BOND: 2 }, 'BOND'],
    ['a missing section', undefined, 'missing'],
    ['a section that is not an object', ['BOND', 'PERCENTAGE'], 'object'],
])('%s throws', (_name, section, match) => {
    expect(() => (0, default_price_types_1.parseDefaultPriceTypes)(section)).toThrow(/default_price_types/);
    expect(() => (0, default_price_types_1.parseDefaultPriceTypes)(section)).toThrow(match);
});
//# sourceMappingURL=default_price_types.test.js.map