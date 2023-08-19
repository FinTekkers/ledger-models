"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
dotenv.config();
var grpc = require("@grpc/grpc-js");
var EnvConfig = /** @class */ (function () {
    function EnvConfig() {
    }
    EnvConfig.getEnvVar = function (key, defaultValue) {
        var value = process.env[key];
        if (value === undefined) {
            if (defaultValue === undefined) {
                throw new Error("Environment variable ".concat(key, " is not set."));
            }
            return defaultValue;
        }
        return value;
    };
    Object.defineProperty(EnvConfig, "apiKey", {
        get: function () {
            throw new Error("API keys not supported currently.");
            // return EnvConfig.getEnvVar('API_KEY');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EnvConfig, "apiURL", {
        /**
         * Returns the URL for the backend GRPC service. It will default to
         * api.fintekkers.org if the environment variable is not set. You
         * cann set the environment variable by adding API_URL to your .env file.
         */
        get: function () {
            var url = EnvConfig.getEnvVar('API_URL', "api.fintekkers.org") + ":8082";
            return url;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EnvConfig, "apiCredentials", {
        get: function () {
            if (this.apiURL === "localhost:8082") {
                return grpc.credentials.createInsecure();
            }
            else {
                return grpc.credentials.createSsl();
            }
        },
        enumerable: false,
        configurable: true
    });
    return EnvConfig;
}());
exports.default = EnvConfig;
//# sourceMappingURL=requestcontext.js.map