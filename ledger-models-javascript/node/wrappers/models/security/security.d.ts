import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { IdentifierProto } from "../../../fintekkers/models/security/identifier/identifier_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { LocalDate } from "../utils/date";
declare class Security {
    proto: SecurityProto;
    constructor(proto: SecurityProto);
    /**
     * Factory method to create the appropriate Security subclass based on security type
     */
    static create(proto: SecurityProto): Security;
    toString(): string;
    getFields(): FieldProto[];
    getField(field: FieldProto): any;
    getID(): UUID;
    getAsOf(): ZonedDateTime;
    getAssetClass(): string;
    getProductClass(): string;
    getProductType(): string;
    getSecurityID(): IdentifierProto;
    getIssueDate(): LocalDate;
    getMaturityDate(): LocalDate;
    getIssuerName(): string;
    equals(other: Security): boolean;
}
export default Security;
