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
exports.SecurityService = void 0;
const util_1 = require("util");
const security_1 = __importDefault(require("../../models/security/security"));
const dt = __importStar(require("../../models/utils/datetime"));
// Requests & Services
const security_service_grpc_pb_1 = require("../../../fintekkers/services/security-service/security_service_grpc_pb");
const query_security_request_pb_1 = require("../../../fintekkers/requests/security/query_security_request_pb");
const create_security_request_pb_1 = require("../../../fintekkers/requests/security/create_security_request_pb");
const requestcontext_1 = __importDefault(require("../../models/utils/requestcontext"));
class SecurityService {
    constructor() {
        this.client = new security_service_grpc_pb_1.SecurityClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
    }
    validateCreateSecurity(security) {
        return __awaiter(this, void 0, void 0, function* () {
            const createRequest = new create_security_request_pb_1.CreateSecurityRequestProto();
            createRequest.setObjectClass('SecurityRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setSecurityInput(security);
            const validateCreateOrUpdateAsync = (0, util_1.promisify)(this.client.validateCreateOrUpdate.bind(this.client));
            const response = yield validateCreateOrUpdateAsync(createRequest);
            return response;
        });
    }
    createSecurity(security) {
        return __awaiter(this, void 0, void 0, function* () {
            const createRequest = new create_security_request_pb_1.CreateSecurityRequestProto();
            createRequest.setObjectClass('SecurityRequest');
            createRequest.setVersion('0.0.1');
            createRequest.setSecurityInput(security);
            const createSecurityAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
            const response = yield createSecurityAsync(createRequest);
            return response;
        });
    }
    searchSecurityAsOfNow(positionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = dt.ZonedDateTime.now().toProto();
            return this.searchSecurity(now, positionFilter);
        });
    }
    searchSecurity(asOf, positionFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchRequest = new query_security_request_pb_1.QuerySecurityRequestProto();
            searchRequest.setObjectClass('SecurityRequest');
            searchRequest.setVersion('0.0.1');
            searchRequest.setAsOf(asOf);
            searchRequest.setSearchSecurityInput(positionFilter.toProto());
            const tmpClient = this.client;
            const listSecurities = [];
            function processStreamSynchronously() {
                return __awaiter(this, void 0, void 0, function* () {
                    const stream2 = tmpClient.search(searchRequest);
                    return new Promise((resolve, reject) => {
                        stream2.on('data', (response) => {
                            response.getSecurityResponseList().forEach((security) => {
                                listSecurities.push(security_1.default.create(security));
                            });
                        });
                        stream2.on('end', () => {
                            resolve(listSecurities);
                        });
                        stream2.on('error', (err) => {
                            console.error('Error in the stream:', err);
                            reject(err);
                        });
                    });
                });
            }
            return yield processStreamSynchronously();
        });
    }
}
exports.SecurityService = SecurityService;
//# sourceMappingURL=SecurityService.js.map