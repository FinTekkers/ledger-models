// source: fintekkers/models/util/lock/node_state.proto
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

var fintekkers_models_util_local_timestamp_pb = require('../../../../fintekkers/models/util/local_timestamp_pb.js');
goog.object.extend(proto, fintekkers_models_util_local_timestamp_pb);
goog.exportSymbol('proto.fintekkers.models.util.lock.NodeStateProto', null, global);
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
proto.fintekkers.models.util.lock.NodeStateProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.models.util.lock.NodeStateProto, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.util.lock.NodeStateProto.displayName = 'proto.fintekkers.models.util.lock.NodeStateProto';
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
proto.fintekkers.models.util.lock.NodeStateProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.util.lock.NodeStateProto.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.util.lock.NodeStateProto} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.util.lock.NodeStateProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    partition: jspb.Message.getFieldWithDefault(msg, 3, ""),
    endPoint: jspb.Message.getFieldWithDefault(msg, 4, ""),
    lastSeen: (f = msg.getLastSeen()) && fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.toObject(includeInstance, f),
    isExpired: jspb.Message.getBooleanFieldWithDefault(msg, 6, false)
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
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto}
 */
proto.fintekkers.models.util.lock.NodeStateProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.util.lock.NodeStateProto;
  return proto.fintekkers.models.util.lock.NodeStateProto.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.util.lock.NodeStateProto} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto}
 */
proto.fintekkers.models.util.lock.NodeStateProto.deserializeBinaryFromReader = function(msg, reader) {
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
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPartition(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setEndPoint(value);
      break;
    case 5:
      var value = new fintekkers_models_util_local_timestamp_pb.LocalTimestampProto;
      reader.readMessage(value,fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.deserializeBinaryFromReader);
      msg.setLastSeen(value);
      break;
    case 6:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsExpired(value);
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
proto.fintekkers.models.util.lock.NodeStateProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.util.lock.NodeStateProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.util.lock.NodeStateProto} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.util.lock.NodeStateProto.serializeBinaryToWriter = function(message, writer) {
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
  f = message.getPartition();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getEndPoint();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getLastSeen();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      fintekkers_models_util_local_timestamp_pb.LocalTimestampProto.serializeBinaryToWriter
    );
  }
  f = message.getIsExpired();
  if (f) {
    writer.writeBool(
      6,
      f
    );
  }
};


/**
 * optional string object_class = 1;
 * @return {string}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.getObjectClass = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string partition = 3;
 * @return {string}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.getPartition = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.setPartition = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string end_point = 4;
 * @return {string}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.getEndPoint = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.setEndPoint = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional fintekkers.models.util.LocalTimestampProto last_seen = 5;
 * @return {?proto.fintekkers.models.util.LocalTimestampProto}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.getLastSeen = function() {
  return /** @type{?proto.fintekkers.models.util.LocalTimestampProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_local_timestamp_pb.LocalTimestampProto, 5));
};


/**
 * @param {?proto.fintekkers.models.util.LocalTimestampProto|undefined} value
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
*/
proto.fintekkers.models.util.lock.NodeStateProto.prototype.setLastSeen = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.clearLastSeen = function() {
  return this.setLastSeen(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.hasLastSeen = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional bool is_expired = 6;
 * @return {boolean}
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.getIsExpired = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 6, false));
};


/**
 * @param {boolean} value
 * @return {!proto.fintekkers.models.util.lock.NodeStateProto} returns this
 */
proto.fintekkers.models.util.lock.NodeStateProto.prototype.setIsExpired = function(value) {
  return jspb.Message.setProto3BooleanField(this, 6, value);
};


goog.object.extend(exports, proto.fintekkers.models.util.lock);
