// source: fintekkers/models/security/identifier/identifier.proto
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

var fintekkers_models_security_identifier_identifier_type_pb = require('../../../../fintekkers/models/security/identifier/identifier_type_pb.js');
goog.object.extend(proto, fintekkers_models_security_identifier_identifier_type_pb);
goog.exportSymbol('proto.fintekkers.models.security.IdentifierProto', null, global);
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
proto.fintekkers.models.security.IdentifierProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.models.security.IdentifierProto, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.security.IdentifierProto.displayName = 'proto.fintekkers.models.security.IdentifierProto';
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
proto.fintekkers.models.security.IdentifierProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.security.IdentifierProto.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.security.IdentifierProto} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.security.IdentifierProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    identifierValue: jspb.Message.getFieldWithDefault(msg, 5, ""),
    identifierType: jspb.Message.getFieldWithDefault(msg, 6, 0)
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
 * @return {!proto.fintekkers.models.security.IdentifierProto}
 */
proto.fintekkers.models.security.IdentifierProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.security.IdentifierProto;
  return proto.fintekkers.models.security.IdentifierProto.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.security.IdentifierProto} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.security.IdentifierProto}
 */
proto.fintekkers.models.security.IdentifierProto.deserializeBinaryFromReader = function(msg, reader) {
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
      var value = /** @type {string} */ (reader.readString());
      msg.setIdentifierValue(value);
      break;
    case 6:
      var value = /** @type {!proto.fintekkers.models.security.IdentifierTypeProto} */ (reader.readEnum());
      msg.setIdentifierType(value);
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
proto.fintekkers.models.security.IdentifierProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.security.IdentifierProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.security.IdentifierProto} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.security.IdentifierProto.serializeBinaryToWriter = function(message, writer) {
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
  f = message.getIdentifierValue();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getIdentifierType();
  if (f !== 0.0) {
    writer.writeEnum(
      6,
      f
    );
  }
};


/**
 * optional string object_class = 1;
 * @return {string}
 */
proto.fintekkers.models.security.IdentifierProto.prototype.getObjectClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.IdentifierProto} returns this
 */
proto.fintekkers.models.security.IdentifierProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.fintekkers.models.security.IdentifierProto.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.IdentifierProto} returns this
 */
proto.fintekkers.models.security.IdentifierProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string identifier_value = 5;
 * @return {string}
 */
proto.fintekkers.models.security.IdentifierProto.prototype.getIdentifierValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.security.IdentifierProto} returns this
 */
proto.fintekkers.models.security.IdentifierProto.prototype.setIdentifierValue = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional IdentifierTypeProto identifier_type = 6;
 * @return {!proto.fintekkers.models.security.IdentifierTypeProto}
 */
proto.fintekkers.models.security.IdentifierProto.prototype.getIdentifierType = function() {
  return /** @type {!proto.fintekkers.models.security.IdentifierTypeProto} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {!proto.fintekkers.models.security.IdentifierTypeProto} value
 * @return {!proto.fintekkers.models.security.IdentifierProto} returns this
 */
proto.fintekkers.models.security.IdentifierProto.prototype.setIdentifierType = function(value) {
  return jspb.Message.setProto3EnumField(this, 6, value);
};


goog.object.extend(exports, proto.fintekkers.models.security);
