// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/transaction/create_transaction_request.proto

package common.request;

public interface TransactionRequestProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:transaction.TransactionRequestProto)
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
   * <code>.util.RequestOperationTypeProto operation_type = 10;</code>
   * @return The enum numeric value on the wire for operationType.
   */
  int getOperationTypeValue();
  /**
   * <code>.util.RequestOperationTypeProto operation_type = 10;</code>
   * @return The operationType.
   */
  common.request.util.RequestOperationTypeProto getOperationType();

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

  /**
   * <code>repeated .util.UUIDProto uuids = 21;</code>
   */
  java.util.List<common.models.protoUtils.Uuid.UUIDProto> 
      getUuidsList();
  /**
   * <code>repeated .util.UUIDProto uuids = 21;</code>
   */
  common.models.protoUtils.Uuid.UUIDProto getUuids(int index);
  /**
   * <code>repeated .util.UUIDProto uuids = 21;</code>
   */
  int getUuidsCount();
  /**
   * <code>repeated .util.UUIDProto uuids = 21;</code>
   */
  java.util.List<? extends common.models.protoUtils.Uuid.UUIDProtoOrBuilder> 
      getUuidsOrBuilderList();
  /**
   * <code>repeated .util.UUIDProto uuids = 21;</code>
   */
  common.models.protoUtils.Uuid.UUIDProtoOrBuilder getUuidsOrBuilder(
      int index);

  /**
   * <code>.position.PositionFilterProto search_transaction_input = 22;</code>
   * @return Whether the searchTransactionInput field is set.
   */
  boolean hasSearchTransactionInput();
  /**
   * <code>.position.PositionFilterProto search_transaction_input = 22;</code>
   * @return The searchTransactionInput.
   */
  common.models.position.PositionFilterProto getSearchTransactionInput();
  /**
   * <code>.position.PositionFilterProto search_transaction_input = 22;</code>
   */
  common.models.position.PositionFilterProtoOrBuilder getSearchTransactionInputOrBuilder();
}
