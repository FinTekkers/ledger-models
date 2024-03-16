// ProtoEnum.test.ts

import { PositionStatusProto } from '../../../fintekkers/models/position/position_status_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { ProtoEnum } from './protoEnum';

describe('ProtoEnum', () => {
    it('should correctly identify the name of the enum value for TransactionTypeProto', () => {
        const protoEnum = new ProtoEnum(TransactionTypeProto, 1);
        expect(protoEnum.getEnumValueName()).toEqual('BUY');
    });

    it('should correctly return the enum value for PositionStatusProto', () => {
        const protoEnum = new ProtoEnum(PositionStatusProto.INTENDED, 2);
        expect(protoEnum.getEnumValue()).toEqual(2);
    });

    it('should throw an error for an unmapped enum name', () => {
        expect(() => ProtoEnum.fromEnumName('UNMAPPED_ENUM', 0)).toThrow('Enum has not been mapped: UNMAPPED_ENUM');
    });

    // Add more tests as necessary to cover your use cases
});
