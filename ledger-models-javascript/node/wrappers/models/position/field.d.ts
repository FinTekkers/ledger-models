import { FieldProto } from '../../../fintekkers/models/position/field_pb';
export declare class Field {
    private field;
    constructor(field: FieldProto);
    getName(): string;
    toString(): string;
}
