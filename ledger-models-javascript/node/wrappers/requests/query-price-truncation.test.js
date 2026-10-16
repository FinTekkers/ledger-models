"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Wire tests for QueryPriceResponseProto.truncated / row_cap.
// See docs/adr/query_price_truncation.md.
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const query_price_response_pb_1 = require("../../fintekkers/requests/price/query_price_response_pb");
function pagedResponse() {
    const response = new query_price_response_pb_1.QueryPriceResponseProto();
    response.addPriceResponse(new price_pb_1.PriceProto().setIsLink(true));
    response.setNextPageToken('opaque-def');
    return response;
}
describe('QueryPriceResponseProto truncation fields', () => {
    test('truncated and row_cap round-trip with existing fields', () => {
        const response = pagedResponse();
        response.setTruncated(true);
        response.setRowCap(1000);
        const parsed = query_price_response_pb_1.QueryPriceResponseProto.deserializeBinary(response.serializeBinary());
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
        const parsed = query_price_response_pb_1.QueryPriceResponseProto.deserializeBinary(old.serializeBinary());
        expect(parsed.getTruncated()).toBe(false);
        expect(parsed.getRowCap()).toBe(0);
        expect(Array.from(explicit.serializeBinary())).toEqual(Array.from(old.serializeBinary()));
    });
});
//# sourceMappingURL=query-price-truncation.test.js.map