// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_portfolio_create_portfolio_request_pb = require('../../../fintekkers/requests/portfolio/create_portfolio_request_pb.js');
var fintekkers_requests_portfolio_create_portfolio_response_pb = require('../../../fintekkers/requests/portfolio/create_portfolio_response_pb.js');
var fintekkers_requests_portfolio_query_portfolio_request_pb = require('../../../fintekkers/requests/portfolio/query_portfolio_request_pb.js');
var fintekkers_requests_portfolio_query_portfolio_response_pb = require('../../../fintekkers/requests/portfolio/query_portfolio_response_pb.js');
var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js');

function serialize_fintekkers_requests_portfolio_CreatePortfolioRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.portfolio.CreatePortfolioRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_portfolio_CreatePortfolioRequestProto(buffer_arg) {
  return fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_portfolio_CreatePortfolioResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.portfolio.CreatePortfolioResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_portfolio_CreatePortfolioResponseProto(buffer_arg) {
  return fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.portfolio.QueryPortfolioRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto(buffer_arg) {
  return fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.portfolio.QueryPortfolioResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto(buffer_arg) {
  return fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
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


var PortfolioService = exports.PortfolioService = {
  createOrUpdate: {
    path: '/fintekkers.services.portfolio_service.Portfolio/CreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
    responseType: fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto,
    requestSerialize: serialize_fintekkers_requests_portfolio_CreatePortfolioRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_portfolio_CreatePortfolioRequestProto,
    responseSerialize: serialize_fintekkers_requests_portfolio_CreatePortfolioResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_portfolio_CreatePortfolioResponseProto,
  },
  getByIds: {
    path: '/fintekkers.services.portfolio_service.Portfolio/GetByIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    responseType: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto,
    requestSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    responseSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto,
  },
  search: {
    path: '/fintekkers.services.portfolio_service.Portfolio/Search',
    requestStream: false,
    responseStream: true,
    requestType: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    responseType: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto,
    requestSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    responseSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto,
  },
  listIds: {
    path: '/fintekkers.services.portfolio_service.Portfolio/ListIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    responseType: fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto,
    requestSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    responseSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioResponseProto,
  },
  validateCreateOrUpdate: {
    path: '/fintekkers.services.portfolio_service.Portfolio/ValidateCreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_portfolio_CreatePortfolioRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_portfolio_CreatePortfolioRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
  validateQueryRequest: {
    path: '/fintekkers.services.portfolio_service.Portfolio/ValidateQueryRequest',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_portfolio_QueryPortfolioRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
};

exports.PortfolioClient = grpc.makeGenericClientConstructor(PortfolioService, 'Portfolio');
