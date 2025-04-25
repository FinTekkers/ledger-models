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
Object.defineProperty(exports, "__esModule", { value: true });
// Models
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
// Model Utils
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
//Requests & Services
const PositionService_1 = require("../../services/position-service/PositionService");
const QueryPositionRequest_1 = require("../../requests/position/QueryPositionRequest");
test('test getting a position against the api.fintekkers.org position service', () => __awaiter(void 0, void 0, void 0, function* () {
    let fields = [field_pb_1.FieldProto.PRODUCT_TYPE, field_pb_1.FieldProto.PORTFOLIO, field_pb_1.FieldProto.PRODUCT_TYPE];
    let measures = [measure_pb_1.MeasureProto.DIRECTED_QUANTITY];
    const isTrue = yield testPosition(fields, measures);
    expect(isTrue).toBe(true);
}), 30000);
test('test invalid request against the api.fintekkers.org position service', () => __awaiter(void 0, void 0, void 0, function* () {
    let fields = [field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.TAX_LOT_CLOSE_DATE, field_pb_1.FieldProto.TRADE_DATE];
    let measures = [measure_pb_1.MeasureProto.DIRECTED_QUANTITY];
    try {
        yield testPosition(fields, measures);
    }
    catch (error) {
        let request = QueryPositionRequest_1.QueryPositionRequest.from(fields, measures);
        let summary = yield new PositionService_1.PositionService().validateRequest(request);
        expect(summary.getErrorsList().length).toBeGreaterThan(0);
    }
}), 30000);
test('test getting a complex type from position', () => __awaiter(void 0, void 0, void 0, function* () {
    let fields = [field_pb_1.FieldProto.SECURITY, field_pb_1.FieldProto.PORTFOLIO];
    let measures = [measure_pb_1.MeasureProto.DIRECTED_QUANTITY];
    let request = QueryPositionRequest_1.QueryPositionRequest.from(fields, measures);
    let positions = yield new PositionService_1.PositionService().search(request);
    let position = positions[0];
    for (let field of position.getFields()) {
        let displayValue = position.getFieldDisplay(field);
        expect(displayValue.indexOf("[object") != 0).toBeTruthy();
    }
    const isTrue = yield testPosition(fields, measures);
    expect(isTrue).toBe(true);
}), 30000);
function testPosition(fields, measures) {
    return __awaiter(this, void 0, void 0, function* () {
        let request = QueryPositionRequest_1.QueryPositionRequest.from(fields, measures);
        const positionService = new PositionService_1.PositionService();
        const validationSummary = yield positionService.validateRequest(request);
        if (validationSummary.getErrorsList().length > 0) {
            throw new Error(validationSummary.getErrorsList().join("\n"));
        }
        let positions = yield positionService.search(request);
        if (positions && positions.length > 0) {
            console.log(positions.length + " positions returned");
            let position = positions[0];
            fields.forEach(field => {
                position.getFieldValue(field);
            });
            return true;
        }
        else {
            return false;
        }
    });
}
//# sourceMappingURL=position.test.js.map