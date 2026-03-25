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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PriceService_1 = require("./PriceService");
const Price_1 = __importDefault(require("../../models/price/Price"));
const positionfilter_1 = require("../../models/position/positionfilter");
const uuid_1 = require("../../models/utils/uuid");
const dt = __importStar(require("../../models/utils/datetime"));
const grpc = __importStar(require("@grpc/grpc-js"));
const util_1 = require("util");
const price_service_grpc_pb_1 = require("../../../fintekkers/services/price-service/price_service_grpc_pb");
const query_price_request_pb_1 = require("../../../fintekkers/requests/price/query_price_request_pb");
const decimal_js_1 = require("decimal.js");
const PRICE_SERVICE_URL = 'localhost:8083';
process.env['API_URL'] = PRICE_SERVICE_URL;
const priceService = new PriceService_1.PriceService();
afterAll(() => {
    priceService.close();
});
/**
 * Helper: discover a security UUID that has prices in the system.
 */
function getSecurityUuidWithPrices() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new price_service_grpc_pb_1.PriceClient(PRICE_SERVICE_URL, grpc.credentials.createInsecure());
        const listRequest = new query_price_request_pb_1.QueryPriceRequestProto();
        listRequest.setObjectClass('PriceRequest');
        listRequest.setVersion('0.0.1');
        const listIdsAsync = (0, util_1.promisify)(client.listIds.bind(client));
        const listResponse = yield listIdsAsync(listRequest);
        const priceUuids = listResponse.getPriceResponseList();
        expect(priceUuids.length).toBeGreaterThan(0);
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
test('search() returns Price wrapper objects', () => __awaiter(void 0, void 0, void 0, function* () {
    const now = dt.ZonedDateTime.now();
    const emptyFilter = new positionfilter_1.PositionFilter();
    const prices = yield priceService.search(now.toProto(), emptyFilter);
    expect(prices.length).toBeGreaterThan(0);
    const firstPrice = prices[0];
    expect(firstPrice).toBeInstanceOf(Price_1.default);
    expect(firstPrice.getPrice()).toBeInstanceOf(decimal_js_1.Decimal);
    expect(firstPrice.getAsOf()).toBeTruthy();
    expect(firstPrice.getSecurityID()).toBeTruthy();
    console.log(`First price: ${firstPrice.toString()}`);
}), 120000);
test('createOrUpdate accepts a Price wrapper object', () => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    // Use Price.fromSimple — the ergonomic constructor
    const price = Price_1.default.fromSimple(securityUuid.toString(), 98.75, new Date());
    const response = yield priceService.createOrUpdate(price);
    expect(response).toBeTruthy();
    expect(response.getObjectClass()).toBeTruthy();
    console.log(`createOrUpdate (wrapper) response: ${response.getObjectClass()}`);
    // Verify via search
    const results = yield priceService.searchBySecurityId(securityUuid.toString());
    const values = results.map(p => p.getPrice().toString());
    expect(values).toContain('98.75');
}), 120000);
test('searchBySecurityId returns prices for a known security', () => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    const prices = yield priceService.searchBySecurityId(securityUuid.toString());
    console.log(`searchBySecurityId returned ${prices.length} prices`);
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
        expect(price).toBeInstanceOf(Price_1.default);
        expect(price.getSecurityID()).toBeTruthy();
    }
}), 120000);
test('searchPriceAsOfNow returns Price wrapper objects', () => __awaiter(void 0, void 0, void 0, function* () {
    const emptyFilter = new positionfilter_1.PositionFilter();
    const prices = yield priceService.searchPriceAsOfNow(emptyFilter);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0]).toBeInstanceOf(Price_1.default);
}), 120000);
test('validateCreateOrUpdate accepts a Price wrapper', () => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid: securityUuid, client } = yield getSecurityUuidWithPrices();
    client.close();
    const price = Price_1.default.fromSimple(securityUuid.toString(), 100.5, new Date());
    const summary = yield priceService.validateCreateOrUpdate(price);
    expect(summary).toBeTruthy();
    const errors = summary.getErrorsList();
    console.log(`Validation errors (wrapper): ${errors.length}`);
    expect(errors.length).toBe(0);
}), 120000);
//# sourceMappingURL=price-wrapper.test.js.map