
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionProto, PositionTypeProto, PositionViewProto } from '../../../fintekkers/models/position/position_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { Position } from "../position/position";
import { ZonedDateTime } from './datetime';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import {LocalTimestampProto} from "../../../fintekkers/models/util/local_timestamp_pb";
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb.js';
// import Timestamp from "google-protobuf/google/protobuf/timestamp_pb";

test('test the date time', async () => {
    const localTimestampProto = new LocalTimestampProto();
    const timestamp = new Timestamp();
    timestamp.setSeconds(1643723400); // Set the seconds
    timestamp.setNanos(0); // Set the nanoseconds
    localTimestampProto.setTimestamp(timestamp);

// Set the time zone
    localTimestampProto.setTimeZone('America/New_York');
    const now = new ZonedDateTime(localTimestampProto);

    let nowTimestampString = now.toDateTime().toString();
    expect(nowTimestampString).toContain("2022-02-01");
    expect(nowTimestampString).toContain("08:50:00");

    const nowProto = now.toProto();
    const nowPacked = new Any();
    nowPacked.setTypeUrl(`DUMMYTYPE_DATE`);
    nowPacked.setValue(nowProto.serializeBinary());

    const position = new PositionProto();

    // Set properties
    position.setObjectClass(' MyClass');
    position.setVersion('1.0');
    position.setPositionView(PositionViewProto.DEFAULT_VIEW);
    position.setPositionType(PositionTypeProto.TRANSACTION);

    // Add fields
    const field1 = new FieldMapEntry();
    field1.setField(FieldProto.AS_OF);
    field1.setFieldValuePacked(nowPacked);
    position.addFields(field1);

    const pos = new Position(position);
    const timestampStr = pos.getFieldDisplay(field1);

    //Expect timestamp match
    expect(timestampStr).toMatch(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/);
});

// second-brain#276 — lock in that the ZonedDateTime constructor throws on
// empty time_zone. Pre-fix: luxon's DateTime silently produced
// isValid=false / year=NaN, indistinguishable from a real value at most
// call sites until much later. Now: loud failure at construction.

describe('ZonedDateTime constructor — second-brain#276', () => {
    test('throws when time_zone is empty (proto3 default)', () => {
        const proto = new LocalTimestampProto();
        const ts = new Timestamp();
        ts.setSeconds(1_700_000_000);
        proto.setTimestamp(ts);
        // time_zone left at the proto3 default ""

        expect(() => new ZonedDateTime(proto)).toThrow(/time_zone is required/);
    });

    test('throws when time_zone is whitespace-only', () => {
        const proto = new LocalTimestampProto();
        const ts = new Timestamp();
        ts.setSeconds(1_700_000_000);
        proto.setTimestamp(ts);
        proto.setTimeZone('   ');

        expect(() => new ZonedDateTime(proto)).toThrow(/time_zone is required/);
    });

    test('throws on fully-default LocalTimestampProto', () => {
        // No timestamp, no time_zone — wholly default instance.
        expect(() => new ZonedDateTime(new LocalTimestampProto()))
            .toThrow(/time_zone is required/);
    });

    test('happy path with UTC still constructs successfully', () => {
        const proto = new LocalTimestampProto();
        const ts = new Timestamp();
        ts.setSeconds(1_700_000_000);
        proto.setTimestamp(ts);
        proto.setTimeZone('UTC');

        const zdt = new ZonedDateTime(proto);
        const dt = zdt.toDateTime();
        expect(dt.isValid).toBe(true);
        expect(dt.year).toBe(2023);
    });
});