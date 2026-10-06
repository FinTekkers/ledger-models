// package: fintekkers.requests.security
// file: fintekkers/requests/security/query_security_response.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as fintekkers_models_security_security_pb from "../../../fintekkers/models/security/security_pb";
import * as fintekkers_requests_security_query_security_request_pb from "../../../fintekkers/requests/security/query_security_request_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";

export class QuerySecurityResponseProto extends jspb.Message { 
    getObjectClass(): string;
    setObjectClass(value: string): QuerySecurityResponseProto;
    getVersion(): string;
    setVersion(value: string): QuerySecurityResponseProto;

    hasQuerySecurityInput(): boolean;
    clearQuerySecurityInput(): void;
    getQuerySecurityInput(): fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto | undefined;
    setQuerySecurityInput(value?: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto): QuerySecurityResponseProto;
    clearSecurityResponseList(): void;
    getSecurityResponseList(): Array<fintekkers_models_security_security_pb.SecurityProto>;
    setSecurityResponseList(value: Array<fintekkers_models_security_security_pb.SecurityProto>): QuerySecurityResponseProto;
    addSecurityResponse(value?: fintekkers_models_security_security_pb.SecurityProto, index?: number): fintekkers_models_security_security_pb.SecurityProto;
    clearErrorsOrWarningsList(): void;
    getErrorsOrWarningsList(): Array<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    setErrorsOrWarningsList(value: Array<fintekkers_requests_util_errors_summary_pb.SummaryProto>): QuerySecurityResponseProto;
    addErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto, index?: number): fintekkers_requests_util_errors_summary_pb.SummaryProto;
    getNextPageToken(): string;
    setNextPageToken(value: string): QuerySecurityResponseProto;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): QuerySecurityResponseProto.AsObject;
    static toObject(includeInstance: boolean, msg: QuerySecurityResponseProto): QuerySecurityResponseProto.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: QuerySecurityResponseProto, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): QuerySecurityResponseProto;
    static deserializeBinaryFromReader(message: QuerySecurityResponseProto, reader: jspb.BinaryReader): QuerySecurityResponseProto;
}

export namespace QuerySecurityResponseProto {
    export type AsObject = {
        objectClass: string,
        version: string,
        querySecurityInput?: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto.AsObject,
        securityResponseList: Array<fintekkers_models_security_security_pb.SecurityProto.AsObject>,
        errorsOrWarningsList: Array<fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject>,
        nextPageToken: string,
    }
}
