/**
 * @fileoverview gRPC-Web generated client stub for fintekkers.services.position_service
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.4.2
// 	protoc              v3.20.3
// source: fintekkers/services/position-service/position_service.proto


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var fintekkers_requests_position_query_position_request_pb = require('../../../fintekkers/requests/position/query_position_request_pb.js')

var fintekkers_requests_position_query_position_response_pb = require('../../../fintekkers/requests/position/query_position_response_pb.js')

var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js')
const proto = {};
proto.fintekkers = {};
proto.fintekkers.services = {};
proto.fintekkers.services.position_service = require('./position_service_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 * @struct
 * @final
 */
proto.fintekkers.services.position_service.PositionClient =
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
proto.fintekkers.services.position_service.PositionPromiseClient =
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
 *   !proto.fintekkers.requests.position.QueryPositionRequestProto,
 *   !proto.fintekkers.requests.position.QueryPositionResponseProto>}
 */
const methodDescriptor_Position_Search = new grpc.web.MethodDescriptor(
  '/fintekkers.services.position_service.Position/Search',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
  fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto,
  /**
   * @param {!proto.fintekkers.requests.position.QueryPositionRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.position.QueryPositionRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.position.QueryPositionResponseProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.position.QueryPositionResponseProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.position_service.PositionClient.prototype.search =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.position_service.Position/Search',
      request,
      metadata || {},
      methodDescriptor_Position_Search,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.position.QueryPositionRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.position.QueryPositionResponseProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.position_service.PositionPromiseClient.prototype.search =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.position_service.Position/Search',
      request,
      metadata || {},
      methodDescriptor_Position_Search);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.fintekkers.requests.position.QueryPositionRequestProto,
 *   !proto.fintekkers.requests.util.errors.SummaryProto>}
 */
const methodDescriptor_Position_ValidateQueryRequest = new grpc.web.MethodDescriptor(
  '/fintekkers.services.position_service.Position/ValidateQueryRequest',
  grpc.web.MethodType.UNARY,
  fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
  fintekkers_requests_util_errors_summary_pb.SummaryProto,
  /**
   * @param {!proto.fintekkers.requests.position.QueryPositionRequestProto} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  fintekkers_requests_util_errors_summary_pb.SummaryProto.deserializeBinary
);


/**
 * @param {!proto.fintekkers.requests.position.QueryPositionRequestProto} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.RpcError, ?proto.fintekkers.requests.util.errors.SummaryProto)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.fintekkers.requests.util.errors.SummaryProto>|undefined}
 *     The XHR Node Readable Stream
 */
proto.fintekkers.services.position_service.PositionClient.prototype.validateQueryRequest =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/fintekkers.services.position_service.Position/ValidateQueryRequest',
      request,
      metadata || {},
      methodDescriptor_Position_ValidateQueryRequest,
      callback);
};


/**
 * @param {!proto.fintekkers.requests.position.QueryPositionRequestProto} request The
 *     request proto
 * @param {?Object<string, string>=} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.fintekkers.requests.util.errors.SummaryProto>}
 *     Promise that resolves to the response
 */
proto.fintekkers.services.position_service.PositionPromiseClient.prototype.validateQueryRequest =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/fintekkers.services.position_service.Position/ValidateQueryRequest',
      request,
      metadata || {},
      methodDescriptor_Position_ValidateQueryRequest);
};


module.exports = proto.fintekkers.services.position_service;

