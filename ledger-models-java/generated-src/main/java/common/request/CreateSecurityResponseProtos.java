// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/security/create_security_response.proto

package common.request;

public final class CreateSecurityResponseProtos {
  private CreateSecurityResponseProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_security_CreateSecurityResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_security_CreateSecurityResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n0requests/security/create_security_resp" +
      "onse.proto\022\010security\032\036models/security/se" +
      "curity.proto\032/requests/security/create_s" +
      "ecurity_request.proto\032\"requests/util/err" +
      "ors/summary.proto\"\357\001\n\033CreateSecurityResp" +
      "onseProto\022\024\n\014object_class\030\001 \001(\t\022\017\n\007versi" +
      "on\030\002 \001(\t\022>\n\020security_request\030\024 \001(\0132$.sec" +
      "urity.CreateSecurityRequestProto\0222\n\021secu" +
      "rity_response\030\036 \001(\0132\027.security.SecurityP" +
      "roto\0225\n\022errors_or_warnings\030( \001(\0132\031.util." +
      "errors.SummaryProtoB0\n\016common.requestB\034C" +
      "reateSecurityResponseProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.models.security.SecurityProtos.getDescriptor(),
          common.request.CreateSecurityRequestProtos.getDescriptor(),
          util.errors.Summary.getDescriptor(),
        });
    internal_static_security_CreateSecurityResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_security_CreateSecurityResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_security_CreateSecurityResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "SecurityRequest", "SecurityResponse", "ErrorsOrWarnings", });
    common.models.security.SecurityProtos.getDescriptor();
    common.request.CreateSecurityRequestProtos.getDescriptor();
    util.errors.Summary.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
