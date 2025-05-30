// source: fintekkers/requests/security/get_fields_response.proto
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

var fintekkers_models_position_field_pb = require('../../../fintekkers/models/position/field_pb.js');
goog.object.extend(proto, fintekkers_models_position_field_pb);
goog.exportSymbol('proto.fintekkers.requests.security.GetFieldsResponseProto', null, global);
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
proto.fintekkers.requests.security.GetFieldsResponseProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fintekkers.requests.security.GetFieldsResponseProto.repeatedFields_, null);
};
goog.inherits(proto.fintekkers.requests.security.GetFieldsResponseProto, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.requests.security.GetFieldsResponseProto.displayName = 'proto.fintekkers.requests.security.GetFieldsResponseProto';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.repeatedFields_ = [10];



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
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.requests.security.GetFieldsResponseProto.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.requests.security.GetFieldsResponseProto} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    fieldsList: (f = jspb.Message.getRepeatedField(msg, 10)) == null ? undefined : f
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
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto}
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.requests.security.GetFieldsResponseProto;
  return proto.fintekkers.requests.security.GetFieldsResponseProto.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.requests.security.GetFieldsResponseProto} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto}
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.deserializeBinaryFromReader = function(msg, reader) {
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
    case 10:
      var values = /** @type {!Array<!proto.fintekkers.models.position.FieldProto>} */ (reader.isDelimited() ? reader.readPackedEnum() : [reader.readEnum()]);
      for (var i = 0; i < values.length; i++) {
        msg.addFields(values[i]);
      }
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
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.requests.security.GetFieldsResponseProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.requests.security.GetFieldsResponseProto} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.serializeBinaryToWriter = function(message, writer) {
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
  f = message.getFieldsList();
  if (f.length > 0) {
    writer.writePackedEnum(
      10,
      f
    );
  }
};


/**
 * optional string object_class = 1;
 * @return {string}
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.getObjectClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto} returns this
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto} returns this
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated fintekkers.models.position.FieldProto fields = 10;
 * @return {!Array<!proto.fintekkers.models.position.FieldProto>}
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.getFieldsList = function() {
  return /** @type {!Array<!proto.fintekkers.models.position.FieldProto>} */ (jspb.Message.getRepeatedField(this, 10));
};


/**
 * @param {!Array<!proto.fintekkers.models.position.FieldProto>} value
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto} returns this
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.setFieldsList = function(value) {
  return jspb.Message.setField(this, 10, value || []);
};


/**
 * @param {!proto.fintekkers.models.position.FieldProto} value
 * @param {number=} opt_index
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto} returns this
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.addFields = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 10, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fintekkers.requests.security.GetFieldsResponseProto} returns this
 */
proto.fintekkers.requests.security.GetFieldsResponseProto.prototype.clearFieldsList = function() {
  return this.setFieldsList([]);
};


goog.object.extend(exports, proto.fintekkers.requests.security);
