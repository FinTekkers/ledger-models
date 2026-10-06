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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsecureChannelAuthError = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const grpc = __importStar(require("@grpc/grpc-js"));
class EnvConfig {
    static getEnvVar(key, defaultValue) {
        const value = process.env[key];
        if (value === undefined) {
            if (defaultValue === undefined) {
                throw new Error(`Environment variable ${key} is not set.`);
            }
            return defaultValue;
        }
        return value;
    }
    static get apiKey() {
        return process.env['API_KEY'];
    }
    /**
     * Returns the URL for the backend GRPC service. It will default to
     * api.fintekkers.org:8082 if the environment variable is not set. If
     * API_URL already includes a port (e.g. localhost:8083), it is used as-is;
     * otherwise :8082 is appended for backward compatibility.
     */
    static get apiURL() {
        const base = EnvConfig.getEnvVar('API_URL', 'api.fintekkers.org');
        return /:\d+$/.test(base) ? base : base + ':8082';
    }
    static get isLocalURL() {
        return /^localhost|^127\.0\.0\.1/.test(this.apiURL);
    }
    static get apiCredentials() {
        if (this.isLocalURL) {
            return grpc.credentials.createInsecure();
        }
        else {
            return grpc.credentials.createSsl();
        }
    }
    static addApiKey(metadata, apiKey) {
        metadata.add('x-api-key', apiKey);
    }
    /**
     * Returns SSL channel credentials combined with per-call credentials that
     * inject `x-api-key: <apiKey>` into every call's metadata.
     *
     * Remote (SSL) hosts only: grpc-js cannot compose call credentials with
     * insecure channel credentials. For localhost / 127.0.0.1 use
     * {@link EnvConfig.getAuthenticatedClientOptions}, which sends the key via
     * an interceptor instead.
     *
     * @throws {InsecureChannelAuthError} when apiURL is localhost / 127.0.0.1.
     */
    static getAuthenticatedCredentials(apiKey) {
        if (this.isLocalURL) {
            throw new InsecureChannelAuthError();
        }
        const callCreds = grpc.credentials.createFromMetadataGenerator((_params, callback) => {
            const metadata = new grpc.Metadata();
            EnvConfig.addApiKey(metadata, apiKey);
            callback(null, metadata);
        });
        return grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(), callCreds);
    }
    /**
     * Returns credentials and interceptors for authenticated calls.
     * For local (insecure) channels, injects the API key via an interceptor.
     * For remote (SSL) channels, uses {@link EnvConfig.getAuthenticatedCredentials}.
     */
    static getAuthenticatedClientOptions(apiKey) {
        if (this.isLocalURL) {
            const interceptor = (_options, nextCall) => {
                return new grpc.InterceptingCall(nextCall(_options), {
                    start(metadata, listener, next) {
                        EnvConfig.addApiKey(metadata, apiKey);
                        next(metadata, listener);
                    }
                });
            };
            return { credentials: grpc.credentials.createInsecure(), interceptors: [interceptor] };
        }
        return {
            credentials: EnvConfig.getAuthenticatedCredentials(apiKey),
            interceptors: []
        };
    }
}
/**
 * Thrown by EnvConfig.getAuthenticatedCredentials when API_URL points at an
 * insecure (local) channel. The message never includes the API key.
 */
class InsecureChannelAuthError extends Error {
    constructor() {
        super('API key auth over an insecure channel requires getAuthenticatedClientOptions()');
        this.name = 'InsecureChannelAuthError';
        Object.setPrototypeOf(this, InsecureChannelAuthError.prototype);
    }
}
exports.InsecureChannelAuthError = InsecureChannelAuthError;
exports.default = EnvConfig;
//# sourceMappingURL=requestcontext.js.map