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
/**
 * LM-485: the "Security metrics" example in ledger-models-javascript/README.md
 * runs here, against the in-memory SecurityMetric server. The code between
 * the README:start and README:end markers must equal the README's example
 * block (after removing common indentation and trailing whitespace).
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const security_metric_type_pb_1 = require("../../fintekkers/models/security/security_metric_type_pb");
const security_1 = __importDefault(require("../models/security/security"));
const security_metric_1 = require("../models/security/security_metric");
const uuid_1 = require("../models/utils/uuid");
const SecurityMetricService_1 = require("./security-metric-service/SecurityMetricService");
const security_metric_fake_server_1 = require("./security_metric_fake_server");
const README = path.resolve(__dirname, '../../../README.md');
const EXAMPLE_MARKER = '<!-- tested by node/wrappers/services/security_metric_readme.test.ts -->';
function normalise(code) {
    const lines = code.split('\n').map(l => l.replace(/\s+$/, ''));
    while (lines.length && lines[0] === '')
        lines.shift();
    while (lines.length && lines[lines.length - 1] === '')
        lines.pop();
    const indents = lines.filter(l => l !== '').map(l => l.length - l.trimStart().length);
    const common = indents.length ? Math.min(...indents) : 0;
    return lines.map(l => l.slice(common)).join('\n');
}
function readmeExample() {
    const text = fs.readFileSync(README, 'utf8');
    const at = text.indexOf(EXAMPLE_MARKER);
    expect(at).toBeGreaterThanOrEqual(0);
    const block = /```(?:ts|typescript)\n([\s\S]*?)```/.exec(text.slice(at));
    expect(block).not.toBeNull();
    return normalise(block[1]);
}
function testedExample() {
    const source = fs.readFileSync(path.resolve(__dirname, 'security_metric_readme.test.ts'), 'utf8');
    // The markers are comment lines of their own.
    const marked = /^[ \t]*\/\/ README:start\n([\s\S]*?)^[ \t]*\/\/ README:end$/m.exec(source);
    expect(marked).not.toBeNull();
    return normalise(marked[1]);
}
let fake;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    fake = yield security_metric_fake_server_1.FakeSecurityMetricServer.start();
    fake.seed(security_metric_fake_server_1.SPY_UUID, security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, [['2026-11-20', '512.34']]);
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield fake.stop();
}));
beforeEach(() => {
    (0, SecurityMetricService_1.setSecurityMetricService)(SecurityMetricService_1.SecurityMetricService.fromEnv({
        PRICE_SERVICE_HOST: '127.0.0.1',
        PRICE_SERVICE_PORT: String(fake.port),
    }));
});
afterEach(() => {
    (0, SecurityMetricService_1.resetSecurityMetricServiceForTests)();
});
test('the README example is the code tested here', () => {
    expect(readmeExample()).toBe(testedExample());
});
test('the README example runs', () => __awaiter(void 0, void 0, void 0, function* () {
    const spyUuid = security_metric_fake_server_1.SPY_UUID;
    const qqqUuid = '00000000-0000-4000-8000-000000000999';
    // README:start
    const spy = new security_1.default(security_1.default.linkOfLatest(new uuid_1.UUID(uuid_1.UUID.fromString(spyUuid))));
    // The latest value on or before a date: undefined when there is none, never 0.
    const shares = yield spy.getMetric(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, '2026-11-23');
    // shares.value: Decimal 15210000000, isoDate(shares.date): '2026-11-20', shares.ageDays: 3
    // Shortcuts; `on` defaults to today.
    const nav = yield spy.navPerShare('2026-11-23');
    // Many securities in one call: every UUID is a key, undefined when it has no value.
    const service = (0, SecurityMetricService_1.getSecurityMetricService)();
    const latest = yield service.get('SHARES_OUTSTANDING', [spyUuid, qqqUuid], '2026-11-23');
    // History in date order, gaps kept; `to` defaults to today.
    const history = yield spy.sharesOutstandingHistory('2026-11-01', '2026-11-23');
    const byDate = history.asDict(); // Map { '2026-11-19' => 15204137000, '2026-11-20' => 15210000000 }
    // Record: points are checked first, then sent; returns the as_of the service stamped.
    const asOf = yield service.record('NAV_PER_SHARE', spyUuid, { '2026-11-23': '513.02' });
    // README:end
    expect(shares.value.toFixed()).toBe('15210000000');
    expect((0, security_metric_1.isoDate)(shares.date)).toBe('2026-11-20');
    expect(shares.ageDays).toBe(3);
    expect(nav.value.toFixed()).toBe('512.34');
    expect([...latest.keys()]).toEqual([spyUuid, qqqUuid]);
    expect(latest.get(spyUuid).value.toFixed()).toBe('15210000000');
    expect(latest.get(qqqUuid)).toBeUndefined();
    expect([...byDate.entries()].map(([d, v]) => [d, v.toFixed()])).toEqual([
        ['2026-11-19', '15204137000'],
        ['2026-11-20', '15210000000'],
    ]);
    expect(asOf.getTimezone()).toBe('UTC');
    expect((yield spy.navPerShare('2026-11-23')).value.toFixed()).toBe('513.02');
}));
//# sourceMappingURL=security_metric_readme.test.js.map