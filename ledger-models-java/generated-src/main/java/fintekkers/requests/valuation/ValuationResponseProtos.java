// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/valuation/valuation_response.proto

package fintekkers.requests.valuation;

public final class ValuationResponseProtos {
  private ValuationResponseProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_valuation_ValuationResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_valuation_ValuationResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n6fintekkers/requests/valuation/valuatio" +
      "n_response.proto\022\035fintekkers.requests.va" +
      "luation\032.fintekkers/models/position/posi" +
      "tion_util.proto\0325fintekkers/requests/val" +
      "uation/valuation_request.proto\"\326\001\n\026Valua" +
      "tionResponseProto\022\024\n\014object_class\030\001 \001(\t\022" +
      "\017\n\007version\030\002 \001(\t\022O\n\021valuation_request\030\024 " +
      "\001(\01324.fintekkers.requests.valuation.Valu" +
      "ationRequestProto\022D\n\017measure_results\030\036 \003" +
      "(\0132+.fintekkers.models.position.MeasureM" +
      "apEntryB\033B\027ValuationResponseProtosP\001b\006pr" +
      "oto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.position.PositionUtilProtos.getDescriptor(),
          fintekkers.requests.valuation.ValuationRequestProtos.getDescriptor(),
        });
    internal_static_fintekkers_requests_valuation_ValuationResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_valuation_ValuationResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_valuation_ValuationResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "ValuationRequest", "MeasureResults", });
    fintekkers.models.position.PositionUtilProtos.getDescriptor();
    fintekkers.requests.valuation.ValuationRequestProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
