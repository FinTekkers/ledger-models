"use strict";
// Note: Some classes and functions have been omitted or simplified due to lack of context.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
var decimal_js_1 = require("decimal.js");
var transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
var Position = /** @class */ (function () {
    function Position(positionProto) {
        this.proto = positionProto;
    }
    Position.prototype.getFieldValue = function (field) {
        switch (field) {
            case field_pb_1.FieldProto.TRADE_DATE:
            case field_pb_1.FieldProto.EFFECTIVE_DATE:
            case field_pb_1.FieldProto.MATURITY_DATE:
            case field_pb_1.FieldProto.TAX_LOT_OPEN_DATE:
            case field_pb_1.FieldProto.TAX_LOT_CLOSE_DATE:
                var start = new Date(2024, 0, 1).getTime(); // January 1st of the startYear
                var now = new Date().getTime();
                var randomTime = start + Math.random() * (now - start);
                return new Date(randomTime);
            case field_pb_1.FieldProto.PRODUCT_TYPE:
                var items = ['Bond', 'Equity'];
                var randomIndex = Math.floor(Math.random() * items.length);
                return items[randomIndex];
            case field_pb_1.FieldProto.ASSET_CLASS:
                var items2 = ['Equity', 'Fixed Income'];
                var randomIndex2 = Math.floor(Math.random() * items2.length);
                return items2[randomIndex2];
            case field_pb_1.FieldProto.ASSET_CLASS:
                var items3 = [transaction_type_pb_1.TransactionTypeProto.BUY, transaction_type_pb_1.TransactionTypeProto.SELL, transaction_type_pb_1.TransactionTypeProto.DEPOSIT, transaction_type_pb_1.TransactionTypeProto.WITHDRAWAL, transaction_type_pb_1.TransactionTypeProto.MATURATION];
                var randomIndex3 = Math.floor(Math.random() * items3.length);
                return items3[randomIndex3];
            default:
                throw new Error("No dummy data setup for this Field");
        }
    };
    Position.prototype.getField = function (fieldToGet) {
        throw Error("Do not cal this");
    };
    Position.prototype.getMeasureValue = function (measure) {
        switch (measure) {
            case measure_pb_1.MeasureProto.DIRECTED_QUANTITY:
                return new decimal_js_1.default(Math.random() * 100000);
            case measure_pb_1.MeasureProto.UNADJUSTED_COST_BASIS:
                return new decimal_js_1.default(Math.random() * 100);
            case measure_pb_1.MeasureProto.MARKET_VALUE:
                return new decimal_js_1.default(Math.random() * 10000000);
        }
    };
    Position.prototype.getMeasure = function (measureToGet) {
        throw new Error("Do not call this");
    };
    Position.prototype.getFieldDisplay = function (fieldToGet) {
        throw new Error("Do not call this");
    };
    Position.prototype.getMeasures = function () {
        return [measure_pb_1.MeasureProto.DIRECTED_QUANTITY, measure_pb_1.MeasureProto.UNADJUSTED_COST_BASIS, measure_pb_1.MeasureProto.MARKET_VALUE];
    };
    Position.prototype.getFields = function () {
        return [field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.TRADE_DATE, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.TRANSACTION_TYPE];
    };
    return Position;
}());
exports.Position = Position;
//# sourceMappingURL=hardcoded.position.js.map