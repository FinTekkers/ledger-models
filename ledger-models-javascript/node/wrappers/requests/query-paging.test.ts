// Wire tests for the paging fields (limit, page_token, next_page_token) on all
// four query messages. See docs/adr/query_paging.md.
import { DateRangeProto } from '../../fintekkers/models/util/date_range_pb';
import { QueryPortfolioRequestProto } from '../../fintekkers/requests/portfolio/query_portfolio_request_pb';
import { QueryPortfolioResponseProto } from '../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { PriceHorizonProto, QueryPriceRequestProto } from '../../fintekkers/requests/price/query_price_request_pb';
import { QueryPriceResponseProto } from '../../fintekkers/requests/price/query_price_response_pb';
import { QuerySecurityRequestProto } from '../../fintekkers/requests/security/query_security_request_pb';
import { QuerySecurityResponseProto } from '../../fintekkers/requests/security/query_security_response_pb';
import { QueryTransactionRequestProto } from '../../fintekkers/requests/transaction/query_transaction_request_pb';
import { QueryTransactionResponseProto } from '../../fintekkers/requests/transaction/query_transaction_response_pb';

// Serialized with the bindings on main (0a0c9657), before the paging fields
// existed. Command: see ledger-models-python/test/requests/test_query_paging.py.
const OLD_PRICE_REQUEST_HEX = '0a0c5072696365526571756573741205302e302e31c80106';
const OLD_TRANSACTION_REQUEST_HEX = '0a125472616e73616374696f6e526571756573741205302e302e31c00164';

interface PagedRequest {
  setObjectClass(value: string): unknown;
  setVersion(value: string): unknown;
  getLimit(): number;
  setLimit(value: number): unknown;
  getPageToken(): string;
  setPageToken(value: string): unknown;
  serializeBinary(): Uint8Array;
}

interface PagedResponse {
  setVersion(value: string): unknown;
  getNextPageToken(): string;
  setNextPageToken(value: string): unknown;
  serializeBinary(): Uint8Array;
}

interface Entity {
  name: string;
  newRequest: () => PagedRequest;
  parseRequest: (bytes: Uint8Array) => PagedRequest;
  newResponse: () => PagedResponse;
  parseResponse: (bytes: Uint8Array) => PagedResponse;
}

const ENTITIES: Entity[] = [
  {
    name: 'security',
    newRequest: () => new QuerySecurityRequestProto(),
    parseRequest: (b) => QuerySecurityRequestProto.deserializeBinary(b),
    newResponse: () => new QuerySecurityResponseProto(),
    parseResponse: (b) => QuerySecurityResponseProto.deserializeBinary(b),
  },
  {
    name: 'transaction',
    newRequest: () => new QueryTransactionRequestProto(),
    parseRequest: (b) => QueryTransactionRequestProto.deserializeBinary(b),
    newResponse: () => new QueryTransactionResponseProto(),
    parseResponse: (b) => QueryTransactionResponseProto.deserializeBinary(b),
  },
  {
    name: 'portfolio',
    newRequest: () => new QueryPortfolioRequestProto(),
    parseRequest: (b) => QueryPortfolioRequestProto.deserializeBinary(b),
    newResponse: () => new QueryPortfolioResponseProto(),
    parseResponse: (b) => QueryPortfolioResponseProto.deserializeBinary(b),
  },
  {
    name: 'price',
    newRequest: () => new QueryPriceRequestProto(),
    parseRequest: (b) => QueryPriceRequestProto.deserializeBinary(b),
    newResponse: () => new QueryPriceResponseProto(),
    parseResponse: (b) => QueryPriceResponseProto.deserializeBinary(b),
  },
];

function fromHex(hex: string): Uint8Array {
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
    const parsed = QueryPriceRequestProto.deserializeBinary(fromHex(OLD_PRICE_REQUEST_HEX));

    expect(parsed.getObjectClass()).toBe('PriceRequest');
    expect(parsed.getTimeRangeCase()).toBe(QueryPriceRequestProto.TimeRangeCase.HORIZON);
    expect(parsed.getHorizon()).toBe(PriceHorizonProto.PRICE_HORIZON_1_YEAR);
    expect(parsed.getLimit()).toBe(0);
    expect(parsed.getPageToken()).toBe('');
  });

  test('old transaction request bytes decode', () => {
    const parsed = QueryTransactionRequestProto.deserializeBinary(fromHex(OLD_TRANSACTION_REQUEST_HEX));

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
    const request = new QueryPriceRequestProto();
    request.setHorizon(PriceHorizonProto.PRICE_HORIZON_1_YEAR);
    request.setPageToken('opaque-abc');
    request.setLimit(10);

    const parsed = QueryPriceRequestProto.deserializeBinary(request.serializeBinary());

    expect(parsed.getTimeRangeCase()).toBe(QueryPriceRequestProto.TimeRangeCase.HORIZON);
    expect(parsed.getHorizon()).toBe(PriceHorizonProto.PRICE_HORIZON_1_YEAR);
    expect(parsed.getPageToken()).toBe('opaque-abc');
    expect(parsed.getLimit()).toBe(10);
  });

  test('price page_token round-trips with date_range', () => {
    const dateRange = new DateRangeProto();
    dateRange.setVersion('0.0.1');
    const request = new QueryPriceRequestProto();
    request.setDateRange(dateRange);
    request.setPageToken('opaque-abc');
    request.setLimit(10);

    const parsed = QueryPriceRequestProto.deserializeBinary(request.serializeBinary());

    expect(parsed.getTimeRangeCase()).toBe(QueryPriceRequestProto.TimeRangeCase.DATE_RANGE);
    expect(parsed.getDateRange()?.getVersion()).toBe('0.0.1');
    expect(parsed.getPageToken()).toBe('opaque-abc');
    expect(parsed.getLimit()).toBe(10);
  });
});
