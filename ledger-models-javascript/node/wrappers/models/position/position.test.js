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
var transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
var price_pb_1 = require("../../../fintekkers/models/price/price_pb");
var tenor_pb_1 = require("../../../fintekkers/models/security/tenor_pb");
var tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
test('test the position wrapper', function () { return __awaiter(void 0, void 0, void 0, function () {
    var isTrue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, testEnumSerialization()];
            case 1:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [4 /*yield*/, testSerialization()];
            case 2:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [4 /*yield*/, testJsonSerialization()];
            case 3:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [4 /*yield*/, testDeSerializationWithUnknownProto()];
            case 4:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [2 /*return*/];
        }
    });
}); });
function testEnumSerialization() {
    return __awaiter(this, void 0, void 0, function () {
        var positionProto, measureValue, position, status;
        return __generator(this, function (_a) {
            positionProto = new position_pb_1.PositionProto();
            positionProto.setFieldsList([
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED)
            ]);
            measureValue = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.55");
            positionProto.setMeasuresList([
                new position_util_pb_1.MeasureMapEntry().setMeasure(measure_pb_1.MeasureProto.DIRECTED_QUANTITY).setMeasureDecimalValue(measureValue)
            ]);
            position = new position_1.Position(positionProto);
            status = position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS);
            expect(status.getEnumValueName()).toBe("EXECUTED");
            expect(status.getEnumValue()).toBe(position_status_pb_1.PositionStatusProto.EXECUTED);
            expect(status.getEnumDescriptor()).toBe(position_status_pb_1.PositionStatusProto);
            position.getMeasures().forEach(function (measureMapEntry) {
                measureMapEntry.getMeasure().toString();
            });
            expect(position.getMeasureValue(measure_pb_1.MeasureProto.DIRECTED_QUANTITY)).toBe(1.55);
            return [2 /*return*/, true];
        });
    });
}
function testJsonSerialization() {
    return __awaiter(this, void 0, void 0, function () {
        var tradeDate, productType, id, tradeDatePacked, idPacked, positionProto, position, position2, tradeDatePosition;
        return __generator(this, function (_a) {
            tradeDate = date_1.LocalDate.today().toDate();
            productType = "Test product type";
            id = new uuid_1.UUID(uuid_1.UUID.random().toBytes());
            tradeDatePacked = new any_pb_1.Any();
            tradeDatePacked.setTypeUrl("DUMMYTYPE_DATE");
            tradeDatePacked.setValue(date_1.LocalDate.from(tradeDate).toProto().serializeBinary());
            idPacked = new any_pb_1.Any();
            idPacked.setTypeUrl("DUMMYTYPE_ID");
            idPacked.setValue(id.toUUIDProto().serializeBinary());
            positionProto = new position_pb_1.PositionProto();
            positionProto.setFieldsList([
                // new FieldMapEntry().setField(FieldProto.SECURITY).setFieldValuePacked(security),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRODUCT_TYPE).setStringValue(productType),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.SECURITY_DESCRIPTION).setStringValue("Dummy"),
                new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ID).setFieldValuePacked(idPacked),
            ]);
            position = new position_1.Position(positionProto);
            position2 = position_1.Position.fromJSON(position.toJSON());
            tradeDatePosition = position2.getFieldValue(field_pb_1.FieldProto.TRADE_DATE);
            expect(tradeDate.getFullYear()).toBe(tradeDatePosition.getFullYear());
            expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
            expect(tradeDate.getDay()).toBe(tradeDatePosition.getDay());
            expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
            expect(position2.getFieldValue(field_pb_1.FieldProto.SECURITY_DESCRIPTION)).toBe("Dummy");
            return [2 /*return*/, true];
        });
    });
}
function testSerialization() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, position, tradeDate, security, portfolio, productType, id, tradeDatePosition, securityPosition, portfolioPosition, positionID, price, tenor;
        return __generator(this, function (_b) {
            _a = getPosition(false), position = _a.position, tradeDate = _a.tradeDate, security = _a.security, portfolio = _a.portfolio, productType = _a.productType, id = _a.id;
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
            expect(position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS).toString()).toBe("EXECUTED");
            expect(position.getMeasureValue(measure_pb_1.MeasureProto.DIRECTED_QUANTITY)).toBe(1);
            price = position.getFieldValue(field_pb_1.FieldProto.PRICE);
            expect(price.getPrice().getArbitraryPrecisionValue()).toBe("1.0");
            tenor = position.getFieldValue(field_pb_1.FieldProto.TENOR);
            expect(tenor.getTermValue()).toBe("3M");
            return [2 /*return*/, true];
        });
    });
}
function testDeSerializationWithUnknownProto() {
    return __awaiter(this, void 0, void 0, function () {
        var position;
        return __generator(this, function (_a) {
            position = getPosition(true).position;
            expect(position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS).toString()).toBe("UNKNOWN");
            return [2 /*return*/, true];
        });
    });
}
function getPosition(includeUnknownEnumValue) {
    var security = new security_pb_1.SecurityProto().setAssetClass("Test");
    var portfolio = new portfolio_pb_1.PortfolioProto().setPortfolioName("Test portfolio");
    var tradeDate = date_1.LocalDate.today().toDate();
    var productType = "Test product type";
    var id = new uuid_1.UUID(uuid_1.UUID.random().toBytes());
    var price = new price_pb_1.PriceProto()
        .setPrice(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.0"))
        .setUuid(id.toUUIDProto())
        .setSecurity(security);
    var tenor = new tenor_pb_1.TenorProto()
        .setTenorType(tenor_type_pb_1.TenorTypeProto.TERM)
        .setTermValue("3M");
    ;
    var measure = measure_pb_1.MeasureProto.DIRECTED_QUANTITY;
    var measureValue = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.0");
    var tradeDatePacked = new any_pb_1.Any();
    tradeDatePacked.setTypeUrl("DUMMYTYPE_DATE");
    tradeDatePacked.setValue(date_1.LocalDate.from(tradeDate).toProto().serializeBinary());
    var idPacked = new any_pb_1.Any();
    idPacked.setTypeUrl("DUMMYTYPE_ID");
    idPacked.setValue(id.toUUIDProto().serializeBinary());
    var pricePacked = new any_pb_1.Any();
    pricePacked.setTypeUrl("DUMMYTYPE_PRICE");
    pricePacked.setValue(price.serializeBinary());
    var tenorPacked = new any_pb_1.Any();
    tenorPacked.setTypeUrl("DUMMYTYPE_TENOR");
    tenorPacked.setValue(tenor.serializeBinary());
    var positionStatus = includeUnknownEnumValue ?
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.UNKNOWN) :
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED);
    var positionProto = new position_pb_1.PositionProto();
    positionProto.setFieldsList([
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.SECURITY).setFieldValuePacked(security),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PORTFOLIO).setFieldValuePacked(portfolio),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
        positionStatus,
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRANSACTION_TYPE).setEnumValue(transaction_type_pb_1.TransactionTypeProto.BUY),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TENOR).setFieldValuePacked(tenorPacked),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRODUCT_TYPE).setStringValue(productType),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ID).setFieldValuePacked(idPacked),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRICE).setFieldValuePacked(pricePacked)
    ]);
    positionProto.setMeasuresList([
        new position_util_pb_1.MeasureMapEntry().setMeasure(measure).setMeasureDecimalValue(measureValue)
    ]);
    var position = new position_1.Position(positionProto);
    return { position: position, tradeDate: tradeDate, security: security, portfolio: portfolio, productType: productType, id: id };
}
//# sourceMappingURL=position.test.js.map