"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Wire tests for the paging fields (limit, page_token, next_page_token) on all
// four query messages. See docs/adr/query_paging.md.
const date_range_pb_1 = require("../../fintekkers/models/util/date_range_pb");
const query_portfolio_request_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_request_pb");
const query_portfolio_response_pb_1 = require("../../fintekkers/requests/portfolio/query_portfolio_response_pb");
const query_price_request_pb_1 = require("../../fintekkers/requests/price/query_price_request_pb");
const query_price_response_pb_1 = require("../../fintekkers/requests/price/query_price_response_pb");
const query_security_request_pb_1 = require("../../fintekkers/requests/security/query_security_request_pb");
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
const query_transaction_request_pb_1 = require("../../fintekkers/requests/transaction/query_transaction_request_pb");
const query_transaction_response_pb_1 = require("../../fintekkers/requests/transaction/query_transaction_response_pb");
// Serialized with the bindings on main (0a0c9657), before the paging fields
// existed. Command: see ledger-models-python/test/requests/test_query_paging.py.
const OLD_PRICE_REQUEST_HEX = '0a0c5072696365526571756573741205302e302e31c80106';
const OLD_TRANSACTION_REQUEST_HEX = '0a125472616e73616374696f6e526571756573741205302e302e31c00164';
const ENTITIES = [
    {
        name: 'security',
        newRequest: () => new query_security_request_pb_1.QuerySecurityRequestProto(),
        parseRequest: (b) => query_security_request_pb_1.QuerySecurityRequestProto.deserializeBinary(b),
        newResponse: () => new query_security_response_pb_1.QuerySecurityResponseProto(),
        parseResponse: (b) => query_security_response_pb_1.QuerySecurityResponseProto.deserializeBinary(b),
    },
    {
        name: 'transaction',
        newRequest: () => new query_transaction_request_pb_1.QueryTransactionRequestProto(),
        parseRequest: (b) => query_transaction_request_pb_1.QueryTransactionRequestProto.deserializeBinary(b),
        newResponse: () => new query_transaction_response_pb_1.QueryTransactionResponseProto(),
        parseResponse: (b) => query_transaction_response_pb_1.QueryTransactionResponseProto.deserializeBinary(b),
    },
    {
        name: 'portfolio',
        newRequest: () => new query_portfolio_request_pb_1.QueryPortfolioRequestProto(),
        parseRequest: (b) => query_portfolio_request_pb_1.QueryPortfolioRequestProto.deserializeBinary(b),
        newResponse: () => new query_portfolio_response_pb_1.QueryPortfolioResponseProto(),
        parseResponse: (b) => query_portfolio_response_pb_1.QueryPortfolioResponseProto.deserializeBinary(b),
    },
    {
        name: 'price',
        newRequest: () => new query_price_request_pb_1.QueryPriceRequestProto(),
        parseRequest: (b) => query_price_request_pb_1.QueryPriceRequestProto.deserializeBinary(b),
        newResponse: () => new query_price_response_pb_1.QueryPriceResponseProto(),
        parseResponse: (b) => query_price_response_pb_1.QueryPriceResponseProto.deserializeBinary(b),
    },
];
function fromHex(hex) {
    return Uint8Array.from(Buffer.from(hex, 'hex'));
}
describe('query paging fields', () => {
    test.each(ENTITIES)('$name: old request reads limit 0 and empty page_token', (entity) => {
        const old = entity.newRequest();
        old.setObjectClass('Request');
        old.setVersion('0.0.1');
        const parsed = entity.parseRequest(old.serializeBinary());
        expect(parsed.getLimit()).toBe(0);
        expect(parsed.getPageToken()).toBe('');
        expect(entity.parseResponse(new Uint8Array()).getNextPageToken()).toBe('');
    });
    test('old price request bytes decode', () => {
        const parsed = query_price_request_pb_1.QueryPriceRequestProto.deserializeBinary(fromHex(OLD_PRICE_REQUEST_HEX));
        expect(parsed.getObjectClass()).toBe('PriceRequest');
        expect(parsed.getTimeRangeCase()).toBe(query_price_request_pb_1.QueryPriceRequestProto.TimeRangeCase.HORIZON);
        expect(parsed.getHorizon()).toBe(query_price_request_pb_1.PriceHorizonProto.PRICE_HORIZON_1_YEAR);
        expect(parsed.getLimit()).toBe(0);
        expect(parsed.getPageToken()).toBe('');
    });
    test('old transaction request bytes decode', () => {
        const parsed = query_transaction_request_pb_1.QueryTransactionRequestProto.deserializeBinary(fromHex(OLD_TRANSACTION_REQUEST_HEX));
        expect(parsed.getObjectClass()).toBe('TransactionRequest');
        expect(parsed.getLimit()).toBe(100);
        expect(parsed.getPageToken()).toBe('');
    });
    test.each(ENTITIES)('$name: paging fields round-trip', (entity) => {
        const request = entity.newRequest();
        request.setLimit(25);
        request.setPageToken('opaque-abc');
        const response = entity.newResponse();
        response.setNextPageToken('opaque-def');
        const parsedRequest = entity.parseRequest(request.serializeBinary());
        const parsedResponse = entity.parseResponse(response.serializeBinary());
        expect(parsedRequest.getLimit()).toBe(25);
        expect(parsedRequest.getPageToken()).toBe('opaque-abc');
        expect(parsedResponse.getNextPageToken()).toBe('opaque-def');
    });
    test.each(ENTITIES)('$name: empty next_page_token encodes as unset', (entity) => {
        const unset = entity.newResponse();
        unset.setVersion('0.0.1');
        const empty = entity.newResponse();
        empty.setVersion('0.0.1');
        empty.setNextPageToken('');
        expect(Array.from(empty.serializeBinary())).toEqual(Array.from(unset.serializeBinary()));
    });
    test('price page_token round-trips with horizon', () => {
        const request = new query_price_request_pb_1.QueryPriceRequestProto();
        request.setHorizon(query_price_request_pb_1.PriceHorizonProto.PRICE_HORIZON_1_YEAR);
        request.setPageToken('opaque-abc');
        request.setLimit(10);
        const parsed = query_price_request_pb_1.QueryPriceRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.getTimeRangeCase()).toBe(query_price_request_pb_1.QueryPriceRequestProto.TimeRangeCase.HORIZON);
        expect(parsed.getHorizon()).toBe(query_price_request_pb_1.PriceHorizonProto.PRICE_HORIZON_1_YEAR);
        expect(parsed.getPageToken()).toBe('opaque-abc');
        expect(parsed.getLimit()).toBe(10);
    });
    test('price page_token round-trips with date_range', () => {
        var _a;
        const dateRange = new date_range_pb_1.DateRangeProto();
        dateRange.setVersion('0.0.1');
        const request = new query_price_request_pb_1.QueryPriceRequestProto();
        request.setDateRange(dateRange);
        request.setPageToken('opaque-abc');
        request.setLimit(10);
        const parsed = query_price_request_pb_1.QueryPriceRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.getTimeRangeCase()).toBe(query_price_request_pb_1.QueryPriceRequestProto.TimeRangeCase.DATE_RANGE);
        expect((_a = parsed.getDateRange()) === null || _a === void 0 ? void 0 : _a.getVersion()).toBe('0.0.1');
        expect(parsed.getPageToken()).toBe('opaque-abc');
        expect(parsed.getLimit()).toBe(10);
    });
});
//# sourceMappingURL=query-paging.test.js.map