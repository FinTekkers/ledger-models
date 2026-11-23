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


// Per-security metric series such as shares outstanding, NAV per share and
// total net assets (LM-484). See SecurityMetricSeriesProto and
// docs/adr/security_metric_series.md.
//
// Absent means unknown, never 0, in every RPC: a missing point is never
// filled with 0 or with another date's value.
var SecurityMetricService = exports.SecurityMetricService = {
  // Store the points of one series. One series per request.
//
// The server ignores the request's series.as_of and stamps its own receive
// time as the knowledge time of the write. Each point is an upsert keyed by
// (security_id, metric, observation_date):
//   - a new date is inserted;
//   - a correction (a different value for a date already stored) closes
//     the old stored row by setting its valid_to to the new as_of, then
//     stores the new value from that as_of. A query at an earlier as_of
//     still returns the old value;
//   - the same value again is a no-op;
//   - dates not in the request are untouched. There is no delete here.
//
// The response is the header only (security_id, metric and the stamped
// as_of) with zero points; the points are not echoed.
//
// Errors:
//   INVALID_ARGUMENT: no security_id; metric UNKNOWN_SECURITY_METRIC; zero
//     points; a point with no observation_date or no value; two points
//     with the same observation_date; a SHARES_OUTSTANDING value with a
//     fractional part.
//   NOT_FOUND: the security does not exist, where the server checks.
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
  // Every point of the requested metrics of one security with an
// observation_date in [start_date, end_date], as known at as_of (the
// request's, else the server's now).
//
// Stream rules:
//   - one series per (security, metric), metrics in request order (a
//     repeated metric once, at its first position);
//   - a long series is split into chunks: consecutive messages that each
//     repeat the same security_id, metric and as_of. Points ascend by
//     observation_date within and across chunks, with no date in two
//     chunks. The client appends the chunks' points to get the series.
//     Chunk size is the server's choice;
//   - every chunk has at least one point, except that a metric with no
//     points in the range yields exactly one message with zero points
//     (unknown, never 0);
//   - as_of on every message is the knowledge time used.
//
// Errors:
//   INVALID_ARGUMENT: no security_id; empty metrics; a metric
//     UNKNOWN_SECURITY_METRIC; start_date after end_date.
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
  // The latest point on or before the request's date for each distinct
// (security_id, metric) pair, as known at as_of (the request's, else the
// server's now).
//
// One series per pair, securities in request order then metrics in request
// order. Each series holds at most one point: the one with the latest
// observation_date on or before the date. A pair with no such point holds
// zero points, meaning unknown, never 0. A point is never carried forward
// past a later correction: the value is the one known at as_of.
//
// Errors:
//   INVALID_ARGUMENT: empty security_ids; empty metrics; a metric
//     UNKNOWN_SECURITY_METRIC; no date.
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
