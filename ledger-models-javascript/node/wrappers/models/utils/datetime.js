import { assert } from 'console';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { DateTime } from 'luxon';
var ZonedDateTime = /** @class */ (function () {
    function ZonedDateTime(proto) {
        this.proto = proto;
    }
    ZonedDateTime.prototype.to_datetime = function () {
        // Creating a DateTime object with the current date and time in a specific time zone (e.g., 'America/New_York')
        var unixTimestampSeconds = this.proto.getTimestamp().getSeconds();
        var nanoseconds = this.proto.getTimestamp().getNanos();
        var dateTime = DateTime.fromSeconds(unixTimestampSeconds, { zone: this.proto.getTimeZone() });
        // Manually add nanoseconds using the set method
        dateTime = dateTime.set({ millisecond: Math.floor(nanoseconds / 1000000) });
        return dateTime;
    };
    ZonedDateTime.prototype.toString = function () {
        return this.to_datetime().toString();
    };
    ZonedDateTime.prototype.to_date_proto = function () {
        return this.proto;
    };
    ZonedDateTime.now = function () {
        // Get the current time in milliseconds since January 1, 1970 (Unix timestamp)
        var currentTimeMillis = Date.now();
        // Convert milliseconds to seconds and nanoseconds
        var seconds = Math.floor(currentTimeMillis / 1000);
        var nanos = (currentTimeMillis % 1000) * 1e6; // 1 millisecond = 1e6 nanoseconds
        // Create a new Timestamp object with the current time
        var timestamp = new Timestamp();
        timestamp.setSeconds(seconds);
        timestamp.setNanos(nanos);
        var localTimestamp = new LocalTimestampProto();
        localTimestamp.setTimeZone('America/New_York');
        localTimestamp.setTimestamp(timestamp);
        return new ZonedDateTime(localTimestamp);
    };
    return ZonedDateTime;
}());
// function createTimestampWithCurrentTime(): ZonedDateTime {
//   // Get the current time in milliseconds since January 1, 1970 (Unix timestamp)
//   const currentTimeMillis = Date.now();
//   // Convert milliseconds to seconds and nanoseconds
//   const seconds = Math.floor(currentTimeMillis / 1000);
//   const nanos = (currentTimeMillis % 1000) * 1e6; // 1 millisecond = 1e6 nanoseconds
//   // Create a new Timestamp object with the current time
//   const timestamp = new Timestamp();
//   timestamp.setSeconds(seconds);
//   timestamp.setNanos(nanos);
//   const localTimestamp = new LocalTimestampProto();
//   localTimestamp.setTimeZone('America/New_York');
//   localTimestamp.setTimestamp(timestamp);
//   return new ZonedDateTime(localTimestamp);
// }
// ZonedDateTime.now = createTimestampWithCurrentTime;
var now = ZonedDateTime.now();
assert(now.to_datetime().toString() === now.toString());
export { ZonedDateTime };
//# sourceMappingURL=datetime.js.map