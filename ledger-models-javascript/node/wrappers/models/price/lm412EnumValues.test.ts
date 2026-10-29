/**
 * LM-412 is additive: PriceTypeProto gains RATE = 5 and ProductTypeProto gains
 * T_BILL_13_WEEK_SERIES = 36. Every existing value keeps its number and name.
 *
 * The values come from test-fixtures/field-changes/lm-412.json, which wire-diff
 * rule lm412 and the Java, Python and Rust tests also read. google-protobuf has
 * no runtime descriptors, so this checks the generated enum objects.
 */
import * as fs from 'fs';
import * as path from 'path';

import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';

interface EnumValue {
    enum: string;
    number: number;
    name: string;
}

const fixturePath = path.resolve(__dirname, '../../../../../test-fixtures/field-changes/lm-412.json');
const spec = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as { added_values: EnumValue[]; kept: EnumValue[] };

const ENUMS: Record<string, Record<string, number>> = {
    '.fintekkers.models.price.PriceTypeProto': PriceTypeProto as unknown as Record<string, number>,
    '.fintekkers.models.security.ProductTypeProto': ProductTypeProto as unknown as Record<string, number>,
};

test('the added values are RATE and T_BILL_13_WEEK_SERIES', () => {
    expect(spec.added_values.map((v) => [v.enum, v.number, v.name])).toEqual([
        ['.fintekkers.models.price.PriceTypeProto', 5, 'RATE'],
        ['.fintekkers.models.security.ProductTypeProto', 36, 'T_BILL_13_WEEK_SERIES'],
    ]);
    expect(PriceTypeProto.RATE).toBe(5);
    expect(ProductTypeProto.T_BILL_13_WEEK_SERIES).toBe(36);
});

test.each([...spec.added_values, ...spec.kept].map((v) => [`${v.enum} ${v.name}`, v] as [string, EnumValue]))(
    '%s has its number',
    (_label, v) => {
        expect(ENUMS[v.enum][v.name]).toBe(v.number);
    },
);

test.each(Object.keys(ENUMS))('kept plus added is the whole of %s', (name) => {
    const listed = [...spec.kept, ...spec.added_values]
        .filter((v) => v.enum === name)
        .map((v) => `${v.number} ${v.name}`)
        .sort();
    const actual = Object.entries(ENUMS[name])
        .map(([n, number]) => `${number} ${n}`)
        .sort();
    expect(actual.length).toBe(listed.length);
    expect(actual).toEqual(listed);
});
