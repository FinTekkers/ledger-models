"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
//Models
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_pb_1 = require("../../../fintekkers/models/position/position_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const portfolio_1 = __importDefault(require("../portfolio/portfolio"));
const security_1 = __importDefault(require("../security/security"));
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
const serialization_1 = require("../utils/serialization");
const protoEnum_1 = require("../utils/protoEnum");
const field_1 = require("./field");
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const transaction_1 = __importDefault(require("../transaction/transaction"));
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const strategy_pb_1 = require("../../../fintekkers/models/strategy/strategy_pb");
const tenor_pb_1 = require("../../../fintekkers/models/security/tenor_pb");
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const wrappers_pb_1 = require("google-protobuf/google/protobuf/wrappers_pb");
class Position {
    constructor(positionProto) {
        this.proto = positionProto;
    }
    /*** */
    toJSON() {
        return {
            proto: this.proto.serializeBinary(), // Serialize Age object to binary buffer
        };
    }
    /**
     * Experimental impelementaiton
     * @param binary An array which is the raw binary of the proto object
     * @returns A Position object with the deserialized binary inside it
     */
    static fromJSON(json) {
        return new Position(position_pb_1.PositionProto.deserializeBinary(json['proto']));
    }
    getFieldValue(field) {
        return this.getField(new position_util_pb_1.FieldMapEntry().setField(field));
    }
    getField(fieldToGet) {
        for (const tmpField of this.proto.getFieldsList()) {
            if (tmpField.getField() === fieldToGet.getField()) {
                if (tmpField.getStringValue() !== undefined && tmpField.getStringValue().length > 0) {
                    return tmpField.getStringValue();
                }
                if (tmpField.getEnumValue() > 0) {
                    let fieldName = new field_1.Field(fieldToGet.getField()).getName();
                    let proto = protoEnum_1.ProtoEnum.fromEnumName(fieldName, tmpField.getEnumValue());
                    return proto;
                }
                else if (tmpField.getEnumValue() == 0 && !tmpField.getStringValue() &&
                    !tmpField.getFieldValuePacked()) {
                    console.log("Warning: this position has an undefined enum value, which should be fixed in upstream data");
                    let fieldName = new field_1.Field(fieldToGet.getField()).getName();
                    let proto = protoEnum_1.ProtoEnum.fromEnumName(fieldName, 0);
                    return proto;
                }
                const unpackedValue = Position.unpackField(tmpField);
                if (field_pb_1.FieldProto.PRICE == fieldToGet.getField()
                    || field_pb_1.FieldProto.TENOR == fieldToGet.getField()) {
                    return unpackedValue; //instanceof PriceProto || TenorProto
                }
                if (field_pb_1.FieldProto.SECURITY == fieldToGet.getField()) {
                    return security_1.default.create(unpackedValue);
                }
                if (field_pb_1.FieldProto.PORTFOLIO == fieldToGet.getField()) {
                    return new portfolio_1.default(unpackedValue);
                }
                return serialization_1.ProtoSerializationUtil.deserialize(unpackedValue);
            }
        }
        throw new Error("Could not find field in position");
    }
    getMeasureValue(measure) {
        return this.getMeasure(new position_util_pb_1.MeasureMapEntry().setMeasure(measure));
    }
    getMeasure(measureToGet) {
        for (const tmpMeasure of this.proto.getMeasuresList()) {
            if (tmpMeasure.getMeasure() === measureToGet.getMeasure()) {
                return serialization_1.ProtoSerializationUtil.deserialize(tmpMeasure.getMeasureDecimalValue());
            }
        }
        throw new Error("Could not find measure in position");
    }
    getFieldDisplay(fieldToGet) {
        const value = this.getField(fieldToGet);
        switch (typeof value) {
            case 'string':
                return value;
            case 'number':
                return "" + value;
            case 'object':
                if (value instanceof security_1.default) {
                    return value.toString();
                }
                else if (value instanceof portfolio_1.default) {
                    return value.getPortfolioName();
                }
                else if (value instanceof price_pb_1.PriceProto) {
                    const uuid = value.getUuid();
                    if (!uuid)
                        throw new Error("Price UUID is required");
                    return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8()).toString();
                }
                else if (value instanceof transaction_1.default) {
                    return value.toString();
                }
                else if (value instanceof uuid_1.UUID) {
                    return value.toString();
                }
                else if (value instanceof Date) {
                    return `${value.getFullYear()}/${value.getMonth()}/${value.getDay()}`;
                }
                else if (value instanceof datetime_1.ZonedDateTime) {
                    const tmpDateTime = value.toDateTime();
                    return tmpDateTime.toFormat('yyyy/MM/dd hh:mm:ss');
                }
                else if (value instanceof protoEnum_1.ProtoEnum) {
                    return value.toString();
                }
                break;
            default:
                return "Can't display this field: " + fieldToGet.getField();
        }
        return "Unknown field type";
    }
    getMeasures() {
        return this.proto.getMeasuresList();
    }
    getFields() {
        return this.proto.getFieldsList();
    }
    toString() {
        let output = "";
        for (const field of this.getFields()) {
            output += `${field_pb_1.FieldProto[field.getField()]},`;
            output += `${this.getFieldDisplay(field)};`;
        }
        for (const measure of this.getMeasures()) {
            output += `${measure_pb_1.MeasureProto[measure.getMeasure()]},`;
            const tmp = this.getMeasure(measure);
            output += `${tmp.toString()};`;
        }
        return output;
    }
    static unpackField(fieldToUnpack) {
        const packedValue = fieldToUnpack.getFieldValuePacked();
        if (!packedValue)
            throw new Error("Field value is required");
        const binaryValue = packedValue.getValue();
        switch (fieldToUnpack.getField()) {
            case field_pb_1.FieldProto.PORTFOLIO_ID:
            case field_pb_1.FieldProto.SECURITY_ID:
            case field_pb_1.FieldProto.PRICE_ID:
            case field_pb_1.FieldProto.ID:
                return uuid_pb_1.UUIDProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.AS_OF:
                return local_timestamp_pb_1.LocalTimestampProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.TRADE_DATE:
            case field_pb_1.FieldProto.MATURITY_DATE:
            case field_pb_1.FieldProto.ISSUE_DATE:
            case field_pb_1.FieldProto.SETTLEMENT_DATE:
            case field_pb_1.FieldProto.TAX_LOT_OPEN_DATE:
            case field_pb_1.FieldProto.TAX_LOT_CLOSE_DATE:
            case field_pb_1.FieldProto.EFFECTIVE_DATE:
                return local_date_pb_1.LocalDateProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.IDENTIFIER:
                return identifier_pb_1.IdentifierProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.STRATEGY:
                return strategy_pb_1.StrategyProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.TENOR:
                return tenor_pb_1.TenorProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.PRICE:
                return price_pb_1.PriceProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.TRANSACTION_TYPE:
            case field_pb_1.FieldProto.POSITION_STATUS:
                return fieldToUnpack;
            case field_pb_1.FieldProto.PORTFOLIO_NAME:
            case field_pb_1.FieldProto.SECURITY_DESCRIPTION:
            case field_pb_1.FieldProto.SECURITY_ISSUER_NAME:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
            case field_pb_1.FieldProto.PRODUCT_TYPE:
            case field_pb_1.FieldProto.PRODUCT_CLASS:
            case field_pb_1.FieldProto.ASSET_CLASS:
                return wrappers_pb_1.StringValue.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.PORTFOLIO:
                return portfolio_pb_1.PortfolioProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.SECURITY:
            case field_pb_1.FieldProto.CASH_IMPACT_SECURITY:
                return security_pb_1.SecurityProto.deserializeBinary(binaryValue);
            case field_pb_1.FieldProto.IS_CANCELLED:
                console.log("Need to check that IS_CANCELLED IS SUPPORTED CORRECTLY");
                return packedValue;
            default:
                throw new Error(`Field not found. Could not unpack ${field_pb_1.FieldProto[fieldToUnpack.getField()]}. Mapping missing`);
        }
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map