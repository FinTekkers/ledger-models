// package: fintekkers.requests.transaction
// file: fintekkers/requests/transaction/query_transaction_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_transaction_transaction_pb from "../../../fintekkers/models/transaction/transaction_pb";
import * as fintekkers_requests_transaction_query_transaction_request_pb from "../../../fintekkers/requests/transaction/query_transaction_request_pb";

export class QueryTransactionResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QueryTransactionResponseProto;
    getVersion(): string;
    setVersion(value: string): QueryTransactionResponseProto;

    hasCreateTransactionRequest(): boolean;
    clearCreateTransactionRequest(): void;
    getCreateTransactionRequest(): fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto | undefined;
    setCreateTransactionRequest(value?: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto): QueryTransactionResponseProto;
    clearTransactionResponseList(): void;
    getTransactionResponseList(): Array<fintekkers_models_transaction_transaction_pb.TransactionProto>;
    setTransactionResponseList(value: Array<fintekkers_models_transaction_transaction_pb.TransactionProto>): QueryTransactionResponseProto;
    addTransactionResponse(value?: fintekkers_models_transaction_transaction_pb.TransactionProto, index?: number): fintekkers_models_transaction_transaction_pb.TransactionProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QueryTransactionResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: QueryTransactionResponseProto): QueryTransactionResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QueryTransactionResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QueryTransactionResponseProto;
    static deserializeBinaryFromReader(message: QueryTransactionResponseProto, reader: jspb.BinaryReader): QueryTransactionResponseProto;
}

export namespace QueryTransactionResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        createTransactionRequest?: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto.AsObject,
        transactionResponseList: Array<fintekkers_models_transaction_transaction_pb.TransactionProto.AsObject>,
    }
}
