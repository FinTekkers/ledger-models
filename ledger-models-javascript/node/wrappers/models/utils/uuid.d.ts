import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
declare class UUID {
    private bytes;
    constructor(bytes: number[]);
    toString(): string;
    toBytes(): number[];
    toUUIDProto(): UUIDProto;
    equals(other: UUID): boolean;
    static random(): UUID;
    static fromU8Array(uint8Array: Uint8Array): UUID;
    static fromString(uuidString: string): number[];
}
export { UUID };
