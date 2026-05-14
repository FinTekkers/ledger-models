import Security from './security';
import IndexSecurity from './IndexSecurity';
import { SecurityProto, IndexDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { UUID } from '../utils/uuid';

test('Security.create routes CPI_SERIES to IndexSecurity', () => {
  const proto = new SecurityProto()
    .setObjectClass('Security')
    .setVersion('0.0.1')
    .setUuid(UUID.random().toUUIDProto())
    .setProductType(ProductTypeProto.CPI_SERIES)
    .setAssetClass('Index');
  proto.setIndexDetails(new IndexDetailsProto().setIndexType(IndexTypeProto.CPI_U));

  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(IndexSecurity);
  expect((sec as IndexSecurity).getIndexType()).toBe(IndexTypeProto.CPI_U);
});

test('Security.create routes SOFR_SERIES to IndexSecurity', () => {
  const proto = new SecurityProto()
    .setObjectClass('Security')
    .setVersion('0.0.1')
    .setUuid(UUID.random().toUUIDProto())
    .setProductType(ProductTypeProto.SOFR_SERIES)
    .setAssetClass('Index');
  proto.setIndexDetails(new IndexDetailsProto().setIndexType(IndexTypeProto.SOFR));

  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(IndexSecurity);
  expect((sec as IndexSecurity).getIndexType()).toBe(IndexTypeProto.SOFR);
});

test('IndexSecurity.getIndexType returns UNKNOWN when index_details is unset', () => {
  // Force-construct without populating index_details so we exercise the
  // null-safe branch in the getter.
  const proto = new SecurityProto()
    .setObjectClass('Security')
    .setVersion('0.0.1')
    .setUuid(UUID.random().toUUIDProto())
    .setProductType(ProductTypeProto.CPI_SERIES)
    .setAssetClass('Index');
  const sec = Security.create(proto) as IndexSecurity;
  expect(sec.getIndexType()).toBe(IndexTypeProto.UNKNOWN_INDEX_TYPE);
});

test('IndexSecurity extends Security (not BondSecurity)', () => {
  const proto = new SecurityProto()
    .setObjectClass('Security')
    .setVersion('0.0.1')
    .setUuid(UUID.random().toUUIDProto())
    .setProductType(ProductTypeProto.EQUITY_INDEX);
  proto.setIndexDetails(new IndexDetailsProto().setIndexType(IndexTypeProto.US_TREASURY));
  const sec = Security.create(proto);
  expect(sec).toBeInstanceOf(IndexSecurity);
  expect(sec).toBeInstanceOf(Security);
  expect(sec.isBond()).toBe(false);
});
