import { SecurityService } from './SecurityService';
import { PositionFilter } from '../../models/position/positionfilter';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { Identifier } from '../../models/security/identifier';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';

test('searchByUuid returns the security matching the given UUID', async () => {
  const service = new SecurityService();

  // First find a known security by CUSIP to get its UUID
  const filter = new PositionFilter();
  const identifierProto = new IdentifierProto()
    .setIdentifierType(IdentifierTypeProto.CUSIP)
    .setIdentifierValue('912810TM4');
  filter.addObjectFilter(FieldProto.IDENTIFIER, new Identifier(identifierProto));

  const byIdentifier = await service.searchSecurityAsOfNow(filter);
  if (byIdentifier.length === 0) {
    console.warn('No security found for test CUSIP — skipping UUID lookup assertion');
    return;
  }

  const original = byIdentifier[0];
  const uuidStr = original.getID().toString();

  // Now look it up by UUID
  const byUuid = await service.searchByUuid(uuidStr);

  expect(byUuid.length).toBeGreaterThan(0);
  expect(byUuid[0].getID().toString()).toBe(uuidStr);
}, 30000);
