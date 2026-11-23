// package: fintekkers.models.security
// file: fintekkers/models/security/security_metric.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_decimal_value_pb from "../../../fintekkers/models/util/decimal_value_pb";
import * as fintekkers_models_util_local_date_pb from "../../../fintekkers/models/util/local_date_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_object_type_pb from "../../../fintekkers/models/util/object_type_pb";
import * as fintekkers_models_util_version_pb from "../../../fintekkers/models/util/version_pb";
import * as fintekkers_models_security_security_metric_type_pb from "../../../fintekkers/models/security/security_metric_type_pb";

export class SecurityMetricSeriesProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): SecurityMetricSeriesProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): SecurityMetricSeriesProto;

    hasSecurityId(): boolean;
    clearSecurityId(): void;
    getSecurityId(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setSecurityId(value?: fintekkers_models_util_uuid_pb.UUIDProto): SecurityMetricSeriesProto;
    getMetric(): fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto;
    setMetric(value: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto): SecurityMetricSeriesProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityMetricSeriesProto;
    clearPointsList(): void;
    getPointsList(): Array<SecurityMetricPointProto>;
    setPointsList(value: Array<SecurityMetricPointProto>): SecurityMetricSeriesProto;
    addPoints(value?: SecurityMetricPointProto, index?: number): SecurityMetricPointProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityMetricSeriesProto.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityMetricSeriesProto): SecurityMetricSeriesProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityMetricSeriesProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityMetricSeriesProto;
    static deserializeBinaryFromReader(message: SecurityMetricSeriesProto, reader: jspb.BinaryReader): SecurityMetricSeriesProto;
}

export namespace SecurityMetricSeriesProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        securityId?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        metric: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        pointsList: Array<SecurityMetricPointProto.AsObject>,
    }
}

export class SecurityMetricPointProto extends jspb.Message { 

    hasObservationDate(): boolean;
    clearObservationDate(): void;
    getObservationDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setObservationDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityMetricPointProto;

    hasValue(): boolean;
    clearValue(): void;
    getValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityMetricPointProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityMetricPointProto.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityMetricPointProto): SecurityMetricPointProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityMetricPointProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityMetricPointProto;
    static deserializeBinaryFromReader(message: SecurityMetricPointProto, reader: jspb.BinaryReader): SecurityMetricPointProto;
}

export namespace SecurityMetricPointProto {
    export type AsObject = {
        observationDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
    }
}
