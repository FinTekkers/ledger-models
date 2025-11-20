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
const date_1 = require("./date");
const any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
test('test the date time', () => __awaiter(void 0, void 0, void 0, function* () {
    const now = date_1.LocalDate.today();
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
    field1.setField(field_pb_1.FieldProto.EFFECTIVE_DATE);
    field1.setFieldValuePacked(nowPacked);
    position.addFields(field1);
    const pos = new position_1.Position(position);
    const timestampStr = pos.getFieldDisplay(field1);
    //Expect timestamp match
    expect(timestampStr).toMatch(/^\d{4}\-(?:\d{1,2})(?:\-\d{1,2})?$/);
}));
//# sourceMappingURL=date.test.js.map