// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var fintekkers_requests_index_composition_get_index_composition_request_pb = require('../../../fintekkers/requests/index_composition/get_index_composition_request_pb.js');
var fintekkers_requests_index_composition_create_index_composition_request_pb = require('../../../fintekkers/requests/index_composition/create_index_composition_request_pb.js');

function serialize_fintekkers_requests_index_composition_CreateIndexCompositionRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.index_composition.CreateIndexCompositionRequestProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_index_composition_CreateIndexCompositionRequestProto(buffer_arg) {
  return fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_index_composition_CreateIndexCompositionResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.index_composition.CreateIndexCompositionResponseProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_index_composition_CreateIndexCompositionResponseProto(buffer_arg) {
  return fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_index_composition_GetIndexCompositionRequestProto(arg) {
  if (!(arg instanceof fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto)) {
    throw new Error('Expected argument of type fintekkers.requests.index_composition.GetIndexCompositionRequestProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_index_composition_GetIndexCompositionRequestProto(buffer_arg) {
  return fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fintekkers_requests_index_composition_GetIndexCompositionResponseProto(arg) {
  if (!(arg instanceof fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto)) {
    throw new Error('Expected argument of type fintekkers.requests.index_composition.GetIndexCompositionResponseProto');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_fintekkers_requests_index_composition_GetIndexCompositionResponseProto(buffer_arg) {
  return fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto.deserializeBinary(new Uint8Array(buffer_arg));
}


var IndexCompositionService = exports.IndexCompositionService = {
  // Store (or replace) an IndexCompositionProto record.
  // If a record with the same (index_uuid, effective_date) already exists it is
  // replaced (last-writer-wins). A UUID is auto-generated when absent.
  createOrUpdate: {
    path: '/fintekkers.services.index_composition_service.IndexComposition/CreateOrUpdate',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionRequestProto,
    responseType: fintekkers_requests_index_composition_create_index_composition_request_pb.CreateIndexCompositionResponseProto,
    requestSerialize: serialize_fintekkers_requests_index_composition_CreateIndexCompositionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_index_composition_CreateIndexCompositionRequestProto,
    responseSerialize: serialize_fintekkers_requests_index_composition_CreateIndexCompositionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_index_composition_CreateIndexCompositionResponseProto,
  },
  // Temporal resolution: return the composition of the given index that was
  // active on as_of_date. Returns the most recent composition where
  // effective_date <= as_of_date.
  //
  // This is the primary query for analytics and portfolio valuation.
  // It is the equity-index analogue of PriceService.Search(security, as_of).
  getIndexComposition: {
    path: '/fintekkers.services.index_composition_service.IndexComposition/GetIndexComposition',
    requestStream: false,
    responseStream: false,
    requestType: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionRequestProto,
    responseType: fintekkers_requests_index_composition_get_index_composition_request_pb.GetIndexCompositionResponseProto,
    requestSerialize: serialize_fintekkers_requests_index_composition_GetIndexCompositionRequestProto,
    requestDeserialize: deserialize_fintekkers_requests_index_composition_GetIndexCompositionRequestProto,
    responseSerialize: serialize_fintekkers_requests_index_composition_GetIndexCompositionResponseProto,
    responseDeserialize: deserialize_fintekkers_requests_index_composition_GetIndexCompositionResponseProto,
  },
};

exports.IndexCompositionClient = grpc.makeGenericClientConstructor(IndexCompositionService);
