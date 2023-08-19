import * as jspb from 'google-protobuf'

import * as fintekkers_models_transaction_transaction_pb from '../../../fintekkers/models/transaction/transaction_pb';
import * as fintekkers_requests_transaction_query_transaction_request_pb from '../../../fintekkers/requests/transaction/query_transaction_request_pb';
import * as fintekkers_requests_util_errors_summary_pb from '../../../fintekkers/requests/util/errors/summary_pb';


export class QueryTransactionResponseProto extends jspb.Message {
  getObjectClass(): string;
  setObjectClass(value: string): QueryTransactionResponseProto;

  getVersion(): string;
  setVersion(value: string): QueryTransactionResponseProto;

  getCreateTransactionRequest(): fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto | undefined;
  setCreateTransactionRequest(value?: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto): QueryTransactionResponseProto;
  hasCreateTransactionRequest(): boolean;
  clearCreateTransactionRequest(): QueryTransactionResponseProto;

  getTransactionResponseList(): Array<fintekkers_models_transaction_transaction_pb.TransactionProto>;
  setTransactionResponseList(value: Array<fintekkers_models_transaction_transaction_pb.TransactionProto>): QueryTransactionResponseProto;
  clearTransactionResponseList(): QueryTransactionResponseProto;
  addTransactionResponse(value?: fintekkers_models_transaction_transaction_pb.TransactionProto, index?: number): fintekkers_models_transaction_transaction_pb.TransactionProto;

  getErrorsOrWarnings(): fintekkers_requests_util_errors_summary_pb.SummaryProto | undefined;
  setErrorsOrWarnings(value?: fintekkers_requests_util_errors_summary_pb.SummaryProto): QueryTransactionResponseProto;
  hasErrorsOrWarnings(): boolean;
  clearErrorsOrWarnings(): QueryTransactionResponseProto;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryTransactionResponseProto.AsObject;
  static toObject(includeInstance: boolean, msg: QueryTransactionResponseProto): QueryTransactionResponseProto.AsObject;
  static serializeBinaryToWriter(message: QueryTransactionResponseProto, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryTransactionResponseProto;
  static deserializeBinaryFromReader(message: QueryTransactionResponseProto, reader: jspb.BinaryReader): QueryTransactionResponseProto;
}

export namespace QueryTransactionResponseProto {
  export type AsObject = {
    objectClass: string,
    version: string,
    createTransactionRequest?: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto.AsObject,
    transactionResponseList: Array<fintekkers_models_transaction_transaction_pb.TransactionProto.AsObject>,
    errorsOrWarnings?: fintekkers_requests_util_errors_summary_pb.SummaryProto.AsObject,
  }
}

