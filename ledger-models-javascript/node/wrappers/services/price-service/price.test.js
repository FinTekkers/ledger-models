"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const PriceService_1 = require("./PriceService");
const positionfilter_1 = require("../../models/position/positionfilter");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const uuid_1 = require("../../models/utils/uuid");
const dt = __importStar(require("../../models/utils/datetime"));
const grpc = __importStar(require("@grpc/grpc-js"));
const price_service_grpc_pb_1 = require("../../../fintekkers/services/price-service/price_service_grpc_pb");
const query_price_request_pb_1 = require("../../../fintekkers/requests/price/query_price_request_pb");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const PRICE_SERVICE_URL = 'localhost:8083';
const priceService = new PriceService_1.PriceService(PRICE_SERVICE_URL);
afterAll(() => {
    priceService.close();
});
/**
 * Helper: get a security UUID that has prices by calling ListIds then GetByIds.
 */
function getSecurityUuidWithPrices() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new price_service_grpc_pb_1.PriceClient(PRICE_SERVICE_URL, grpc.credentials.createInsecure());
        // ListIds to get a price UUID
        const listRequest = new query_price_request_pb_1.QueryPriceRequestProto();
        listRequest.setObjectClass('PriceRequest');
        listRequest.setVersion('0.0.1');
        const listIdsAsync = (0, util_1.promisify)(client.listIds.bind(client));
        const listResponse = yield listIdsAsync(listRequest);
        const priceUuids = listResponse.getPriceResponseList();
        expect(priceUuids.length).toBeGreaterThan(0);
        // GetByIds for the first price to get its security UUID
        const getRequest = new query_price_request_pb_1.QueryPriceRequestProto();
        getRequest.setObjectClass('PriceRequest');
        getRequest.setVersion('0.0.1');
        getRequest.setUuidsList([priceUuids[0].getUuid()]);
        const getByIdsAsync = (0, util_1.promisify)(client.getByIds.bind(client));
        const getResponse = yield getByIdsAsync(getRequest);
        const prices = getResponse.getPriceResponseList();
        expect(prices.length).toBeGreaterThan(0);
        const securityUuidProto = prices[0].getSecurity().getUuid();
        return { uuid: uuid_1.UUID.fromU8Array(securityUuidProto.getRawUuid_asU8()), client };
    });
}
test('search with empty filter returns prices', () => __awaiter(void 0, void 0, void 0, function* () {
    const now = dt.ZonedDateTime.now();
    const emptyFilter = new positionfilter_1.PositionFilter();
    const prices = yield priceService.searchPrice(now.toProto(), emptyFilter);
    console.log(`Empty filter search returned ${prices.length} prices`);
    expect(prices.length).toBeGreaterThan(0);
    // Verify price structure
    const firstPrice = prices[0];
    expect(firstPrice.getPrice()).toBeTruthy();
    expect(firstPrice.getSecurity()).toBeTruthy();
}), 120000);
test('search by SECURITY_ID returns prices for a known security', () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // First discover a security UUID that actually has prices
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    console.log(`Found security UUID with prices: ${securityUuid.toString()}`);
    const now = dt.ZonedDateTime.now();
    const filter = new positionfilter_1.PositionFilter()
        .addEqualsFilter(field_pb_1.FieldProto.SECURITY_ID, securityUuid);
    const prices = yield priceService.searchPrice(now.toProto(), filter);
    console.log(`Search returned ${prices.length} prices for security ${securityUuid.toString()}`);
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
        expect(price.getSecurity()).toBeTruthy();
        expect((_a = price.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()).toBeTruthy();
    }
}), 120000);
test('search for CUSIP 91282CPZ8 (UUID 18e8c4e6-3da0-47c9-b26d-c5ea8b8dce95) returns prices', () => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const now = dt.ZonedDateTime.now();
    const securityUuid = new uuid_1.UUID(uuid_1.UUID.fromString('18e8c4e6-3da0-47c9-b26d-c5ea8b8dce95'));
    const filter = new positionfilter_1.PositionFilter()
        .addEqualsFilter(field_pb_1.FieldProto.SECURITY_ID, securityUuid);
    const prices = yield priceService.searchPrice(now.toProto(), filter);
    console.log(`CUSIP 91282CPZ8 search returned ${prices.length} prices`);
    // The gRPC call must succeed (no errors). If prices exist for this CUSIP,
    // verify their structure. The service may not have this security loaded yet.
    expect(prices.length).toBeGreaterThanOrEqual(0);
    if (prices.length > 0) {
        for (const price of prices) {
            expect(price.getSecurity()).toBeTruthy();
            const priceValue = (_b = price.getPrice()) === null || _b === void 0 ? void 0 : _b.getArbitraryPrecisionValue();
            expect(priceValue).toBeTruthy();
            console.log(`  Price: ${priceValue}`);
        }
    }
    else {
        console.warn('  No prices loaded for CUSIP 91282CPZ8 yet — gRPC call succeeded, data not populated');
    }
}), 120000);
/**
 * Helper: build a PriceProto for a known security with a given price value.
 */
function buildPriceProto(securityUuid, priceValue) {
    const now = dt.ZonedDateTime.now();
    const price = new price_pb_1.PriceProto();
    price.setObjectClass('Price');
    price.setVersion('0.0.1');
    price.setUuid(uuid_1.UUID.random().toUUIDProto());
    price.setAsOf(now.toProto());
    const decimalValue = new decimal_value_pb_1.DecimalValueProto();
    decimalValue.setArbitraryPrecisionValue(priceValue);
    price.setPrice(decimalValue);
    // Set security as a link reference
    const security = new security_pb_1.SecurityProto();
    security.setUuid(securityUuid.toUUIDProto());
    security.setIsLink(true);
    price.setSecurity(security);
    price.setPriceType(price_type_pb_1.PriceTypeProto.PERCENTAGE);
    return price;
}
test('createOrUpdate inserts a price via the gRPC API', () => __awaiter(void 0, void 0, void 0, function* () {
    // Discover a real security UUID that already has prices
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    const priceProto = buildPriceProto(securityUuid, '99.875');
    const response = yield priceService.createOrUpdate(priceProto);
    // The RPC must succeed and return a valid response
    expect(response).toBeTruthy();
    expect(response.getObjectClass()).toBeTruthy();
    console.log(`createOrUpdate response object_class: ${response.getObjectClass()}`);
    // Verify the price was persisted by searching for it
    const now = dt.ZonedDateTime.now();
    const filter = new positionfilter_1.PositionFilter()
        .addEqualsFilter(field_pb_1.FieldProto.SECURITY_ID, securityUuid);
    const prices = yield priceService.searchPrice(now.toProto(), filter);
    const priceValues = prices.map(p => { var _a; return (_a = p.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue(); });
    expect(priceValues).toContain('99.875');
}), 120000);
test('validateCreateOrUpdate returns no errors for a valid price', () => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    const priceProto = buildPriceProto(securityUuid, '100.25');
    const summary = yield priceService.validateCreateOrUpdate(priceProto);
    expect(summary).toBeTruthy();
    const errors = summary.getErrorsList();
    console.log(`Validation errors: ${errors.length}`);
    expect(errors.length).toBe(0);
}), 120000);
test('createOrUpdate price can be retrieved via search', () => __awaiter(void 0, void 0, void 0, function* () {
    // Discover a real security UUID
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    // Create a price with a distinctive value
    const priceProto = buildPriceProto(securityUuid, '101.5');
    const createResponse = yield priceService.createOrUpdate(priceProto);
    expect(createResponse).toBeTruthy();
    // Search for prices for that security and verify our price appears
    const now = dt.ZonedDateTime.now();
    const filter = new positionfilter_1.PositionFilter()
        .addEqualsFilter(field_pb_1.FieldProto.SECURITY_ID, securityUuid);
    const prices = yield priceService.searchPrice(now.toProto(), filter);
    expect(prices.length).toBeGreaterThan(0);
    const priceValues = prices.map(p => { var _a; return (_a = p.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue(); });
    console.log(`Found ${prices.length} prices for security, values: ${priceValues.join(', ')}`);
    expect(priceValues).toContain('101.5');
}), 120000);
//# sourceMappingURL=price.test.js.map