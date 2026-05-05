// source: fintekkers/models/position/field.proto
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

goog.exportSymbol('proto.fintekkers.models.position.FieldProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.position.FieldProto = {
  UNKNOWN_FIELD: 0,
  ID: 1,
  AS_OF: 2,
  EFFECTIVE_DATE: 10,
  STRATEGY: 11,
  SECURITY: 12,
  SECURITY_DESCRIPTION: 61,
  SECURITY_ISSUER_NAME: 62,
  CASH_IMPACT_SECURITY: 13,
  ASSET_CLASS: 50,
  PRODUCT_CLASS: 51,
  PRODUCT_TYPE: 52,
  SECURITY_ID: 53,
  IDENTIFIER: 54,
  TENOR: 55,
  ISSUE_DATE: 58,
  MATURITY_DATE: 56,
  ADJUSTED_TENOR: 57,
  PORTFOLIO: 14,
  PORTFOLIO_ID: 15,
  PORTFOLIO_NAME: 60,
  PRICE: 16,
  PRICE_ID: 17,
  IS_CANCELLED: 18,
  POSITION_STATUS: 19,
  TRADE_DATE: 30,
  SETTLEMENT_DATE: 31,
  TRANSACTION_TYPE: 32,
  TAX_LOT_OPEN_DATE: 40,
  TAX_LOT_CLOSE_DATE: 41
};

goog.object.extend(exports, proto.fintekkers.models.position);
