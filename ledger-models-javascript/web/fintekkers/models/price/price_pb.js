// source: fintekkers/models/price/price.proto
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
var global = (function() { return this || window || global || self || Function('return this')(); }).call(null);

var fintekkers_models_util_decimal_value_pb = require('../../../fintekkers/models/util/decimal_value_pb.js');
goog.object.extend(proto, fintekkers_models_util_decimal_value_pb);
var fintekkers_models_util_local_timestamp_pb = require('../../../fintekkers/models/util/local_timestamp_pb.js');
goog.object.extend(proto, fintekkers_models_util_local_timestamp_pb);
var fintekkers_models_util_uuid_pb = require('../../../fintekkers/models/util/uuid_pb.js');
goog.object.extend(proto, fintekkers_models_util_uuid_pb);
var fintekkers_models_security_security_pb = require('../../../fintekkers/models/security/security_pb.js');
goog.object.extend(proto, fintekkers_models_security_security_pb);
goog.exportSymbol('proto.fintekkers.models.price.PriceProto', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fintekkers.models.price.PriceProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.models.price.PriceProto, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.price.PriceProto.displayName = 'proto.fintekkers.models.price.PriceProto';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fintekkers.models.price.PriceProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.price.PriceProto.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.price.PriceProto} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.price.PriceProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    uuid: (f = msg.getUuid()) && fintekkers_models_util_uuid_pb.UUIDProto.toObject(includeInstance, f),
    asOf: (f = msg.getAsOf()) && fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.toObject(includeInstance, f),
    isLink: jspb.Message.getBooleanFieldWithDefault(msg, 7, false),
    validFrom: (f = msg.getValidFrom()) && fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.toObject(includeInstance, f),
    validTo: (f = msg.getValidTo()) && fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.toObject(includeInstance, f),
    price: (f = msg.getPrice()) && fintekkers_models_util_decimal_value_pb.DecimalValueProto.toObject(includeInstance, f),
    security: (f = msg.getSecurity()) && fintekkers_models_security_security_pb.SecurityProto.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fintekkers.models.price.PriceProto}
 */
proto.fintekkers.models.price.PriceProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.price.PriceProto;
  return proto.fintekkers.models.price.PriceProto.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.price.PriceProto} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.price.PriceProto}
 */
proto.fintekkers.models.price.PriceProto.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setObjectClass(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 5:
      var value = new fintekkers_models_util_uuid_pb.UUIDProto;
      reader.readMessage(value,fintekkers_models_util_uuid_pb.UUIDProto.deserializeBinaryFromReader);
      msg.setUuid(value);
      break;
    case 6:
      var value = new fintekkers_models_util_local_timestamp_pb.LocalTimestampProto;
      reader.readMessage(value,fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.deserializeBinaryFromReader);
      msg.setAsOf(value);
      break;
    case 7:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsLink(value);
      break;
    case 8:
      var value = new fintekkers_models_util_local_timestamp_pb.LocalTimestampProto;
      reader.readMessage(value,fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.deserializeBinaryFromReader);
      msg.setValidFrom(value);
      break;
    case 9:
      var value = new fintekkers_models_util_local_timestamp_pb.LocalTimestampProto;
      reader.readMessage(value,fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.deserializeBinaryFromReader);
      msg.setValidTo(value);
      break;
    case 10:
      var value = new fintekkers_models_util_decimal_value_pb.DecimalValueProto;
      reader.readMessage(value,fintekkers_models_util_decimal_value_pb.DecimalValueProto.deserializeBinaryFromReader);
      msg.setPrice(value);
      break;
    case 11:
      var value = new fintekkers_models_security_security_pb.SecurityProto;
      reader.readMessage(value,fintekkers_models_security_security_pb.SecurityProto.deserializeBinaryFromReader);
      msg.setSecurity(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fintekkers.models.price.PriceProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.price.PriceProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.price.PriceProto} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.price.PriceProto.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getObjectClass();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getUuid();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      fintekkers_models_util_uuid_pb.UUIDProto.serializeBinaryToWriter
    );
  }
  f = message.getAsOf();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.serializeBinaryToWriter
    );
  }
  f = message.getIsLink();
  if (f) {
    writer.writeBool(
      7,
      f
    );
  }
  f = message.getValidFrom();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.serializeBinaryToWriter
    );
  }
  f = message.getValidTo();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.serializeBinaryToWriter
    );
  }
  f = message.getPrice();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      fintekkers_models_util_decimal_value_pb.DecimalValueProto.serializeBinaryToWriter
    );
  }
  f = message.getSecurity();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      fintekkers_models_security_security_pb.SecurityProto.serializeBinaryToWriter
    );
  }
};


/**
 * optional string object_class = 1;
 * @return {string}
 */
proto.fintekkers.models.price.PriceProto.prototype.getObjectClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.fintekkers.models.price.PriceProto.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional fintekkers.models.util.UUIDProto uuid = 5;
 * @return {?proto.fintekkers.models.util.UUIDProto}
 */
proto.fintekkers.models.price.PriceProto.prototype.getUuid = function() {
  return /** @type{?proto.fintekkers.models.util.UUIDProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_uuid_pb.UUIDProto, 5));
};


/**
 * @param {?proto.fintekkers.models.util.UUIDProto|undefined} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
*/
proto.fintekkers.models.price.PriceProto.prototype.setUuid = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.clearUuid = function() {
  return this.setUuid(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.hasUuid = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional fintekkers.models.util.LocalTimestampProto as_of = 6;
 * @return {?proto.fintekkers.models.util.LocalTimestampProto}
 */
proto.fintekkers.models.price.PriceProto.prototype.getAsOf = function() {
  return /** @type{?proto.fintekkers.models.util.LocalTimestampProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_timestamp_pb.LocalTimestampProto, 6));
};


/**
 * @param {?proto.fintekkers.models.util.LocalTimestampProto|undefined} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
*/
proto.fintekkers.models.price.PriceProto.prototype.setAsOf = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.clearAsOf = function() {
  return this.setAsOf(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.hasAsOf = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional bool is_link = 7;
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.getIsLink = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 7, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.setIsLink = function(value) {
  return jspb.Message.setProto3BooleanField(this, 7, value);
};


/**
 * optional fintekkers.models.util.LocalTimestampProto valid_from = 8;
 * @return {?proto.fintekkers.models.util.LocalTimestampProto}
 */
proto.fintekkers.models.price.PriceProto.prototype.getValidFrom = function() {
  return /** @type{?proto.fintekkers.models.util.LocalTimestampProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_timestamp_pb.LocalTimestampProto, 8));
};


/**
 * @param {?proto.fintekkers.models.util.LocalTimestampProto|undefined} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
*/
proto.fintekkers.models.price.PriceProto.prototype.setValidFrom = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.clearValidFrom = function() {
  return this.setValidFrom(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.hasValidFrom = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional fintekkers.models.util.LocalTimestampProto valid_to = 9;
 * @return {?proto.fintekkers.models.util.LocalTimestampProto}
 */
proto.fintekkers.models.price.PriceProto.prototype.getValidTo = function() {
  return /** @type{?proto.fintekkers.models.util.LocalTimestampProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_timestamp_pb.LocalTimestampProto, 9));
};


/**
 * @param {?proto.fintekkers.models.util.LocalTimestampProto|undefined} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
*/
proto.fintekkers.models.price.PriceProto.prototype.setValidTo = function(value) {
  return jspb.Message.setWrapperField(this, 9, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.clearValidTo = function() {
  return this.setValidTo(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.hasValidTo = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional fintekkers.models.util.DecimalValueProto price = 10;
 * @return {?proto.fintekkers.models.util.DecimalValueProto}
 */
proto.fintekkers.models.price.PriceProto.prototype.getPrice = function() {
  return /** @type{?proto.fintekkers.models.util.DecimalValueProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_decimal_value_pb.DecimalValueProto, 10));
};


/**
 * @param {?proto.fintekkers.models.util.DecimalValueProto|undefined} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
*/
proto.fintekkers.models.price.PriceProto.prototype.setPrice = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.clearPrice = function() {
  return this.setPrice(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.hasPrice = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional fintekkers.models.security.SecurityProto security = 11;
 * @return {?proto.fintekkers.models.security.SecurityProto}
 */
proto.fintekkers.models.price.PriceProto.prototype.getSecurity = function() {
  return /** @type{?proto.fintekkers.models.security.SecurityProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_security_security_pb.SecurityProto, 11));
};


/**
 * @param {?proto.fintekkers.models.security.SecurityProto|undefined} value
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
*/
proto.fintekkers.models.price.PriceProto.prototype.setSecurity = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.price.PriceProto} returns this
 */
proto.fintekkers.models.price.PriceProto.prototype.clearSecurity = function() {
  return this.setSecurity(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.price.PriceProto.prototype.hasSecurity = function() {
  return jspb.Message.getField(this, 11) != null;
};


goog.object.extend(exports, proto.fintekkers.models.price);
