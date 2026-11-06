"use strict";
// LM-438: transaction child-structure rules. The same fixture
// (test-fixtures/transaction-children/cases.json) runs in Java, Python and Rust.
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
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const errors_1 = require("../errors");
const uuid_1 = require("../utils/uuid");
const transaction_rules_1 = require("./transaction_rules");
const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/transaction-children/cases.json');
const CASES = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')).cases;
const byName = (name) => CASES.find(c => c.name === name);
function uuid(s) {
    return s === '' ? new uuid_pb_1.UUIDProto().setRawUuid(new Uint8Array()) : new uuid_1.UUID(uuid_1.UUID.fromString(s)).toUUIDProto();
}
function security(s) {
    const p = new security_pb_1.SecurityProto().setUuid(uuid(s.uuid));
    if (s.link)
        return p.setIsLink(true);
    if (s.product_type)
        p.setProductType(product_type_pb_1.ProductTypeProto[s.product_type]);
    if (s.cash_details)
        p.setCashDetails(new security_pb_1.CashDetailsProto());
    return p;
}
function node(n) {
    var _a;
    const p = new transaction_pb_1.TransactionProto()
        .setTransactionType(transaction_type_pb_1.TransactionTypeProto[n.transaction_type])
        .setSecurity(security(n.security));
    if (n.uuid !== undefined)
        p.setUuid(uuid(n.uuid));
    for (const c of (_a = n.children) !== null && _a !== void 0 ? _a : [])
        p.addChildtransactions(node(c));
    return p;
}
describe('transaction_rules.validate', () => {
    test('fixture has the six cases', () => {
        expect(CASES.map(c => c.name).sort()).toEqual([
            'children_without_uuid', 'duplicate_child_ids', 'maturation_with_two_cash',
            'two_cash_children', 'valid_buy', 'valid_sell',
        ]);
    });
    test.each(CASES.map(c => c.name))('%s matches the shared fixture', name => {
        const c = byName(name);
        const actual = (0, transaction_rules_1.validate)(node(c.transaction));
        expect(actual.map(v => v.getField())).toEqual(c.violations.map(v => v.field));
        c.violations.forEach((want, i) => {
            var _a;
            const got = actual[i];
            expect((_a = uuid_1.UUID.fromUUIDProto(got.getObjectId())) === null || _a === void 0 ? void 0 : _a.toString()).toBe(want.object_id);
            for (const id of want.message_ids)
                expect(got.getMessage()).toContain(id);
        });
    });
    test('children_without_uuid has an unset and an empty-raw_uuid child', () => {
        const children = node(byName('children_without_uuid').transaction).getChildtransactionsList();
        expect(children[0].hasUuid()).toBe(false);
        expect(children[2].hasUuid()).toBe(true);
        expect(children[2].getUuid().getRawUuid_asU8().length).toBe(0);
    });
    test('requireValid throws ModelValidationError on two cash children', () => {
        const p = node(byName('two_cash_children').transaction);
        expect(() => (0, transaction_rules_1.requireValid)(p)).toThrow(errors_1.ModelValidationError);
        try {
            (0, transaction_rules_1.requireValid)(p);
        }
        catch (e) {
            expect(e.field).toBe('child_transactions[1]');
            expect(e.violations[0].getMessage().startsWith(transaction_rules_1.SECOND_CASH_CHILD)).toBe(true);
        }
    });
});
//# sourceMappingURL=transaction_rules.test.js.map