// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/position/query_position_request.proto

package common.request;

public final class QueryPositionRequestProtos {
  private QueryPositionRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_position_QueryPositionRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_position_QueryPositionRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n.requests/position/query_position_reque" +
      "st.proto\022\010position\032\033models/position/fiel" +
      "d.proto\032\035models/position/measure.proto\032\036" +
      "models/position/position.proto\032%models/p" +
      "osition/position_filter.proto\032!models/ut" +
      "il/local_timestamp.proto\032\035requests/util/" +
      "operation.proto\"\223\003\n\031QueryPositionRequest" +
      "Proto\022\024\n\014object_class\030\001 \001(\t\022\017\n\007version\030\002" +
      " \001(\t\0227\n\016operation_type\030\n \001(\0162\037.util.Requ" +
      "estOperationTypeProto\0222\n\rposition_type\030\024" +
      " \001(\0162\033.position.PositionTypeProto\0222\n\rpos" +
      "ition_view\030\025 \001(\0162\033.position.PositionView" +
      "Proto\022$\n\006fields\030\036 \003(\0162\024.position.FieldPr" +
      "oto\022(\n\010measures\030\037 \003(\0162\026.position.Measure" +
      "Proto\0224\n\rfilter_fields\030  \001(\0132\035.position." +
      "PositionFilterProto\022(\n\005as_of\030! \001(\0132\031.uti" +
      "l.LocalTimestampProtoB.\n\016common.requestB" +
      "\032QueryPositionRequestProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.models.position.FieldProtos.getDescriptor(),
          common.models.position.MeasureProtos.getDescriptor(),
          common.models.position.PositionProtos.getDescriptor(),
          common.models.position.PositionFilterProtos.getDescriptor(),
          common.models.protoUtils.LocalTimestamp.getDescriptor(),
          common.request.util.Operation.getDescriptor(),
        });
    internal_static_position_QueryPositionRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_position_QueryPositionRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_position_QueryPositionRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "OperationType", "PositionType", "PositionView", "Fields", "Measures", "FilterFields", "AsOf", });
    common.models.position.FieldProtos.getDescriptor();
    common.models.position.MeasureProtos.getDescriptor();
    common.models.position.PositionProtos.getDescriptor();
    common.models.position.PositionFilterProtos.getDescriptor();
    common.models.protoUtils.LocalTimestamp.getDescriptor();
    common.request.util.Operation.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
