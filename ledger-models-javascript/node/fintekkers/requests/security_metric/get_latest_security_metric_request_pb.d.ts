// package: fintekkers.requests.security_metric
// file: fintekkers/requests/security_metric/get_latest_security_metric_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_security_security_metric_pb from "../../../fintekkers/models/security/security_metric_pb";
import * as fintekkers_models_security_security_metric_type_pb from "../../../fintekkers/models/security/security_metric_type_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";

export class GetLatestSecurityMetricRequestProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetLatestSecurityMetricRequestProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): GetLatestSecurityMetricRequestProto;
    clearSecurityIdsList(): void;
    getSecurityIdsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
    setSecurityIdsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): GetLatestSecurityMetricRequestProto;
    addSecurityIds(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;
    clearMetricsList(): void;
    getMetricsList(): Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>;
    setMetricsList(value: Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>): GetLatestSecurityMetricRequestProto;
    addMetrics(value: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto, index?: number): fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto;

    hasDate(): boolean;
    clearDate(): void;
    getDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): GetLatestSecurityMetricRequestProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): GetLatestSecurityMetricRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLatestSecurityMetricRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetLatestSecurityMetricRequestProto): GetLatestSecurityMetricRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLatestSecurityMetricRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLatestSecurityMetricRequestProto;
    static deserializeBinaryFromReader(message: GetLatestSecurityMetricRequestProto, reader: jspb.BinaryReader): GetLatestSecurityMetricRequestProto;
}

export namespace GetLatestSecurityMetricRequestProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        securityIdsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
        metricsList: Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>,
        date?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    }
}

export class GetLatestSecurityMetricResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): GetLatestSecurityMetricResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): GetLatestSecurityMetricResponseProto;
    clearSeriesList(): void;
    getSeriesList(): Array<fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto>;
    setSeriesList(value: Array<fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto>): GetLatestSecurityMetricResponseProto;
    addSeries(value?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto, index?: number): fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetLatestSecurityMetricResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: GetLatestSecurityMetricResponseProto): GetLatestSecurityMetricResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetLatestSecurityMetricResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetLatestSecurityMetricResponseProto;
    static deserializeBinaryFromReader(message: GetLatestSecurityMetricResponseProto, reader: jspb.BinaryReader): GetLatestSecurityMetricResponseProto;
}

export namespace GetLatestSecurityMetricResponseProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        seriesList: Array<fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto.AsObject>,
    }
}
