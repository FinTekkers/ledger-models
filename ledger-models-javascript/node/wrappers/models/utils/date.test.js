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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var position_pb_1 = require("../../../fintekkers/models/position/position_pb");
var position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
var Position_1_1 = require("../position/Position.1");
var date_1 = require("./date");
var any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
test('test the date time', function () { return __awaiter(void 0, void 0, void 0, function () {
    var now, nowProto, nowPacked, position, field1, pos, timestampStr;
    return __generator(this, function (_a) {
        now = date_1.LocalDate.today();
        nowProto = now.toProto();
        nowPacked = new any_pb_1.Any();
        nowPacked.setTypeUrl("DUMMYTYPE_DATE");
        nowPacked.setValue(nowProto.serializeBinary());
        position = new position_pb_1.PositionProto();
        // Set properties
        position.setObjectClass(' MyClass');
        position.setVersion('1.0');
        position.setPositionView(position_pb_1.PositionViewProto.DEFAULT_VIEW);
        position.setPositionType(position_pb_1.PositionTypeProto.TRANSACTION);
        field1 = new position_util_pb_1.FieldMapEntry();
        field1.setField(field_pb_1.FieldProto.EFFECTIVE_DATE);
        field1.setFieldValuePacked(nowPacked);
        position.addFields(field1);
        pos = new Position_1_1.Position(position);
        timestampStr = pos.getFieldDisplay(field1);
        //Expect timestamp match
        expect(timestampStr).toMatch(/^\d{4}\/(?:\d{1,2})(?:\/\d{1,2})?$/);
        return [2 /*return*/];
    });
}); });
//# sourceMappingURL=date.test.js.map