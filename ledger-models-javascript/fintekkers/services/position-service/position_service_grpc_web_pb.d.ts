import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_position_query_position_request_pb from '../../../fintekkers/requests/position/query_position_request_pb';
import * as fintekkers_requests_position_query_position_response_pb from '../../../fintekkers/requests/position/query_position_response_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class PositionClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  search(
    request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;

  validateQueryRequest(
    request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

export class PositionPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  search(
    request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto>;

  validateQueryRequest(
    request: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

