"use strict";
// SecurityService client-side identifier guard (#347).
// Pins that createSecurity / validateCreateSecurity raise the guard BEFORE
// invoking the gRPC client when the request carries an UNKNOWN-typed or
// empty identifier. Pure unit test — never touches the wire; the client is
// replaced with a sentinel that fails the test if hit.
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
const identifier_pb_1 = require("../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../fintekkers/models/security/identifier/identifier_type_pb");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
const identifier_1 = require("../models/security/identifier");
const SecurityService_1 = require("./security-service/SecurityService");
function makeIdentifier(type, value) {
    const p = new identifier_pb_1.IdentifierProto();
    p.setIdentifierType(type);
    p.setIdentifierValue(value);
    return p;
}
function securityWith(identifier) {
    const s = new security_pb_1.SecurityProto();
    s.addIdentifiers(identifier);
    return s;
}
function failingClient() {
    // Any RPC hit means the guard didn't fire — the test should fail loud.
    const explode = () => {
        throw new Error('client-side guard must reject before invoking the stub');
    };
    return {
        createOrUpdate: explode,
        validateCreateOrUpdate: explode,
    };
}
describe('SecurityService client-side identifier guard', () => {
    test('createSecurity rejects UNKNOWN_IDENTIFIER_TYPE before RPC', () => __awaiter(void 0, void 0, void 0, function* () {
        const svc = new SecurityService_1.SecurityService();
        svc.client = failingClient();
        const bad = securityWith(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, 'stale-uuid'));
        yield expect(svc.createSecurity(bad)).rejects.toBeInstanceOf(identifier_1.IdentifierValidationError);
    }));
    test('validateCreateSecurity rejects UNKNOWN_IDENTIFIER_TYPE before RPC', () => __awaiter(void 0, void 0, void 0, function* () {
        const svc = new SecurityService_1.SecurityService();
        svc.client = failingClient();
        const bad = securityWith(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE, 'stale-uuid'));
        yield expect(svc.validateCreateSecurity(bad)).rejects.toBeInstanceOf(identifier_1.IdentifierValidationError);
    }));
    test('createSecurity rejects empty identifier_value before RPC', () => __awaiter(void 0, void 0, void 0, function* () {
        const svc = new SecurityService_1.SecurityService();
        svc.client = failingClient();
        const bad = securityWith(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, ''));
        yield expect(svc.createSecurity(bad)).rejects.toBeInstanceOf(identifier_1.IdentifierValidationError);
    }));
});
//# sourceMappingURL=security.identifier-guard.test.js.map