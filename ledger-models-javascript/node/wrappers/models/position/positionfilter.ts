import { FieldMapEntry, PositionFilterOperator } from '../../../fintekkers/models/position/position_util_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { pack } from '../utils/serialization.util';
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';

export class PositionFilter {
    filters: FieldMapEntry[];

    constructor() {
        this.filters = [];
    }

    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValueString The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addEqualsStringFilter(field: FieldProto, fieldValueString: string): PositionFilter {
        return this.addFilter(field, PositionFilterOperator.EQUALS, null, fieldValueString);
    }

    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addEqualsFilter(field: FieldProto, fieldValue: any): PositionFilter {
        if (typeof fieldValue === 'string') {
            return this.addEqualsStringFilter(field, fieldValue as string);
        } else {
            return this.addFilter(field, PositionFilterOperator.EQUALS, fieldValue, undefined);
        }
    }

    /**
     * @param {*} field FieldProto.ASSET_CLASS, as an example
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addFilter(field: FieldProto, operator: PositionFilterOperator, fieldValue?: any, fieldValueString?: string): PositionFilter {
        const fieldMapEntry = new FieldMapEntry();
        fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
        fieldMapEntry.setOperator(operator);

        if (fieldValueString)
            fieldMapEntry.setStringValue(fieldValueString);
        else if (fieldValue) {
            fieldMapEntry.setFieldValuePacked(pack(fieldValue));
        } else {
            throw new Error("Need to provide a string, or object");
        }

        this.filters.push(fieldMapEntry);
        return this;
    }

    getFilters(): Array<FieldMapEntry> {
        return this.filters;
    }

    toProto(): PositionFilterProto {
        const positionFilterProto = new PositionFilterProto();
        positionFilterProto.setObjectClass('PositionFilter');
        positionFilterProto.setVersion('0.0.1');
        positionFilterProto.setFiltersList(this.filters);

        return positionFilterProto;
    }
}
