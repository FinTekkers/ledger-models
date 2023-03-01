import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_portfolio_create_portfolio_request_pb from '../../../fintekkers/requests/portfolio/create_portfolio_request_pb';
import * as fintekkers_requests_portfolio_create_portfolio_response_pb from '../../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import * as fintekkers_requests_portfolio_query_portfolio_request_pb from '../../../fintekkers/requests/portfolio/query_portfolio_request_pb';
import * as fintekkers_requests_portfolio_query_portfolio_response_pb from '../../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class PortfolioClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;

  getByIDs(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;

  search(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;

  listIDs(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

export class PortfolioPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto>;

  getByIDs(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;

  search(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;

  listIDs(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

