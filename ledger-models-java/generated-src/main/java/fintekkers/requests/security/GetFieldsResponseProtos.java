// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/get_fields_response.proto

package fintekkers.requests.security;

public final class GetFieldsResponseProtos {
  private GetFieldsResponseProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_security_GetFieldsResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_security_GetFieldsResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n6fintekkers/requests/security/get_field" +
      "s_response.proto\022\034fintekkers.requests.se" +
      "curity\032&fintekkers/models/position/field" +
      ".proto\"w\n\026GetFieldsResponseProto\022\024\n\014obje" +
      "ct_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\0226\n\006field" +
      "s\030\n \003(\0162&.fintekkers.models.position.Fie" +
      "ldProtoB\033B\027GetFieldsResponseProtosP\001b\006pr" +
      "oto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.position.FieldProtos.getDescriptor(),
        });
    internal_static_fintekkers_requests_security_GetFieldsResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_security_GetFieldsResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_security_GetFieldsResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "Fields", });
    fintekkers.models.position.FieldProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
