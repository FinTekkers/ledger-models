"use strict";
/**
 * LM-287: the JS service-address lookup resolves every case in the shared
 * fixture exactly as Java `ServiceAddress` and Rust `service_address.rs` do.
 * No cases are written here; they all come from the fixture.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const serviceaddress_1 = require("./serviceaddress");
const fixturePath = path.resolve(__dirname, '../../../../test-fixtures/service-address-cases.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const rows = fixture.cases.flatMap((c) => c.services.map((s) => [c.name, s, c]));
function serviceNamed(name) {
    if (!Object.prototype.hasOwnProperty.call(serviceaddress_1.Service, name)) {
        throw new Error(`fixture names an unknown service: ${name}`);
    }
    return serviceaddress_1.Service[name];
}
describe('service-address-cases.json', () => {
    test('has cases covering every step, so an emptied fixture cannot pass', () => {
        // 30 cases expanding to 55 (case, service) checks.
        expect(fixture.cases.length).toBeGreaterThanOrEqual(30);
        expect(rows.length).toBeGreaterThanOrEqual(55);
        expect(new Set(fixture.cases.map((c) => c.step))).toEqual(new Set(['a', 'b', 'c', 'd']));
        for (const c of fixture.cases) {
            expect(c.services.length).toBeGreaterThan(0);
            expect((c.expected === undefined) !== (c.error === undefined)).toBe(true);
        }
    });
    test('standard_ports match the resolver', () => {
        expect(fixture.standard_ports).toEqual({
            BROKER: serviceaddress_1.BROKER_PORT,
            LEDGER: serviceaddress_1.LEDGER_PORT,
            VALUATION: serviceaddress_1.VALUATION_PORT,
            PRICE: serviceaddress_1.PRICE_PORT,
        });
        for (const s of Object.values(serviceaddress_1.Service)) {
            expect((0, serviceaddress_1.standardPort)(s)).toBe(fixture.standard_ports[(0, serviceaddress_1.envPrefix)(s)]);
        }
    });
    test.each(rows)('%s [%s]', (_name, serviceName, c) => {
        const service = serviceNamed(serviceName);
        if (c.error !== undefined) {
            expect(() => (0, serviceaddress_1.resolve)(service, c.env)).toThrow(c.error);
            return;
        }
        const endpoint = (0, serviceaddress_1.resolve)(service, c.env);
        expect(endpoint).toEqual(c.expected);
        expect((0, serviceaddress_1.target)(endpoint)).toBe(`${c.expected.host}:${c.expected.port}`);
    });
});
//# sourceMappingURL=serviceaddress.test.js.map