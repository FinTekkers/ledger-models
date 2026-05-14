import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { UUID } from '../utils/uuid';
import { Identifier } from './identifier';

function buildSecurityWithIds(ids: Array<{ type: IdentifierTypeProto; value: string }>): Security {
  const proto = new SecurityProto()
    .setObjectClass('Security')
    .setVersion('0.0.1')
    .setUuid(UUID.random().toUUIDProto())
    .setProductType(ProductTypeProto.COMMON_STOCK)
    .setAssetClass('Equity')
    .setIssuerName('Acme');
  for (const id of ids) {
    proto.addIdentifiers(new IdentifierProto().setIdentifierType(id.type).setIdentifierValue(id.value));
  }
  return Security.create(proto);
}

test('getIdentifiers returns wrapped Identifier list preserving order', () => {
  const sec = buildSecurityWithIds([
    { type: IdentifierTypeProto.ISIN, value: 'US0378331005' },
    { type: IdentifierTypeProto.CUSIP, value: '037833100' },
    { type: IdentifierTypeProto.EXCH_TICKER, value: 'AAPL' },
  ]);
  const ids = sec.getIdentifiers();
  expect(ids).toHaveLength(3);
  expect(ids[0]).toBeInstanceOf(Identifier);
  expect(ids[0].getIdentifierValue()).toBe('US0378331005');
  expect(ids[0].getIdentifierType()).toBe(IdentifierTypeProto.ISIN);
  expect(ids[2].getIdentifierValue()).toBe('AAPL');
});

test('getIdentifiers returns empty list when none set', () => {
  const sec = buildSecurityWithIds([]);
  expect(sec.getIdentifiers()).toEqual([]);
});

test('getIdentifierByType finds the matching identifier', () => {
  const sec = buildSecurityWithIds([
    { type: IdentifierTypeProto.ISIN, value: 'US0378331005' },
    { type: IdentifierTypeProto.CUSIP, value: '037833100' },
  ]);
  const cusip = sec.getIdentifierByType(IdentifierTypeProto.CUSIP);
  expect(cusip).toBeDefined();
  expect(cusip!.getIdentifierValue()).toBe('037833100');
});

test('getIdentifierByType returns undefined when type is absent', () => {
  const sec = buildSecurityWithIds([
    { type: IdentifierTypeProto.ISIN, value: 'US0378331005' },
  ]);
  expect(sec.getIdentifierByType(IdentifierTypeProto.FIGI)).toBeUndefined();
});

test('identifier accessors throw on a link-mode Security', () => {
  // linkOf builds a link-mode SecurityProto. Reading the identifier list
  // off a link is meaningless, so we explicitly reject it.
  const linkProto = new SecurityProto().setIsLink(true);
  linkProto.setUuid(UUID.random().toUUIDProto());
  const link = Security.create(linkProto);
  expect(() => link.getIdentifiers()).toThrow(/link-mode/);
  expect(() => link.getIdentifierByType(IdentifierTypeProto.ISIN)).toThrow(/link-mode/);
});
