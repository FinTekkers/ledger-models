// package: fintekkers.services.security_metric_service
// file: fintekkers/services/security-metric-service/security_metric_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_security_metric_service_security_metric_service_pb from "../../../fintekkers/services/security-metric-service/security_metric_service_pb";
import * as fintekkers_requests_security_metric_create_security_metric_request_pb from "../../../fintekkers/requests/security_metric/create_security_metric_request_pb";
import * as fintekkers_requests_security_metric_search_security_metric_request_pb from "../../../fintekkers/requests/security_metric/search_security_metric_request_pb";
import * as fintekkers_requests_security_metric_get_latest_security_metric_request_pb from "../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb";

interface ISecurityMetricService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: ISecurityMetricService_ICreateOrUpdate;
    search: ISecurityMetricService_ISearch;
    getLatest: ISecurityMetricService_IGetLatest;
}

interface ISecurityMetricService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto> {
    path: "/fintekkers.services.security_metric_service.SecurityMetric/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto>;
}
interface ISecurityMetricService_ISearch extends grpc.MethodDefinition<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto, fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto> {
    path: "/fintekkers.services.security_metric_service.SecurityMetric/Search";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
}
interface ISecurityMetricService_IGetLatest extends grpc.MethodDefinition<fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto> {
    path: "/fintekkers.services.security_metric_service.SecurityMetric/GetLatest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto>;
}

export const SecurityMetricService: ISecurityMetricService;

export interface ISecurityMetricServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto>;
    search: grpc.handleServerStreamingCall<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto, fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
    getLatest: grpc.handleUnaryCall<fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto>;
}

export interface ISecurityMetricClient {
    createOrUpdate(request: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
    search(request: fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
    getLatest(request: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    getLatest(request: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    getLatest(request: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
}

export class SecurityMetricClient extends grpc.Client implements ISecurityMetricClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
    public search(request: fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto>;
    public getLatest(request: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    public getLatest(request: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
    public getLatest(request: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto) => void): grpc.ClientUnaryCall;
}
