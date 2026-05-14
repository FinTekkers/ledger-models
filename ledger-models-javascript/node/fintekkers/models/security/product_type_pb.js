// source: fintekkers/models/security/product_type.proto
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

goog.exportSymbol('proto.fintekkers.models.security.ProductTypeProto', null, global);
/**
 * @enum {number}
 */
proto.fintekkers.models.security.ProductTypeProto = {
  PRODUCT_TYPE_UNKNOWN: 0,
  TBILL: 1,
  TREASURY_NOTE: 2,
  TREASURY_BOND: 3,
  TIPS: 4,
  TREASURY_FRN: 5,
  STRIPS: 6,
  SOVEREIGN_BOND: 7,
  CORP_BOND: 8,
  MUNI_BOND: 9,
  MORTGAGE_BACKED: 10,
  COMMON_STOCK: 20,
  PREFERRED_STOCK: 21,
  ADR: 22,
  ETF: 23,
  EQUITY_INDEX: 30,
  BOND_INDEX: 31,
  COMMODITY_INDEX: 32,
  VIX_SPOT: 33,
  CPI_SERIES: 34,
  SOFR_SERIES: 35,
  CURRENCY: 40,
  FX_SPOT: 41,
  MONEY_MARKET_FUND: 42,
  CRYPTOCURRENCY: 50,
  STABLECOIN: 51,
  GOLD: 60,
  SILVER: 61
};

goog.object.extend(exports, proto.fintekkers.models.security);
