"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZonedDateTime = void 0;
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const luxon_1 = require("luxon");
class ZonedDateTime {
    constructor(proto) {
        this.proto = proto;
    }
    getTimezone() {
        return this.proto.getTimeZone();
    }
    getSeconds() {
        const timestamp = this.proto.getTimestamp();
        if (!timestamp)
            throw new Error("Timestamp is required");
        return timestamp.getSeconds();
    }
    getNanoSeconds() {
        const timestamp = this.proto.getTimestamp();
        if (!timestamp)
            throw new Error("Timestamp is required");
        return timestamp.getNanos();
    }
    toDateTime() {
        const timestamp = this.proto.getTimestamp();
        if (!timestamp)
            throw new Error("Timestamp is required");
        const unixTimestampSeconds = timestamp.getSeconds();
        const nanoseconds = timestamp.getNanos();
        let dateTime = luxon_1.DateTime.fromSeconds(unixTimestampSeconds, { zone: this.proto.getTimeZone() });
        // Manually add nanoseconds using the set method
        dateTime = dateTime.set({ millisecond: Math.floor(nanoseconds / 1000000) });
        return dateTime;
    }
    toString() {
        const dateTime = this.toDateTime();
        const date = new Date(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour, dateTime.minute, dateTime.second);
        return date.toISOString().slice(0, 19).replace(/-/g, '/').replace('T', ' ');
    }
    toProto() {
        return this.proto;
    }
    static now() {
        // Get the current time in milliseconds since January 1, 1970 (Unix timestamp)
        const currentTimeMillis = Date.now();
        // Convert milliseconds to seconds and nanoseconds
        const seconds = Math.floor(currentTimeMillis / 1000);
        const nanos = (currentTimeMillis % 1000) * 1e6; // 1 millisecond = 1e6 nanoseconds
        // Create a new Timestamp object with the current time
        const timestamp = new timestamp_pb_1.Timestamp();
        timestamp.setSeconds(seconds);
        timestamp.setNanos(nanos);
        const localTimestamp = new local_timestamp_pb_1.LocalTimestampProto();
        localTimestamp.setTimeZone('America/New_York');
        localTimestamp.setTimestamp(timestamp);
        return new ZonedDateTime(localTimestamp);
    }
}
exports.ZonedDateTime = ZonedDateTime;
//# sourceMappingURL=datetime.js.map