// package: fintekkers.requests.transaction
// file: fintekkers/requests/transaction/create_transaction_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_transaction_transaction_pb from "../../../fintekkers/models/transaction/transaction_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";

export class CreateTransactionRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CreateTransactionRequestProto;
    getVersion(): string;
    setVersion(value: string): CreateTransactionRequestProto;
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreateTransactionRequestProto;
    getVersionMajor(): number;
    setVersionMajor(value: number): CreateTransactionRequestProto;
    getVersionMinor(): number;
    setVersionMinor(value: number): CreateTransactionRequestProto;
    getVersionPatch(): number;
    setVersionPatch(value: number): CreateTransactionRequestProto;

    hasCreateTransactionInput(): boolean;
    clearCreateTransactionInput(): void;
    getCreateTransactionInput(): fintekkers_models_transaction_transaction_pb.TransactionProto | undefined;
    setCreateTransactionInput(value?: fintekkers_models_transaction_transaction_pb.TransactionProto): CreateTransactionRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTransactionRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTransactionRequestProto): CreateTransactionRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTransactionRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTransactionRequestProto;
    static deserializeBinaryFromReader(message: CreateTransactionRequestProto, reader: jspb.BinaryReader): CreateTransactionRequestProto;
}

export namespace CreateTransactionRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        versionMajor: number,
        versionMinor: number,
        versionPatch: number,
        createTransactionInput?: fintekkers_models_transaction_transaction_pb.TransactionProto.AsObject,
    }
}
