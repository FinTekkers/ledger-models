import { assert } from 'console';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import * as uuid from 'uuid';

class UUID {
  private bytes: number[];

  constructor(bytes: number[]) {
    this.bytes = bytes;
  }

  toString(): string {
    const byteArray: Uint8Array = new Uint8Array(this.bytes);
    return uuid.stringify(byteArray);
  }

  toBytes(): number[] {
    return this.bytes;
  }

  toUUIDProto(): UUIDProto {
    const id_proto = new UUIDProto();
    id_proto.setRawUuid(new Uint8Array(this.toBytes()));
    return id_proto;
  }

  equals(other: UUID): boolean {
    return this.toBytes() === other.toBytes();
  }

  static random(): UUID {
    const random = uuid.v4();
    return new UUID(UUID.fromString(random));
  }

  static fromU8Array(uint8Array: Uint8Array): UUID {
    const array: number[] = Array.from(uint8Array, byte => byte);
    return new UUID(array);
  }

  static fromString(uuidString: string): number[] {
    // Remove hyphens and convert to a continuous hexadecimal string
    const hexString = uuidString.replace(/-/g, '');

    // Split the continuous hexadecimal string into two-character chunks
    const hexChunks = hexString.match(/.{1,2}/g);

    // Convert each two-character chunk to a byte (number)
    const bytes = hexChunks!.map((chunk) => parseInt(chunk, 16));

    return bytes;
  }
}

export { UUID };
