// package: fintekkers.requests.security_metric
// file: fintekkers/requests/security_metric/search_security_metric_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_security_security_metric_pb from "../../../fintekkers/models/security/security_metric_pb";
import * as fintekkers_models_security_security_metric_type_pb from "../../../fintekkers/models/security/security_metric_type_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class SearchSecurityMetricRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): SearchSecurityMetricRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): SearchSecurityMetricRequestProto;

    hasSecurityId(): boolean;
    clearSecurityId(): void;
    getSecurityId(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setSecurityId(value?: fintekkers_models_util_uuid_pb.UUIDProto): SearchSecurityMetricRequestProto;
    clearMetricList(): void;
    getMetricList(): Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>;
    setMetricList(value: Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>): SearchSecurityMetricRequestProto;
    addMetric(value: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto, index?: number): fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto;

    hasFromDate(): boolean;
    clearFromDate(): void;
    getFromDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setFromDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SearchSecurityMetricRequestProto;

    hasToDate(): boolean;
    clearToDate(): void;
    getToDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setToDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SearchSecurityMetricRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SearchSecurityMetricRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: SearchSecurityMetricRequestProto): SearchSecurityMetricRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SearchSecurityMetricRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SearchSecurityMetricRequestProto;
    static deserializeBinaryFromReader(message: SearchSecurityMetricRequestProto, reader: jspb.BinaryReader): SearchSecurityMetricRequestProto;
}

export namespace SearchSecurityMetricRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        securityId?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        metricList: Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>,
        fromDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        toDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
    }
}

export class SearchSecurityMetricResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): SearchSecurityMetricResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): SearchSecurityMetricResponseProto;
    clearSecurityMetricResponseList(): void;
    getSecurityMetricResponseList(): Array<fintekkers_models_security_security_metric_pb.SecurityMetricProto>;
    setSecurityMetricResponseList(value: Array<fintekkers_models_security_security_metric_pb.SecurityMetricProto>): SearchSecurityMetricResponseProto;
    addSecurityMetricResponse(value?: fintekkers_models_security_security_metric_pb.SecurityMetricProto, index?: number): fintekkers_models_security_security_metric_pb.SecurityMetricProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SearchSecurityMetricResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: SearchSecurityMetricResponseProto): SearchSecurityMetricResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SearchSecurityMetricResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SearchSecurityMetricResponseProto;
    static deserializeBinaryFromReader(message: SearchSecurityMetricResponseProto, reader: jspb.BinaryReader): SearchSecurityMetricResponseProto;
}

export namespace SearchSecurityMetricResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        securityMetricResponseList: Array<fintekkers_models_security_security_metric_pb.SecurityMetricProto.AsObject>,
    }
}
