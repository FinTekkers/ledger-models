"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const serialization_1 = require("../utils/serialization");
class Security {
    constructor(proto) {
        this.proto = proto;
    }
    toString() {
        return `ID[${this.getID().toString()}], ${this.getSecurityID()}[${this.getIssuerName()}]`;
    }
    getFields() {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    }
    getField(field) {
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
                throw new Error(`Field not mapped in Security wrapper: ${field}`);
        }
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error("UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error("AsOf is required");
        return new datetime_1.ZonedDateTime(asOf);
    }
    getAssetClass() {
        return this.proto.getAssetClass();
    }
    getProductClass() {
        throw new Error('Not implemented yet. See Java implementation for reference');
    }
    getProductType() {
        throw new Error('Not implemented yet. See Java implementation for reference');
    }
    getSecurityID() {
        const identifier = this.proto.getIdentifier();
        if (!identifier)
            throw new Error("Identifier is required");
        return identifier;
    }
    getIssueDate() {
        const date = this.proto.getIssueDate();
        if (!date)
            throw new Error("IssueDate is required");
        return serialization_1.ProtoSerializationUtil.deserialize(date);
    }
    getMaturityDate() {
        const date = this.proto.getMaturityDate();
        if (!date)
            throw new Error("MaturityDate is required");
        return serialization_1.ProtoSerializationUtil.deserialize(date);
    }
    getIssuerName() {
        return this.proto.getIssuerName();
    }
    equals(other) {
        if (other instanceof Security) {
            return this.getID().equals(other.getID());
        }
        else {
            return false;
        }
    }
}
exports.default = Security;
//# sourceMappingURL=security.js.map