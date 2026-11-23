// package: fintekkers.requests.security_metric
// file: fintekkers/requests/security_metric/search_security_metric_request.proto

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
    clearMetricsList(): void;
    getMetricsList(): Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>;
    setMetricsList(value: Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>): SearchSecurityMetricRequestProto;
    addMetrics(value: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto, index?: number): fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto;

    hasStartDate(): boolean;
    clearStartDate(): void;
    getStartDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setStartDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SearchSecurityMetricRequestProto;

    hasEndDate(): boolean;
    clearEndDate(): void;
    getEndDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setEndDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SearchSecurityMetricRequestProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SearchSecurityMetricRequestProto;

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
        metricsList: Array<fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto>,
        startDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        endDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
    }
}

export class SearchSecurityMetricResponseProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): SearchSecurityMetricResponseProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): SearchSecurityMetricResponseProto;

    hasSeries(): boolean;
    clearSeries(): void;
    getSeries(): fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto | undefined;
    setSeries(value?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto): SearchSecurityMetricResponseProto;

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
        series?: fintekkers_models_security_security_metric_pb.SecurityMetricSeriesProto.AsObject,
    }
}
