// package: fintekkers.requests.transaction
// file: fintekkers/requests/transaction/create_transaction_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_transaction_transaction_pb from "../../../fintekkers/models/transaction/transaction_pb";
import * as fintekkers_requests_transaction_create_transaction_request_pb from "../../../fintekkers/requests/transaction/create_transaction_request_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class CreateTransactionResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CreateTransactionResponseProto;
    getVersion(): string;
    setVersion(value: string): CreateTransactionResponseProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreateTransactionResponseProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): CreateTransactionResponseProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): CreateTransactionResponseProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): CreateTransactionResponseProto;

    hasCreateTransactionRequest(): boolean;
    clearCreateTransactionRequest(): void;
    getCreateTransactionRequest(): fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto | undefined;
    setCreateTransactionRequest(value?: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto): CreateTransactionResponseProto;

    hasTransactionResponse(): boolean;
    clearTransactionResponse(): void;
    getTransactionResponse(): fintekkers_models_transaction_transaction_pb.TransactionProto | undefined;
    setTransactionResponse(value?: fintekkers_models_transaction_transaction_pb.TransactionProto): CreateTransactionResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTransactionResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTransactionResponseProto): CreateTransactionResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTransactionResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTransactionResponseProto;
    static deserializeBinaryFromReader(message: CreateTransactionResponseProto, reader: jspb.BinaryReader): CreateTransactionResponseProto;
}

export namespace CreateTransactionResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        createTransactionRequest?: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto.AsObject,
        transactionResponse?: fintekkers_models_transaction_transaction_pb.TransactionProto.AsObject,
    }
}
