// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/valuation/valuation_request.proto

package fintekkers.requests.valuation;

public final class ValuationRequestProtos {
  private ValuationRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_valuation_ValuationRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_valuation_ValuationRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n5fintekkers/requests/valuation/valuatio" +
      "n_request.proto\022\035fintekkers.requests.val" +
      "uation\032)fintekkers/models/security/secur" +
      "ity.proto\032)fintekkers/models/position/po" +
      "sition.proto\032#fintekkers/models/price/pr" +
      "ice.proto\032(fintekkers/requests/util/oper" +
      "ation.proto\032(fintekkers/models/position/" +
      "measure.proto\"\207\003\n\025ValuationRequestProto\022" +
      "\024\n\014object_class\030\001 \001(\t\022\017\n\007version\030\002 \001(\t\022K" +
      "\n\016operation_type\030\n \001(\01623.fintekkers.requ" +
      "ests.util.RequestOperationTypeProto\022:\n\010m" +
      "easures\030\036 \003(\0162(.fintekkers.models.positi" +
      "on.MeasureProto\022A\n\016security_input\030\024 \001(\0132" +
      ").fintekkers.models.security.SecurityPro" +
      "to\022A\n\016position_input\030\025 \001(\0132).fintekkers." +
      "models.position.PositionProto\0228\n\013price_i" +
      "nput\030\026 \001(\0132#.fintekkers.models.price.Pri" +
      "ceProtoB\032B\026ValuationRequestProtosP\001b\006pro" +
      "to3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.security.SecurityProtos.getDescriptor(),
          fintekkers.models.position.PositionProtos.getDescriptor(),
          fintekkers.models.price.PriceProtos.getDescriptor(),
          fintekkers.requests.util.Operation.getDescriptor(),
          fintekkers.models.position.MeasureProtos.getDescriptor(),
        });
    internal_static_fintekkers_requests_valuation_ValuationRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_valuation_ValuationRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_valuation_ValuationRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "OperationType", "Measures", "SecurityInput", "PositionInput", "PriceInput", });
    fintekkers.models.security.SecurityProtos.getDescriptor();
    fintekkers.models.position.PositionProtos.getDescriptor();
    fintekkers.models.price.PriceProtos.getDescriptor();
    fintekkers.requests.util.Operation.getDescriptor();
    fintekkers.models.position.MeasureProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
