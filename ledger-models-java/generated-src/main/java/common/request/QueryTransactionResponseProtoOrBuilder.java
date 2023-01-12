// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/transaction/query_transaction_response.proto

package common.request;

public interface QueryTransactionResponseProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:transaction.QueryTransactionResponseProto)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>string object_class = 1;</code>
   * @return The objectClass.
   */
  java.lang.String getObjectClass();
  /**
   * <code>string object_class = 1;</code>
   * @return The bytes for objectClass.
   */
  com.google.protobuf.ByteString
      getObjectClassBytes();

  /**
   * <code>string version = 2;</code>
   * @return The version.
   */
  java.lang.String getVersion();
  /**
   * <code>string version = 2;</code>
   * @return The bytes for version.
   */
  com.google.protobuf.ByteString
      getVersionBytes();

  /**
   * <code>.transaction.QueryTransactionRequestProto create_transaction_request = 20;</code>
   * @return Whether the createTransactionRequest field is set.
   */
  boolean hasCreateTransactionRequest();
  /**
   * <code>.transaction.QueryTransactionRequestProto create_transaction_request = 20;</code>
   * @return The createTransactionRequest.
   */
  common.request.QueryTransactionRequestProto getCreateTransactionRequest();
  /**
   * <code>.transaction.QueryTransactionRequestProto create_transaction_request = 20;</code>
   */
  common.request.QueryTransactionRequestProtoOrBuilder getCreateTransactionRequestOrBuilder();

  /**
   * <code>repeated .transaction.TransactionProto transaction_response = 30;</code>
   */
  java.util.List<common.models.transaction.TransactionProto> 
      getTransactionResponseList();
  /**
   * <code>repeated .transaction.TransactionProto transaction_response = 30;</code>
   */
  common.models.transaction.TransactionProto getTransactionResponse(int index);
  /**
   * <code>repeated .transaction.TransactionProto transaction_response = 30;</code>
   */
  int getTransactionResponseCount();
  /**
   * <code>repeated .transaction.TransactionProto transaction_response = 30;</code>
   */
  java.util.List<? extends common.models.transaction.TransactionProtoOrBuilder> 
      getTransactionResponseOrBuilderList();
  /**
   * <code>repeated .transaction.TransactionProto transaction_response = 30;</code>
   */
  common.models.transaction.TransactionProtoOrBuilder getTransactionResponseOrBuilder(
      int index);
}