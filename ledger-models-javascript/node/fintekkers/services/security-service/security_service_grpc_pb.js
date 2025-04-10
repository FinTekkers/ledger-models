// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_security_query_security_request_pb = require('../../../fintekkers/requests/security/query_security_request_pb.js');
var fintekkers_requests_security_query_security_response_pb = require('../../../fintekkers/requests/security/query_security_response_pb.js');
var fintekkers_requests_security_create_security_request_pb = require('../../../fintekkers/requests/security/create_security_request_pb.js');
var fintekkers_requests_security_create_security_response_pb = require('../../../fintekkers/requests/security/create_security_response_pb.js');
var fintekkers_requests_security_get_fields_response_pb = require('../../../fintekkers/requests/security/get_fields_response_pb.js');
var fintekkers_requests_util_errors_summary_pb = require('../../../fintekkers/requests/util/errors/summary_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_fintekkers_requests_security_CreateSecurityRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.CreateSecurityRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_CreateSecurityRequestProto(buffer_arg) {
  return fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_CreateSecurityResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_create_security_response_pb.CreateSecurityResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.CreateSecurityResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_CreateSecurityResponseProto(buffer_arg) {
  return fintekkers_requests_security_create_security_response_pb.CreateSecurityResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_GetFieldsResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_get_fields_response_pb.GetFieldsResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.GetFieldsResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_GetFieldsResponseProto(buffer_arg) {
  return fintekkers_requests_security_get_fields_response_pb.GetFieldsResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_QuerySecurityRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.QuerySecurityRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_QuerySecurityRequestProto(buffer_arg) {
  return fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_QuerySecurityResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security.QuerySecurityResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_QuerySecurityResponseProto(buffer_arg) {
  return fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
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


var SecurityService = exports.SecurityService = {
  createOrUpdate: {
    path: '/fintekkers.services.security_service.Security/CreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto,
    responseType: fintekkers_requests_security_create_security_response_pb.CreateSecurityResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_CreateSecurityRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_CreateSecurityRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_CreateSecurityResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_CreateSecurityResponseProto,
  },
  getByIds: {
    path: '/fintekkers.services.security_service.Security/GetByIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    responseType: fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_QuerySecurityRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_QuerySecurityRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_QuerySecurityResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_QuerySecurityResponseProto,
  },
  search: {
    path: '/fintekkers.services.security_service.Security/Search',
    requestStream: false,
    responseStream: true,
    requestType: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    responseType: fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_QuerySecurityRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_QuerySecurityRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_QuerySecurityResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_QuerySecurityResponseProto,
  },
  listIds: {
    path: '/fintekkers.services.security_service.Security/ListIds',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    responseType: fintekkers_requests_security_query_security_response_pb.QuerySecurityResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_QuerySecurityRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_QuerySecurityRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_QuerySecurityResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_QuerySecurityResponseProto,
  },
  validateCreateOrUpdate: {
    path: '/fintekkers.services.security_service.Security/ValidateCreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_create_security_request_pb.CreateSecurityRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_security_CreateSecurityRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_CreateSecurityRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
  validateQueryRequest: {
    path: '/fintekkers.services.security_service.Security/ValidateQueryRequest',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_query_security_request_pb.QuerySecurityRequestProto,
    responseType: fintekkers_requests_util_errors_summary_pb.SummaryProto,
    requestSerialize: serialize_fintekkers_requests_security_QuerySecurityRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_QuerySecurityRequestProto,
    responseSerialize: serialize_fintekkers_requests_util_errors_SummaryProto,
    responseDeserialize: deserialize_fintekkers_requests_util_errors_SummaryProto,
  },
  getFields: {
    path: '/fintekkers.services.security_service.Security/GetFields',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: fintekkers_requests_security_get_fields_response_pb.GetFieldsResponseProto,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fintekkers_requests_security_GetFieldsResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_GetFieldsResponseProto,
  },
};

exports.SecurityClient = grpc.makeGenericClientConstructor(SecurityService);
