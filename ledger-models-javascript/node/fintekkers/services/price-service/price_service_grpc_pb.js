// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_price_query_price_request_pb = require('../../../fintekkers/requests/price/query_price_request_pb.js');
var fintekkers_requests_price_query_price_response_pb = require('../../../fintekkers/requests/price/query_price_response_pb.js');
var fintekkers_requests_price_create_price_request_pb = require('../../../fintekkers/requests/price/create_price_request_pb.js');
var fintekkers_requests_price_create_price_response_pb = require('../../../fintekkers/requests/price/create_price_response_pb.js');
var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js');

function serialize_fintekkers_requests_price_CreatePriceRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.price.CreatePriceRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_price_CreatePriceRequestProto(buffer_arg) {
  return fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_price_CreatePriceResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.price.CreatePriceResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_price_CreatePriceResponseProto(buffer_arg) {
  return fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_price_QueryPriceRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.price.QueryPriceRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_price_QueryPriceRequestProto(buffer_arg) {
  return fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_price_QueryPriceResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.price.QueryPriceResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_price_QueryPriceResponseProto(buffer_arg) {
  return fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_util_errors_SummaryProto(arg) {
  if (!(arg instanceof fintekkers_requests_util_errors_summary_pb.SummaryProto)) {
    throw new Error('Expected argument of type fintekkers.requests.util.errors.SummaryProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_util_errors_SummaryProto(buffer_arg) {
  return fintekkers_requests_util_errors_summary_pb.SummaryProto.deserializeBinary(new Uint8Array(buffer_arg));
}


var PriceService = exports.PriceService = {
  createOrUpdate: {
    path: '/fintekkers.services.price_service.Price/CreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto,
    responseType: fintekkers_requests_price_create_price_response_pb.CreatePriceResponseProto,
    requestSerialize: serialize_fintekkers_requests_price_CreatePriceRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_price_CreatePriceRequestProto,
    responseSerialize: serialize_fintekkers_requests_price_CreatePriceResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_price_CreatePriceResponseProto,
  },
  getByIds: {
    path: '/fintekkers.services.price_service.Price/GetByIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    responseType: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto,
    requestSerialize: serialize_fintekkers_requests_price_QueryPriceRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_price_QueryPriceRequestProto,
    responseSerialize: serialize_fintekkers_requests_price_QueryPriceResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_price_QueryPriceResponseProto,
  },
  search: {
    path: '/fintekkers.services.price_service.Price/Search',
    requestStream: false,
    responseStream: true,
    requestType: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    responseType: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto,
    requestSerialize: serialize_fintekkers_requests_price_QueryPriceRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_price_QueryPriceRequestProto,
    responseSerialize: serialize_fintekkers_requests_price_QueryPriceResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_price_QueryPriceResponseProto,
  },
  listIds: {
    path: '/fintekkers.services.price_service.Price/ListIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    responseType: fintekkers_requests_price_query_price_response_pb.QueryPriceResponseProto,
    requestSerialize: serialize_fintekkers_requests_price_QueryPriceRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_price_QueryPriceRequestProto,
    responseSerialize: serialize_fintekkers_requests_price_QueryPriceResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_price_QueryPriceResponseProto,
  },
  validateCreateOrUpdate: {
    path: '/fintekkers.services.price_service.Price/ValidateCreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_price_create_price_request_pb.CreatePriceRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_price_CreatePriceRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_price_CreatePriceRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
  validateQueryRequest: {
    path: '/fintekkers.services.price_service.Price/ValidateQueryRequest',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_price_query_price_request_pb.QueryPriceRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_price_QueryPriceRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_price_QueryPriceRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
};

exports.PriceClient = grpc.makeGenericClientConstructor(PriceService, 'Price');
