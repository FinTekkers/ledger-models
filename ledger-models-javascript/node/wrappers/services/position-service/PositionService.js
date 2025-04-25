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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionService = void 0;
// Models
const position_1 = require("../../models/position/position");
// Requests & Services
const position_service_grpc_pb_1 = require("../../../fintekkers/services/position-service/position_service_grpc_pb");
//Utils
const requestcontext_1 = __importDefault(require("../../models/utils/requestcontext"));
class PositionService {
    constructor() {
        this.client = new position_service_grpc_pb_1.PositionClient(requestcontext_1.default.apiURL, requestcontext_1.default.apiCredentials);
    }
    validateRequest(positionRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const tmpClient = this.client;
            const request = positionRequest.toProto();
            return new Promise((resolve, reject) => {
                tmpClient.validateQueryRequest(request, (error, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(response); // Return response from the callback
                    }
                });
            });
        });
    }
    search(positionRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const tmpClient = this.client;
            const listPositions = [];
            const request = positionRequest.toProto();
            const positionService = this;
            function processStreamSynchronously() {
                return __awaiter(this, void 0, void 0, function* () {
                    const stream2 = tmpClient.search(request);
                    return new Promise((resolve, reject) => {
                        stream2.on('data', (response) => {
                            response.getPositionsList().forEach((position) => {
                                listPositions.push(new position_1.Position(position));
                            });
                        });
                        stream2.on('end', () => {
                            resolve(listPositions);
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
exports.PositionService = PositionService;
//# sourceMappingURL=PositionService.js.map