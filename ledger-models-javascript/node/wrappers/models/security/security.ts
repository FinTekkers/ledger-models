import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { ProtoSerializationUtil } from '../utils/serialization';
import { LocalDate } from "../utils/date";
import { SecurityTypeProto } from "../../../fintekkers/models/security/security_type_pb";

class Security {
  proto: SecurityProto;

  constructor(proto: SecurityProto) {
    this.proto = proto;
  }

  toString(): string {
    return `ID[${this.getID().toString()}], ${this.getSecurityID()}[${this.getIssuerName()}]`;
  }

  getFields(): FieldProto[] {
    return [FieldProto.ID, FieldProto.SECURITY_ID, FieldProto.AS_OF, FieldProto.ASSET_CLASS, FieldProto.IDENTIFIER];
  }

  getField(field: FieldProto): any {
    switch (field) {
      case FieldProto.ID:
      case FieldProto.SECURITY_ID:
        return this.getID();
      case FieldProto.AS_OF:
        return this.getAsOf();
      case FieldProto.ASSET_CLASS:
        return this.getAssetClass();
      case FieldProto.PRODUCT_CLASS:
        return this.getProductClass();
      case FieldProto.PRODUCT_TYPE:
        return this.getProductType();
      case FieldProto.IDENTIFIER:
        return this.getSecurityID();
      case FieldProto.TENOR:
      case FieldProto.ADJUSTED_TENOR:
        throw new Error('Not implemented yet');
      case FieldProto.MATURITY_DATE:
        return this.getMaturityDate();
      case FieldProto.ISSUE_DATE:
        return this.getIssueDate();
      default:
        throw new Error(`Field not mapped in Security wrapper: ${field}`);
    }
  }

  getID(): UUID {
    const uuid = this.proto.getUuid();
    if (!uuid) throw new Error("UUID is required");
    return UUID.fromU8Array(uuid.getRawUuid_asU8());
  }

  getAsOf(): ZonedDateTime {
    const asOf = this.proto.getAsOf();
    if (!asOf) throw new Error("AsOf is required");
    return new ZonedDateTime(asOf);
  }

  getAssetClass(): string {
    return this.proto.getAssetClass();
  }

  getProductClass(): string {
    throw new Error('Not implemented yet. See Java implementation for reference');
  }

  getProductType(): string {
    let securityType = this.proto.getSecurityType();
    let securityTypeString = SecurityTypeProto[securityType];;
    return securityTypeString;
  }

  getSecurityID(): IdentifierProto {
    const identifier = this.proto.getIdentifier();
    if (!identifier) throw new Error("Identifier is required");
    return identifier;
  }

  getIssueDate(): LocalDate {
    const date = this.proto.getIssueDate();
    if (!date) throw new Error("Issue date is required");
    return new LocalDate(date);
  }

  getMaturityDate(): LocalDate {
    const date = this.proto.getMaturityDate();
    if (!date) throw new Error("Maturity date is required");
    return new LocalDate(date);
  }

  getIssuerName(): string {
    return this.proto.getIssuerName();
  }

  equals(other: Security): boolean {
    if (other instanceof Security) {
      return this.getID().equals(other.getID());
    } else {
      return false;
    }
  }
}

export default Security;
