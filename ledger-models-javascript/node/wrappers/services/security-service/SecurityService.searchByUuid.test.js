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
const SecurityService_1 = require("./SecurityService");
const positionfilter_1 = require("../../models/position/positionfilter");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const identifier_1 = require("../../models/security/identifier");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
test('searchByUuid returns the security matching the given UUID', () => __awaiter(void 0, void 0, void 0, function* () {
    const service = new SecurityService_1.SecurityService();
    // First find a known security by CUSIP to get its UUID
    const filter = new positionfilter_1.PositionFilter();
    const identifierProto = new identifier_pb_1.IdentifierProto()
        .setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.CUSIP)
        .setIdentifierValue('912810TM4');
    filter.addObjectFilter(field_pb_1.FieldProto.IDENTIFIER, new identifier_1.Identifier(identifierProto));
    const byIdentifier = yield service.searchSecurityAsOfNow(filter);
    if (byIdentifier.length === 0) {
        console.warn('No security found for test CUSIP — skipping UUID lookup assertion');
        return;
    }
    const original = byIdentifier[0];
    const uuidStr = original.getID().toString();
    // Now look it up by UUID
    const byUuid = yield service.searchByUuid(uuidStr);
    expect(byUuid.length).toBeGreaterThan(0);
    expect(byUuid[0].getID().toString()).toBe(uuidStr);
}), 30000);
//# sourceMappingURL=SecurityService.searchByUuid.test.js.map