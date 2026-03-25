// package: fintekkers.services.index_composition_service
// file: fintekkers/services/index-composition-service/index_composition_service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as fintekkers_services_index_composition_service_index_composition_service_pb from "../../../fintekkers/services/index-composition-service/index_composition_service_pb";
import * as fintekkers_requests_index_composition_get_index_composition_request_pb from "../../../fintekkers/requests/index_composition/get_index_composition_request_pb";
import * as fintekkers_requests_index_composition_create_index_composition_request_pb from "../../../fintekkers/requests/index_composition/create_index_composition_request_pb";

interface IIndexCompositionService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createOrUpdate: IIndexCompositionService_ICreateOrUpdate;
    getIndexComposition: IIndexCompositionService_IGetIndexComposition;
}

interface IIndexCompositionService_ICreateOrUpdate extends grpc.MethodDefinition<fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto> {
    path: "/fintekkers.services.index_composition_service.IndexComposition/CreateOrUpdate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto>;
}
interface IIndexCompositionService_IGetIndexComposition extends grpc.MethodDefinition<fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto> {
    path: "/fintekkers.services.index_composition_service.IndexComposition/GetIndexComposition";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto>;
    requestDeserialize: grpc.deserialize<fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto>;
    responseSerialize: grpc.serialize<fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto>;
    responseDeserialize: grpc.deserialize<fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto>;
}

export const IndexCompositionService: IIndexCompositionService;

export interface IIndexCompositionServer extends grpc.UntypedServiceImplementation {
    createOrUpdate: grpc.handleUnaryCall<fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto>;
    getIndexComposition: grpc.handleUnaryCall<fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto>;
}

export interface IIndexCompositionClient {
    createOrUpdate(request: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    createOrUpdate(request: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    getIndexComposition(request: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    getIndexComposition(request: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    getIndexComposition(request: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
}

export class IndexCompositionClient extends grpc.Client implements IIndexCompositionClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createOrUpdate(request: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    public createOrUpdate(request: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    public getIndexComposition(request: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    public getIndexComposition(request: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
    public getIndexComposition(request: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto) => void): grpc.ClientUnaryCall;
}
