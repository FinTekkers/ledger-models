// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/transaction/create_transaction_response.proto

package fintekkers.requests.transaction;

public final class CreateTransactionResponseProtos {
  private CreateTransactionResponseProtos() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_transaction_CreateTransactionResponseProto_descriptor;
  static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_transaction_CreateTransactionResponseProto_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\nAfintekkers/requests/transaction/create" +
      "_transaction_response.proto\022\037fintekkers." +
      "requests.transaction\032/fintekkers/models/" +
      "transaction/transaction.proto\032@fintekker" +
      "s/requests/transaction/create_transactio" +
      "n_request.proto\"\372\001\n\036CreateTransactionRes" +
      "ponseProto\022\024\n\014object_class\030\001 \001(\t\022\017\n\007vers" +
      "ion\030\002 \001(\t\022b\n\032create_transaction_request\030" +
      "\024 \001(\0132>.fintekkers.requests.transaction." +
      "CreateTransactionRequestProto\022M\n\024transac" +
      "tion_response\030\036 \001(\0132/.fintekkers.models." +
      "transaction.TransactionProtoB#B\037CreateTr" +
      "ansactionResponseProtosP\001b\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
          fintekkers.models.transaction.TransactionProtos.getDescriptor(),
          fintekkers.requests.transaction.CreateTransactionRequestProtos.getDescriptor(),
        });
    internal_static_fintekkers_requests_transaction_CreateTransactionResponseProto_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_transaction_CreateTransactionResponseProto_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_transaction_CreateTransactionResponseProto_descriptor,
        new java.lang.String[] { "ObjectClass", "Version", "CreateTransactionRequest", "TransactionResponse", });
    fintekkers.models.transaction.TransactionProtos.getDescriptor();
    fintekkers.requests.transaction.CreateTransactionRequestProtos.getDescriptor();
  }

  // @@protoc_insertion_point(outer_class_scope)
}
