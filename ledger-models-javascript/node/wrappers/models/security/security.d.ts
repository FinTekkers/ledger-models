import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
declare class Security {
    proto: SecurityProto;
    constructor(proto: SecurityProto);
    toString(): string;
    getFields(): FieldProto[];
    getField(field: FieldProto): any;
    getID(): UUID;
    getAsOf(): ZonedDateTime;
    getAssetClass(): string;
    getProductClass(): string;
    getProductType(): any;
    getSecurityID(): IdentifierProto;
    getIssueDate(): Date;
    getMaturityDate(): Date;
    getIssuerName(): string;
    equals(other: Security): boolean;
}
export default Security;
