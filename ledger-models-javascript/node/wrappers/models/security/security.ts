import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";

class Security {
  proto: SecurityProto;

  constructor(proto: SecurityProto) {
    this.proto = proto;
  }

  toString(): string {
    return `ID[${this.get_id().toString()}], ${this.get_security_id()}[${this.proto.getIssuerName()}]`;
  }

  get_fields(): FieldProto[] {
    return [FieldProto.ID, FieldProto.SECURITY_ID, FieldProto.AS_OF, FieldProto.ASSET_CLASS, FieldProto.IDENTIFIER];
  }

  get_field(field: FieldProto): any {
    switch (field) {
      case FieldProto.ID:
      case FieldProto.SECURITY_ID:
        return this.get_id();
      case FieldProto.AS_OF:
        return this.get_as_of();
      case FieldProto.ASSET_CLASS:
        return this.get_asset_class();
      case FieldProto.PRODUCT_CLASS:
        return this.get_product_class();
      case FieldProto.PRODUCT_TYPE:
        return this.get_product_type();
      case FieldProto.IDENTIFIER:
        return this.get_security_id();
      case FieldProto.TENOR:
      case FieldProto.ADJUSTED_TENOR:
        throw new Error('Not implemented yet');
      case FieldProto.MATURITY_DATE:
        throw new Error('Not implemented yet');
      default:
        throw new Error(`Field not mapped in Security wrapper: ${field}`);
    }
  }

  get_id(): UUID {
    return UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
  }

  get_as_of(): ZonedDateTime {
    return new ZonedDateTime(this.proto.getAsOf());
  }

  get_asset_class(): string {
    return this.proto.getAssetClass();
  }

  get_product_class(): string {
    throw new Error('Not implemented yet. See Java implementation for reference');
  }

  get_product_type(): any {
    throw new Error('Not implemented yet. See Java implementation for reference');
  }

  get_security_id(): IdentifierProto {
    // const id: IdentifierProto = this.proto.identifier;
    return this.proto.getIdentifier(); // Assuming you've implemented the Identifier class
  }

  get_issue_date(): Date {
    const date = this.proto.getIssueDate();
    return new Date(date.getYear(), date.getMonth(), date.getDay());
  }

  get_maturity_date(): Date {
    const date = this.proto.getMaturityDate();
    return new Date(date.getYear(), date.getMonth(), date.getDay());
  }

  equals(other: Security): boolean {
    if (other instanceof Security) {
      return this.get_id().equals(other.get_id());
    } else {
      return false;
    }
  }
}

export default Security;
