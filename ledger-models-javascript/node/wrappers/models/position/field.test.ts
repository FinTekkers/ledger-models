import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { Field } from './field';

test('test the field wrapper', async () => {
    const isTrue = await testSerialization();
    expect(isTrue).toBe(true);
});

async function testSerialization(): Promise<boolean> {
    let field: Field = new Field(FieldProto.TRADE_DATE);
    expect(field.getName()).toBe("TRADE_DATE");
    return true;
}
