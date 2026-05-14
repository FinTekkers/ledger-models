"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_pb_1 = require("../../../fintekkers/models/position/position_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const position_1 = require("../position/position");
const datetime_1 = require("./datetime");
const any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_js_1 = require("google-protobuf/google/protobuf/timestamp_pb.js");
// import Timestamp from "google-protobuf/google/protobuf/timestamp_pb";
test('test the date time', () => __awaiter(void 0, void 0, void 0, function* () {
    const localTimestampProto = new local_timestamp_pb_1.LocalTimestampProto();
    const timestamp = new timestamp_pb_js_1.Timestamp();
    timestamp.setSeconds(1643723400); // Set the seconds
    timestamp.setNanos(0); // Set the nanoseconds
    localTimestampProto.setTimestamp(timestamp);
    // Set the time zone
    localTimestampProto.setTimeZone('America/New_York');
    const now = new datetime_1.ZonedDateTime(localTimestampProto);
    let nowTimestampString = now.toDateTime().toString();
    expect(nowTimestampString).toContain("2022-02-01");
    expect(nowTimestampString).toContain("08:50:00");
    const nowProto = now.toProto();
    const nowPacked = new any_pb_1.Any();
    nowPacked.setTypeUrl(`DUMMYTYPE_DATE`);
    nowPacked.setValue(nowProto.serializeBinary());
    const position = new position_pb_1.PositionProto();
    // Set properties
    position.setObjectClass(' MyClass');
    position.setVersion('1.0');
    position.setPositionView(position_pb_1.PositionViewProto.DEFAULT_VIEW);
    position.setPositionType(position_pb_1.PositionTypeProto.TRANSACTION);
    // Add fields
    const field1 = new position_util_pb_1.FieldMapEntry();
    field1.setField(field_pb_1.FieldProto.AS_OF);
    field1.setFieldValuePacked(nowPacked);
    position.addFields(field1);
    const pos = new position_1.Position(position);
    const timestampStr = pos.getFieldDisplay(field1);
    //Expect timestamp match
    expect(timestampStr).toMatch(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/);
}));
// second-brain#276 — lock in that the ZonedDateTime constructor throws on
// empty time_zone. Pre-fix: luxon's DateTime silently produced
// isValid=false / year=NaN, indistinguishable from a real value at most
// call sites until much later. Now: loud failure at construction.
describe('ZonedDateTime constructor — second-brain#276', () => {
    test('throws when time_zone is empty (proto3 default)', () => {
        const proto = new local_timestamp_pb_1.LocalTimestampProto();
        const ts = new timestamp_pb_js_1.Timestamp();
        ts.setSeconds(1700000000);
        proto.setTimestamp(ts);
        // time_zone left at the proto3 default ""
        expect(() => new datetime_1.ZonedDateTime(proto)).toThrow(/time_zone is required/);
    });
    test('throws when time_zone is whitespace-only', () => {
        const proto = new local_timestamp_pb_1.LocalTimestampProto();
        const ts = new timestamp_pb_js_1.Timestamp();
        ts.setSeconds(1700000000);
        proto.setTimestamp(ts);
        proto.setTimeZone('   ');
        expect(() => new datetime_1.ZonedDateTime(proto)).toThrow(/time_zone is required/);
    });
    test('throws on fully-default LocalTimestampProto', () => {
        // No timestamp, no time_zone — wholly default instance.
        expect(() => new datetime_1.ZonedDateTime(new local_timestamp_pb_1.LocalTimestampProto()))
            .toThrow(/time_zone is required/);
    });
    test('happy path with UTC still constructs successfully', () => {
        const proto = new local_timestamp_pb_1.LocalTimestampProto();
        const ts = new timestamp_pb_js_1.Timestamp();
        ts.setSeconds(1700000000);
        proto.setTimestamp(ts);
        proto.setTimeZone('UTC');
        const zdt = new datetime_1.ZonedDateTime(proto);
        const dt = zdt.toDateTime();
        expect(dt.isValid).toBe(true);
        expect(dt.year).toBe(2023);
    });
});
//# sourceMappingURL=datetime.test.js.map