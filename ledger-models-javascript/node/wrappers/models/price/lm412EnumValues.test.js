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
 * LM-412 is additive: PriceTypeProto gains RATE = 5 and ProductTypeProto gains
 * T_BILL_13_WEEK_SERIES = 36. Every existing value keeps its number and name.
 *
 * The values come from test-fixtures/field-changes/lm-412.json, which wire-diff
 * rule lm412 and the Java, Python and Rust tests also read. google-protobuf has
 * no runtime descriptors, so this checks the generated enum objects.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const fixturePath = path.resolve(__dirname, '../../../../../test-fixtures/field-changes/lm-412.json');
const spec = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const ENUMS = {
    '.fintekkers.models.price.PriceTypeProto': price_type_pb_1.PriceTypeProto,
    '.fintekkers.models.security.ProductTypeProto': product_type_pb_1.ProductTypeProto,
};
test('the added values are RATE and T_BILL_13_WEEK_SERIES', () => {
    expect(spec.added_values.map((v) => [v.enum, v.number, v.name])).toEqual([
        ['.fintekkers.models.price.PriceTypeProto', 5, 'RATE'],
        ['.fintekkers.models.security.ProductTypeProto', 36, 'T_BILL_13_WEEK_SERIES'],
    ]);
    expect(price_type_pb_1.PriceTypeProto.RATE).toBe(5);
    expect(product_type_pb_1.ProductTypeProto.T_BILL_13_WEEK_SERIES).toBe(36);
});
test.each([...spec.added_values, ...spec.kept].map((v) => [`${v.enum} ${v.name}`, v]))('%s has its number', (_label, v) => {
    expect(ENUMS[v.enum][v.name]).toBe(v.number);
});
test.each(Object.keys(ENUMS))('kept plus added is the whole of %s', (name) => {
    const listed = [...spec.kept, ...spec.added_values]
        .filter((v) => v.enum === name)
        .map((v) => `${v.number} ${v.name}`)
        .sort();
    const actual = Object.entries(ENUMS[name])
        .map(([n, number]) => `${number} ${n}`)
        .sort();
    expect(actual.length).toBe(listed.length);
    expect(actual).toEqual(listed);
});
//# sourceMappingURL=lm412EnumValues.test.js.map