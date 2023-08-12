"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var datetime_1 = require("../utils/datetime");
var uuid_1 = require("../utils/uuid");
var Security = /** @class */ (function () {
    function Security(proto) {
        this.proto = proto;
    }
    Security.prototype.toString = function () {
        return "ID[".concat(this.getID().toString(), "], ").concat(this.getSecurityID(), "[").concat(this.getIssuerName(), "]");
    };
    Security.prototype.getFields = function () {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    };
    Security.prototype.getField = function (field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.SECURITY_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.ASSET_CLASS:
                return this.getAssetClass();
            case field_pb_1.FieldProto.PRODUCT_CLASS:
                return this.getProductClass();
            case field_pb_1.FieldProto.PRODUCT_TYPE:
                return this.getProductType();
            case field_pb_1.FieldProto.IDENTIFIER:
                return this.getSecurityID();
            case field_pb_1.FieldProto.TENOR:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
                throw new Error('Not implemented yet');
            case field_pb_1.FieldProto.MATURITY_DATE:
                throw new Error('Not implemented yet');
            default:
                throw new Error("Field not mapped in Security wrapper: ".concat(field));
        }
    };
    Security.prototype.getID = function () {
        return uuid_1.UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    };
    Security.prototype.getAsOf = function () {
        return new datetime_1.ZonedDateTime(this.proto.getAsOf());
    };
    Security.prototype.getAssetClass = function () {
        return this.proto.getAssetClass();
    };
    Security.prototype.getProductClass = function () {
        throw new Error('Not implemented yet. See Java implementation for reference');
    };
    Security.prototype.getProductType = function () {
        throw new Error('Not implemented yet. See Java implementation for reference');
    };
    Security.prototype.getSecurityID = function () {
        // const id: IdentifierProto = this.proto.identifier;
        return this.proto.getIdentifier(); // Assuming you've implemented the Identifier class
    };
    Security.prototype.getIssueDate = function () {
        var date = this.proto.getIssueDate();
        return new Date(date.getYear(), date.getMonth(), date.getDay());
    };
    Security.prototype.getMaturityDate = function () {
        var date = this.proto.getMaturityDate();
        return new Date(date.getYear(), date.getMonth(), date.getDay());
    };
    Security.prototype.getIssuerName = function () {
        return this.proto.getIssuerName();
    };
    Security.prototype.equals = function (other) {
        if (other instanceof Security) {
            return this.getID().equals(other.getID());
        }
        else {
            return false;
        }
    };
    return Security;
}());
exports.default = Security;
//# sourceMappingURL=security.js.map