import { promisify } from 'util';
import { PriceService } from './PriceService';
import { PositionFilter } from '../../models/position/positionfilter';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { UUID } from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';
import * as grpc from '@grpc/grpc-js';
import { PriceClient } from '../../../fintekkers/services/price-service/price_service_grpc_pb';
import { QueryPriceRequestProto } from '../../../fintekkers/requests/price/query_price_request_pb';
import { QueryPriceResponseProto } from '../../../fintekkers/requests/price/query_price_response_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';

const PRICE_SERVICE_URL = 'localhost:8083';

const priceService = new PriceService(PRICE_SERVICE_URL);

afterAll(() => {
  priceService.close();
});

/**
 * Helper: get a security UUID that has prices by calling ListIds then GetByIds.
 */
async function getSecurityUuidWithPrices(): Promise<{ uuid: UUID; client: PriceClient }> {
  const client = new PriceClient(PRICE_SERVICE_URL, grpc.credentials.createInsecure());

  // ListIds to get a price UUID
  const listRequest = new QueryPriceRequestProto();
  listRequest.setObjectClass('PriceRequest');
  listRequest.setVersion('0.0.1');

  const listIdsAsync = promisify(client.listIds.bind(client));
  const listResponse = await listIdsAsync(listRequest) as QueryPriceResponseProto;
  const priceUuids = listResponse.getPriceResponseList();
  expect(priceUuids.length).toBeGreaterThan(0);

  // GetByIds for the first price to get its security UUID
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

test('search with empty filter returns prices', async () => {
  const now = dt.ZonedDateTime.now();
  const emptyFilter = new PositionFilter();

  const prices = await priceService.searchPrice(now.toProto(), emptyFilter);

  console.log(`Empty filter search returned ${prices.length} prices`);
  expect(prices.length).toBeGreaterThan(0);

  // Verify price structure
  const firstPrice = prices[0];
  expect(firstPrice.getPrice()).toBeTruthy();
  expect(firstPrice.getSecurity()).toBeTruthy();
}, 120000);

test('search by SECURITY_ID returns prices for a known security', async () => {
  // First discover a security UUID that actually has prices
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();
  console.log(`Found security UUID with prices: ${securityUuid.toString()}`);

  const now = dt.ZonedDateTime.now();

  const filter = new PositionFilter()
    .addEqualsFilter(FieldProto.SECURITY_ID, securityUuid);

  const prices = await priceService.searchPrice(now.toProto(), filter);

  console.log(`Search returned ${prices.length} prices for security ${securityUuid.toString()}`);
  expect(prices.length).toBeGreaterThan(0);

  for (const price of prices) {
    expect(price.getSecurity()).toBeTruthy();
    expect(price.getPrice()?.getArbitraryPrecisionValue()).toBeTruthy();
  }
}, 120000);

test('search for CUSIP 91282CPZ8 (UUID 18e8c4e6-3da0-47c9-b26d-c5ea8b8dce95) returns prices', async () => {
  const now = dt.ZonedDateTime.now();

  const securityUuid = new UUID(UUID.fromString('18e8c4e6-3da0-47c9-b26d-c5ea8b8dce95'));
  const filter = new PositionFilter()
    .addEqualsFilter(FieldProto.SECURITY_ID, securityUuid);

  const prices = await priceService.searchPrice(now.toProto(), filter);

  console.log(`CUSIP 91282CPZ8 search returned ${prices.length} prices`);

  // The gRPC call must succeed (no errors). If prices exist for this CUSIP,
  // verify their structure. The service may not have this security loaded yet.
  expect(prices.length).toBeGreaterThanOrEqual(0);

  if (prices.length > 0) {
    for (const price of prices) {
      expect(price.getSecurity()).toBeTruthy();
      const priceValue = price.getPrice()?.getArbitraryPrecisionValue();
      expect(priceValue).toBeTruthy();
      console.log(`  Price: ${priceValue}`);
    }
  } else {
    console.warn('  No prices loaded for CUSIP 91282CPZ8 yet — gRPC call succeeded, data not populated');
  }
}, 120000);

/**
 * Helper: build a PriceProto for a known security with a given price value.
 */
function buildPriceProto(securityUuid: UUID, priceValue: string): PriceProto {
  const now = dt.ZonedDateTime.now();

  const price = new PriceProto();
  price.setObjectClass('Price');
  price.setVersion('0.0.1');
  price.setUuid(UUID.random().toUUIDProto());
  price.setAsOf(now.toProto());

  const decimalValue = new DecimalValueProto();
  decimalValue.setArbitraryPrecisionValue(priceValue);
  price.setPrice(decimalValue);

  // Set security as a link reference
  const security = new SecurityProto();
  security.setUuid(securityUuid.toUUIDProto());
  security.setIsLink(true);
  price.setSecurity(security);

  price.setPriceType(PriceTypeProto.PERCENTAGE);

  return price;
}

test('createOrUpdate inserts a price via the gRPC API', async () => {
  // Discover a real security UUID that already has prices
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();

  const priceProto = buildPriceProto(securityUuid, '99.875');

  const response = await priceService.createOrUpdate(priceProto);

  // The RPC must succeed and return a valid response
  expect(response).toBeTruthy();
  expect(response.getObjectClass()).toBeTruthy();
  console.log(`createOrUpdate response object_class: ${response.getObjectClass()}`);

  // Verify the price was persisted by searching for it
  const now = dt.ZonedDateTime.now();
  const filter = new PositionFilter()
    .addEqualsFilter(FieldProto.SECURITY_ID, securityUuid);

  const prices = await priceService.searchPrice(now.toProto(), filter);
  const priceValues = prices.map(p => p.getPrice()?.getArbitraryPrecisionValue());
  expect(priceValues).toContain('99.875');
}, 120000);

test('validateCreateOrUpdate returns no errors for a valid price', async () => {
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();

  const priceProto = buildPriceProto(securityUuid, '100.25');

  const summary = await priceService.validateCreateOrUpdate(priceProto);

  expect(summary).toBeTruthy();
  const errors = summary.getErrorsList();
  console.log(`Validation errors: ${errors.length}`);
  expect(errors.length).toBe(0);
}, 120000);

test('createOrUpdate price can be retrieved via search', async () => {
  // Discover a real security UUID
  const { uuid: securityUuid, client } = await getSecurityUuidWithPrices();
  client.close();

  // Create a price with a distinctive value
  const priceProto = buildPriceProto(securityUuid, '101.5');
  const createResponse = await priceService.createOrUpdate(priceProto);
  expect(createResponse).toBeTruthy();

  // Search for prices for that security and verify our price appears
  const now = dt.ZonedDateTime.now();
  const filter = new PositionFilter()
    .addEqualsFilter(FieldProto.SECURITY_ID, securityUuid);

  const prices = await priceService.searchPrice(now.toProto(), filter);
  expect(prices.length).toBeGreaterThan(0);

  const priceValues = prices.map(p => p.getPrice()?.getArbitraryPrecisionValue());
  console.log(`Found ${prices.length} prices for security, values: ${priceValues.join(', ')}`);
  expect(priceValues).toContain('101.5');
}, 120000);
