// source: fintekkers/services/lock-service/lock_service.proto
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

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
goog.object.extend(proto, google_protobuf_empty_pb);
var fintekkers_requests_util_lock_lock_request_pb = require('../../../fintekkers/requests/util/lock/lock_request_pb.js');
goog.object.extend(proto, fintekkers_requests_util_lock_lock_request_pb);
var fintekkers_requests_util_lock_lock_response_pb = require('../../../fintekkers/requests/util/lock/lock_response_pb.js');
goog.object.extend(proto, fintekkers_requests_util_lock_lock_response_pb);
var fintekkers_models_util_lock_node_partition_pb = require('../../../fintekkers/models/util/lock/node_partition_pb.js');
goog.object.extend(proto, fintekkers_models_util_lock_node_partition_pb);
var fintekkers_models_util_lock_node_state_pb = require('../../../fintekkers/models/util/lock/node_state_pb.js');
goog.object.extend(proto, fintekkers_models_util_lock_node_state_pb);
goog.exportSymbol('proto.fintekkers.services.lock_service.NamespaceList', null, global);
goog.exportSymbol('proto.fintekkers.services.lock_service.PartitionsList', null, global);
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
proto.fintekkers.services.lock_service.NamespaceList = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fintekkers.services.lock_service.NamespaceList.repeatedFields_, null);
};
goog.inherits(proto.fintekkers.services.lock_service.NamespaceList, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.services.lock_service.NamespaceList.displayName = 'proto.fintekkers.services.lock_service.NamespaceList';
}
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
proto.fintekkers.services.lock_service.PartitionsList = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fintekkers.services.lock_service.PartitionsList.repeatedFields_, null);
};
goog.inherits(proto.fintekkers.services.lock_service.PartitionsList, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.services.lock_service.PartitionsList.displayName = 'proto.fintekkers.services.lock_service.PartitionsList';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fintekkers.services.lock_service.NamespaceList.repeatedFields_ = [1];



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
proto.fintekkers.services.lock_service.NamespaceList.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.services.lock_service.NamespaceList.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.services.lock_service.NamespaceList} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.services.lock_service.NamespaceList.toObject = function(includeInstance, msg) {
  var f, obj = {
    namespacesList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
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
 * @return {!proto.fintekkers.services.lock_service.NamespaceList}
 */
proto.fintekkers.services.lock_service.NamespaceList.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.services.lock_service.NamespaceList;
  return proto.fintekkers.services.lock_service.NamespaceList.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.services.lock_service.NamespaceList} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.services.lock_service.NamespaceList}
 */
proto.fintekkers.services.lock_service.NamespaceList.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addNamespaces(value);
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
proto.fintekkers.services.lock_service.NamespaceList.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.services.lock_service.NamespaceList.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.services.lock_service.NamespaceList} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.services.lock_service.NamespaceList.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNamespacesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string namespaces = 1;
 * @return {!Array<string>}
 */
proto.fintekkers.services.lock_service.NamespaceList.prototype.getNamespacesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.fintekkers.services.lock_service.NamespaceList} returns this
 */
proto.fintekkers.services.lock_service.NamespaceList.prototype.setNamespacesList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.fintekkers.services.lock_service.NamespaceList} returns this
 */
proto.fintekkers.services.lock_service.NamespaceList.prototype.addNamespaces = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fintekkers.services.lock_service.NamespaceList} returns this
 */
proto.fintekkers.services.lock_service.NamespaceList.prototype.clearNamespacesList = function() {
  return this.setNamespacesList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fintekkers.services.lock_service.PartitionsList.repeatedFields_ = [1];



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
proto.fintekkers.services.lock_service.PartitionsList.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.services.lock_service.PartitionsList.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.services.lock_service.PartitionsList} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.services.lock_service.PartitionsList.toObject = function(includeInstance, msg) {
  var f, obj = {
    namespacesList: jspb.Message.toObjectList(msg.getNamespacesList(),
    fintekkers_models_util_lock_node_partition_pb.NodePartition.toObject, includeInstance)
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
 * @return {!proto.fintekkers.services.lock_service.PartitionsList}
 */
proto.fintekkers.services.lock_service.PartitionsList.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.services.lock_service.PartitionsList;
  return proto.fintekkers.services.lock_service.PartitionsList.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.services.lock_service.PartitionsList} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.services.lock_service.PartitionsList}
 */
proto.fintekkers.services.lock_service.PartitionsList.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new fintekkers_models_util_lock_node_partition_pb.NodePartition;
      reader.readMessage(value,fintekkers_models_util_lock_node_partition_pb.NodePartition.deserializeBinaryFromReader);
      msg.addNamespaces(value);
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
proto.fintekkers.services.lock_service.PartitionsList.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.services.lock_service.PartitionsList.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.services.lock_service.PartitionsList} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.services.lock_service.PartitionsList.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNamespacesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      fintekkers_models_util_lock_node_partition_pb.NodePartition.serializeBinaryToWriter
    );
  }
};


/**
 * repeated fintekkers.models.util.lock.NodePartition namespaces = 1;
 * @return {!Array<!proto.fintekkers.models.util.lock.NodePartition>}
 */
proto.fintekkers.services.lock_service.PartitionsList.prototype.getNamespacesList = function() {
  return /** @type{!Array<!proto.fintekkers.models.util.lock.NodePartition>} */ (
    jspb.Message.getRepeatedWrapperField(this, fintekkers_models_util_lock_node_partition_pb.NodePartition, 1));
};


/**
 * @param {!Array<!proto.fintekkers.models.util.lock.NodePartition>} value
 * @return {!proto.fintekkers.services.lock_service.PartitionsList} returns this
*/
proto.fintekkers.services.lock_service.PartitionsList.prototype.setNamespacesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fintekkers.models.util.lock.NodePartition=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fintekkers.models.util.lock.NodePartition}
 */
proto.fintekkers.services.lock_service.PartitionsList.prototype.addNamespaces = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fintekkers.models.util.lock.NodePartition, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fintekkers.services.lock_service.PartitionsList} returns this
 */
proto.fintekkers.services.lock_service.PartitionsList.prototype.clearNamespacesList = function() {
  return this.setNamespacesList([]);
};


goog.object.extend(exports, proto.fintekkers.services.lock_service);