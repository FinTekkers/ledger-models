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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Models
var measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
// Model Utils
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
//Requests & Services
var PositionService_1 = require("../../services/position-service/PositionService");
var QueryPositionRequest_1 = require("../../requests/position/QueryPositionRequest");
test('test getting a position against the api.fintekkers.org position service', function () { return __awaiter(void 0, void 0, void 0, function () {
    var fields, measures, isTrue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fields = [field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.TRADE_DATE, field_pb_1.FieldProto.PRODUCT_TYPE, field_pb_1.FieldProto.PORTFOLIO, field_pb_1.FieldProto.PRODUCT_TYPE];
                measures = [measure_pb_1.MeasureProto.DIRECTED_QUANTITY];
                return [4 /*yield*/, testPosition(fields, measures)];
            case 1:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [2 /*return*/];
        }
    });
}); }, 30000);
test('test invalid request against the api.fintekkers.org position service', function () { return __awaiter(void 0, void 0, void 0, function () {
    var fields, measures, error_1, request, summary;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fields = [field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.TAX_LOT_CLOSE_DATE, field_pb_1.FieldProto.TRADE_DATE];
                measures = [measure_pb_1.MeasureProto.DIRECTED_QUANTITY];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 5]);
                return [4 /*yield*/, testPosition(fields, measures)];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3:
                error_1 = _a.sent();
                request = QueryPositionRequest_1.QueryPositionRequest.from(fields, measures);
                return [4 /*yield*/, new PositionService_1.PositionService().validateRequest(request)];
            case 4:
                summary = _a.sent();
                expect(summary.getErrorsList().length).toBeGreaterThan(0);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); }, 30000);
test('test getting a complex type from position', function () { return __awaiter(void 0, void 0, void 0, function () {
    var fields, measures, request, positions, position, _i, _a, field, displayValue, isTrue;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                fields = [field_pb_1.FieldProto.SECURITY, field_pb_1.FieldProto.PORTFOLIO];
                measures = [measure_pb_1.MeasureProto.DIRECTED_QUANTITY];
                request = QueryPositionRequest_1.QueryPositionRequest.from(fields, measures);
                return [4 /*yield*/, new PositionService_1.PositionService().search(request)];
            case 1:
                positions = _b.sent();
                position = positions[0];
                for (_i = 0, _a = position.getFields(); _i < _a.length; _i++) {
                    field = _a[_i];
                    displayValue = position.getFieldDisplay(field);
                    expect(displayValue.indexOf("[object") != 0).toBeTruthy();
                }
                return [4 /*yield*/, testPosition(fields, measures)];
            case 2:
                isTrue = _b.sent();
                expect(isTrue).toBe(true);
                return [2 /*return*/];
        }
    });
}); }, 30000);
function testPosition(fields, measures) {
    return __awaiter(this, void 0, void 0, function () {
        var request, positions, position_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    request = QueryPositionRequest_1.QueryPositionRequest.from(fields, measures);
                    return [4 /*yield*/, new PositionService_1.PositionService().search(request)];
                case 1:
                    positions = _a.sent();
                    if (positions && positions.length > 0) {
                        console.log(positions.length + " positions returned");
                        position_1 = positions[0];
                        fields.forEach(function (field) {
                            position_1.getFieldValue(field);
                        });
                        return [2 /*return*/, true];
                    }
                    else {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=position.test.js.map