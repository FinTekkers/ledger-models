// source: fintekkers/requests/util/operation.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

goog.exportSymbol('proto.fintekkers.requests.util.RequestOperationTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.requests.util.RequestOperationTypeProto = {
  UNKNOWN_OPERATION: 0,
  VALIDATE: 1,
  CREATE: 2,
  GET: 3,
  SEARCH: 4
};

goog.object.extend(exports, proto.fintekkers.requests.util);
