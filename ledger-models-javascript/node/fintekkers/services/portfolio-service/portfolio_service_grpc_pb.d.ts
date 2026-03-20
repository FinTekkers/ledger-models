// package: fintekkers.services.portfolio_service
// file: fintekkers/services/portfolio-service/portfolio_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_portfolio_service_portfolio_service_pb from "../../../fintekkers/services/portfolio-service/portfolio_service_pb";
import * as fintekkers_requests_portfolio_create_portfolio_request_pb from "../../../fintekkers/requests/portfolio/create_portfolio_request_pb";
import * as fintekkers_requests_portfolio_create_portfolio_response_pb from "../../../fintekkers/requests/portfolio/create_portfolio_response_pb";
import * as fintekkers_requests_portfolio_query_portfolio_request_pb from "../../../fintekkers/requests/portfolio/query_portfolio_request_pb";
import * as fintekkers_requests_portfolio_query_portfolio_response_pb from "../../../fintekkers/requests/portfolio/query_portfolio_response_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";
import * as fintekkers_requests_util_delete_request_pb from "../../../fintekkers/requests/util/delete_request_pb";

interface IPortfolioService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: IPortfolioService_ICreateOrUpdate;
    getByIds: IPortfolioService_IGetByIds;
    search: IPortfolioService_ISearch;
    listIds: IPortfolioService_IListIds;
    delete: IPortfolioService_IDelete;
    validateCreateOrUpdate: IPortfolioService_IValidateCreateOrUpdate;
    validateQueryRequest: IPortfolioService_IValidateQueryRequest;
}

interface IPortfolioService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;
}
interface IPortfolioService_IGetByIds extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/GetByIds";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
}
interface IPortfolioService_ISearch extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/Search";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
}
interface IPortfolioService_IListIds extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/ListIds";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
}
interface IPortfolioService_IDelete extends grpc.MethodDefinition<fintekkers_requests_util_delete_request_pb.DeleteRequestProto, fintekkers_requests_util_delete_request_pb.DeleteResponseProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/Delete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_util_delete_request_pb.DeleteRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_util_delete_request_pb.DeleteRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_delete_request_pb.DeleteResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_delete_request_pb.DeleteResponseProto>;
}
interface IPortfolioService_IValidateCreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/ValidateCreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}
interface IPortfolioService_IValidateQueryRequest extends grpc.MethodDefinition<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.portfolio_service.Portfolio/ValidateQueryRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export const PortfolioService: IPortfolioService;

export interface IPortfolioServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;
    getByIds: grpc.handleUnaryCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    search: grpc.handleServerStreamingCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    listIds: grpc.handleUnaryCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    delete: grpc.handleUnaryCall<fintekkers_requests_util_delete_request_pb.DeleteRequestProto, fintekkers_requests_util_delete_request_pb.DeleteResponseProto>;
    validateCreateOrUpdate: grpc.handleUnaryCall<fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    validateQueryRequest: grpc.handleUnaryCall<fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export interface IPortfolioClient {
    createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    getByIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    getByIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    getByIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    listIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    listIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    listIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}

export class PortfolioClient extends grpc.Client implements IPortfolioClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public getByIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public getByIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public getByIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    public search(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;
    public listIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public listIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public listIds(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void): grpc.ClientUnaryCall;
    public delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    public delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    public delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}
