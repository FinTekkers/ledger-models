import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
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
     * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
     */
    addFilter(field: FieldProto, fieldValue: any): PositionFilter {
        const fieldMapEntry = new FieldMapEntry();
        fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
        fieldMapEntry.setFieldValuePacked(pack(fieldValue));

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
