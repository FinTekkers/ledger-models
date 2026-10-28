"use strict";
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
// A price search for a security filters on SECURITY_ID, never uuIds (LM-398).
// QueryPriceRequestProto.uuIds holds price IDs only.
const PriceService_1 = require("./price-service/PriceService");
const uuid_1 = require("../models/utils/uuid");
const field_pb_1 = require("../../fintekkers/models/position/field_pb");
const uuid_pb_1 = require("../../fintekkers/models/util/uuid_pb");
/**
 * A PriceService whose gRPC client records each search request. Same shape
 * as capturingService in util/object-types.test.ts: importing that file
 * would register its tests here too.
 */
function capturingPriceService() {
    const requests = [];
    const stream = (request) => {
        requests.push(request);
        const handlers = {};
        setImmediate(() => { var _a; return (_a = handlers.end) === null || _a === void 0 ? void 0 : _a.call(handlers); });
        return { on(event, handler) { handlers[event] = handler; return this; } };
    };
    const service = Object.create(PriceService_1.PriceService.prototype);
    service.client = { search: stream };
    return { service, requests };
}
test('searchBySecurityId sends SECURITY_ID filter and empty uuIds', () => __awaiter(void 0, void 0, void 0, function* () {
    const securityId = uuid_1.UUID.random();
    const { service, requests } = capturingPriceService();
    yield service.searchBySecurityId(securityId.toString());
    expect(requests).toHaveLength(1);
    const request = requests[0];
    expect(request.getUuidsList()).toHaveLength(0);
    const filters = request.getSearchPriceInput().getFiltersList();
    expect(filters.map(f => f.getField())).toEqual([field_pb_1.FieldProto.SECURITY_ID]);
    const packed = filters[0].getFieldValuePacked();
    expect(packed.getTypeUrl()).toBe('type.googleapis.com/fintekkers.models.util.UUIDProto');
    const sent = uuid_pb_1.UUIDProto.deserializeBinary(packed.getValue_asU8());
    expect(Array.from(sent.getRawUuid_asU8())).toEqual(Array.from(securityId.toUUIDProto().getRawUuid_asU8()));
}));
//# sourceMappingURL=price.search-by-security.test.js.map