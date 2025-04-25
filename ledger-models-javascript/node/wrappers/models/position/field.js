"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = void 0;
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
class Field {
    constructor(field) {
        this.field = field;
    }
    getName() {
        function getEnumNameByValue(enumObj, value) {
            // Find the enum key that matches the value
            const entry = Object.entries(enumObj).find(([, val]) => val === value);
            // Return the key name if found, otherwise undefined or a placeholder
            return entry ? entry[0] : 'undefined';
        }
        return getEnumNameByValue(field_pb_1.FieldProto, this.field);
    }
    toString() {
        return ""; //this.getEnumValueName();
    }
}
exports.Field = Field;
//# sourceMappingURL=field.js.map