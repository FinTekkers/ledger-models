// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/transaction/transaction_request.proto

package common.request;

public final class TransactionRequestProtos {
  private TransactionRequestProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_transaction_TransactionRequestProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_transaction_TransactionRequestProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n.requests/transaction/transaction_reque" +
      "st.proto\022\013transaction\032$models/transactio" +
      "n/transaction.proto\032\026models/util/uuid.pr" +
      "oto\032\035requests/util/operation.proto\032%mode" +
      "ls/position/position_filter.proto\"\233\002\n\027Tr" +
      "ansactionRequestProto\022\024\n\014object_class\030\001 " +
      "\001(\t\022\017\n\007version\030\002 \001(\t\0227\n\016operation_type\030\n" +
      " \001(\0162\037.util.RequestOperationTypeProto\022?\n" +
      "\030create_transaction_input\030\024 \001(\0132\035.transa" +
      "ction.TransactionProto\022\036\n\005uuids\030\025 \003(\0132\017." +
      "util.UUIDProto\022?\n\030search_transaction_inp" +
      "ut\030\026 \001(\0132\035.position.PositionFilterProtoB" +
      ",\n\016common.requestB\030TransactionRequestPro" +
      "tosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          common.models.transaction.TransactionProtos.getDescriptor(),
          common.models.protoUtils.Uuid.getDescriptor(),
          util.Operation.getDescriptor(),
          common.models.position.PositionFilterProtos.getDescriptor(),
        });
    internal_static_transaction_TransactionRequestProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_transaction_TransactionRequestProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_transaction_TransactionRequestProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "OperationType", "CreateTransactionInput", "Uuids", "SearchTransactionInput", });
    common.models.transaction.TransactionProtos.getDescriptor();
    common.models.protoUtils.Uuid.getDescriptor();
    util.Operation.getDescriptor();
    common.models.position.PositionFilterProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}