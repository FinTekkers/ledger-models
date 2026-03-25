// package: fintekkers.requests.index_composition
// file: fintekkers/requests/index_composition/create_index_composition_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_index_composition_pb from "../../../fintekkers/models/security/index_composition_pb";
import * as fintekkers_requests_util_operation_pb from "../../../fintekkers/requests/util/operation_pb";

export class CreateIndexCompositionRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CreateIndexCompositionRequestProto;
    getVersion(): string;
    setVersion(value: string): CreateIndexCompositionRequestProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): CreateIndexCompositionRequestProto;

    hasCreateIndexCompositionInput(): boolean;
    clearCreateIndexCompositionInput(): void;
    getCreateIndexCompositionInput(): fintekkers_models_security_index_composition_pb.IndexCompositionProto | undefined;
    setCreateIndexCompositionInput(value?: fintekkers_models_security_index_composition_pb.IndexCompositionProto): CreateIndexCompositionRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateIndexCompositionRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateIndexCompositionRequestProto): CreateIndexCompositionRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateIndexCompositionRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateIndexCompositionRequestProto;
    static deserializeBinaryFromReader(message: CreateIndexCompositionRequestProto, reader: jspb.BinaryReader): CreateIndexCompositionRequestProto;
}

export namespace CreateIndexCompositionRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        createIndexCompositionInput?: fintekkers_models_security_index_composition_pb.IndexCompositionProto.AsObject,
    }
}

export class CreateIndexCompositionResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): CreateIndexCompositionResponseProto;
    getVersion(): string;
    setVersion(value: string): CreateIndexCompositionResponseProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): CreateIndexCompositionResponseProto;

    hasCreateIndexCompositionRequest(): boolean;
    clearCreateIndexCompositionRequest(): void;
    getCreateIndexCompositionRequest(): CreateIndexCompositionRequestProto | undefined;
    setCreateIndexCompositionRequest(value?: CreateIndexCompositionRequestProto): CreateIndexCompositionResponseProto;

    hasIndexCompositionResponse(): boolean;
    clearIndexCompositionResponse(): void;
    getIndexCompositionResponse(): fintekkers_models_security_index_composition_pb.IndexCompositionProto | undefined;
    setIndexCompositionResponse(value?: fintekkers_models_security_index_composition_pb.IndexCompositionProto): CreateIndexCompositionResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateIndexCompositionResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateIndexCompositionResponseProto): CreateIndexCompositionResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateIndexCompositionResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateIndexCompositionResponseProto;
    static deserializeBinaryFromReader(message: CreateIndexCompositionResponseProto, reader: jspb.BinaryReader): CreateIndexCompositionResponseProto;
}

export namespace CreateIndexCompositionResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        createIndexCompositionRequest?: CreateIndexCompositionRequestProto.AsObject,
        indexCompositionResponse?: fintekkers_models_security_index_composition_pb.IndexCompositionProto.AsObject,
    }
}
