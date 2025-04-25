import { FieldProto } from '../../../fintekkers/models/position/field_pb';

export class Field {
    private field: FieldProto;

    constructor(field: FieldProto) {
        this.field = field;
    }

    getName() {
        function getEnumNameByValue(enumObj: any, value: number): string {
            // Find the enum key that matches the value
            const entry = Object.entries(enumObj).find(([, val]) => val === value);
            // Return the key name if found, otherwise undefined or a placeholder
            return entry ? entry[0] : 'undefined';
        }

        return getEnumNameByValue(FieldProto, this.field);
    }

    toString(): string {
        return "";//this.getEnumValueName();
    }
}
