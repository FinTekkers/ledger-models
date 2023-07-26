import { assert } from 'console';
import { UUIDProto } from '../fintekkers/models/util/uuid_pb';
import * as uuid from 'uuid';

class UUID {
  private bytes: number[];

  constructor(bytes: number[]) {
    this.bytes = bytes;
  }

  to_string(): string {
    const buffer = Buffer.from(this.bytes);
    return uuid.stringify(buffer);
  }

  to_bytes(): number[] {
    return this.bytes;
  }

  to_uuid_proto(): UUIDProto {
    const id_proto = new UUIDProto();
    id_proto.setRawUuid(new Uint8Array(this.to_bytes()));
    return id_proto;
  }

  static random(): UUID {
    const random = uuid.v4();
    return new UUID(UUID.uuidStringToBytes(random));
  }

  static uuidStringToBytes(uuidString: string): number[] {
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
assert(test_uuid.to_string() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
const test_uuid_bytes_copy = UUID.uuidStringToBytes(test_uuid.to_string());

assert(
  test_uuid_bytes.length === test_uuid_bytes_copy.length &&
    test_uuid_bytes.every((value, index) => value === test_uuid_bytes_copy[index])
);

assert(UUID.random().to_string().length == 36);

export { UUID };
