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

const test_uuid_bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
const test_uuid = new UUID(test_uuid_bytes);
assert(test_uuid.toString() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
const test_uuid_bytes_copy = UUID.fromString(test_uuid.toString());

assert(
  test_uuid_bytes.length === test_uuid_bytes_copy.length &&
  test_uuid_bytes.every((value, index) => value === test_uuid_bytes_copy[index])
);

assert(UUID.random().toString().length == 36);

export { UUID };
