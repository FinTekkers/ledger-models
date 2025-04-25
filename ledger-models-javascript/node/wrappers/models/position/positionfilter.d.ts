import { FieldMapEntry, PositionFilterOperator } from '../../../fintekkers/models/position/position_util_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';
export declare class PositionFilter {
    filters: FieldMapEntry[];
    constructor();
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValueString The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addEqualsStringFilter(field: FieldProto, fieldValueString: string): PositionFilter;
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addEqualsFilter(field: FieldProto, fieldValue: any): PositionFilter;
    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addFilter(field: FieldProto, operator: PositionFilterOperator, fieldValue?: any, fieldValueString?: string): PositionFilter;
    getFilters(): Array<FieldMapEntry>;
    toProto(): PositionFilterProto;
}
