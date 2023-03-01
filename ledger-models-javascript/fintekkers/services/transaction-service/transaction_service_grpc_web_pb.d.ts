import * as grpcWeb from 'grpc-web';

import * as fintekkers_requests_transaction_create_transaction_request_pb from '../../../fintekkers/requests/transaction/create_transaction_request_pb';
import * as fintekkers_requests_transaction_create_transaction_response_pb from '../../../fintekkers/requests/transaction/create_transaction_response_pb';
import * as fintekkers_requests_transaction_query_transaction_request_pb from '../../../fintekkers/requests/transaction/query_transaction_request_pb';
import * as fintekkers_requests_transaction_query_transaction_response_pb from '../../../fintekkers/requests/transaction/query_transaction_response_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class TransactionClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;

  getByIDs(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;

  search(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;

  listIDs(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: fintekkers_requests_util_errors_summary_pb.SummaryProto) => void
  ): grpcWeb.ClientReadableStream<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

export class TransactionPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createOrUpdate(
    request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto>;

  getByIDs(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;

  search(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;

  listIDs(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto>;

  validateCreateOrUpdate(
    request: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

  validateQueryRequest(
    request: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    metadata?: grpcWeb.Metadata
  ): Promise<fintekkers_requests_util_errors_summary_pb.SummaryProto>;

}

