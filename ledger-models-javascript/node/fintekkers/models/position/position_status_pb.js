// source: fintekkers/models/position/position_status.proto
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

goog.exportSymbol('proto.fintekkers.models.position.PositionStatusProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.position.PositionStatusProto = {
  UNKNOWN: 0,
  HYPOTHETICAL: 1,
  INTENDED: 2,
  EXECUTED: 3
};

goog.object.extend(exports, proto.fintekkers.models.position);
