import { PriceService } from './PriceService';
import Price from '../../models/price/Price';
import { PositionFilter } from '../../models/position/positionfilter';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { UUID } from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';
import * as grpc from '@grpc/grpc-js';
import { promisify } from 'util';
import { PriceClient } from '../../../fintekkers/services/price-service/price_service_grpc_pb';
import { QueryPriceRequestProto } from '../../../fintekkers/requests/price/query_price_request_pb';
import { QueryPriceResponseProto } from '../../../fintekkers/requests/price/query_price_response_pb';
import { Decimal } from 'decimal.js';

const PRICE_SERVICE_URL = 'localhost:8083';
process.env['API_URL'] = PRICE_SERVICE_URL;
const priceService = new PriceService();

afterAll(() => {
  priceService.close();
});

/**
 * Helper: discover a security UUID that has prices in the system.
 */
async function getSecurityUuidWithPrices(): Promise<{ uuid: UUID; client: PriceClient }> {
  const client = new PriceClient(PRICE_SERVICE_URL, grpc.credentials.createInsecure());

  const listRequest = new QueryPriceRequestProto();
  listRequest.setObjectClass('PriceRequest');
  listRequest.setVersion('0.0.1');

  const listIdsAsync = promisify(client.listIds.bind(client));
  const listResponse = await listIdsAsync(listRequest) as QueryPriceResponseProto;
  const priceUuids = listResponse.getPriceResponseList();
  expect(priceUuids.length).toBeGreaterThan(0);

  const getRequest = new QueryPriceRequestProto();
  getRequest.setObjectClass('PriceRequest');
  getRequest.setVersion('0.0.1');
  getRequest.setUuidsList([priceUuids[0].getUuid()!]);

  const getByIdsAsync = promisify(client.getByIds.bind(client));
  const getResponse = await getByIdsAsync(getRequest) as QueryPriceResponseProto;
  const prices = getResponse.getPriceResponseList();
  expect(prices.length).toBeGreaterThan(0);

  const securityUuidProto = prices[0].getSecurity()!.getUuid()!;
  return { uuid: UUID.fromU8Array(securityUuidProto.getRawUuid_asU8()), client };
}

test('search() returns Price wrapper objects', async () => {
  const now = dt.ZonedDateTime.now();
  const emptyFilter = new PositionFilter();

  const prices = await priceService.search(now.toProto(), emptyFilter);

  expect(prices.length).toBeGreaterThan(0);

  const firstPrice = prices[0];
  expect(firstPrice).toBeInstanceOf(Price);
  expect(firstPrice.getPrice()).toBeInstanceOf(Decimal);
  expect(firstPrice.getAsOf()).toBeTruthy();
  expect(firstPrice.getSecurityID()).toBeTruthy();
  console.log(`First price: ${firstPrice.toString()}`);
}, 120000);

test('createOrUpdate accepts a Price wrapper object', async () => {
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();

  // Use Price.fromSimple — the ergonomic constructor
  const price = Price.fromSimple(securityUuid.toString(), 98.75, new Date());

  const response = await priceService.createOrUpdate(price);

  expect(response).toBeTruthy();
  expect(response.getObjectClass()).toBeTruthy();
  console.log(`createOrUpdate (wrapper) response: ${response.getObjectClass()}`);

  // Verify via search
  const results = await priceService.searchBySecurityId(securityUuid.toString());
  const values = results.map(p => p.getPrice().toString());
  expect(values).toContain('98.75');
}, 120000);

test('searchBySecurityId returns prices for a known security', async () => {
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();

  const prices = await priceService.searchBySecurityId(securityUuid.toString());

  console.log(`searchBySecurityId returned ${prices.length} prices`);
  expect(prices.length).toBeGreaterThan(0);

  for (const price of prices) {
    expect(price).toBeInstanceOf(Price);
    expect(price.getSecurityID()).toBeTruthy();
  }
}, 120000);

test('searchPriceAsOfNow returns Price wrapper objects', async () => {
  const emptyFilter = new PositionFilter();
  const prices = await priceService.searchPriceAsOfNow(emptyFilter);

  expect(prices.length).toBeGreaterThan(0);
  expect(prices[0]).toBeInstanceOf(Price);
}, 120000);

test('validateCreateOrUpdate accepts a Price wrapper', async () => {
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();

  const price = Price.fromSimple(securityUuid.toString(), 100.5, new Date());

  const summary = await priceService.validateCreateOrUpdate(price);
  expect(summary).toBeTruthy();
  const errors = summary.getErrorsList();
  console.log(`Validation errors (wrapper): ${errors.length}`);
  expect(errors.length).toBe(0);
}, 120000);
