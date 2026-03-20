// source: fintekkers/requests/util/delete_request.proto
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = globalThis;

var fintekkers_models_util_uuid_pb = require('../../../fintekkers/models/util/uuid_pb.js');
goog.object.extend(proto, fintekkers_models_util_uuid_pb);
goog.exportSymbol('proto.fintekkers.requests.util.AffectedEntityProto', null, global);
goog.exportSymbol('proto.fintekkers.requests.util.DeleteRequestProto', null, global);
goog.exportSymbol('proto.fintekkers.requests.util.DeleteResponseProto', null, global);
goog.exportSymbol('proto.fintekkers.requests.util.EntityTypeProto', null, global);

// EntityTypeProto enum
proto.fintekkers.requests.util.EntityTypeProto = {
  UNKNOWN_ENTITY: 0,
  SECURITY: 1,
  PORTFOLIO: 2,
  TRANSACTION: 3,
  PRICE: 4,
  POSITION: 5
};

// ============================================================================
// AffectedEntityProto
// ============================================================================
proto.fintekkers.requests.util.AffectedEntityProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.requests.util.AffectedEntityProto, jspb.Message);

if (jspb.Message.GENERATE_TO_OBJECT) {
proto.fintekkers.requests.util.AffectedEntityProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.requests.util.AffectedEntityProto.toObject(opt_includeInstance, this);
};
proto.fintekkers.requests.util.AffectedEntityProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    entityType: jspb.Message.getFieldWithDefault(msg, 1, 0),
    uuid: (f = msg.getUuid()) && fintekkers_models_util_uuid_pb.UUIDProto.toObject(includeInstance, f),
    description: jspb.Message.getFieldWithDefault(msg, 3, "")
  };
  if (includeInstance) { obj.$jspbMessageInstance = msg; }
  return obj;
};
}

proto.fintekkers.requests.util.AffectedEntityProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.requests.util.AffectedEntityProto;
  return proto.fintekkers.requests.util.AffectedEntityProto.deserializeBinaryFromReader(msg, reader);
};
proto.fintekkers.requests.util.AffectedEntityProto.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) break;
    var field = reader.getFieldNumber();
    switch (field) {
    case 1: msg.setEntityType(reader.readEnum()); break;
    case 2:
      var value = new fintekkers_models_util_uuid_pb.UUIDProto;
      reader.readMessage(value, fintekkers_models_util_uuid_pb.UUIDProto.deserializeBinaryFromReader);
      msg.setUuid(value); break;
    case 3: msg.setDescription(reader.readString()); break;
    default: reader.skipField(); break;
    }
  }
  return msg;
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.requests.util.AffectedEntityProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};
proto.fintekkers.requests.util.AffectedEntityProto.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEntityType();
  if (f !== 0.0) { writer.writeEnum(1, f); }
  f = message.getUuid();
  if (f != null) { writer.writeMessage(2, f, fintekkers_models_util_uuid_pb.UUIDProto.serializeBinaryToWriter); }
  f = message.getDescription();
  if (f.length > 0) { writer.writeString(3, f); }
};

proto.fintekkers.requests.util.AffectedEntityProto.prototype.getEntityType = function() {
  return jspb.Message.getFieldWithDefault(this, 1, 0);
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.setEntityType = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.getUuid = function() {
  return jspb.Message.getWrapperField(this, fintekkers_models_util_uuid_pb.UUIDProto, 2);
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.setUuid = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.clearUuid = function() {
  return this.setUuid(undefined);
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.hasUuid = function() {
  return jspb.Message.getField(this, 2) != null;
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.getDescription = function() {
  return jspb.Message.getFieldWithDefault(this, 3, "");
};
proto.fintekkers.requests.util.AffectedEntityProto.prototype.setDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};

// ============================================================================
// DeleteRequestProto
// ============================================================================
proto.fintekkers.requests.util.DeleteRequestProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fintekkers.requests.util.DeleteRequestProto, jspb.Message);

if (jspb.Message.GENERATE_TO_OBJECT) {
proto.fintekkers.requests.util.DeleteRequestProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.requests.util.DeleteRequestProto.toObject(opt_includeInstance, this);
};
proto.fintekkers.requests.util.DeleteRequestProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    uuid: (f = msg.getUuid()) && fintekkers_models_util_uuid_pb.UUIDProto.toObject(includeInstance, f),
    entityType: jspb.Message.getFieldWithDefault(msg, 11, 0),
    dryRun: jspb.Message.getBooleanFieldWithDefault(msg, 20, false),
    cascade: jspb.Message.getBooleanFieldWithDefault(msg, 21, false),
    force: jspb.Message.getBooleanFieldWithDefault(msg, 22, false)
  };
  if (includeInstance) { obj.$jspbMessageInstance = msg; }
  return obj;
};
}

proto.fintekkers.requests.util.DeleteRequestProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.requests.util.DeleteRequestProto;
  return proto.fintekkers.requests.util.DeleteRequestProto.deserializeBinaryFromReader(msg, reader);
};
proto.fintekkers.requests.util.DeleteRequestProto.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) break;
    var field = reader.getFieldNumber();
    switch (field) {
    case 1: msg.setObjectClass(reader.readString()); break;
    case 2: msg.setVersion(reader.readString()); break;
    case 10:
      var value = new fintekkers_models_util_uuid_pb.UUIDProto;
      reader.readMessage(value, fintekkers_models_util_uuid_pb.UUIDProto.deserializeBinaryFromReader);
      msg.setUuid(value); break;
    case 11: msg.setEntityType(reader.readEnum()); break;
    case 20: msg.setDryRun(reader.readBool()); break;
    case 21: msg.setCascade(reader.readBool()); break;
    case 22: msg.setForce(reader.readBool()); break;
    default: reader.skipField(); break;
    }
  }
  return msg;
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.requests.util.DeleteRequestProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};
proto.fintekkers.requests.util.DeleteRequestProto.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getObjectClass();
  if (f.length > 0) { writer.writeString(1, f); }
  f = message.getVersion();
  if (f.length > 0) { writer.writeString(2, f); }
  f = message.getUuid();
  if (f != null) { writer.writeMessage(10, f, fintekkers_models_util_uuid_pb.UUIDProto.serializeBinaryToWriter); }
  f = message.getEntityType();
  if (f !== 0.0) { writer.writeEnum(11, f); }
  f = message.getDryRun();
  if (f) { writer.writeBool(20, f); }
  f = message.getCascade();
  if (f) { writer.writeBool(21, f); }
  f = message.getForce();
  if (f) { writer.writeBool(22, f); }
};

proto.fintekkers.requests.util.DeleteRequestProto.prototype.getObjectClass = function() {
  return jspb.Message.getFieldWithDefault(this, 1, "");
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.getVersion = function() {
  return jspb.Message.getFieldWithDefault(this, 2, "");
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.getUuid = function() {
  return jspb.Message.getWrapperField(this, fintekkers_models_util_uuid_pb.UUIDProto, 10);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setUuid = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.clearUuid = function() {
  return this.setUuid(undefined);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.hasUuid = function() {
  return jspb.Message.getField(this, 10) != null;
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.getEntityType = function() {
  return jspb.Message.getFieldWithDefault(this, 11, 0);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setEntityType = function(value) {
  return jspb.Message.setProto3EnumField(this, 11, value);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.getDryRun = function() {
  return jspb.Message.getBooleanFieldWithDefault(this, 20, false);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setDryRun = function(value) {
  return jspb.Message.setProto3BooleanField(this, 20, value);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.getCascade = function() {
  return jspb.Message.getBooleanFieldWithDefault(this, 21, false);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setCascade = function(value) {
  return jspb.Message.setProto3BooleanField(this, 21, value);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.getForce = function() {
  return jspb.Message.getBooleanFieldWithDefault(this, 22, false);
};
proto.fintekkers.requests.util.DeleteRequestProto.prototype.setForce = function(value) {
  return jspb.Message.setProto3BooleanField(this, 22, value);
};

// ============================================================================
// DeleteResponseProto
// ============================================================================
proto.fintekkers.requests.util.DeleteResponseProto = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fintekkers.requests.util.DeleteResponseProto.repeatedFields_, null);
};
goog.inherits(proto.fintekkers.requests.util.DeleteResponseProto, jspb.Message);
proto.fintekkers.requests.util.DeleteResponseProto.repeatedFields_ = [30, 40];

if (jspb.Message.GENERATE_TO_OBJECT) {
proto.fintekkers.requests.util.DeleteResponseProto.prototype.toObject = function(opt_includeInstance) {
  return proto.fintekkers.requests.util.DeleteResponseProto.toObject(opt_includeInstance, this);
};
proto.fintekkers.requests.util.DeleteResponseProto.toObject = function(includeInstance, msg) {
  var f, obj = {
    objectClass: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, ""),
    deleteRequest: (f = msg.getDeleteRequest()) && proto.fintekkers.requests.util.DeleteRequestProto.toObject(includeInstance, f),
    success: jspb.Message.getBooleanFieldWithDefault(msg, 20, false),
    wasDryRun: jspb.Message.getBooleanFieldWithDefault(msg, 21, false),
    totalCount: jspb.Message.getFieldWithDefault(msg, 22, 0),
    affectedEntitiesList: jspb.Message.toObjectList(msg.getAffectedEntitiesList(),
        proto.fintekkers.requests.util.AffectedEntityProto.toObject, includeInstance),
    warningsList: (f = jspb.Message.getRepeatedField(msg, 40)) == null ? undefined : f
  };
  if (includeInstance) { obj.$jspbMessageInstance = msg; }
  return obj;
};
}

proto.fintekkers.requests.util.DeleteResponseProto.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fintekkers.requests.util.DeleteResponseProto;
  return proto.fintekkers.requests.util.DeleteResponseProto.deserializeBinaryFromReader(msg, reader);
};
proto.fintekkers.requests.util.DeleteResponseProto.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) break;
    var field = reader.getFieldNumber();
    switch (field) {
    case 1: msg.setObjectClass(reader.readString()); break;
    case 2: msg.setVersion(reader.readString()); break;
    case 10:
      var value = new proto.fintekkers.requests.util.DeleteRequestProto;
      reader.readMessage(value, proto.fintekkers.requests.util.DeleteRequestProto.deserializeBinaryFromReader);
      msg.setDeleteRequest(value); break;
    case 20: msg.setSuccess(reader.readBool()); break;
    case 21: msg.setWasDryRun(reader.readBool()); break;
    case 22: msg.setTotalCount(reader.readInt32()); break;
    case 30:
      var value = new proto.fintekkers.requests.util.AffectedEntityProto;
      reader.readMessage(value, proto.fintekkers.requests.util.AffectedEntityProto.deserializeBinaryFromReader);
      msg.addAffectedEntities(value); break;
    case 40: msg.addWarnings(reader.readString()); break;
    default: reader.skipField(); break;
    }
  }
  return msg;
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fintekkers.requests.util.DeleteResponseProto.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};
proto.fintekkers.requests.util.DeleteResponseProto.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getObjectClass();
  if (f.length > 0) { writer.writeString(1, f); }
  f = message.getVersion();
  if (f.length > 0) { writer.writeString(2, f); }
  f = message.getDeleteRequest();
  if (f != null) { writer.writeMessage(10, f, proto.fintekkers.requests.util.DeleteRequestProto.serializeBinaryToWriter); }
  f = message.getSuccess();
  if (f) { writer.writeBool(20, f); }
  f = message.getWasDryRun();
  if (f) { writer.writeBool(21, f); }
  f = message.getTotalCount();
  if (f !== 0) { writer.writeInt32(22, f); }
  f = message.getAffectedEntitiesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(30, f, proto.fintekkers.requests.util.AffectedEntityProto.serializeBinaryToWriter);
  }
  f = message.getWarningsList();
  if (f.length > 0) { writer.writeRepeatedString(40, f); }
};

proto.fintekkers.requests.util.DeleteResponseProto.prototype.getObjectClass = function() {
  return jspb.Message.getFieldWithDefault(this, 1, "");
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setObjectClass = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getVersion = function() {
  return jspb.Message.getFieldWithDefault(this, 2, "");
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getDeleteRequest = function() {
  return jspb.Message.getWrapperField(this, proto.fintekkers.requests.util.DeleteRequestProto, 10);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setDeleteRequest = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.clearDeleteRequest = function() {
  return this.setDeleteRequest(undefined);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.hasDeleteRequest = function() {
  return jspb.Message.getField(this, 10) != null;
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getSuccess = function() {
  return jspb.Message.getBooleanFieldWithDefault(this, 20, false);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setSuccess = function(value) {
  return jspb.Message.setProto3BooleanField(this, 20, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getWasDryRun = function() {
  return jspb.Message.getBooleanFieldWithDefault(this, 21, false);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setWasDryRun = function(value) {
  return jspb.Message.setProto3BooleanField(this, 21, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getTotalCount = function() {
  return jspb.Message.getFieldWithDefault(this, 22, 0);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setTotalCount = function(value) {
  return jspb.Message.setProto3IntField(this, 22, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getAffectedEntitiesList = function() {
  return jspb.Message.getRepeatedWrapperField(this, proto.fintekkers.requests.util.AffectedEntityProto, 30);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setAffectedEntitiesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 30, value);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.addAffectedEntities = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 30, opt_value, proto.fintekkers.requests.util.AffectedEntityProto, opt_index);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.clearAffectedEntitiesList = function() {
  return this.setAffectedEntitiesList([]);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.getWarningsList = function() {
  return jspb.Message.getRepeatedField(this, 40);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.setWarningsList = function(value) {
  return jspb.Message.setField(this, 40, value || []);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.addWarnings = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 40, value, opt_index);
};
proto.fintekkers.requests.util.DeleteResponseProto.prototype.clearWarningsList = function() {
  return this.setWarningsList([]);
};

goog.object.extend(exports, proto.fintekkers.requests.util);
