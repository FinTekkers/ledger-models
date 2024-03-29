// source: fintekkers/models/position/position_filter.proto
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

var fintekkers_models_position_position_util_pb = require('../../../fintekkers/models/position/position_util_pb.js');
goog.object.extend(proto, fintekkers_models_position_position_util_pb);
goog.exportSymbol('proto.fintekkers.models.position.PositionFilterProto', null, global);
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
proto.fintekkers.models.position.PositionFilterProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fintekkers.models.position.PositionFilterProto.repeatedFields_, null);
};
goog.inherits(proto.fintekkers.models.position.PositionFilterProto, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.position.PositionFilterProto.displayName = 'proto.fintekkers.models.position.PositionFilterProto';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fintekkers.models.position.PositionFilterProto.repeatedFields_ = [21];



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
proto.fintekkers.models.position.PositionFilterProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.position.PositionFilterProto.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.position.PositionFilterProto} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.position.PositionFilterProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    filtersList: jspb.Message.toObjectList(msg.getFiltersList(),
    fintekkers_models_position_position_util_pb.FieldMapEntry.toObject, includeInstance)
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
 * @return {!proto.fintekkers.models.position.PositionFilterProto}
 */
proto.fintekkers.models.position.PositionFilterProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.position.PositionFilterProto;
  return proto.fintekkers.models.position.PositionFilterProto.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.position.PositionFilterProto} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.position.PositionFilterProto}
 */
proto.fintekkers.models.position.PositionFilterProto.deserializeBinaryFromReader = function(msg, reader) {
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
    case 21:
      var value = new fintekkers_models_position_position_util_pb.FieldMapEntry;
      reader.readMessage(value,fintekkers_models_position_position_util_pb.FieldMapEntry.deserializeBinaryFromReader);
      msg.addFilters(value);
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
proto.fintekkers.models.position.PositionFilterProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.position.PositionFilterProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.position.PositionFilterProto} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.position.PositionFilterProto.serializeBinaryToWriter = function(message, writer) {
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
  f = message.getFiltersList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      21,
      f,
      fintekkers_models_position_position_util_pb.FieldMapEntry.serializeBinaryToWriter
    );
  }
};


/**
 * optional string object_class = 1;
 * @return {string}
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.getObjectClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.position.PositionFilterProto} returns this
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.position.PositionFilterProto} returns this
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * repeated FieldMapEntry filters = 21;
 * @return {!Array<!proto.fintekkers.models.position.FieldMapEntry>}
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.getFiltersList = function() {
  return /** @type{!Array<!proto.fintekkers.models.position.FieldMapEntry>} */ (
    jspb.Message.getRepeatedWrapperField(this, fintekkers_models_position_position_util_pb.FieldMapEntry, 21));
};


/**
 * @param {!Array<!proto.fintekkers.models.position.FieldMapEntry>} value
 * @return {!proto.fintekkers.models.position.PositionFilterProto} returns this
*/
proto.fintekkers.models.position.PositionFilterProto.prototype.setFiltersList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 21, value);
};


/**
 * @param {!proto.fintekkers.models.position.FieldMapEntry=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fintekkers.models.position.FieldMapEntry}
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.addFilters = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 21, opt_value, proto.fintekkers.models.position.FieldMapEntry, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fintekkers.models.position.PositionFilterProto} returns this
 */
proto.fintekkers.models.position.PositionFilterProto.prototype.clearFiltersList = function() {
  return this.setFiltersList([]);
};


goog.object.extend(exports, proto.fintekkers.models.position);
