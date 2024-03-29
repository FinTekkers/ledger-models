// source: fintekkers/models/position/position_util.proto
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

var google_protobuf_any_pb = require('google-protobuf/google/protobuf/any_pb.js');
goog.object.extend(proto, google_protobuf_any_pb);
var fintekkers_models_position_field_pb = require('../../../fintekkers/models/position/field_pb.js');
goog.object.extend(proto, fintekkers_models_position_field_pb);
var fintekkers_models_position_measure_pb = require('../../../fintekkers/models/position/measure_pb.js');
goog.object.extend(proto, fintekkers_models_position_measure_pb);
var fintekkers_models_util_decimal_value_pb = require('../../../fintekkers/models/util/decimal_value_pb.js');
goog.object.extend(proto, fintekkers_models_util_decimal_value_pb);
goog.exportSymbol('proto.fintekkers.models.position.FieldMapEntry', null, global);
goog.exportSymbol('proto.fintekkers.models.position.FieldMapEntry.FieldmapvalueoneofCase', null, global);
goog.exportSymbol('proto.fintekkers.models.position.MeasureMapEntry', null, global);
goog.exportSymbol('proto.fintekkers.models.position.PositionFilterOperator', null, global);
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
proto.fintekkers.models.position.MeasureMapEntry = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.models.position.MeasureMapEntry, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.position.MeasureMapEntry.displayName = 'proto.fintekkers.models.position.MeasureMapEntry';
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
proto.fintekkers.models.position.FieldMapEntry = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_);
};
goog.inherits(proto.fintekkers.models.position.FieldMapEntry, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fintekkers.models.position.FieldMapEntry.displayName = 'proto.fintekkers.models.position.FieldMapEntry';
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
proto.fintekkers.models.position.MeasureMapEntry.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.position.MeasureMapEntry.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.position.MeasureMapEntry} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.position.MeasureMapEntry.toObject = function(includeInstance, msg) {
  var f, obj = {
    measure: jspb.Message.getFieldWithDefault(msg, 1, 0),
    measureDecimalValue: (f = msg.getMeasureDecimalValue()) && fintekkers_models_util_decimal_value_pb.DecimalValueProto.toObject(includeInstance, f)
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
 * @return {!proto.fintekkers.models.position.MeasureMapEntry}
 */
proto.fintekkers.models.position.MeasureMapEntry.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.position.MeasureMapEntry;
  return proto.fintekkers.models.position.MeasureMapEntry.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.position.MeasureMapEntry} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.position.MeasureMapEntry}
 */
proto.fintekkers.models.position.MeasureMapEntry.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fintekkers.models.position.MeasureProto} */ (reader.readEnum());
      msg.setMeasure(value);
      break;
    case 2:
      var value = new fintekkers_models_util_decimal_value_pb.DecimalValueProto;
      reader.readMessage(value,fintekkers_models_util_decimal_value_pb.DecimalValueProto.deserializeBinaryFromReader);
      msg.setMeasureDecimalValue(value);
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
proto.fintekkers.models.position.MeasureMapEntry.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.position.MeasureMapEntry.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.position.MeasureMapEntry} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.position.MeasureMapEntry.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMeasure();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getMeasureDecimalValue();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      fintekkers_models_util_decimal_value_pb.DecimalValueProto.serializeBinaryToWriter
    );
  }
};


/**
 * optional MeasureProto measure = 1;
 * @return {!proto.fintekkers.models.position.MeasureProto}
 */
proto.fintekkers.models.position.MeasureMapEntry.prototype.getMeasure = function() {
  return /** @type {!proto.fintekkers.models.position.MeasureProto} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fintekkers.models.position.MeasureProto} value
 * @return {!proto.fintekkers.models.position.MeasureMapEntry} returns this
 */
proto.fintekkers.models.position.MeasureMapEntry.prototype.setMeasure = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional fintekkers.models.util.DecimalValueProto measure_decimal_value = 2;
 * @return {?proto.fintekkers.models.util.DecimalValueProto}
 */
proto.fintekkers.models.position.MeasureMapEntry.prototype.getMeasureDecimalValue = function() {
  return /** @type{?proto.fintekkers.models.util.DecimalValueProto} */ (
    jspb.Message.getWrapperField(this, fintekkers_models_util_decimal_value_pb.DecimalValueProto, 2));
};


/**
 * @param {?proto.fintekkers.models.util.DecimalValueProto|undefined} value
 * @return {!proto.fintekkers.models.position.MeasureMapEntry} returns this
*/
proto.fintekkers.models.position.MeasureMapEntry.prototype.setMeasureDecimalValue = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.position.MeasureMapEntry} returns this
 */
proto.fintekkers.models.position.MeasureMapEntry.prototype.clearMeasureDecimalValue = function() {
  return this.setMeasureDecimalValue(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.position.MeasureMapEntry.prototype.hasMeasureDecimalValue = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.fintekkers.models.position.FieldMapEntry.oneofGroups_ = [[4,5,6]];

/**
 * @enum {number}
 */
proto.fintekkers.models.position.FieldMapEntry.FieldmapvalueoneofCase = {
  FIELDMAPVALUEONEOF_NOT_SET: 0,
  FIELD_VALUE_PACKED: 4,
  ENUM_VALUE: 5,
  STRING_VALUE: 6
};

/**
 * @return {proto.fintekkers.models.position.FieldMapEntry.FieldmapvalueoneofCase}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.getFieldmapvalueoneofCase = function() {
  return /** @type {proto.fintekkers.models.position.FieldMapEntry.FieldmapvalueoneofCase} */(jspb.Message.computeOneofCase(this, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_[0]));
};



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
proto.fintekkers.models.position.FieldMapEntry.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.models.position.FieldMapEntry.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fintekkers.models.position.FieldMapEntry} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.position.FieldMapEntry.toObject = function(includeInstance, msg) {
  var f, obj = {
    field: jspb.Message.getFieldWithDefault(msg, 1, 0),
    fieldValuePacked: (f = msg.getFieldValuePacked()) && google_protobuf_any_pb.Any.toObject(includeInstance, f),
    enumValue: jspb.Message.getFieldWithDefault(msg, 5, 0),
    stringValue: jspb.Message.getFieldWithDefault(msg, 6, ""),
    operator: jspb.Message.getFieldWithDefault(msg, 20, 0)
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
 * @return {!proto.fintekkers.models.position.FieldMapEntry}
 */
proto.fintekkers.models.position.FieldMapEntry.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.models.position.FieldMapEntry;
  return proto.fintekkers.models.position.FieldMapEntry.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fintekkers.models.position.FieldMapEntry} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fintekkers.models.position.FieldMapEntry}
 */
proto.fintekkers.models.position.FieldMapEntry.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fintekkers.models.position.FieldProto} */ (reader.readEnum());
      msg.setField(value);
      break;
    case 4:
      var value = new google_protobuf_any_pb.Any;
      reader.readMessage(value,google_protobuf_any_pb.Any.deserializeBinaryFromReader);
      msg.setFieldValuePacked(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setEnumValue(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setStringValue(value);
      break;
    case 20:
      var value = /** @type {!proto.fintekkers.models.position.PositionFilterOperator} */ (reader.readEnum());
      msg.setOperator(value);
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
proto.fintekkers.models.position.FieldMapEntry.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.models.position.FieldMapEntry.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fintekkers.models.position.FieldMapEntry} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fintekkers.models.position.FieldMapEntry.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getField();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getFieldValuePacked();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      google_protobuf_any_pb.Any.serializeBinaryToWriter
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getOperator();
  if (f !== 0.0) {
    writer.writeEnum(
      20,
      f
    );
  }
};


/**
 * optional FieldProto field = 1;
 * @return {!proto.fintekkers.models.position.FieldProto}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.getField = function() {
  return /** @type {!proto.fintekkers.models.position.FieldProto} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fintekkers.models.position.FieldProto} value
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.setField = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional google.protobuf.Any field_value_packed = 4;
 * @return {?proto.google.protobuf.Any}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.getFieldValuePacked = function() {
  return /** @type{?proto.google.protobuf.Any} */ (
    jspb.Message.getWrapperField(this, google_protobuf_any_pb.Any, 4));
};


/**
 * @param {?proto.google.protobuf.Any|undefined} value
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
*/
proto.fintekkers.models.position.FieldMapEntry.prototype.setFieldValuePacked = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.clearFieldValuePacked = function() {
  return this.setFieldValuePacked(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.hasFieldValuePacked = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional int32 enum_value = 5;
 * @return {number}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.getEnumValue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.setEnumValue = function(value) {
  return jspb.Message.setOneofField(this, 5, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.clearEnumValue = function() {
  return jspb.Message.setOneofField(this, 5, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.hasEnumValue = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional string string_value = 6;
 * @return {string}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.getStringValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.setStringValue = function(value) {
  return jspb.Message.setOneofField(this, 6, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.clearStringValue = function() {
  return jspb.Message.setOneofField(this, 6, proto.fintekkers.models.position.FieldMapEntry.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.hasStringValue = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional PositionFilterOperator operator = 20;
 * @return {!proto.fintekkers.models.position.PositionFilterOperator}
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.getOperator = function() {
  return /** @type {!proto.fintekkers.models.position.PositionFilterOperator} */ (jspb.Message.getFieldWithDefault(this, 20, 0));
};


/**
 * @param {!proto.fintekkers.models.position.PositionFilterOperator} value
 * @return {!proto.fintekkers.models.position.FieldMapEntry} returns this
 */
proto.fintekkers.models.position.FieldMapEntry.prototype.setOperator = function(value) {
  return jspb.Message.setProto3EnumField(this, 20, value);
};


/**
 * @enum {number}
 */
proto.fintekkers.models.position.PositionFilterOperator = {
  UNKNOWN_OPERATOR: 0,
  EQUALS: 1,
  NOT_EQUALS: 2,
  LESS_THAN: 3,
  LESS_THAN_OR_EQUALS: 4,
  MORE_THAN: 5,
  MORE_THAN_OR_EQUALS: 6
};

goog.object.extend(exports, proto.fintekkers.models.position);
