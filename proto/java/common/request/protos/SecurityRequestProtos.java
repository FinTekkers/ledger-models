// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: protos/requests/security/security_request.proto

package common.request.protos;

public final class SecurityRequestProtos {
  private SecurityRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_security_SecurityRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_security_SecurityRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n/protos/requests/security/security_requ" +
      "est.proto\022\010security\032%protos/models/secur" +
      "ity/security.proto\032\035protos/models/util/u" +
      "uid.proto\032,protos/models/position/positi" +
      "on_filter.proto\032$protos/requests/util/op" +
      "eration.proto\"\214\002\n\024SecurityRequestProto\022\024" +
      "\n\014object_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\0227\n" +
      "\016operation_type\030\n \001(\0162\037.util.RequestOper" +
      "ationTypeProto\0226\n\025create_security_input\030" +
      "\024 \001(\0132\027.security.SecurityProto\022\036\n\005uuids\030" +
      "\025 \003(\0132\017.util.UUIDProto\022<\n\025search_securit" +
      "y_input\030\026 \001(\0132\035.position.PositionFilterP" +
      "rotoB0\n\025common.request.protosB\025SecurityR" +
      "equestProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.model.protos.SecurityProtos.getDescriptor(),
          common.model.protoUtils.Uuid.getDescriptor(),
          common.model.protos.PositionFilterProtos.getDescriptor(),
          util.Operation.getDescriptor(),
        });
    internal_static_security_SecurityRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_security_SecurityRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_security_SecurityRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "OperationType", "CreateSecurityInput", "Uuids", "SearchSecurityInput", });
    common.model.protos.SecurityProtos.getDescriptor();
    common.model.protoUtils.Uuid.getDescriptor();
    common.model.protos.PositionFilterProtos.getDescriptor();
    util.Operation.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}