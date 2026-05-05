// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_position_query_position_request_pb = require('../../../fintekkers/requests/position/query_position_request_pb.js');
var fintekkers_requests_position_query_position_response_pb = require('../../../fintekkers/requests/position/query_position_response_pb.js');
var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js');
var fintekkers_requests_security_get_field_values_request_pb = require('../../../fintekkers/requests/security/get_field_values_request_pb.js');
var fintekkers_requests_security_get_field_values_response_pb = require('../../../fintekkers/requests/security/get_field_values_response_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_fintekkers_requests_position_QueryPositionRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.position.QueryPositionRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_position_QueryPositionRequestProto(buffer_arg) {
  return fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_position_QueryPositionResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.position.QueryPositionResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_position_QueryPositionResponseProto(buffer_arg) {
  return fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_GetFieldValuesRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_get_field_values_request_pb.GetFieldValuesRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.GetFieldValuesRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_GetFieldValuesRequestProto(buffer_arg) {
  return fintekkers_requests_security_get_field_values_request_pb.GetFieldValuesRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_GetFieldValuesResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_get_field_values_response_pb.GetFieldValuesResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.GetFieldValuesResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_GetFieldValuesResponseProto(buffer_arg) {
  return fintekkers_requests_security_get_field_values_response_pb.GetFieldValuesResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var PositionService = exports.PositionService = {
  //    rpc GetByIds (position.QueryPositionRequestProto) returns (position.QueryPositionResponseProto);
search: {
    path: '/fintekkers.services.position_service.Position/Search',
    requestStream: false,
    responseStream: true,
    requestType: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
    responseType: fintekkers_requests_position_query_position_response_pb.QueryPositionResponseProto,
    requestSerialize: serialize_fintekkers_requests_position_QueryPositionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_position_QueryPositionRequestProto,
    responseSerialize: serialize_fintekkers_requests_position_QueryPositionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_position_QueryPositionResponseProto,
  },
  //    rpc ListIds (transaction.QueryTransactionRequestProto) returns (transaction.QueryTransactionResponseProto);
//    rpc ValidateCreateOrUpdate (transaction.CreateTransactionRequestProto) returns (util.errors.SummaryProto);
validateQueryRequest: {
    path: '/fintekkers.services.position_service.Position/ValidateQueryRequest',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_position_query_position_request_pb.QueryPositionRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_position_QueryPositionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_position_QueryPositionRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
  getFields: {
    path: '/fintekkers.services.position_service.Position/GetFields',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: fintekkers_requests_security_get_field_values_response_pb.GetFieldValuesResponseProto,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fintekkers_requests_security_GetFieldValuesResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_GetFieldValuesResponseProto,
  },
  getFieldValues: {
    path: '/fintekkers.services.position_service.Position/GetFieldValues',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_get_field_values_request_pb.GetFieldValuesRequestProto,
    responseType: fintekkers_requests_security_get_field_values_response_pb.GetFieldValuesResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_GetFieldValuesRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_GetFieldValuesRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_GetFieldValuesResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_GetFieldValuesResponseProto,
  },
};

exports.PositionClient = grpc.makeGenericClientConstructor(PositionService, 'Position');
