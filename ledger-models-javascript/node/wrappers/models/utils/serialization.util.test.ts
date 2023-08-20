import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { pack, unpack } from './serialization.util';
import { ZonedDateTime } from './datetime';

import assert = require('assert');

test('test packing/unpacking string', () => {
  testString();
});

test('test packing/unpacking date', () => {
  testDate();
});

test('test packing/unpacking timestamp', () => {
  testTimestamp();
});

function testTimestamp() {
  const now = ZonedDateTime.now();

  const packedNow: Any = pack(now);
  const unpackedNow: ZonedDateTime = unpack(packedNow);

  assert.equal(now.getTimezone(), unpackedNow.getTimezone(), "Timezone doesn't match");
  assert.equal(now.getSeconds(), unpackedNow.getSeconds(), "Seconds do not match");
  assert.equal(now.getNanoSeconds(), unpackedNow.getNanoSeconds(), "Nanoseconds do not match");
}

function testDate() {
  const testDate = new Date()
  testDate.setHours(0, 0, 0, 0);

  const packedDate: Any = pack(testDate);
  const unpackedDate: Date = unpack(packedDate);
  assert.equal(unpackedDate.getTime(), testDate.getTime(), "Date packing/unpacking failed");
}

function testString() {
  const testString = "Hello";

  const packedString: Any = pack(testString);
  const unpackedString: String = unpack(packedString);
  assert.equal(unpackedString, testString, "String packing/unpacking failed");
}

