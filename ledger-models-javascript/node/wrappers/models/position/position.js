"use strict";
// Note: Some classes and functions have been omitted or simplified due to lack of context.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
var portfolio_1 = require("../portfolio/portfolio");
var security_1 = require("../security/security");
var uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
var local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
var identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
var measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
var serialization_1 = require("../utils/serialization");
var wrappers_pb_1 = require("google-protobuf/google/protobuf/wrappers_pb");
var Position = /** @class */ (function () {
    function Position(positionProto) {
        this.proto = positionProto;
        // //For each field, put into a map
        // this.proto.getFieldsList().forEach(field => {
        //   console.log(field);
        // });
    }
    Position.prototype.getFieldValue = function (field) {
        return this.getField(new position_util_pb_1.FieldMapEntry().setField(field));
    };
    Position.prototype.getField = function (fieldToGet) {
        for (var _i = 0, _a = this.proto.getFieldsList(); _i < _a.length; _i++) {
            var tmpField = _a[_i];
            if (tmpField.getField() === fieldToGet.getField()) {
                if (tmpField.getStringValue()) {
                    return tmpField.getStringValue();
                }
                if (tmpField.getEnumValue() > 0) {
                    throw new Error("Doh");
                    // const descriptor = FieldProto.DESCRIPTOR.valuesByNumber[fieldToGet.field];
                    // return new ProtoEnum(descriptor, unpackedValue.enumValue);
                }
                var unpackedValue = Position.unpackField(tmpField);
                if (field_pb_1.FieldProto.SECURITY == fieldToGet.getField()) {
                    return new security_1.default(unpackedValue);
                }
                if (field_pb_1.FieldProto.PORTFOLIO == fieldToGet.getField()) {
                    return new portfolio_1.default(unpackedValue);
                }
                return serialization_1.ProtoSerializationUtil.deserialize(unpackedValue);
            }
        }
        throw new Error("Could not find field in position");
    };
    Position.prototype.getMeasureValue = function (measure) {
        return this.getMeasure(new position_util_pb_1.MeasureMapEntry().setMeasure(measure));
    };
    Position.prototype.getMeasure = function (measureToGet) {
        for (var _i = 0, _a = this.proto.getMeasuresList(); _i < _a.length; _i++) {
            var tmpMeasure = _a[_i];
            if (tmpMeasure.getMeasure() === measureToGet.getMeasure()) {
                return serialization_1.ProtoSerializationUtil.deserialize(tmpMeasure.getMeasureDecimalValue());
            }
        }
        throw new Error("Could not find measure in position");
    };
    Position.prototype.getFieldDisplay = function (fieldToGet) {
        var fieldValue = this.getField(fieldToGet);
        return fieldValue.toString();
    };
    Position.prototype.getMeasures = function () {
        return this.proto.getMeasuresList();
    };
    Position.prototype.getFields = function () {
        return this.proto.getFieldsList();
    };
    Position.prototype.toString = function () {
        var output = "";
        for (var _i = 0, _a = this.getFields(); _i < _a.length; _i++) {
            var field = _a[_i];
            output += "".concat(field_pb_1.FieldProto[field.getField()], ",");
            output += "".concat(this.getFieldDisplay(field), ";");
        }
        for (var _b = 0, _c = this.getMeasures(); _b < _c.length; _b++) {
            var measure = _c[_b];
            output += "".concat(measure_pb_1.MeasureProto[measure.getMeasure()], ",");
            var tmp = this.getMeasure(measure);
            output += "".concat(tmp.toString(), ";");
        }
        return output;
    };
    // private static wrapStringToAny(myString: string): Any {
    //     const myAny = new Any();
    //     myAny.pack(wrappers.StringValue.create({ value: myString }));
    //     return myAny;
    // }
    // private static packField(fieldToPack: any): Any {
    //     const myAny = new Any();
    //     myAny.pack(fieldToPack);
    //     return myAny;
    // }
    Position.unpackField = function (fieldToUnpack) {
        switch (fieldToUnpack.getField()) {
            case field_pb_1.FieldProto.PORTFOLIO_ID:
            case field_pb_1.FieldProto.SECURITY_ID:
            case field_pb_1.FieldProto.ID:
                return uuid_pb_1.UUIDProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
            case field_pb_1.FieldProto.AS_OF:
                return local_timestamp_pb_1.LocalTimestampProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
            case field_pb_1.FieldProto.TRADE_DATE:
            case field_pb_1.FieldProto.MATURITY_DATE:
            case field_pb_1.FieldProto.ISSUE_DATE:
            case field_pb_1.FieldProto.SETTLEMENT_DATE:
            case field_pb_1.FieldProto.TAX_LOT_OPEN_DATE:
            case field_pb_1.FieldProto.TAX_LOT_CLOSE_DATE:
                return local_date_pb_1.LocalDateProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
            case field_pb_1.FieldProto.IDENTIFIER:
                return identifier_pb_1.IdentifierProto.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
            case field_pb_1.FieldProto.TRANSACTION_TYPE:
            case field_pb_1.FieldProto.POSITION_STATUS:
                // Assuming ProtoEnum is properly defined elsewhere
                // const descriptor = FieldProto.DESCRIPTOR.valuesByNumber[fieldToUnpack.field];
                return null; //new ProtoEnum(descriptor, fieldToUnpack.enumValue);
            case field_pb_1.FieldProto.PORTFOLIO_NAME:
            case field_pb_1.FieldProto.SECURITY_DESCRIPTION:
            case field_pb_1.FieldProto.PRODUCT_TYPE:
            case field_pb_1.FieldProto.ASSET_CLASS:
                return wrappers_pb_1.StringValue.deserializeBinary(fieldToUnpack.getFieldValuePacked().getValue());
            case field_pb_1.FieldProto.PORTFOLIO:
                return fieldToUnpack.getFieldValuePacked();
            case field_pb_1.FieldProto.SECURITY:
                return fieldToUnpack.getFieldValuePacked();
            default:
                throw new Error("Field not found. Could not unpack ".concat(field_pb_1.FieldProto[fieldToUnpack.getField()]));
        }
    };
    return Position;
}());
exports.Position = Position;
//# sourceMappingURL=position.js.map