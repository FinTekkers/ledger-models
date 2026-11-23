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

export class SecurityMetricProto extends jspb.Message { 
    getObjectType(): fintekkers_models_util_object_type_pb.ObjectTypeProto;
    setObjectType(value: fintekkers_models_util_object_type_pb.ObjectTypeProto): SecurityMetricProto;

    hasVersion(): boolean;
    clearVersion(): void;
    getVersion(): fintekkers_models_util_version_pb.VersionProto | undefined;
    setVersion(value?: fintekkers_models_util_version_pb.VersionProto): SecurityMetricProto;

    hasUuid(): boolean;
    clearUuid(): void;
    getUuid(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setUuid(value?: fintekkers_models_util_uuid_pb.UUIDProto): SecurityMetricProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityMetricProto;

    hasValidFrom(): boolean;
    clearValidFrom(): void;
    getValidFrom(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidFrom(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityMetricProto;

    hasValidTo(): boolean;
    clearValidTo(): void;
    getValidTo(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setValidTo(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): SecurityMetricProto;

    hasSecurityId(): boolean;
    clearSecurityId(): void;
    getSecurityId(): fintekkers_models_util_uuid_pb.UUIDProto | undefined;
    setSecurityId(value?: fintekkers_models_util_uuid_pb.UUIDProto): SecurityMetricProto;
    getMetric(): fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto;
    setMetric(value: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto): SecurityMetricProto;

    hasObservationDate(): boolean;
    clearObservationDate(): void;
    getObservationDate(): fintekkers_models_util_local_date_pb.LocalDateProto | undefined;
    setObservationDate(value?: fintekkers_models_util_local_date_pb.LocalDateProto): SecurityMetricProto;

    hasValue(): boolean;
    clearValue(): void;
    getValue(): fintekkers_models_util_decimal_value_pb.DecimalValueProto | undefined;
    setValue(value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto): SecurityMetricProto;
    getSource(): string;
    setSource(value: string): SecurityMetricProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecurityMetricProto.AsObject;
    static toObject(includeInstance: boolean, msg: SecurityMetricProto): SecurityMetricProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecurityMetricProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecurityMetricProto;
    static deserializeBinaryFromReader(message: SecurityMetricProto, reader: jspb.BinaryReader): SecurityMetricProto;
}

export namespace SecurityMetricProto {
    export type AsObject = {
        objectType: fintekkers_models_util_object_type_pb.ObjectTypeProto,
        version?: fintekkers_models_util_version_pb.VersionProto.AsObject,
        uuid?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validFrom?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        validTo?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        securityId?: fintekkers_models_util_uuid_pb.UUIDProto.AsObject,
        metric: fintekkers_models_security_security_metric_type_pb.SecurityMetricTypeProto,
        observationDate?: fintekkers_models_util_local_date_pb.LocalDateProto.AsObject,
        value?: fintekkers_models_util_decimal_value_pb.DecimalValueProto.AsObject,
        source: string,
    }
}
