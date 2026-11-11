"use strict";
// LM-463: trade-price rule. The same fixture
// (test-fixtures/transaction-price/cases.json) runs in Java, Python and Rust.
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
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const uuid_1 = require("../utils/uuid");
const transaction_rules_1 = require("./transaction_rules");
const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/transaction-price/cases.json');
const CASES = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')).cases;
const byName = (name) => CASES.find(c => c.name === name);
const FIELD = `${transaction_rules_1.PRICE_PREFIX}price_type`;
function price(p) {
    const out = new price_pb_1.PriceProto();
    if (p.uuid !== undefined)
        out.setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(p.uuid)).toUUIDProto());
    if (p.link)
        out.setIsLink(true);
    if (typeof p.price_type === 'number') {
        // A number is the raw wire value.
        out.setPriceType(p.price_type);
    }
    else if (p.price_type !== undefined) {
        out.setPriceType(price_type_pb_1.PriceTypeProto[p.price_type]);
    }
    return out;
}
function transaction(t) {
    const out = new transaction_pb_1.TransactionProto().setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(t.uuid)).toUUIDProto());
    if (t.price)
        out.setPrice(price(t.price));
    return out;
}
const onPriceType = (vs) => vs.filter(v => v.getField() === FIELD).map(v => v.getMessage());
describe('transaction_rules.validate: trade price (LM-463)', () => {
    test('fixture has every case, including the metric cases', () => {
        const names = CASES.map(c => c.name);
        expect(new Set(names).size).toBe(names.length);
        expect(names).toEqual(expect.arrayContaining([
            'inline_unknown', 'inline_unknown_no_uuid', 'inline_absolute', 'inline_percentage', 'inline_rate',
            'inline_unrecognised_value', 'link_no_price_type', 'link_unknown_explicit', 'no_price',
        ]));
    });
    test('every fixture case runs and matches', () => {
        let ran = 0;
        for (const c of CASES) {
            const actual = (0, transaction_rules_1.validate)(transaction(c.transaction));
            expect([c.name, actual.map(v => v.getField())]).toEqual([c.name, c.violations.map(v => v.field)]);
            c.violations.forEach((want, i) => {
                var _a;
                const got = actual[i];
                expect(got.getMessage()).toBe(want.message);
                if (want.object_id === null)
                    expect(got.hasObjectId()).toBe(false);
                else
                    expect((_a = uuid_1.UUID.fromUUIDProto(got.getObjectId())) === null || _a === void 0 ? void 0 : _a.toString()).toBe(want.object_id);
            });
            ran++;
        }
        expect(ran).toBe(CASES.length);
    });
    test('inline_unknown gives exactly one violation on price.price_type', () => {
        const actual = (0, transaction_rules_1.validate)(transaction(byName('inline_unknown').transaction));
        expect(actual).toHaveLength(1);
        expect(actual[0].getField()).toBe('price.price_type');
        expect(actual[0].getMessage()).toContain('price_type');
        expect(actual[0].getMessage()).toBe(transaction_rules_1.UNKNOWN_TRADE_PRICE_TYPE);
    });
    test.each(['inline_absolute', 'inline_percentage', 'inline_rate'])('%s gives no violation', name => {
        expect(onPriceType((0, transaction_rules_1.validate)(transaction(byName(name).transaction)))).toEqual([]);
    });
    test.each(['link_no_price_type', 'link_unknown_explicit'])('%s is never checked', name => {
        expect(onPriceType((0, transaction_rules_1.validate)(transaction(byName(name).transaction)))).toEqual([]);
    });
    test('an unrecognised raw value passes', () => {
        const proto = new transaction_pb_1.TransactionProto().setPrice(new price_pb_1.PriceProto().setPriceType(999));
        expect((0, transaction_rules_1.validate)(proto)).toEqual([]);
    });
    test('every named price type except UNKNOWN_PRICE_TYPE passes', () => {
        const visited = [];
        for (const value of Object.values(price_type_pb_1.PriceTypeProto)) {
            if (typeof value !== 'number' || value === price_type_pb_1.PriceTypeProto.UNKNOWN_PRICE_TYPE)
                continue;
            const proto = new transaction_pb_1.TransactionProto().setPrice(new price_pb_1.PriceProto().setPriceType(value));
            expect([value, (0, transaction_rules_1.validate)(proto)]).toEqual([value, []]);
            visited.push(value);
        }
        expect(visited.length).toBeGreaterThanOrEqual(5);
        expect(visited).toContain(price_type_pb_1.PriceTypeProto.RATE);
    });
});
//# sourceMappingURL=transaction_price_rules.test.js.map