// source: fintekkers/models/security/day_count_convention.proto
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

goog.exportSymbol('proto.fintekkers.models.security.DayCountConventionProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.security.DayCountConventionProto = {
  UNKNOWN_DAY_COUNT: 0,
  ACT_ACT_ICMA: 1,
  THIRTY_360_US: 2,
  ACT_360: 3,
  ACT_365_FIXED: 4
};

goog.object.extend(exports, proto.fintekkers.models.security);
