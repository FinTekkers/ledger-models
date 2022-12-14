// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: models/util/lock/node_state.proto

package common.util.locks;

public interface NodeStateProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:util.lock.NodeStateProto)
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
   *Placeholder, will change
   * </pre>
   *
   * <code>string partition = 3;</code>
   * @return The partition.
   */
  java.lang.String getPartition();
  /**
   * <pre>
   *Placeholder, will change
   * </pre>
   *
   * <code>string partition = 3;</code>
   * @return The bytes for partition.
   */
  com.google.protobuf.ByteString
      getPartitionBytes();

  /**
   * <pre>
   *Currently a URL, will change
   * </pre>
   *
   * <code>string end_point = 4;</code>
   * @return The endPoint.
   */
  java.lang.String getEndPoint();
  /**
   * <pre>
   *Currently a URL, will change
   * </pre>
   *
   * <code>string end_point = 4;</code>
   * @return The bytes for endPoint.
   */
  com.google.protobuf.ByteString
      getEndPointBytes();

  /**
   * <pre>
   *The last time a node was seen
   * </pre>
   *
   * <code>.util.LocalTimestampProto last_seen = 5;</code>
   * @return Whether the lastSeen field is set.
   */
  boolean hasLastSeen();
  /**
   * <pre>
   *The last time a node was seen
   * </pre>
   *
   * <code>.util.LocalTimestampProto last_seen = 5;</code>
   * @return The lastSeen.
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProto getLastSeen();
  /**
   * <pre>
   *The last time a node was seen
   * </pre>
   *
   * <code>.util.LocalTimestampProto last_seen = 5;</code>
   */
  common.models.protoUtils.LocalTimestamp.LocalTimestampProtoOrBuilder getLastSeenOrBuilder();

  /**
   * <pre>
   *Whether the lock is expired or not (owned by the lock-service)
   * </pre>
   *
   * <code>bool is_expired = 6;</code>
   * @return The isExpired.
   */
  boolean getIsExpired();
}
