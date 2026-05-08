// source: fintekkers/models/security/asset_class.proto
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

goog.exportSymbol('proto.fintekkers.models.security.AssetClassProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.security.AssetClassProto = {
  UNKNOWN_ASSET_CLASS: 0,
  FIXED_INCOME: 1,
  EQUITY: 2,
  CASH_ASSET_CLASS: 3,
  INDEX: 4,
  VOLATILITY: 5
};

goog.object.extend(exports, proto.fintekkers.models.security);
