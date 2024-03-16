"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = void 0;
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var Field = /** @class */ (function () {
    function Field(field) {
        this.field = field;
    }
    Field.prototype.getName = function () {
        function getEnumNameByValue(enumObj, value) {
            // Find the enum key that matches the value
            var entry = Object.entries(enumObj).find(function (_a) {
                var val = _a[1];
                return val === value;
            });
            // Return the key name if found, otherwise undefined or a placeholder
            return entry ? entry[0] : 'undefined';
        }
        return getEnumNameByValue(field_pb_1.FieldProto, this.field);
    };
    Field.prototype.toString = function () {
        return null; //this.getEnumValueName();
    };
    return Field;
}());
exports.Field = Field;
//# sourceMappingURL=field.js.map