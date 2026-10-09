"use strict";
/**
 * Unit tests for Issue #114: API key support in EnvConfig.
 *
 * No network access: grpc-js credential factories are spied on and the
 * metadata generator / interceptor are invoked directly.
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
const grpc = __importStar(require("@grpc/grpc-js"));
const requestcontext_1 = __importStar(require("./requestcontext"));
const savedApiUrl = process.env.API_URL;
const savedApiKey = process.env.API_KEY;
// Variables the lookup reads before API_URL; the host may set them.
const SHADOWING = ['BROKER_HOST', 'LEDGER_SERVICE_HOST', 'LEDGER_SERVICE_PORT'];
const savedShadowing = SHADOWING.map((k) => process.env[k]);
function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
    }
    else {
        process.env[name] = value;
    }
}
beforeEach(() => {
    restoreEnv('API_URL', undefined);
    restoreEnv('API_KEY', undefined);
    SHADOWING.forEach((k) => restoreEnv(k, undefined));
});
afterEach(() => {
    restoreEnv('API_URL', savedApiUrl);
    restoreEnv('API_KEY', savedApiKey);
    SHADOWING.forEach((k, i) => restoreEnv(k, savedShadowing[i]));
    jest.restoreAllMocks();
});
describe('EnvConfig.apiURL', () => {
    test('uses API_URL as-is when it includes a port', () => {
        process.env.API_URL = 'localhost:80';
        expect(requestcontext_1.default.apiURL).toBe('localhost:80');
    });
    test('appends :8082 when API_URL has no port', () => {
        process.env.API_URL = 'localhost';
        expect(requestcontext_1.default.apiURL).toBe('localhost:8082');
    });
    test('defaults to localhost:8082 when API_URL is unset', () => {
        expect(requestcontext_1.default.apiURL).toBe('localhost:8082');
    });
});
describe('EnvConfig.apiKey', () => {
    test('returns API_KEY when set', () => {
        process.env.API_KEY = 'k';
        expect(requestcontext_1.default.apiKey).toBe('k');
    });
    test('returns undefined when unset, without throwing', () => {
        expect(() => requestcontext_1.default.apiKey).not.toThrow();
        expect(requestcontext_1.default.apiKey).toBeUndefined();
    });
});
describe('EnvConfig.apiCredentials', () => {
    test.each(['localhost:80', '127.0.0.1:8085'])('uses insecure credentials for %s', (url) => {
        process.env.API_URL = url;
        const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
        const ssl = jest.spyOn(grpc.credentials, 'createSsl');
        requestcontext_1.default.apiCredentials;
        expect(insecure).toHaveBeenCalledTimes(1);
        expect(ssl).not.toHaveBeenCalled();
    });
    test('uses insecure credentials when API_URL is unset (localhost:8082)', () => {
        const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
        const ssl = jest.spyOn(grpc.credentials, 'createSsl');
        requestcontext_1.default.apiCredentials;
        expect(insecure).toHaveBeenCalledTimes(1);
        expect(ssl).not.toHaveBeenCalled();
    });
    test('uses SSL credentials for a remote API_URL', () => {
        process.env.API_URL = 'myhost.example.com';
        const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
        const ssl = jest.spyOn(grpc.credentials, 'createSsl');
        requestcontext_1.default.apiCredentials;
        expect(ssl).toHaveBeenCalledTimes(1);
        expect(insecure).not.toHaveBeenCalled();
    });
});
describe('EnvConfig.getAuthenticatedCredentials', () => {
    test('metadata generator injects x-api-key', () => {
        process.env.API_URL = 'myhost.example.com';
        const generatorSpy = jest.spyOn(grpc.credentials, 'createFromMetadataGenerator');
        const creds = requestcontext_1.default.getAuthenticatedCredentials('k');
        expect(creds).toBeInstanceOf(grpc.ChannelCredentials);
        expect(generatorSpy).toHaveBeenCalledTimes(1);
        const generator = generatorSpy.mock.calls[0][0];
        const callback = jest.fn();
        generator({ service_url: 'https://myhost.example.com:8082' }, callback);
        expect(callback).toHaveBeenCalledTimes(1);
        const [err, metadata] = callback.mock.calls[0];
        expect(err).toBeNull();
        expect(metadata.get('x-api-key')).toEqual(['k']);
    });
    test.each(['localhost:80', '127.0.0.1:8085'])('throws InsecureChannelAuthError without leaking the key for %s', (url) => {
        process.env.API_URL = url;
        const secret = 'dummy-secret-123';
        let caught;
        try {
            requestcontext_1.default.getAuthenticatedCredentials(secret);
        }
        catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(requestcontext_1.InsecureChannelAuthError);
        const err = caught;
        expect(err.message).not.toContain(secret);
        expect(String(err)).not.toContain(secret);
    });
    test('never logs the key', () => {
        const secret = 'dummy-secret-123';
        const spies = [
            jest.spyOn(console, 'log').mockImplementation(() => { }),
            jest.spyOn(console, 'warn').mockImplementation(() => { }),
            jest.spyOn(console, 'error').mockImplementation(() => { }),
        ];
        const generatorSpy = jest.spyOn(grpc.credentials, 'createFromMetadataGenerator');
        process.env.API_URL = 'myhost.example.com';
        requestcontext_1.default.getAuthenticatedCredentials(secret);
        generatorSpy.mock.calls[0][0]({ service_url: '' }, () => { });
        process.env.API_URL = 'localhost:80';
        requestcontext_1.default.getAuthenticatedClientOptions(secret);
        for (const spy of spies) {
            for (const args of spy.mock.calls) {
                expect(args.map(String).join(' ')).not.toContain(secret);
            }
        }
    });
});
describe('EnvConfig.getAuthenticatedClientOptions', () => {
    test.each(['localhost:80', '127.0.0.1:8085'])('uses insecure channel for %s', (url) => {
        process.env.API_URL = url;
        const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
        const ssl = jest.spyOn(grpc.credentials, 'createSsl');
        const { interceptors } = requestcontext_1.default.getAuthenticatedClientOptions('k');
        expect(insecure).toHaveBeenCalledTimes(1);
        expect(ssl).not.toHaveBeenCalled();
        expect(interceptors).toHaveLength(1);
    });
    test('uses SSL channel for a remote host', () => {
        process.env.API_URL = 'myhost.example.com';
        const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
        const ssl = jest.spyOn(grpc.credentials, 'createSsl');
        const { interceptors } = requestcontext_1.default.getAuthenticatedClientOptions('k');
        expect(ssl).toHaveBeenCalledTimes(1);
        expect(insecure).not.toHaveBeenCalled();
        expect(interceptors).toHaveLength(0);
    });
    test('local interceptor injects x-api-key on start', () => {
        process.env.API_URL = 'localhost:80';
        const { interceptors } = requestcontext_1.default.getAuthenticatedClientOptions('k');
        const nextStart = jest.fn();
        const fakeNextCall = {
            start: nextStart,
            cancelWithStatus: jest.fn(),
            getPeer: jest.fn(),
            sendMessageWithContext: jest.fn(),
            sendMessage: jest.fn(),
            startRead: jest.fn(),
            halfClose: jest.fn(),
            setCredentials: jest.fn(),
        };
        const nextCall = jest.fn(() => fakeNextCall);
        const call = interceptors[0]({}, nextCall);
        call.start(new grpc.Metadata(), {});
        expect(nextStart).toHaveBeenCalledTimes(1);
        const sentMetadata = nextStart.mock.calls[0][0];
        expect(sentMetadata.get('x-api-key')).toEqual(['k']);
    });
});
//# sourceMappingURL=requestcontext.auth.test.js.map