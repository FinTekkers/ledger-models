
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionProto, PositionTypeProto, PositionViewProto } from '../../../fintekkers/models/position/position_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { Position } from "../position/position";
import { LocalDate } from './date';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

test('test the date time', async () => {
    const now = LocalDate.today();

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
    field1.setField(FieldProto.EFFECTIVE_DATE);
    field1.setFieldValuePacked(nowPacked);
    position.addFields(field1);

    const pos = new Position(position);
    const timestampStr = pos.getFieldDisplay(field1);

    //Expect timestamp match
    expect(timestampStr).toMatch(/^\d{4}\-(?:\d{1,2})(?:\-\d{1,2})?$/);
});