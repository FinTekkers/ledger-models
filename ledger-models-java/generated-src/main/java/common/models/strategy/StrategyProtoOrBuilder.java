// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: models/strategy/strategy.proto

package common.models.strategy;

public interface StrategyProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:strategy.StrategyProto)
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
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   * @return Whether the uuid field is set.
   */
  boolean hasUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   * @return The uuid.
   */
  common.models.protoUtils.Uuid.UUIDProto getUuid();
  /**
   * <pre>
   *Primary Key
   * </pre>
   *
   * <code>.util.UUIDProto uuid = 5;</code>
   */
  common.models.protoUtils.Uuid.UUIDProtoOrBuilder getUuidOrBuilder();

  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   * @return Whether the asOf field is set.
   */
  boolean hasAsOf();
  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   * @return The asOf.
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProto getAsOf();
  /**
   * <code>.util.LocalTimestampProto as_of = 6;</code>
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProtoOrBuilder getAsOfOrBuilder();

  /**
   * <code>bool is_link = 7;</code>
   * @return The isLink.
   */
  boolean getIsLink();

  /**
   * <pre>
   *Transaction details
   * </pre>
   *
   * <code>string strategy_name = 10;</code>
   * @return The strategyName.
   */
  java.lang.String getStrategyName();
  /**
   * <pre>
   *Transaction details
   * </pre>
   *
   * <code>string strategy_name = 10;</code>
   * @return The bytes for strategyName.
   */
  com.google.protobuf.ByteString
      getStrategyNameBytes();

  /**
   * <code>.strategy.StrategyProto parent = 11;</code>
   * @return Whether the parent field is set.
   */
  boolean hasParent();
  /**
   * <code>.strategy.StrategyProto parent = 11;</code>
   * @return The parent.
   */
  common.models.strategy.StrategyProto getParent();
  /**
   * <code>.strategy.StrategyProto parent = 11;</code>
   */
  common.models.strategy.StrategyProtoOrBuilder getParentOrBuilder();
}
