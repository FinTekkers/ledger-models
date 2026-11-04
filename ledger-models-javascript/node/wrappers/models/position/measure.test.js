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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const measure_1 = require("./measure");
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
const MEASURE_PROTO = path.resolve(__dirname, '../../../../../ledger-models-protos/fintekkers/models/position/measure.proto');
describe('Measure.fromName', () => {
    test.each(measure_1.Measure.getAllTypeNames())('fromName("%s") returns the matching numeric enum value', (name) => {
        const value = measure_1.Measure.fromName(name);
        const expected = measure_pb_1.MeasureProto[name];
        expect(value).toBe(expected);
    });
    test('throws on unknown name and lists valid names in the error', () => {
        let err;
        try {
            measure_1.Measure.fromName('NOT_A_REAL_MEASURE');
        }
        catch (e) {
            err = e;
        }
        expect(err).toBeDefined();
        expect(err.message).toContain('NOT_A_REAL_MEASURE');
        // Hint with known valid entries.
        expect(err.message).toContain('PRESENT_VALUE');
        expect(err.message).toContain('DIRTY_PRICE');
    });
    test('throws on lowercase / friendly-label input (proto-name strict)', () => {
        // ledger-models is the source-of-truth vocabulary; consumers
        // (UI dropdown labels, URL params) standardize on proto names.
        // Pin the strict behavior so this contract is loudly tested.
        expect(() => measure_1.Measure.fromName('present_value')).toThrow();
        expect(() => measure_1.Measure.fromName('Dirty Price')).toThrow();
    });
    test('accepts UNKNOWN_MEASURE — sentinel is a valid enum key', () => {
        // Excluded from getAllTypeNames (no dropdown surface) but still a
        // valid proto enum value. Mirrors Identifier / SecurityType /
        // AssetClass / PositionFilterOperator behavior.
        expect(measure_1.Measure.fromName('UNKNOWN_MEASURE')).toBe(measure_pb_1.MeasureProto.UNKNOWN_MEASURE);
    });
});
describe('INFLATION_COMPENSATION (LM-433)', () => {
    test('resolves by name to the number declared in measure.proto', () => {
        const declared = fs.readFileSync(MEASURE_PROTO, 'utf8').match(/^\s*INFLATION_COMPENSATION\s*=\s*(\d+)\s*;/m);
        expect(declared).not.toBeNull();
        const number = Number(declared[1]);
        expect(measure_1.Measure.fromName('INFLATION_COMPENSATION')).toBe(number);
        expect(measure_pb_1.MeasureProto['INFLATION_COMPENSATION']).toBe(number);
    });
});
describe('Measure.getAllTypeNames', () => {
    test('returns the expected set in proto-declaration order, excluding UNKNOWN_MEASURE', () => {
        // Proto-declared order in measure.proto (post-PR #192 additions):
        //   UNKNOWN_MEASURE = 0;             (excluded)
        //   DIRECTED_QUANTITY = 1;
        //   MARKET_VALUE = 2;
        //   UNADJUSTED_COST_BASIS = 3;
        //   ADJUSTED_COST_BASIS = 4;
        //   CURRENT_YIELD = 5;
        //   YIELD_TO_MATURITY = 7;           (note: no tag 6)
        //   MACAULAY_DURATION = 8;
        //   PRESENT_VALUE = 9;
        //   REAL_YIELD = 10;
        //   INFLATION_ADJUSTED_PRINCIPAL = 11;
        //   PRESENT_VALUE_CASHFLOWS = 12;
        //   DISCOUNT_MARGIN = 13;
        //   SPREAD_DURATION = 14;
        //   PAR_YIELD = 15;
        //   SPOT_YIELD = 16;
        //   FORWARD_YIELD = 17;
        //   PROFIT_LOSS = 18;
        //   PROFIT_LOSS_PERCENT = 19;
        //   ACCRUED_INTEREST = 20;
        //   CONVEXITY = 21;
        //   DIRTY_PRICE = 22;
        //   CLEAN_PRICE = 23;
        //   MODIFIED_DURATION = 24;
        //   DV01 = 25;
        //   DISCOUNT_YIELD = 26;          (v0.2.3, #209 — TBill yield conventions)
        //   BOND_EQUIVALENT_YIELD = 27;   (v0.2.3, #209)
        //   REFERENCE_CPI = 28;           (LM-343 — TIPS index ratio inputs)
        //   INDEX_RATIO = 29;             (LM-343)
        //   INFLATION_COMPENSATION = 30;  (LM-433 — TIPS inflation accrual)
        expect(measure_1.Measure.getAllTypeNames()).toEqual([
            'DIRECTED_QUANTITY',
            'MARKET_VALUE',
            'UNADJUSTED_COST_BASIS',
            'ADJUSTED_COST_BASIS',
            'CURRENT_YIELD',
            'YIELD_TO_MATURITY',
            'MACAULAY_DURATION',
            'PRESENT_VALUE',
            'REAL_YIELD',
            'INFLATION_ADJUSTED_PRINCIPAL',
            'PRESENT_VALUE_CASHFLOWS',
            'DISCOUNT_MARGIN',
            'SPREAD_DURATION',
            'PAR_YIELD',
            'SPOT_YIELD',
            'FORWARD_YIELD',
            'PROFIT_LOSS',
            'PROFIT_LOSS_PERCENT',
            'ACCRUED_INTEREST',
            'CONVEXITY',
            'DIRTY_PRICE',
            'CLEAN_PRICE',
            'MODIFIED_DURATION',
            'DV01',
            'DISCOUNT_YIELD',
            'BOND_EQUIVALENT_YIELD',
            'REFERENCE_CPI',
            'INDEX_RATIO',
            'INFLATION_COMPENSATION',
        ]);
    });
    test('excludes the UNKNOWN_MEASURE sentinel', () => {
        expect(measure_1.Measure.getAllTypeNames()).not.toContain('UNKNOWN_MEASURE');
    });
});
//# sourceMappingURL=measure.test.js.map