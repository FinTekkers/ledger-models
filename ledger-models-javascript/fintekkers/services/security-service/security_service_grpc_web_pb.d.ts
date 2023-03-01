import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_security_create_security_request_pb from '../../../fintekkers/requests/security/create_security_request_pb';
import * as fintekkers_requests_security_create_security_response_pb from '../../../fintekkers/requests/security/create_security_response_pb';
import * as fintekkers_requests_security_query_security_request_pb from '../../../fintekkers/requests/security/query_security_request_pb';
import * as fintekkers_requests_security_query_security_response_pb from '../../../fintekkers/requests/security/query_security_response_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class SecurityClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_security_create_security_response_pb.CreateSecurityResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_security_create_security_response_pb.CreateSecurityResponseProto>;

  getByIDs(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto>;

  search(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto>;

  listIDs(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

export class SecurityPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_security_create_security_response_pb.CreateSecurityResponseProto>;

  getByIDs(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto>;

  search(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto>;

  listIDs(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

