/**
 * @fileoverview gRPC-Web generated client stub for fintekkers.services.portfolio_service
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.4.2
// 	protoc              v3.20.3
// source: fintekkers/services/portfolio-service/portfolio_service.proto


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var fintekkers_requests_portfolio_create_portfolio_request_pb = require('../../../fintekkers/requests/portfolio/create_portfolio_request_pb.js')

var fintekkers_requests_portfolio_create_portfolio_response_pb = require('../../../fintekkers/requests/portfolio/create_portfolio_response_pb.js')

var fintekkers_requests_portfolio_query_portfolio_request_pb = require('../../../fintekkers/requests/portfolio/query_portfolio_request_pb.js')

var fintekkers_requests_portfolio_query_portfolio_response_pb = require('../../../fintekkers/requests/portfolio/query_portfolio_response_pb.js')

var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js')
const proto = {};
proto.fintekkers = {};
proto.fintekkers.services = {};
proto.fintekkers.services.portfolio_service = require('./portfolio_service_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.fintekkers.services.portfolio_service.PortfolioClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options.format = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname.replace(/\/+$/, '');

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options.format = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname.replace(/\/+$/, '');

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto,
 *   !proto.fintekkers.requests.portfolio.CreatePortfolioResponseProto>}
 */
const methodDescriptor_Portfolio_CreateOrUpdate = new grpc.web.MethodDescriptor(
  '/fintekkers.services.portfolio_service.Portfolio/CreateOrUpdate',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
  fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto,
  /**
   * @param {!proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_portfolio_create_portfolio_response_pb.CreatePortfolioResponseProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.portfolio.CreatePortfolioResponseProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.portfolio.CreatePortfolioResponseProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioClient.prototype.createOrUpdate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/CreateOrUpdate',
      request,
      metadata || {},
      methodDescriptor_Portfolio_CreateOrUpdate,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.portfolio.CreatePortfolioResponseProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient.prototype.createOrUpdate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/CreateOrUpdate',
      request,
      metadata || {},
      methodDescriptor_Portfolio_CreateOrUpdate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto,
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 */
const methodDescriptor_Portfolio_GetByIds = new grpc.web.MethodDescriptor(
  '/fintekkers.services.portfolio_service.Portfolio/GetByIds',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
  fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto,
  /**
   * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioClient.prototype.getByIds =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/GetByIds',
      request,
      metadata || {},
      methodDescriptor_Portfolio_GetByIds,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient.prototype.getByIds =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/GetByIds',
      request,
      metadata || {},
      methodDescriptor_Portfolio_GetByIds);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto,
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 */
const methodDescriptor_Portfolio_Search = new grpc.web.MethodDescriptor(
  '/fintekkers.services.portfolio_service.Portfolio/Search',
  grpc.web.MethodType.SERVER_STREAMING,
  fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
  fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto,
  /**
   * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioClient.prototype.search =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/Search',
      request,
      metadata || {},
      methodDescriptor_Portfolio_Search);
};


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient.prototype.search =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/Search',
      request,
      metadata || {},
      methodDescriptor_Portfolio_Search);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto,
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 */
const methodDescriptor_Portfolio_ListIds = new grpc.web.MethodDescriptor(
  '/fintekkers.services.portfolio_service.Portfolio/ListIds',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
  fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto,
  /**
   * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_portfolio_query_portfolio_response_pb.QueryPortfolioResponseProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioClient.prototype.listIds =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/ListIds',
      request,
      metadata || {},
      methodDescriptor_Portfolio_ListIds,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.portfolio.QueryPortfolioResponseProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient.prototype.listIds =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/ListIds',
      request,
      metadata || {},
      methodDescriptor_Portfolio_ListIds);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto,
 *   !proto.fintekkers.requests.util.errors.SummaryProto>}
 */
const methodDescriptor_Portfolio_ValidateCreateOrUpdate = new grpc.web.MethodDescriptor(
  '/fintekkers.services.portfolio_service.Portfolio/ValidateCreateOrUpdate',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_portfolio_create_portfolio_request_pb.CreatePortfolioRequestProto,
  fintekkers_requests_util_errors_summary_pb.SummaryProto,
  /**
   * @param {!proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_util_errors_summary_pb.SummaryProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.util.errors.SummaryProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.util.errors.SummaryProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioClient.prototype.validateCreateOrUpdate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/ValidateCreateOrUpdate',
      request,
      metadata || {},
      methodDescriptor_Portfolio_ValidateCreateOrUpdate,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.portfolio.CreatePortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.util.errors.SummaryProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient.prototype.validateCreateOrUpdate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/ValidateCreateOrUpdate',
      request,
      metadata || {},
      methodDescriptor_Portfolio_ValidateCreateOrUpdate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto,
 *   !proto.fintekkers.requests.util.errors.SummaryProto>}
 */
const methodDescriptor_Portfolio_ValidateQueryRequest = new grpc.web.MethodDescriptor(
  '/fintekkers.services.portfolio_service.Portfolio/ValidateQueryRequest',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_portfolio_query_portfolio_request_pb.QueryPortfolioRequestProto,
  fintekkers_requests_util_errors_summary_pb.SummaryProto,
  /**
   * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_util_errors_summary_pb.SummaryProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.util.errors.SummaryProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.util.errors.SummaryProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.portfolio_service.PortfolioClient.prototype.validateQueryRequest =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/ValidateQueryRequest',
      request,
      metadata || {},
      methodDescriptor_Portfolio_ValidateQueryRequest,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.portfolio.QueryPortfolioRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.util.errors.SummaryProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.portfolio_service.PortfolioPromiseClient.prototype.validateQueryRequest =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.portfolio_service.Portfolio/ValidateQueryRequest',
      request,
      metadata || {},
      methodDescriptor_Portfolio_ValidateQueryRequest);
};


module.exports = proto.fintekkers.services.portfolio_service;

