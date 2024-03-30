"use strict";
// ProtoEnum.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
var position_status_pb_1 = require("../../../fintekkers/models/position/position_status_pb");
var transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
var protoEnum_1 = require("./protoEnum");
describe('ProtoEnum', function () {
    it('should correctly identify the name of the enum value for TransactionTypeProto', function () {
        var protoEnum = new protoEnum_1.ProtoEnum(transaction_type_pb_1.TransactionTypeProto, 1);
        expect(protoEnum.getEnumValueName()).toEqual('BUY');
    });
    it('should correctly return the enum value for PositionStatusProto', function () {
        var protoEnum = new protoEnum_1.ProtoEnum(position_status_pb_1.PositionStatusProto.INTENDED, 2);
        expect(protoEnum.getEnumValue()).toEqual(2);
    });
    it('should correctly return the enum name for PositionStatusProto', function () {
        var protoEnum = new protoEnum_1.ProtoEnum(position_status_pb_1.PositionStatusProto.INTENDED, 2);
        expect(function () { return protoEnum.getEnumName(); }).toThrow(Error);
    });
    it('should throw an error for an unmapped enum name', function () {
        expect(function () { return protoEnum_1.ProtoEnum.fromEnumName('UNMAPPED_ENUM', 0); }).toThrow('Enum has not been mapped: UNMAPPED_ENUM');
    });
    // Add more tests as necessary to cover your use cases
});
//# sourceMappingURL=protoEnum.test.js.map