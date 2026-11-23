// package: fintekkers.requests.security_metric
// file: fintekkers/requests/security_metric/create_security_metric_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_security_metric_pb from "../../../fintekkers/models/security/security_metric_pb";
import * as fintekkers_requests_util_operation_pb from "../../../fintekkers/requests/util/operation_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class CreateSecurityMetricRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreateSecurityMetricRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): CreateSecurityMetricRequestProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): CreateSecurityMetricRequestProto;

    hasSeries(): boolean;
    clearSeries(): void;
    getSeries(): fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto | undefined;
    setSeries(value?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto): CreateSecurityMetricRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSecurityMetricRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSecurityMetricRequestProto): CreateSecurityMetricRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSecurityMetricRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSecurityMetricRequestProto;
    static deserializeBinaryFromReader(message: CreateSecurityMetricRequestProto, reader: jspb.BinaryReader): CreateSecurityMetricRequestProto;
}

export namespace CreateSecurityMetricRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        series?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto.AsObject,
    }
}

export class CreateSecurityMetricResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): CreateSecurityMetricResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): CreateSecurityMetricResponseProto;
    getOperationType(): fintekkers_requests_util_operation_pb.RequestOperationTypeProto;
    setOperationType(value: fintekkers_requests_util_operation_pb.RequestOperationTypeProto): CreateSecurityMetricResponseProto;

    hasSeries(): boolean;
    clearSeries(): void;
    getSeries(): fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto | undefined;
    setSeries(value?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto): CreateSecurityMetricResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateSecurityMetricResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: CreateSecurityMetricResponseProto): CreateSecurityMetricResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateSecurityMetricResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateSecurityMetricResponseProto;
    static deserializeBinaryFromReader(message: CreateSecurityMetricResponseProto, reader: jspb.BinaryReader): CreateSecurityMetricResponseProto;
}

export namespace CreateSecurityMetricResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        operationType: fintekkers_requests_util_operation_pb.RequestOperationTypeProto,
        series?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto.AsObject,
    }
}
