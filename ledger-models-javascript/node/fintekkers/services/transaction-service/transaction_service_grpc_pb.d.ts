// package: fintekkers.services.transaction_service
// file: fintekkers/services/transaction-service/transaction_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_transaction_service_transaction_service_pb from "../../../fintekkers/services/transaction-service/transaction_service_pb";
import * as fintekkers_requests_transaction_create_transaction_request_pb from "../../../fintekkers/requests/transaction/create_transaction_request_pb";
import * as fintekkers_requests_transaction_create_transaction_response_pb from "../../../fintekkers/requests/transaction/create_transaction_response_pb";
import * as fintekkers_requests_transaction_query_transaction_request_pb from "../../../fintekkers/requests/transaction/query_transaction_request_pb";
import * as fintekkers_requests_transaction_query_transaction_response_pb from "../../../fintekkers/requests/transaction/query_transaction_response_pb";
import * as fintekkers_requests_util_errors_summary_pb from "../../../fintekkers/requests/util/errors/summary_pb";
import * as fintekkers_requests_util_delete_request_pb from "../../../fintekkers/requests/util/delete_request_pb";

interface ITransactionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: ITransactionService_ICreateOrUpdate;
    getByIds: ITransactionService_IGetByIds;
    search: ITransactionService_ISearch;
    listIds: ITransactionService_IListIds;
    delete: ITransactionService_IDelete;
    validateCreateOrUpdate: ITransactionService_IValidateCreateOrUpdate;
    validateQueryRequest: ITransactionService_IValidateQueryRequest;
}

interface ITransactionService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto> {
    path: "/fintekkers.services.transaction_service.Transaction/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;
}
interface ITransactionService_IGetByIds extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto> {
    path: "/fintekkers.services.transaction_service.Transaction/GetByIds";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
}
interface ITransactionService_ISearch extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto> {
    path: "/fintekkers.services.transaction_service.Transaction/Search";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
}
interface ITransactionService_IListIds extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto> {
    path: "/fintekkers.services.transaction_service.Transaction/ListIds";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
}
interface ITransactionService_IDelete extends grpc.MethodDefinition<fintekkers_requests_util_delete_request_pb.DeleteRequestProto, fintekkers_requests_util_delete_request_pb.DeleteResponseProto> {
    path: "/fintekkers.services.transaction_service.Transaction/Delete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_util_delete_request_pb.DeleteRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_util_delete_request_pb.DeleteRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_delete_request_pb.DeleteResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_delete_request_pb.DeleteResponseProto>;
}
interface ITransactionService_IValidateCreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.transaction_service.Transaction/ValidateCreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}
interface ITransactionService_IValidateQueryRequest extends grpc.MethodDefinition<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto> {
    path: "/fintekkers.services.transaction_service.Transaction/ValidateQueryRequest";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export const TransactionService: ITransactionService;

export interface ITransactionServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;
    getByIds: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    search: grpc.handleServerStreamingCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    listIds: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    delete: grpc.handleUnaryCall<fintekkers_requests_util_delete_request_pb.DeleteRequestProto, fintekkers_requests_util_delete_request_pb.DeleteResponseProto>;
    validateCreateOrUpdate: grpc.handleUnaryCall<fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
    validateQueryRequest: grpc.handleUnaryCall<fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, fintekkers_requests_util_errors_summary_pb.SummaryProto>;
}

export interface ITransactionClient {
    createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    getByIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    getByIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    getByIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    listIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    listIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    listIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}

export class TransactionClient extends grpc.Client implements ITransactionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public getByIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public getByIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public getByIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    public search(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;
    public listIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public listIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public listIds(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void): grpc.ClientUnaryCall;
    public delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    public delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    public delete(request: fintekkers_requests_util_delete_request_pb.DeleteRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_delete_request_pb.DeleteResponseProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateCreateOrUpdate(request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
    public validateQueryRequest(request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void): grpc.ClientUnaryCall;
}
