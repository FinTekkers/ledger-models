"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = void 0;
var transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
var TransactionType = /** @class */ (function () {
    function TransactionType(proto) {
        this.proto = proto;
    }
    TransactionType.prototype.getDirectionMultiplier = function () {
        switch (this.proto) {
            case transaction_type_pb_1.TransactionTypeProto.BUY:
            case transaction_type_pb_1.TransactionTypeProto.DEPOSIT:
            case transaction_type_pb_1.TransactionTypeProto.MATURATION_OFFSET:
                return 1;
            case transaction_type_pb_1.TransactionTypeProto.SELL:
            case transaction_type_pb_1.TransactionTypeProto.WITHDRAWAL:
            case transaction_type_pb_1.TransactionTypeProto.MATURATION:
                return -1;
            case transaction_type_pb_1.TransactionTypeProto.UNKNOWN:
                throw new Error('Unknown transaction type: ' + this.toString());
        }
    };
    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum desriptor as the value. There is
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than BUY, you could return Buy.
     *
     * @returns TransactionType as a string
     */
    TransactionType.prototype.toString = function () {
        return TransactionType.ttEnumMap.get(this.proto);
    };
    return TransactionType;
}());
exports.TransactionType = TransactionType;
(function () {
    TransactionType.ttEnumMap = new Map();
    Object.keys(transaction_type_pb_1.TransactionTypeProto).forEach(function (key) {
        TransactionType.ttEnumMap.set(transaction_type_pb_1.TransactionTypeProto[key], key);
    });
})();
//# sourceMappingURL=transaction_type.js.map