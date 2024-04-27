import assert = require('assert');
import { UUID } from './uuid';

test('test packing/unpacking string', () => {
  testString();
});

function testString() {
  const test_uuid_bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
  const test_uuid = new UUID(test_uuid_bytes);
  assert(test_uuid.toString() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
  const test_uuid_bytes_copy = UUID.fromString(test_uuid.toString());

  assert(
    test_uuid_bytes.length === test_uuid_bytes_copy.length &&
    test_uuid_bytes.every((value, index) => value === test_uuid_bytes_copy[index])
  );

  assert(UUID.random().toString().length == 36);
}

