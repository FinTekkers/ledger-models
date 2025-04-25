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
//# sourceMappingURL=datetime.test.js.map