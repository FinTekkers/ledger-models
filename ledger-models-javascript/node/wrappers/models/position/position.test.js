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
var uuid_1 = require("../utils/uuid");
var any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
var decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
var position_pb_1 = require("../../../fintekkers/models/position/position_pb");
var position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
var security_pb_1 = require("../../../fintekkers/models/security/security_pb");
var portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
var position_1 = require("./position");
var date_1 = require("../utils/date");
var position_status_pb_1 = require("../../../fintekkers/models/position/position_status_pb");
test('test the position wrapper', function () { return __awaiter(void 0, void 0, void 0, function () {
    var isTrue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, testSerialization()];
            case 1:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [2 /*return*/];
        }
    });
}); });
function testSerialization() {
    return __awaiter(this, void 0, void 0, function () {
        var fields, security, portfolio, tradeDate, productType, id, measure, measureValue, tradeDatePacked, idPacked, positionProto, position, tradeDatePosition, securityPosition, portfolioPosition, positionID;
        return __generator(this, function (_a) {
            fields = [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.TRADE_DATE, field_pb_1.FieldProto.PRODUCT_TYPE, field_pb_1.FieldProto.PORTFOLIO, field_pb_1.FieldProto.SECURITY];
            security = new security_pb_1.SecurityProto().setAssetClass("Test");
            portfolio = new portfolio_pb_1.PortfolioProto().setPortfolioName("Test portfolio");
            tradeDate = date_1.LocalDate.today().toDate();
            productType = "Test product type";
            id = new uuid_1.UUID(uuid_1.UUID.random().toBytes());
            measure = measure_pb_1.MeasureProto.DIRECTED_QUANTITY;
            measureValue = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.0");
            tradeDatePacked = new any_pb_1.Any();
            tradeDatePacked.setTypeUrl("Doesn't matter");
            tradeDatePacked.setValue(date_1.LocalDate.from(tradeDate).toProto().serializeBinary());
            idPacked = new any_pb_1.Any();
            idPacked.setTypeUrl("Doesn't matter");
            idPacked.setValue(id.toUUIDProto().serializeBinary());
            positionProto = new position_pb_1.PositionProto();
            positionProto.setFieldsList([
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.SECURITY).setFieldValuePacked(security),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PORTFOLIO).setFieldValuePacked(portfolio),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRODUCT_TYPE).setStringValue(productType),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ID).setFieldValuePacked(idPacked),
            ]);
            position = new position_1.Position(positionProto);
            tradeDatePosition = position.getFieldValue(field_pb_1.FieldProto.TRADE_DATE);
            expect(tradeDate.getFullYear()).toBe(tradeDatePosition.getFullYear());
            expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
            expect(tradeDate.getDay()).toBe(tradeDatePosition.getDay());
            securityPosition = position.getFieldValue(field_pb_1.FieldProto.SECURITY);
            expect(securityPosition.getAssetClass()).toBe(security.getAssetClass());
            portfolioPosition = position.getFieldValue(field_pb_1.FieldProto.PORTFOLIO);
            expect(portfolioPosition.getPortfolioName()).toBe(portfolio.getPortfolioName());
            expect(position.getFieldValue(field_pb_1.FieldProto.PRODUCT_TYPE)).toBe(productType);
            positionID = position.getFieldValue(field_pb_1.FieldProto.ID);
            expect(positionID.toString()).toBe(id.toString());
            expect(position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS)).toBe(position_status_pb_1.PositionStatusProto.EXECUTED);
            return [2 /*return*/, true];
        });
    });
}
//# sourceMappingURL=position.test.js.map