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
 * LM-418: the deprecated arm-named exports give the same results as the
 * input-type names they call, and hierarchy.json still loads with the legacy
 * valuation_arms / arm keys for one release.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const product_inputs_1 = require("./product_inputs");
const errors_1 = require("../errors");
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const REPO = path.resolve(__dirname, '../../../../..');
function readJson(...parts) {
    return JSON.parse(fs.readFileSync(path.join(REPO, ...parts), 'utf-8'));
}
/** The value, or the thrown error's class and message. */
function outcome(call) {
    try {
        return call();
    }
    catch (e) {
        return [e.constructor.name, e.message];
    }
}
/** `root` with the section and entry keys renamed to the legacy names. */
function legacy(root) {
    const out = JSON.parse(JSON.stringify(root));
    const section = out.valuation_input_types;
    delete out.valuation_input_types;
    for (const entry of section.entries) {
        entry.arm = entry.input_type;
        delete entry.input_type;
    }
    out.valuation_arms = section;
    return out;
}
// ---------- metric 2: the aliases match the new names ----------
describe('armFor matches inputTypeFor on every fixture case', () => {
    const cases = readJson('ledger-models-protos', 'fixtures', 'valuation_input_types_cases.json').cases;
    const priced = cases.filter(c => Object.prototype.hasOwnProperty.call(product_type_pb_1.ProductTypeProto, c.product_type));
    test('there are enough cases', () => expect(priced.length).toBeGreaterThanOrEqual(5));
    test.each(priced)('$product_type/$coupon_type', c => {
        const s = new security_pb_1.SecurityProto()
            .setProductType(product_type_pb_1.ProductTypeProto[c.product_type])
            .setBondDetails(new security_pb_1.BondDetailsProto()
            .setCouponType(coupon_type_pb_1.CouponTypeProto[c.coupon_type]));
        const expected = outcome(() => (0, product_inputs_1.inputTypeFor)(s));
        expect(outcome(() => (0, product_inputs_1.armFor)(s))).toEqual(expected);
        if (c.input_type !== undefined)
            expect(expected).toBe(c.input_type);
    });
});
describe('measuresForArm matches measuresForInputType', () => {
    const fixture = readJson('test-fixtures', 'catalog', 'measures-for-input-type.json');
    const inputTypes = [...Object.keys(fixture.input_types), fixture.unknown_input_type];
    const catalog = readJson('ledger-models-protos', 'catalog', 'measures.json').measures;
    test.each(inputTypes)('%s', inputType => {
        expect(outcome(() => (0, product_inputs_1.measuresForArm)(inputType))).toEqual(outcome(() => (0, product_inputs_1.measuresForInputType)(inputType)));
        expect(outcome(() => (0, product_inputs_1.measuresForArmIn)(catalog, inputType)))
            .toEqual(outcome(() => (0, product_inputs_1.measuresForInputTypeIn)(catalog, inputType)));
    });
    test('INFLATION_COMPENSATION for the tips arm only (LM-434, VS-155)', () => {
        const others = Object.keys(fixture.input_types).filter(arm => arm !== 'tips');
        expect(others).toHaveLength(5);
        expect((0, product_inputs_1.measuresForArm)('tips')).toContain(measure_pb_1.MeasureProto.INFLATION_COMPENSATION);
        for (const arm of others)
            expect((0, product_inputs_1.measuresForArm)(arm)).not.toContain(measure_pb_1.MeasureProto.INFLATION_COMPENSATION);
    });
});
test('the ValuationArms aliases are the ValuationInputTypes ones', () => {
    const section = readJson('ledger-models-protos', 'hierarchy.json').valuation_input_types;
    expect(product_inputs_1.ValuationArms).toBe(product_inputs_1.ValuationInputTypes);
    const parsed = (0, product_inputs_1.parseValuationArms)(section);
    expect(parsed).toBeInstanceOf(product_inputs_1.ValuationInputTypes);
    expect(parsed).toEqual((0, product_inputs_1.parseValuationInputTypes)(section));
    expect((0, product_inputs_1.shippedValuationArms)()).toBe((0, product_inputs_1.shippedValuationInputTypes)());
    const entry = (0, product_inputs_1.shippedValuationInputTypes)().require('TIPS', 'FIXED');
    expect(entry.arm).toBe(entry.inputType);
    expect(entry.inputType).toBe('tips');
});
test('MissingMarketDataError.arm matches inputType', () => {
    const tips = new security_pb_1.SecurityProto().setProductType(product_type_pb_1.ProductTypeProto.TIPS);
    let e;
    try {
        (0, product_inputs_1.forSecurity)(tips, new price_pb_1.PriceProto());
    }
    catch (err) {
        e = err;
    }
    expect(e).toBeInstanceOf(errors_1.MissingMarketDataError);
    const m = e;
    expect(m.inputType).toBe('tips');
    expect(m.arm).toBe(m.inputType);
    expect(m.message).toContain('for input type tips');
});
// ---------- metric 3: the legacy keys load the same mapping ----------
test('the legacy keys load the same mapping', () => {
    const root = readJson('ledger-models-protos', 'hierarchy.json');
    expect(root.valuation_input_types.entries).toHaveLength(8);
    const current = (0, product_inputs_1.valuationInputTypesFromHierarchy)(root);
    const old = (0, product_inputs_1.valuationInputTypesFromHierarchy)(legacy(root));
    expect(old).toEqual(current);
    expect(current).toEqual((0, product_inputs_1.shippedValuationInputTypes)());
    expect(old.uncoveredLeaves()).toEqual(current.uncoveredLeaves());
});
const breaks = [
    ['both root keys', r => { r.valuation_arms = JSON.parse(JSON.stringify(r.valuation_input_types)); }],
    ['neither root key', r => { delete r.valuation_input_types; }],
    ['an entry with both fields', r => { r.valuation_input_types.entries[0].arm = 'bond'; }],
];
test.each(breaks)('%s is rejected', (_name, brk) => {
    const root = readJson('ledger-models-protos', 'hierarchy.json');
    brk(root);
    expect(() => (0, product_inputs_1.valuationInputTypesFromHierarchy)(root)).toThrow(/valuation_input_types/);
});
//# sourceMappingURL=product_inputs.deprecated.test.js.map