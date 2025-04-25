import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import * as uuid from 'uuid';

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex: string[] = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

class UUID {
  private bytes: number[];


  constructor(bytes: number[]) {
    this.bytes = bytes;
  }

  toString(): string {
    const arr: Uint8Array = new Uint8Array(this.bytes);
    const offset = 0;
    const str = byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
    return str; //uuid.stringify(byteArray);
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
