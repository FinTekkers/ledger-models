// source: fintekkers/models/security/security_type.proto
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

goog.exportSymbol('proto.fintekkers.models.security.SecurityTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.security.SecurityTypeProto = {
  UNKNOWN_SECURITY_TYPE: 0,
  CASH_SECURITY: 1,
  EQUITY_SECURITY: 2,
  BOND_SECURITY: 3,
  TIPS: 4,
  FRN: 5,
  INDEX_SECURITY: 6
};

goog.object.extend(exports, proto.fintekkers.models.security);
