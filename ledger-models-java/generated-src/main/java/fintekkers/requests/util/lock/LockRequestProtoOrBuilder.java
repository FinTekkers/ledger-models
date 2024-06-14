// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/util/lock/lock_request.proto

package fintekkers.requests.util.lock;

public interface LockRequestProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.requests.util.lock.LockRequestProto)
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
   *The namespace/partition to get the lock for. Generally, when requesting a 
   *lock the caller should only specify the namespace, meaning that its up to 
   *the lock service to pick a partition for you. 
   *If the partition number is also specified the lock service will ONLY try
   *to get the lock on that parition and fail if it the lock is already taken
   * </pre>
   *
   * <code>.fintekkers.models.util.lock.NodePartition node_partition = 11;</code>
   * @return Whether the nodePartition field is set.
   */
  boolean hasNodePartition();
  /**
   * <pre>
   *The namespace/partition to get the lock for. Generally, when requesting a 
   *lock the caller should only specify the namespace, meaning that its up to 
   *the lock service to pick a partition for you. 
   *If the partition number is also specified the lock service will ONLY try
   *to get the lock on that parition and fail if it the lock is already taken
   * </pre>
   *
   * <code>.fintekkers.models.util.lock.NodePartition node_partition = 11;</code>
   * @return The nodePartition.
   */
  fintekkers.models.util.lock.NodePartitionOuterClass.NodePartition getNodePartition();
  /**
   * <pre>
   *The namespace/partition to get the lock for. Generally, when requesting a 
   *lock the caller should only specify the namespace, meaning that its up to 
   *the lock service to pick a partition for you. 
   *If the partition number is also specified the lock service will ONLY try
   *to get the lock on that parition and fail if it the lock is already taken
   * </pre>
   *
   * <code>.fintekkers.models.util.lock.NodePartition node_partition = 11;</code>
   */
  fintekkers.models.util.lock.NodePartitionOuterClass.NodePartitionOrBuilder getNodePartitionOrBuilder();

  /**
   * <code>.fintekkers.models.util.Endpoint endpoint = 12;</code>
   * @return Whether the endpoint field is set.
   */
  boolean hasEndpoint();
  /**
   * <code>.fintekkers.models.util.Endpoint endpoint = 12;</code>
   * @return The endpoint.
   */
  fintekkers.models.util.EndpointOuterClass.Endpoint getEndpoint();
  /**
   * <code>.fintekkers.models.util.Endpoint endpoint = 12;</code>
   */
  fintekkers.models.util.EndpointOuterClass.EndpointOrBuilder getEndpointOrBuilder();
}
