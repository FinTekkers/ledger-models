// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/create_security_response.proto

package fintekkers.requests.security;

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
    internal_static_fintekkers_requests_security_CreateSecurityResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_security_CreateSecurityResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n;fintekkers/requests/security/create_se" +
      "curity_response.proto\022\034fintekkers.reques" +
      "ts.security\032)fintekkers/models/security/" +
      "security.proto\032:fintekkers/requests/secu" +
      "rity/create_security_request.proto\032-fint" +
      "ekkers/requests/util/errors/summary.prot" +
      "o\"\251\002\n\033CreateSecurityResponseProto\022\024\n\014obj" +
      "ect_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\022R\n\020secu" +
      "rity_request\030\024 \001(\01328.fintekkers.requests" +
      ".security.CreateSecurityRequestProto\022D\n\021" +
      "security_response\030\036 \001(\0132).fintekkers.mod" +
      "els.security.SecurityProto\022I\n\022errors_or_" +
      "warnings\030( \001(\0132-.fintekkers.requests.uti" +
      "l.errors.SummaryProtoB B\034CreateSecurityR" +
      "esponseProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.security.SecurityProtos.getDescriptor(),
          fintekkers.requests.security.CreateSecurityRequestProtos.getDescriptor(),
          fintekkers.requests.util.errors.Summary.getDescriptor(),
        });
    internal_static_fintekkers_requests_security_CreateSecurityResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_security_CreateSecurityResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_security_CreateSecurityResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "SecurityRequest", "SecurityResponse", "ErrorsOrWarnings", });
    fintekkers.models.security.SecurityProtos.getDescriptor();
    fintekkers.requests.security.CreateSecurityRequestProtos.getDescriptor();
    fintekkers.requests.util.errors.Summary.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
