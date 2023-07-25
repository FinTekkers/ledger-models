const { assert } = require('console');
const { UUIDProto } = require('./node/fintekkers/models/util/uuid_pb');
const uuid = require('uuid');

class UUID {
    constructor(bytes) {
      this.bytes = bytes;
    }

    to_string() {
        const buffer = Buffer.from(this.bytes);
        return uuid.stringify(buffer);
    }
      
    to_bytes() {
        return this.bytes;
      }

    to_uuid_proto() {
        const id_proto = new UUIDProto();
        id_proto.setRawUuid(new Uint8Array(this.to_bytes()));
        return id_proto;
    }
  }

function randomUUID() {
    const random = uuid.v4();
    return new UUID(uuidStringToBytes(random));
};

function uuidStringToBytes(uuid) {
    // Remove hyphens and convert to a continuous hexadecimal string
    const hexString = uuid.replace(/-/g, '');
  
    // Split the continuous hexadecimal string into two-character chunks
    const hexChunks = hexString.match(/.{1,2}/g);
  
    // Convert each two-character chunk to a byte (number)
    const bytes = hexChunks.map(chunk => parseInt(chunk, 16));
  
    return bytes;
}

// Static function to create a new UUID objects
UUID.random = randomUUID;
UUID.uuidStringToBytes = uuidStringToBytes;

const test_uuid_bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
const test_uuid = new UUID(test_uuid_bytes);
assert (test_uuid.to_string() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
const test_uuid_bytes_copy = UUID.uuidStringToBytes(test_uuid.to_string());

assert (test_uuid_bytes.length === test_uuid_bytes_copy.length && test_uuid_bytes.every((value, index) => value === test_uuid_bytes_copy[index]));

assert (UUID.random().to_string().length == 36);

exports.UUID = UUID;