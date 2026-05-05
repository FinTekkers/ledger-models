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
const PriceService_1 = require("./price-service/PriceService");
const link_resolver_1 = __importDefault(require("../util/link-resolver"));
const Price_1 = __importDefault(require("../models/price/Price"));
const uuid_1 = require("../models/utils/uuid");
const positionfilter_1 = require("../models/position/positionfilter");
const dt = __importStar(require("../models/utils/datetime"));
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const decimal_value_pb_1 = require("../../fintekkers/models/util/decimal_value_pb");
const identifier_pb_1 = require("../../fintekkers/models/security/identifier/identifier_pb");
const query_security_response_pb_1 = require("../../fintekkers/requests/security/query_security_response_pb");
/**
 * End-to-end test: priceService.searchWithSecurities resolves all link
 * securities embedded in the returned Prices via a single batched
 * GetByIds RPC.
 */
function fullSecurity(uuid, issuerName) {
    const proto = new security_pb_1.SecurityProto();
    proto.setObjectClass('Security');
    proto.setVersion('0.0.1');
    proto.setUuid(uuid.toUUIDProto());
    proto.setIsLink(false);
    proto.setIssuerName(issuerName);
    const ident = new identifier_pb_1.IdentifierProto();
    ident.setIdentifierValue(`TICKER-${issuerName}`);
    proto.setIdentifier(ident);
    return proto;
}
function linkPriceProto(securityUuid, priceValue) {
    const linkSec = new security_pb_1.SecurityProto();
    linkSec.setUuid(securityUuid.toUUIDProto());
    linkSec.setIsLink(true);
    const priceProto = new price_pb_1.PriceProto();
    priceProto.setObjectClass('Price');
    priceProto.setVersion('0.0.1');
    priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    priceProto.setSecurity(linkSec);
    const dv = new decimal_value_pb_1.DecimalValueProto();
    dv.setArbitraryPrecisionValue(priceValue);
    priceProto.setPrice(dv);
    return priceProto;
}
test('PriceService.searchWithSecurities returns hydrated Prices end-to-end', () => __awaiter(void 0, void 0, void 0, function* () {
    const uuidA = uuid_1.UUID.random();
    const uuidB = uuid_1.UUID.random();
    const store = new Map([
        [uuidA.toString(), fullSecurity(uuidA, 'AAPL')],
        [uuidB.toString(), fullSecurity(uuidB, 'MSFT')],
    ]);
    const callLog = { count: 0 };
    // Stub LinkResolver with a mock SecurityClient.
    const mockSecurityClient = {
        getByIds: (request, callback) => {
            callLog.count += 1;
            const requested = request.getUuidsList().map((u) => uuid_1.UUID.fromU8Array(u.getRawUuid_asU8()).toString());
            const response = new query_security_response_pb_1.QuerySecurityResponseProto();
            response.setSecurityResponseList(requested.map((u) => store.get(u)).filter(Boolean));
            setImmediate(() => callback(null, response));
        },
    };
    const linkResolver = new link_resolver_1.default({
        securityClient: mockSecurityClient,
        portfolioClient: {},
    });
    // Stub PriceService.search to skip the gRPC stream and return canned Prices.
    const priceService = new PriceService_1.PriceService();
    jest
        .spyOn(priceService, 'search')
        .mockResolvedValue([
        new Price_1.default(linkPriceProto(uuidA, '100')),
        new Price_1.default(linkPriceProto(uuidA, '101')),
        new Price_1.default(linkPriceProto(uuidB, '200')),
    ]);
    const asOf = dt.ZonedDateTime.now().toProto();
    const filter = new positionfilter_1.PositionFilter();
    const prices = yield priceService.searchWithSecurities(asOf, filter, linkResolver);
    expect(prices).toHaveLength(3);
    // 1 batched RPC for 2 unique security UUIDs.
    expect(callLog.count).toBe(1);
    // Every Price now has a hydrated full Security embedded.
    for (const p of prices) {
        const sec = p.proto.getSecurity();
        expect(sec.getIsLink()).toBe(false);
        expect(['AAPL', 'MSFT']).toContain(sec.getIssuerName());
        expect(sec.getIdentifier().getIdentifierValue()).toMatch(/^TICKER-/);
    }
}));
//# sourceMappingURL=searchWithSecurities.test.js.map