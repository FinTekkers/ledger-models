// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/transaction/query_transaction_request.proto

package common.request;

public final class QueryTransactionRequestProtos {
  private QueryTransactionRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_transaction_QueryTransactionRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_transaction_QueryTransactionRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n4requests/transaction/query_transaction" +
      "_request.proto\022\013transaction\032\026models/util" +
      "/uuid.proto\032%models/position/position_fi" +
      "lter.proto\"\246\001\n\034QueryTransactionRequestPr" +
      "oto\022\024\n\014object_class\030\001 \001(\t\022\017\n\007version\030\002 \001" +
      "(\t\022\036\n\005uuids\030\025 \003(\0132\017.util.UUIDProto\022?\n\030se" +
      "arch_transaction_input\030\026 \001(\0132\035.position." +
      "PositionFilterProtoB1\n\016common.requestB\035Q" +
      "ueryTransactionRequestProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.models.protoUtils.Uuid.getDescriptor(),
          common.models.position.PositionFilterProtos.getDescriptor(),
        });
    internal_static_transaction_QueryTransactionRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_transaction_QueryTransactionRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_transaction_QueryTransactionRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "Uuids", "SearchTransactionInput", });
    common.models.protoUtils.Uuid.getDescriptor();
    common.models.position.PositionFilterProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
