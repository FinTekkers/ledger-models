// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/get_field_values_response.proto

package fintekkers.requests.security;

public final class GetFieldValuesResponseProtos {
  private GetFieldValuesResponseProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_security_GetFieldValuesResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_security_GetFieldValuesResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n<fintekkers/requests/security/get_field" +
      "_values_response.proto\022\034fintekkers.reque" +
      "sts.security\032\031google/protobuf/any.proto\"" +
      "j\n\033GetFieldValuesResponseProto\022\024\n\014object" +
      "_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\022$\n\006values\030" +
      "\n \003(\0132\024.google.protobuf.AnyB B\034GetFieldV" +
      "aluesResponseProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          com.google.protobuf.AnyProto.getDescriptor(),
        });
    internal_static_fintekkers_requests_security_GetFieldValuesResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_security_GetFieldValuesResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_security_GetFieldValuesResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "Values", });
    com.google.protobuf.AnyProto.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
