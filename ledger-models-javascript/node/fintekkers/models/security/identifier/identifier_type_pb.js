// source: fintekkers/models/security/identifier/identifier_type.proto
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

goog.exportSymbol('proto.fintekkers.models.security.IdentifierTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.security.IdentifierTypeProto = {
  UNKNOWN_IDENTIFIER_TYPE: 0,
  EXCH_TICKER: 1,
  ISIN: 2,
  CUSIP: 3,
  OSI: 4,
  FIGI: 5,
  SERIES_ID: 6,
  CASH: 50
};

goog.object.extend(exports, proto.fintekkers.models.security);
