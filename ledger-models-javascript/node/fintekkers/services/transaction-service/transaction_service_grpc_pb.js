// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_transaction_create_transaction_request_pb = require('../../../fintekkers/requests/transaction/create_transaction_request_pb.js');
var fintekkers_requests_transaction_create_transaction_response_pb = require('../../../fintekkers/requests/transaction/create_transaction_response_pb.js');
var fintekkers_requests_transaction_query_transaction_request_pb = require('../../../fintekkers/requests/transaction/query_transaction_request_pb.js');
var fintekkers_requests_transaction_query_transaction_response_pb = require('../../../fintekkers/requests/transaction/query_transaction_response_pb.js');
var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js');

function serialize_fintekkers_requests_transaction_CreateTransactionRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.transaction.CreateTransactionRequestProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_transaction_CreateTransactionRequestProto(buffer_arg) {
  return fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_transaction_CreateTransactionResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.transaction.CreateTransactionResponseProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_transaction_CreateTransactionResponseProto(buffer_arg) {
  return fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_transaction_QueryTransactionRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.transaction.QueryTransactionRequestProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_transaction_QueryTransactionRequestProto(buffer_arg) {
  return fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_transaction_QueryTransactionResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.transaction.QueryTransactionResponseProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_transaction_QueryTransactionResponseProto(buffer_arg) {
  return fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_util_errors_SummaryProto(arg) {
  if (!(arg instanceof fintekkers_requests_util_errors_summary_pb.SummaryProto)) {
    throw new Error('Expected argument of type fintekkers.requests.util.errors.SummaryProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_util_errors_SummaryProto(buffer_arg) {
  return fintekkers_requests_util_errors_summary_pb.SummaryProto.deserializeBinary(new Uint8Array(buffer_arg));
}


var TransactionService = exports.TransactionService = {
  createOrUpdate: {
    path: '/fintekkers.services.transaction_service.Transaction/CreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto,
    responseType: fintekkers_requests_transaction_create_transaction_response_pb.CreateTransactionResponseProto,
    requestSerialize: serialize_fintekkers_requests_transaction_CreateTransactionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_transaction_CreateTransactionRequestProto,
    responseSerialize: serialize_fintekkers_requests_transaction_CreateTransactionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_transaction_CreateTransactionResponseProto,
  },
  getByIds: {
    path: '/fintekkers.services.transaction_service.Transaction/GetByIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    responseType: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto,
    requestSerialize: serialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    responseSerialize: serialize_fintekkers_requests_transaction_QueryTransactionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionResponseProto,
  },
  search: {
    path: '/fintekkers.services.transaction_service.Transaction/Search',
    requestStream: false,
    responseStream: true,
    requestType: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    responseType: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto,
    requestSerialize: serialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    responseSerialize: serialize_fintekkers_requests_transaction_QueryTransactionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionResponseProto,
  },
  listIds: {
    path: '/fintekkers.services.transaction_service.Transaction/ListIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    responseType: fintekkers_requests_transaction_query_transaction_response_pb.QueryTransactionResponseProto,
    requestSerialize: serialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    responseSerialize: serialize_fintekkers_requests_transaction_QueryTransactionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionResponseProto,
  },
  validateCreateOrUpdate: {
    path: '/fintekkers.services.transaction_service.Transaction/ValidateCreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_transaction_create_transaction_request_pb.CreateTransactionRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_transaction_CreateTransactionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_transaction_CreateTransactionRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
  validateQueryRequest: {
    path: '/fintekkers.services.transaction_service.Transaction/ValidateQueryRequest',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_transaction_query_transaction_request_pb.QueryTransactionRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_transaction_QueryTransactionRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
};

exports.TransactionClient = grpc.makeGenericClientConstructor(TransactionService);
