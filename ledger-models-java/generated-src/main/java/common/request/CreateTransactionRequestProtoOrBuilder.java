// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/transaction/create_transaction_request.proto

package common.request;

public interface CreateTransactionRequestProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:transaction.CreateTransactionRequestProto)
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
   * <code>.transaction.TransactionProto create_transaction_input = 20;</code>
   * @return Whether the createTransactionInput field is set.
   */
  boolean hasCreateTransactionInput();
  /**
   * <code>.transaction.TransactionProto create_transaction_input = 20;</code>
   * @return The createTransactionInput.
   */
  common.models.transaction.TransactionProto getCreateTransactionInput();
  /**
   * <code>.transaction.TransactionProto create_transaction_input = 20;</code>
   */
  common.models.transaction.TransactionProtoOrBuilder getCreateTransactionInputOrBuilder();
}
