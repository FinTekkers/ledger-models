import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
declare class UUID {
    private bytes;
    constructor(bytes: number[]);
    toString(): string;
    toBytes(): number[];
    toUUIDProto(): UUIDProto;
    equals(other: UUID): boolean;
    static random(): UUID;
    /**
     * Throws ModelValidationError naming `raw_uuid` when the input is neither
     * empty nor exactly 16 bytes (LM-334). Empty is accepted as before; prefer
     * fromUUIDProto, which reads empty as unset.
     */
    static fromU8Array(uint8Array: Uint8Array): UUID;
    /**
     * Decodes a UUIDProto (LM-334). Unset or empty raw_uuid is undefined. Any
     * other length but 16 throws ModelValidationError naming `raw_uuid`.
     */
    static fromUUIDProto(proto?: UUIDProto): UUID | undefined;
    static fromString(uuidString: string): number[];
}
export { UUID };
