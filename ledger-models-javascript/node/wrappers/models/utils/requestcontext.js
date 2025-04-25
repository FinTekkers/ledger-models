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
        throw new Error("API keys not supported currently.");
        // return EnvConfig.getEnvVar('API_KEY');
    }
    /**
     * Returns the URL for the backend GRPC service. It will default to
     * api.fintekkers.org if the environment variable is not set. You
     * cann set the environment variable by adding API_URL to your .env file.
     */
    static get apiURL() {
        const url = EnvConfig.getEnvVar('API_URL', "api.fintekkers.org") + ":8082";
        return url;
    }
    static get apiCredentials() {
        if (this.apiURL === "localhost:8082") {
            return grpc.credentials.createInsecure();
        }
        else {
            return grpc.credentials.createSsl();
        }
    }
}
exports.default = EnvConfig;
//# sourceMappingURL=requestcontext.js.map