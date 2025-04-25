"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const field_1 = require("./field");
test('test the field wrapper', () => __awaiter(void 0, void 0, void 0, function* () {
    const isTrue = yield testSerialization();
    expect(isTrue).toBe(true);
}));
function testSerialization() {
    return __awaiter(this, void 0, void 0, function* () {
        let field = new field_1.Field(field_pb_1.FieldProto.TRADE_DATE);
        expect(field.getName()).toBe("TRADE_DATE");
        return true;
    });
}
//# sourceMappingURL=field.test.js.map