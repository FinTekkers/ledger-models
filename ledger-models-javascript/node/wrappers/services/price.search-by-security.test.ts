// A price search for a security filters on SECURITY_ID, never uuIds (LM-398).
// QueryPriceRequestProto.uuIds holds price IDs only.
import { PriceService } from './price-service/PriceService';
import { UUID } from '../models/utils/uuid';

import { FieldProto } from '../../fintekkers/models/position/field_pb';
import { UUIDProto } from '../../fintekkers/models/util/uuid_pb';
import { QueryPriceRequestProto } from '../../fintekkers/requests/price/query_price_request_pb';

/**
 * A PriceService whose gRPC client records each search request. Same shape
 * as capturingService in util/object-types.test.ts: importing that file
 * would register its tests here too.
 */
function capturingPriceService(): { service: PriceService; requests: QueryPriceRequestProto[] } {
  const requests: QueryPriceRequestProto[] = [];
  const stream = (request: QueryPriceRequestProto) => {
    requests.push(request);
    const handlers: Record<string, () => void> = {};
    setImmediate(() => handlers.end?.());
    return { on(event: string, handler: () => void) { handlers[event] = handler; return this; } };
  };
  const service = Object.create(PriceService.prototype) as PriceService;
  (service as unknown as { client: unknown }).client = { search: stream };
  return { service, requests };
}

test('searchBySecurityId sends SECURITY_ID filter and empty uuIds', async () => {
  const securityId = UUID.random();
  const { service, requests } = capturingPriceService();

  await service.searchBySecurityId(securityId.toString());

  expect(requests).toHaveLength(1);
  const request = requests[0];
  expect(request.getUuidsList()).toHaveLength(0);
  const filters = request.getSearchPriceInput()!.getFiltersList();
  expect(filters.map(f => f.getField())).toEqual([FieldProto.SECURITY_ID]);
  const packed = filters[0].getFieldValuePacked()!;
  expect(packed.getTypeUrl()).toBe('type.googleapis.com/fintekkers.models.util.UUIDProto');
  const sent = UUIDProto.deserializeBinary(packed.getValue_asU8());
  expect(Array.from(sent.getRawUuid_asU8())).toEqual(Array.from(securityId.toUUIDProto().getRawUuid_asU8()));
});
