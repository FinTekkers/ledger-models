// LM-438: transaction child-structure rules. The same fixture
// (test-fixtures/transaction-children/cases.json) runs in Java, Python and Rust.

import * as fs from 'fs';
import * as path from 'path';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { CashDetailsProto, SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { ModelValidationError } from '../errors';
import { UUID } from '../utils/uuid';
import { requireValid, SECOND_CASH_CHILD, validate } from './transaction_rules';

interface SecuritySpec { uuid: string; link?: boolean; product_type?: string; cash_details?: boolean }
interface Node { uuid?: string; transaction_type: string; security: SecuritySpec; children?: Node[] }
interface Violation { field: string; object_id: string; message_ids: string[] }
interface Case { name: string; transaction: Node; violations: Violation[] }

const FIXTURE = path.resolve(__dirname, '../../../../../test-fixtures/transaction-children/cases.json');
const CASES: Case[] = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')).cases;
const byName = (name: string): Case => CASES.find(c => c.name === name)!;

function uuid(s: string): UUIDProto {
    return s === '' ? new UUIDProto().setRawUuid(new Uint8Array()) : new UUID(UUID.fromString(s)).toUUIDProto();
}

function security(s: SecuritySpec): SecurityProto {
    const p = new SecurityProto().setUuid(uuid(s.uuid));
    if (s.link) return p.setIsLink(true);
    if (s.product_type) p.setProductType(ProductTypeProto[s.product_type as keyof typeof ProductTypeProto]);
    if (s.cash_details) p.setCashDetails(new CashDetailsProto());
    return p;
}

function node(n: Node): TransactionProto {
    const p = new TransactionProto()
        .setTransactionType(TransactionTypeProto[n.transaction_type as keyof typeof TransactionTypeProto])
        .setSecurity(security(n.security));
    if (n.uuid !== undefined) p.setUuid(uuid(n.uuid));
    for (const c of n.children ?? []) p.addChildtransactions(node(c));
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
        const actual = validate(node(c.transaction));
        expect(actual.map(v => v.getField())).toEqual(c.violations.map(v => v.field));
        c.violations.forEach((want, i) => {
            const got = actual[i];
            expect(UUID.fromUUIDProto(got.getObjectId())?.toString()).toBe(want.object_id);
            for (const id of want.message_ids) expect(got.getMessage()).toContain(id);
        });
    });

    test('children_without_uuid has an unset and an empty-raw_uuid child', () => {
        const children = node(byName('children_without_uuid').transaction).getChildtransactionsList();
        expect(children[0].hasUuid()).toBe(false);
        expect(children[2].hasUuid()).toBe(true);
        expect(children[2].getUuid()!.getRawUuid_asU8().length).toBe(0);
    });

    test('requireValid throws ModelValidationError on two cash children', () => {
        const p = node(byName('two_cash_children').transaction);
        expect(() => requireValid(p)).toThrow(ModelValidationError);
        try {
            requireValid(p);
        } catch (e) {
            expect((e as ModelValidationError).field).toBe('child_transactions[1]');
            expect((e as ModelValidationError).violations[0].getMessage().startsWith(SECOND_CASH_CHILD)).toBe(true);
        }
    });
});
