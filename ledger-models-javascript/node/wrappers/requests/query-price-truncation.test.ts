// Wire tests for QueryPriceResponseProto.truncated / row_cap.
// See docs/adr/query_price_truncation.md.
import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { QueryPriceResponseProto } from '../../fintekkers/requests/price/query_price_response_pb';

function pagedResponse(): QueryPriceResponseProto {
  const response = new QueryPriceResponseProto();
  response.addPriceResponse(new PriceProto().setIsLink(true));
  response.setNextPageToken('opaque-def');
  return response;
}

describe('QueryPriceResponseProto truncation fields', () => {
  test('truncated and row_cap round-trip with existing fields', () => {
    const response = pagedResponse();
    response.setTruncated(true);
    response.setRowCap(1000);

    const parsed = QueryPriceResponseProto.deserializeBinary(response.serializeBinary());

    expect(parsed.getTruncated()).toBe(true);
    expect(parsed.getRowCap()).toBe(1000);
    expect(parsed.getNextPageToken()).toBe('opaque-def');
    expect(parsed.getPriceResponseList()).toHaveLength(1);
    expect(parsed.getPriceResponseList()[0].getIsLink()).toBe(true);
  });

  test('response without the new fields reads false / 0', () => {
    const old = pagedResponse();
    const explicit = pagedResponse();
    explicit.setTruncated(false);
    explicit.setRowCap(0);

    const parsed = QueryPriceResponseProto.deserializeBinary(old.serializeBinary());

    expect(parsed.getTruncated()).toBe(false);
    expect(parsed.getRowCap()).toBe(0);
    expect(Array.from(explicit.serializeBinary())).toEqual(Array.from(old.serializeBinary()));
  });
});
