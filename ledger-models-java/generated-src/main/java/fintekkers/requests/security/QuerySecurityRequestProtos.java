// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/query_security_request.proto

package fintekkers.requests.security;

public final class QuerySecurityRequestProtos {
  private QuerySecurityRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_security_QuerySecurityRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_security_QuerySecurityRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n9fintekkers/requests/security/query_sec" +
      "urity_request.proto\022\034fintekkers.requests" +
      ".security\032!fintekkers/models/util/uuid.p" +
      "roto\032,fintekkers/models/util/local_times" +
      "tamp.proto\0320fintekkers/models/position/p" +
      "osition_filter.proto\"\200\002\n\031QuerySecurityRe" +
      "questProto\022\024\n\014object_class\030\001 \001(\t\022\017\n\007vers" +
      "ion\030\002 \001(\t\0220\n\005uuIds\030\025 \003(\0132!.fintekkers.mo" +
      "dels.util.UUIDProto\022N\n\025search_security_i" +
      "nput\030\026 \001(\0132/.fintekkers.models.position." +
      "PositionFilterProto\022:\n\005as_of\030\027 \001(\0132+.fin" +
      "tekkers.models.util.LocalTimestampProtoB" +
      "\036B\032QuerySecurityRequestProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.util.Uuid.getDescriptor(),
          fintekkers.models.util.LocalTimestamp.getDescriptor(),
          fintekkers.models.position.PositionFilterProtos.getDescriptor(),
        });
    internal_static_fintekkers_requests_security_QuerySecurityRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_security_QuerySecurityRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_security_QuerySecurityRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "UuIds", "SearchSecurityInput", "AsOf", });
    fintekkers.models.util.Uuid.getDescriptor();
    fintekkers.models.util.LocalTimestamp.getDescriptor();
    fintekkers.models.position.PositionFilterProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
