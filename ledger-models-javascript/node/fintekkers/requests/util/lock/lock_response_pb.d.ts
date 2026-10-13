// package: fintekkers.requests.util.lock
// file: fintekkers/requests/util/lock/lock_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_lock_node_state_pb from "../../../../fintekkers/models/util/lock/node_state_pb";
import * as fintekkers_requests_util_lock_lock_request_pb from "../../../../fintekkers/requests/util/lock/lock_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../../fintekkers/requests/util/errors/summary_pb";
import * as fintekkers_models_util_object_type_pb from "../../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../../fintekkers/models/util/version_pb";

export class LockResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): LockResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): LockResponseProto;

    hasGetLockRequest(): boolean;
    clearGetLockRequest(): void;
    getGetLockRequest(): fintekkers_requests_util_lock_lock_request_pb.LockRequestProto | undefined;
    setGetLockRequest(value?: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto): LockResponseProto;

    hasLockResponse(): boolean;
    clearLockResponse(): void;
    getLockResponse(): fintekkers_models_util_lock_node_state_pb.NodeState | undefined;
    setLockResponse(value?: fintekkers_models_util_lock_node_state_pb.NodeState): LockResponseProto;

    hasErrorsOrWarnings(): boolean;
    clearErrorsOrWarnings(): void;
    getErrorsOrWarnings(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
    setErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): LockResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LockResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: LockResponseProto): LockResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LockResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LockResponseProto;
    static deserializeBinaryFromReader(message: LockResponseProto, reader: jspb.BinaryReader): LockResponseProto;
}

export namespace LockResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        getLockRequest?: fintekkers_requests_util_lock_lock_request_pb.LockRequestProto.AsObject,
        lockResponse?: fintekkers_models_util_lock_node_state_pb.NodeState.AsObject,
        errorsOrWarnings?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
    }
}
