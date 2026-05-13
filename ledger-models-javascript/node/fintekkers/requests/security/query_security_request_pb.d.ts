// package: fintekkers.requests.security
// file: fintekkers/requests/security/query_security_request.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_util_uuid_pb from "../../../fintekkers/models/util/uuid_pb";
import * as fintekkers_models_util_local_timestamp_pb from "../../../fintekkers/models/util/local_timestamp_pb";
import * as fintekkers_models_position_position_filter_pb from "../../../fintekkers/models/position/position_filter_pb";

export class QuerySecurityRequestProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QuerySecurityRequestProto;
    getVersion(): string;
    setVersion(value: string): QuerySecurityRequestProto;
    clearUuidsList(): void;
    getUuidsList(): Array<fintekkers_models_util_uuid_pb.UUIDProto>;
    setUuidsList(value: Array<fintekkers_models_util_uuid_pb.UUIDProto>): QuerySecurityRequestProto;
    addUuids(value?: fintekkers_models_util_uuid_pb.UUIDProto, index?: number): fintekkers_models_util_uuid_pb.UUIDProto;

    hasSearchSecurityInput(): boolean;
    clearSearchSecurityInput(): void;
    getSearchSecurityInput(): fintekkers_models_position_position_filter_pb.PositionFilterProto | undefined;
    setSearchSecurityInput(value?: fintekkers_models_position_position_filter_pb.PositionFilterProto): QuerySecurityRequestProto;

    hasAsOf(): boolean;
    clearAsOf(): void;
    getAsOf(): fintekkers_models_util_local_timestamp_pb.LocalTimestampProto | undefined;
    setAsOf(value?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto): QuerySecurityRequestProto;
    getNameFilter(): string;
    setNameFilter(value: string): QuerySecurityRequestProto;
    getLookthrough(): boolean;
    setLookthrough(value: boolean): QuerySecurityRequestProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QuerySecurityRequestProto.AsObject;
    static toObject(includeInstance: boolean, msg: QuerySecurityRequestProto): QuerySecurityRequestProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QuerySecurityRequestProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QuerySecurityRequestProto;
    static deserializeBinaryFromReader(message: QuerySecurityRequestProto, reader: jspb.BinaryReader): QuerySecurityRequestProto;
}

export namespace QuerySecurityRequestProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        uuidsList: Array<fintekkers_models_util_uuid_pb.UUIDProto.AsObject>,
        searchSecurityInput?: fintekkers_models_position_position_filter_pb.PositionFilterProto.AsObject,
        asOf?: fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.AsObject,
        nameFilter: string,
        lookthrough: boolean,
    }
}
