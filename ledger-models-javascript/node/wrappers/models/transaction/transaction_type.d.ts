import { TransactionTypeProto } from "../../../fintekkers/models/transaction/transaction_type_pb";
export declare class TransactionType {
    proto: TransactionTypeProto;
    constructor(proto: TransactionTypeProto);
    static ttEnumMap: Map<number, string>;
    getDirectionMultiplier(): number;
    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum desriptor as the value. There is
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than BUY, you could return Buy.
     *
     * @returns TransactionType as a string
     */
    toString(): string;
}
