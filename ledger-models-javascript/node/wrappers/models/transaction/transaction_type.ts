import { TransactionTypeProto } from "../../../fintekkers/models/transaction/transaction_type_pb";

export class TransactionType {
    proto: TransactionTypeProto;

    constructor(proto: TransactionTypeProto) {
        this.proto = proto;
      }

    static ttEnumMap: Map<number, string>;

    static {
        TransactionType.ttEnumMap = new Map<number, string>();

        Object.keys(TransactionTypeProto).forEach(key => {
            TransactionType.ttEnumMap.set(TransactionTypeProto[key], key);
        });
    }

    getDirectionMultiplier(): number {
        switch (this.proto) {
            case TransactionTypeProto.BUY:
            case TransactionTypeProto.DEPOSIT:
            case TransactionTypeProto.MATURATION_OFFSET:
                return 1;
            case TransactionTypeProto.SELL:
            case TransactionTypeProto.WITHDRAWAL:
            case TransactionTypeProto.MATURATION:
                return -1;
            case TransactionTypeProto.UNKNOWN:
                throw new Error('Unknown transaction type: '+this.toString()); );
        }
    }

    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a 
     * reverse map with the enum ID as the key and the enum desriptor as the value. There is 
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than BUY, you could return Buy. 
     * 
     * @returns TransactionType as a string
     */
    toString() : string {  
      return TransactionType.ttEnumMap.get(this.proto);
    }
}