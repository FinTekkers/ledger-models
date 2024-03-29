"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transaction_type_1 = require("./transaction_type");
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var security_1 = require("../security/security");
var portfolio_1 = require("../portfolio/portfolio");
//Model Utils
var datetime_1 = require("../utils/datetime");
var uuid_1 = require("../utils/uuid");
var date_1 = require("../utils/date");
var decimal_js_1 = require("decimal.js");
var Transaction = /** @class */ (function () {
    function Transaction(proto) {
        this.proto = proto;
    }
    Transaction.prototype.toString = function () {
        try {
            var validTo = this.proto.getValidTo() ? this.proto.getValidTo().toString() : "NULL";
            var validFrom = this.proto.getValidFrom() ? this.proto.getValidFrom().toString() : "NULL";
            var strategyAllocation = this.proto.getStrategyAllocation() ? this.getStrategyAllocation().toString() : "NULL";
            return "".concat(/*this.proto.isCancelled()*/ false ? "INVALIDATED: " : "", "TXN[").concat(this.getID().toString(), "], ") +
                "TradeDate[".concat(this.getTradeDate().toString(), "], TxnType[").concat(this.getTransactionType(), "], Price[").concat(this.getPrice(), "], Quantity[").concat(this.getQuantity(), "], ") +
                "AsOf[".concat(this.getAsOf().toString(), "], Portfolio[").concat(this.getPortfolio().getPortfolioName(), "], Issuer[").concat(this.getSecurity().getIssuerName(), "], ") +
                "ValidFrom[".concat(validFrom, "], ValidTo[").concat(validTo, "], Strategy[").concat(strategyAllocation, "]");
        }
        catch (e) {
            console.error(e);
            return "Transaction toString() serialization failed: ".concat(e);
        }
    };
    Transaction.prototype.getFields = function () {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    };
    Transaction.prototype.getField = function (field) {
        switch (field) {
            case field_pb_1.FieldProto.ID:
            case field_pb_1.FieldProto.SECURITY_ID:
                return this.getID();
            case field_pb_1.FieldProto.AS_OF:
                return this.getAsOf();
            case field_pb_1.FieldProto.ASSET_CLASS:
                return this.getSecurity().getAssetClass();
            case field_pb_1.FieldProto.PRODUCT_CLASS:
                return this.getSecurity().getProductClass();
            case field_pb_1.FieldProto.PRODUCT_TYPE:
                return this.getSecurity().getProductType();
            case field_pb_1.FieldProto.IDENTIFIER:
                return this.getSecurity().getSecurityID();
            case field_pb_1.FieldProto.TENOR:
            case field_pb_1.FieldProto.ADJUSTED_TENOR:
                throw new Error('Not implemented yet');
            case field_pb_1.FieldProto.MATURITY_DATE:
                throw new Error('Not implemented yet');
            default:
                throw new Error("Field not mapped in Security wrapper: ".concat(field));
        }
    };
    Transaction.prototype.getID = function () {
        return uuid_1.UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    };
    Transaction.prototype.getAsOf = function () {
        return new datetime_1.ZonedDateTime(this.proto.getAsOf());
    };
    Transaction.prototype.getPortfolio = function () {
        return new portfolio_1.default(this.proto.getPortfolio());
    };
    Transaction.prototype.getSecurity = function () {
        return new security_1.default(this.proto.getSecurity());
    };
    Transaction.prototype.getStrategyAllocation = function () {
        return this.proto.getStrategyAllocation();
    };
    Transaction.prototype.getPrice = function () {
        return this.proto.getPrice();
    };
    Transaction.prototype.getQuantity = function () {
        return new decimal_js_1.Decimal(this.proto.getQuantity().getArbitraryPrecisionValue());
    };
    Transaction.prototype.getIssuerName = function () {
        return this.getSecurity().getIssuerName();
    };
    Transaction.prototype.getDirectedQuantity = function () {
        return this.getQuantity().mul(this.getTransactionType().getDirectionMultiplier());
    };
    Transaction.prototype.getTradeDate = function () {
        return new date_1.LocalDate(this.proto.getTradeDate());
    };
    Transaction.prototype.getSettlementDate = function () {
        return new date_1.LocalDate(this.proto.getSettlementDate());
    };
    Transaction.prototype.getTransactionType = function () {
        return new transaction_type_1.TransactionType(this.proto.getTransactionType());
    };
    Transaction.prototype.getTradeName = function () {
        return this.proto.getTradeName();
    };
    Transaction.prototype.getPositionStatus = function () {
        return this.proto.getPositionStatus();
    };
    Transaction.prototype.getChildrenTransactions = function () {
        return this.proto.getChildtransactionsList();
    };
    Transaction.prototype.equals = function (other) {
        if (other instanceof Transaction) {
            return this.getID().equals(other.getID());
        }
        else {
            return false;
        }
    };
    return Transaction;
}());
exports.default = Transaction;
//# sourceMappingURL=transaction.js.map