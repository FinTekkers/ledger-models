// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_security_metric_create_security_metric_request_pb = require('../../../fintekkers/requests/security_metric/create_security_metric_request_pb.js');
var fintekkers_requests_security_metric_search_security_metric_request_pb = require('../../../fintekkers/requests/security_metric/search_security_metric_request_pb.js');
var fintekkers_requests_security_metric_get_latest_security_metric_request_pb = require('../../../fintekkers/requests/security_metric/get_latest_security_metric_request_pb.js');

function serialize_fintekkers_requests_security_metric_CreateSecurityMetricRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security_metric.CreateSecurityMetricRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_metric_CreateSecurityMetricRequestProto(buffer_arg) {
  return fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_metric_CreateSecurityMetricResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security_metric.CreateSecurityMetricResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_metric_CreateSecurityMetricResponseProto(buffer_arg) {
  return fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_metric_GetLatestSecurityMetricRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_metric_GetLatestSecurityMetricRequestProto(buffer_arg) {
  return fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_metric_GetLatestSecurityMetricResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_metric_GetLatestSecurityMetricResponseProto(buffer_arg) {
  return fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_metric_SearchSecurityMetricRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security_metric.SearchSecurityMetricRequestProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_metric_SearchSecurityMetricRequestProto(buffer_arg) {
  return fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_security_metric_SearchSecurityMetricResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.security_metric.SearchSecurityMetricResponseProto');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fintekkers_requests_security_metric_SearchSecurityMetricResponseProto(buffer_arg) {
  return fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}


// Dated security metrics (LM-482): figures about a security that are not
// prices, such as shares outstanding, NAV per share and total net assets.
// Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
//
// The rules every RPC follows:
//   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
//     or an amount in the security's currency.
//   - Absent is unknown: an observation that does not exist is left out of a
//     response, never sent as 0.
//   - A correction for the same (security_id, metric, observation_date) is a
//     new version with a later as_of. Reads return only the latest as_of
//     version of each.
//   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
//     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
//     value or observation_date on write, or a from_date after to_date.
var SecurityMetricService = exports.SecurityMetricService = {
  // Store one observation. A write for an existing (security_id, metric,
// observation_date) is a correction, stored as a new version with a later
// as_of.
createOrUpdate: {
    path: '/fintekkers.services.security_metric_service.SecurityMetric/CreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricRequestProto,
    responseType: fintekkers_requests_security_metric_create_security_metric_request_pb.CreateSecurityMetricResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_metric_CreateSecurityMetricRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_metric_CreateSecurityMetricRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_metric_CreateSecurityMetricResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_metric_CreateSecurityMetricResponseProto,
  },
  // Stream one security's observations with observation_date in
// [from_date, to_date] (inclusive; an unset bound is unbounded), for the
// requested metrics (empty means all), ordered by observation_date, then
// metric.
search: {
    path: '/fintekkers.services.security_metric_service.SecurityMetric/Search',
    requestStream: false,
    responseStream: true,
    requestType: fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricRequestProto,
    responseType: fintekkers_requests_security_metric_search_security_metric_request_pb.SearchSecurityMetricResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_metric_SearchSecurityMetricRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_metric_SearchSecurityMetricRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_metric_SearchSecurityMetricResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_metric_SearchSecurityMetricResponseProto,
  },
  // Latest on or before: for each (security_id, metric), the observation
// with the latest observation_date on or before date. At most one per
// pair; a pair with none is absent. An empty security_id list gives an
// empty response, not an error.
getLatest: {
    path: '/fintekkers.services.security_metric_service.SecurityMetric/GetLatest',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricRequestProto,
    responseType: fintekkers_requests_security_metric_get_latest_security_metric_request_pb.GetLatestSecurityMetricResponseProto,
    requestSerialize: serialize_fintekkers_requests_security_metric_GetLatestSecurityMetricRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_security_metric_GetLatestSecurityMetricRequestProto,
    responseSerialize: serialize_fintekkers_requests_security_metric_GetLatestSecurityMetricResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_security_metric_GetLatestSecurityMetricResponseProto,
  },
};

exports.SecurityMetricClient = grpc.makeGenericClientConstructor(SecurityMetricService, 'SecurityMetric');
