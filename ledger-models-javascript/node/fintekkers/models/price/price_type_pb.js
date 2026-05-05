// source: fintekkers/models/price/price_type.proto
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

goog.exportSymbol('proto.fintekkers.models.price.PriceTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.price.PriceTypeProto = {
  UNKNOWN_PRICE_TYPE: 0,
  ABSOLUTE: 1,
  PERCENTAGE: 2,
  BASIS_POINTS: 3,
  INDEX_LEVEL: 4
};

goog.object.extend(exports, proto.fintekkers.models.price);
