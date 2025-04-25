"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_type_1 = require("./transaction_type");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const security_1 = __importDefault(require("../security/security"));
const portfolio_1 = __importDefault(require("../portfolio/portfolio"));
//Model Utils
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const date_1 = require("../utils/date");
const decimal_js_1 = require("decimal.js");
class Transaction {
    constructor(proto) {
        this.proto = proto;
    }
    toString() {
        var _a, _b, _c, _d, _e, _f;
        try {
            const validTo = (_b = (_a = this.proto.getValidTo()) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "NULL";
            const validFrom = (_d = (_c = this.proto.getValidFrom()) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "NULL";
            const strategyAllocation = (_f = (_e = this.proto.getStrategyAllocation()) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : "NULL";
            return `${ /*this.proto.isCancelled()*/false ? "INVALIDATED: " : ""}TXN[${this.getID().toString()}], ` +
                `TradeDate[${this.getTradeDate().toString()}], TxnType[${this.getTransactionType()}], Price[${this.getPrice()}], Quantity[${this.getQuantity()}], ` +
                `AsOf[${this.getAsOf().toString()}], Portfolio[${this.getPortfolio().getPortfolioName()}], Issuer[${this.getSecurity().getIssuerName()}], ` +
                `ValidFrom[${validFrom}], ValidTo[${validTo}], Strategy[${strategyAllocation}]`;
        }
        catch (e) {
            console.error(e);
            return `Transaction toString() serialization failed: ${e}`;
        }
    }
    getFields() {
        return [field_pb_1.FieldProto.ID, field_pb_1.FieldProto.SECURITY_ID, field_pb_1.FieldProto.AS_OF, field_pb_1.FieldProto.ASSET_CLASS, field_pb_1.FieldProto.IDENTIFIER];
    }
    getField(field) {
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
                throw new Error(`Field not mapped in Security wrapper: ${field}`);
        }
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error("UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error("AsOf is required");
        return new datetime_1.ZonedDateTime(asOf);
    }
    getPortfolio() {
        const portfolio = this.proto.getPortfolio();
        if (!portfolio)
            throw new Error("Portfolio is required");
        return new portfolio_1.default(portfolio);
    }
    getSecurity() {
        const security = this.proto.getSecurity();
        if (!security)
            throw new Error("Security is required");
        return new security_1.default(security);
    }
    getStrategyAllocation() {
        const allocation = this.proto.getStrategyAllocation();
        if (!allocation)
            throw new Error("StrategyAllocation is required");
        return allocation;
    }
    getPrice() {
        const price = this.proto.getPrice();
        if (!price)
            throw new Error("Price is required");
        return price;
    }
    getQuantity() {
        const quantity = this.proto.getQuantity();
        if (!quantity)
            throw new Error("Quantity is required");
        return new decimal_js_1.Decimal(quantity.getArbitraryPrecisionValue());
    }
    getIssuerName() {
        return this.getSecurity().getIssuerName();
    }
    getDirectedQuantity() {
        return this.getQuantity().mul(this.getTransactionType().getDirectionMultiplier());
    }
    getTradeDate() {
        const tradeDate = this.proto.getTradeDate();
        if (!tradeDate)
            throw new Error("TradeDate is required");
        return new date_1.LocalDate(tradeDate);
    }
    getSettlementDate() {
        const settlementDate = this.proto.getSettlementDate();
        if (!settlementDate)
            throw new Error("SettlementDate is required");
        return new date_1.LocalDate(settlementDate);
    }
    getTransactionType() {
        return new transaction_type_1.TransactionType(this.proto.getTransactionType());
    }
    getTradeName() {
        return this.proto.getTradeName();
    }
    getPositionStatus() {
        return this.proto.getPositionStatus();
    }
    getChildrenTransactions() {
        return this.proto.getChildtransactionsList();
    }
    equals(other) {
        if (other instanceof Transaction) {
            return this.getID().equals(other.getID());
        }
        else {
            return false;
        }
    }
}
exports.default = Transaction;
//# sourceMappingURL=transaction.js.map