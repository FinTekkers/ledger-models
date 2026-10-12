// package: fintekkers.models.transaction
// file: fintekkers/models/transaction/transaction.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_portfolio_portfolio_pb from "../../../fintekkers/models/portfolio/portfolio_pb";
import * as fintekkers_models_strategy_strategy_allocation_pb from "../../../fintekkers/models/strategy/strategy_allocation_pb";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_models_price_price_pb from "../../../fintekkers/models/price/price_pb";
import * as fintekkers_models_position_position_status_pb from "../../../fintekkers/models/position/position_status_pb";
import * as fintekkers_models_transaction_transaction_type_pb from "../../../fintekkers/models/transaction/transaction_type_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class TransactionProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): TransactionProto;
    getVersion(): string;
    setVersion(value: string): TransactionProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): TransactionProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): TransactionProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): TransactionProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): TransactionProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): TransactionProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): TransactionProto;
    getIsLink(): boolean;
    setIsLink(value: boolean): TransactionProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): TransactionProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): TransactionProto;

    hasPortfolio(): boolean;
    clearPortfolio(): void;
    getPortfolio(): fintekkers_models_portfolio_portfolio_pb.PortfolioProto | undefined;
    setPortfolio(value?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto): TransactionProto;

    hasSecurity(): boolean;
    clearSecurity(): void;
    getSecurity(): fintekkers_models_security_security_pb.SecurityProto | undefined;
    setSecurity(value?: fintekkers_models_security_security_pb.SecurityProto): TransactionProto;
    getTransactionType(): fintekkers_models_transaction_transaction_type_pb.TransactionTypeProto;
    setTransactionType(value: fintekkers_models_transaction_transaction_type_pb.TransactionTypeProto): TransactionProto;

    hasQuantity(): boolean;
    clearQuantity(): void;
    getQuantity(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setQuantity(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): TransactionProto;

    hasPrice(): boolean;
    clearPrice(): void;
    getPrice(): fintekkers_models_price_price_pb.PriceProto | undefined;
    setPrice(value?: fintekkers_models_price_price_pb.PriceProto): TransactionProto;

    hasTradeDate(): boolean;
    clearTradeDate(): void;
    getTradeDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setTradeDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TransactionProto;

    hasSettlementDate(): boolean;
    clearSettlementDate(): void;
    getSettlementDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setSettlementDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): TransactionProto;
    clearChildtransactionsList(): void;
    getChildtransactionsList(): Array<TransactionProto>;
    setChildtransactionsList(value: Array<TransactionProto>): TransactionProto;
    addChildtransactions(value?: TransactionProto, index?: number): TransactionProto;
    getPositionStatus(): fintekkers_models_position_position_status_pb.PositionStatusProto;
    setPositionStatus(value: fintekkers_models_position_position_status_pb.PositionStatusProto): TransactionProto;
    getTradeName(): string;
    setTradeName(value: string): TransactionProto;

    hasStrategyAllocation(): boolean;
    clearStrategyAllocation(): void;
    getStrategyAllocation(): fintekkers_models_strategy_strategy_allocation_pb.StrategyAllocationProto | undefined;
    setStrategyAllocation(value?: fintekkers_models_strategy_strategy_allocation_pb.StrategyAllocationProto): TransactionProto;
    getIsCancelled(): boolean;
    setIsCancelled(value: boolean): TransactionProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TransactionProto.AsObject;
    static toObject(includeInstance: boolean, msg: TransactionProto): TransactionProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TransactionProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TransactionProto;
    static deserializeBinaryFromReader(message: TransactionProto, reader: jspb.BinaryReader): TransactionProto;
}

export namespace TransactionProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        isLink: boolean,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        portfolio?: fintekkers_models_portfolio_portfolio_pb.PortfolioProto.AsObject,
        security?: fintekkers_models_security_security_pb.SecurityProto.AsObject,
        transactionType: fintekkers_models_transaction_transaction_type_pb.TransactionTypeProto,
        quantity?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        price?: fintekkers_models_price_price_pb.PriceProto.AsObject,
        tradeDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        settlementDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        childtransactionsList: Array<TransactionProto.AsObject>,
        positionStatus: fintekkers_models_position_position_status_pb.PositionStatusProto,
        tradeName: string,
        strategyAllocation?: fintekkers_models_strategy_strategy_allocation_pb.StrategyAllocationProto.AsObject,
        isCancelled: boolean,
    }
}
