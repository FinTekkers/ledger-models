// source: fintekkers/models/transaction/transaction_type.proto
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

goog.exportSymbol('proto.fintekkers.models.transaction.TransactionTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.transaction.TransactionTypeProto = {
  UNKNOWN: 0,
  BUY: 1,
  SELL: 2,
  DEPOSIT: 3,
  WITHDRAWAL: 4,
  MATURATION: 5,
  MATURATION_OFFSET: 6
};

goog.object.extend(exports, proto.fintekkers.models.transaction);
