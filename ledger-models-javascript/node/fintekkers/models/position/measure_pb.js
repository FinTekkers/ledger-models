// source: fintekkers/models/position/measure.proto
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

goog.exportSymbol('proto.fintekkers.models.position.MeasureProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.position.MeasureProto = {
  UNKNOWN_MEASURE: 0,
  DIRECTED_QUANTITY: 1,
  MARKET_VALUE: 2,
  UNADJUSTED_COST_BASIS: 3,
  ADJUSTED_COST_BASIS: 4,
  CURRENT_YIELD: 5,
  YIELD_TO_MATURITY: 7,
  MACAULAY_DURATION: 8
};

goog.object.extend(exports, proto.fintekkers.models.position);
