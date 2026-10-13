// Every message with object_type has an own-type stamp (LM-320). Walks the
// descriptor set for messages whose field 1 is
// fintekkers.models.util.ObjectTypeProto, and fails when `stampOwn` has no
// entry for one. Stamps each and checks its own type and version (0, 0, 1).
import * as fs from 'fs';
import * as path from 'path';
import { DescriptorProto, FileDescriptorSet } from 'google-protobuf/google/protobuf/descriptor_pb';

import { ObjectTypeProto } from '../../fintekkers/models/util/object_type_pb';
import { UUIDProto } from '../../fintekkers/models/util/uuid_pb';

import * as objectTypes from './object-types';
import { ObjectTyped } from './object-types';

// The descriptor set compile.sh writes for every language.
const DESCRIPTOR_SET = path.resolve(__dirname, '../../../../ledger-models-rust/ledger_models_file_descriptor_set_v_todo.bin');
const GENERATED = path.resolve(__dirname, '../..');

const OBJECT_TYPE_ENUM = '.fintekkers.models.util.ObjectTypeProto';

// The 13 types LM-320 names: every *ResponseProto and the index-composition
// requests and responses.
const NAMED = [
  'fintekkers.requests.price.CreatePriceResponseProto',
  'fintekkers.requests.price.QueryPriceResponseProto',
  'fintekkers.requests.security.CreateSecurityResponseProto',
  'fintekkers.requests.security.QuerySecurityResponseProto',
  'fintekkers.requests.portfolio.CreatePortfolioResponseProto',
  'fintekkers.requests.portfolio.QueryPortfolioResponseProto',
  'fintekkers.requests.transaction.CreateTransactionResponseProto',
  'fintekkers.requests.transaction.QueryTransactionResponseProto',
  'fintekkers.requests.position.QueryPositionResponseProto',
  'fintekkers.requests.index_composition.CreateIndexCompositionRequestProto',
  'fintekkers.requests.index_composition.CreateIndexCompositionResponseProto',
  'fintekkers.requests.index_composition.GetIndexCompositionRequestProto',
  'fintekkers.requests.index_composition.GetIndexCompositionResponseProto',
];

type MessageClass = new () => ObjectTyped;

/** Full name -> generated class of every message whose field 1 is ObjectTypeProto. */
function walk(): Map<string, MessageClass> {
  if (!fs.existsSync(DESCRIPTOR_SET)) throw new Error(`descriptor set not found at ${DESCRIPTOR_SET}`);
  const found = new Map<string, MessageClass>();
  const set = FileDescriptorSet.deserializeBinary(new Uint8Array(fs.readFileSync(DESCRIPTOR_SET)));
  const isTyped = (message: DescriptorProto) =>
    message.getFieldList().some((f) => f.getNumber() === 1 && f.getTypeName() === OBJECT_TYPE_ENUM);
  for (const file of set.getFileList()) {
    const fileName = file.getName() as string;
    // Loaded only for a typed message: google/protobuf/* has no module here.
    const generated = () => require(path.join(GENERATED, fileName.replace(/\.proto$/, '_pb')));
    const visit = (fullName: string, scope: () => Record<string, unknown>, message: DescriptorProto) => {
      const messageClass = () => scope()[message.getName() as string] as MessageClass & Record<string, unknown>;
      if (isTyped(message)) {
        if (typeof messageClass() !== 'function') throw new Error(`${fullName}: no generated class in ${fileName}`);
        found.set(fullName, messageClass());
      }
      for (const nested of message.getNestedTypeList()) {
        visit(`${fullName}.${nested.getName()}`, messageClass, nested);
      }
    };
    for (const message of file.getMessageTypeList()) {
      visit(`${file.getPackage()}.${message.getName()}`, generated, message);
    }
  }
  return found;
}

const WALKED = walk();

/** The walked names that `lookup` has no own type for. */
function missingTypes(walked: Iterable<string>, lookup: (fullName: string) => ObjectTypeProto | undefined): string[] {
  return Array.from(walked).filter((name) => lookup(name) === undefined);
}

function lookup(fullName: string): ObjectTypeProto | undefined {
  const messageClass = WALKED.get(fullName) as MessageClass;
  return objectTypes.ownType(new messageClass());
}

/** The value the naming rule gives: message name without Proto, in SCREAMING_SNAKE, prefixed OBJECT_TYPE_. */
function expectedType(fullName: string): ObjectTypeProto {
  const name = (fullName.split('.').pop() as string).replace(/Proto$/, '');
  const enumName = 'OBJECT_TYPE_' + name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  const value = (ObjectTypeProto as unknown as Record<string, ObjectTypeProto>)[enumName];
  if (value === undefined) throw new Error(`${fullName}: no ${enumName} in ObjectTypeProto`);
  return value;
}

test('the walk finds every typed message, including the named ones', () => {
  expect(WALKED.size).toBeGreaterThanOrEqual(49);
  for (const name of NAMED) expect(WALKED.has(name)).toBe(true);
});

test('every typed message has an own type', () => {
  expect(missingTypes(WALKED.keys(), lookup)).toEqual([]);
});

test('a missing entry is reported', () => {
  const dropped = 'fintekkers.requests.price.QueryPriceResponseProto';
  const without = (name: string) => (name === dropped ? undefined : lookup(name));
  expect(missingTypes(WALKED.keys(), without)).toEqual([dropped]);
});

test.each(Array.from(WALKED.keys()).sort())('stamping %s sets its own type and version', (fullName) => {
  const messageClass = WALKED.get(fullName) as MessageClass;
  const stamped = objectTypes.stampOwn(new messageClass());
  const expected = expectedType(fullName);
  expect(objectTypes.readType(stamped)).toBe(expected);
  expect(objectTypes.readVersion(stamped)).toEqual([0, 0, 1]);
  // The name table agrees with the class table.
  expect(objectTypes.OWN_TYPE_NAMES.get(fullName)).toBe(expected);
});

test('own types are distinct and known', () => {
  const types = Array.from(WALKED.keys()).map(lookup);
  expect(types).not.toContain(ObjectTypeProto.OBJECT_TYPE_UNKNOWN);
  expect(new Set(types).size).toBe(types.length);
});

test('the LM-318 entries keep their values', () => {
  const lm318: [string, ObjectTypeProto][] = [
    ['fintekkers.models.portfolio.PortfolioProto', ObjectTypeProto.OBJECT_TYPE_PORTFOLIO],
    ['fintekkers.models.position.PositionProto', ObjectTypeProto.OBJECT_TYPE_POSITION],
    ['fintekkers.models.position.PositionFilterProto', ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER],
    ['fintekkers.models.price.PriceProto', ObjectTypeProto.OBJECT_TYPE_PRICE],
    ['fintekkers.models.security.IdentifierProto', ObjectTypeProto.OBJECT_TYPE_IDENTIFIER],
    ['fintekkers.models.security.SecurityProto', ObjectTypeProto.OBJECT_TYPE_SECURITY],
    ['fintekkers.models.security.TenorProto', ObjectTypeProto.OBJECT_TYPE_TENOR],
    ['fintekkers.models.strategy.StrategyProto', ObjectTypeProto.OBJECT_TYPE_STRATEGY],
    ['fintekkers.models.strategy.StrategyAllocationProto', ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION],
    ['fintekkers.models.transaction.TransactionProto', ObjectTypeProto.OBJECT_TYPE_TRANSACTION],
    ['fintekkers.requests.portfolio.CreatePortfolioRequestProto', ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST],
    ['fintekkers.requests.portfolio.QueryPortfolioRequestProto', ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST],
    ['fintekkers.requests.price.CreatePriceRequestProto', ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST],
    ['fintekkers.requests.price.QueryPriceRequestProto', ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST],
    ['fintekkers.requests.security.CreateSecurityRequestProto', ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST],
    ['fintekkers.requests.security.QuerySecurityRequestProto', ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST],
    ['fintekkers.requests.transaction.CreateTransactionRequestProto', ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST],
    ['fintekkers.requests.transaction.QueryTransactionRequestProto', ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST],
  ];
  for (const [name, objectType] of lm318) expect([name, lookup(name)]).toEqual([name, objectType]);
});

test('stampOwn on a message without object_type throws', () => {
  expect(objectTypes.ownType(new UUIDProto())).toBeUndefined();
  expect(objectTypes.ownType({})).toBeUndefined();
  expect(() => objectTypes.stampOwn(new UUIDProto() as unknown as ObjectTyped)).toThrow('this message type has no own ObjectTypeProto');
});
