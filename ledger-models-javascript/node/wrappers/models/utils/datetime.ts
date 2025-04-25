import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { DateTime } from 'luxon';

class ZonedDateTime {
  private proto: LocalTimestampProto;

  constructor(proto: LocalTimestampProto) {
    this.proto = proto;
  }

  getTimezone(): string {
    return this.proto.getTimeZone();
  }

  getSeconds(): number {
    const timestamp = this.proto.getTimestamp();
    if (!timestamp) throw new Error("Timestamp is required");
    return timestamp.getSeconds();
  }

  getNanoSeconds(): number {
    const timestamp = this.proto.getTimestamp();
    if (!timestamp) throw new Error("Timestamp is required");
    return timestamp.getNanos();
  }

  toDateTime(): DateTime {
    const timestamp = this.proto.getTimestamp();
    if (!timestamp) throw new Error("Timestamp is required");
    const unixTimestampSeconds = timestamp.getSeconds();
    const nanoseconds = timestamp.getNanos();

    let dateTime = DateTime.fromSeconds(unixTimestampSeconds, { zone: this.proto.getTimeZone() });

    // Manually add nanoseconds using the set method
    dateTime = dateTime.set({ millisecond: Math.floor(nanoseconds / 1000000) });
    return dateTime;
  }

  toString(): string {
    const dateTime = this.toDateTime();
    const date = new Date(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour, dateTime.minute, dateTime.second);
    return date.toISOString().slice(0, 19).replace(/-/g, '/').replace('T', ' ');
  }

  toProto(): LocalTimestampProto {
    return this.proto;
  }

  static now(): ZonedDateTime {
    // Get the current time in milliseconds since January 1, 1970 (Unix timestamp)
    const currentTimeMillis = Date.now();

    // Convert milliseconds to seconds and nanoseconds
    const seconds = Math.floor(currentTimeMillis / 1000);
    const nanos = (currentTimeMillis % 1000) * 1e6; // 1 millisecond = 1e6 nanoseconds

    // Create a new Timestamp object with the current time
    const timestamp = new Timestamp();
    timestamp.setSeconds(seconds);
    timestamp.setNanos(nanos);

    const localTimestamp = new LocalTimestampProto();
    localTimestamp.setTimeZone('America/New_York');
    localTimestamp.setTimestamp(timestamp);

    return new ZonedDateTime(localTimestamp);
  }
}

export { ZonedDateTime };
