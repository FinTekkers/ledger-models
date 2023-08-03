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
        return "ID[".concat(this.get_id().toString(), "], ").concat(this.get_security_id(), "[").concat(this.proto.getIssuerName(), "]");
    };
    Security.prototype.get_fields = function () {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    };
    Security.prototype.get_field = function (field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.SECURITY_ID:
                return this.get_id();
            case field_pb_1.FieldProto.AS_OF:
                return this.get_as_of();
            case field_pb_1.FieldProto.ASSET_CLASS:
                return this.get_asset_class();
            case field_pb_1.FieldProto.PRODUCT_CLASS:
                return this.get_product_class();
            case field_pb_1.FieldProto.PRODUCT_TYPE:
                return this.get_product_type();
            case field_pb_1.FieldProto.IDENTIFIER:
                return this.get_security_id();
            case field_pb_1.FieldProto.TENOR:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
                throw new Error('Not implemented yet');
            case field_pb_1.FieldProto.MATURITY_DATE:
                throw new Error('Not implemented yet');
            default:
                throw new Error("Field not mapped in Security wrapper: ".concat(field));
        }
    };
    Security.prototype.get_id = function () {
        return uuid_1.UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    };
    Security.prototype.get_as_of = function () {
        return new datetime_1.ZonedDateTime(this.proto.getAsOf());
    };
    Security.prototype.get_asset_class = function () {
        return this.proto.getAssetClass();
    };
    Security.prototype.get_product_class = function () {
        throw new Error('Not implemented yet. See Java implementation for reference');
    };
    Security.prototype.get_product_type = function () {
        throw new Error('Not implemented yet. See Java implementation for reference');
    };
    Security.prototype.get_security_id = function () {
        // const id: IdentifierProto = this.proto.identifier;
        return this.proto.getIdentifier(); // Assuming you've implemented the Identifier class
    };
    Security.prototype.get_issue_date = function () {
        var date = this.proto.getIssueDate();
        return new Date(date.getYear(), date.getMonth(), date.getDay());
    };
    Security.prototype.get_maturity_date = function () {
        var date = this.proto.getMaturityDate();
        return new Date(date.getYear(), date.getMonth(), date.getDay());
    };
    Security.prototype.equals = function (other) {
        if (other instanceof Security) {
            return this.get_id().equals(other.get_id());
        }
        else {
            return false;
        }
    };
    return Security;
}());
exports.default = Security;
//# sourceMappingURL=security.js.map