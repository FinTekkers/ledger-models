// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/get_field_values_response.proto

package fintekkers.requests.security;

public interface GetFieldValuesResponseProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.requests.security.GetFieldValuesResponseProto)
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
   * <code>repeated .google.protobuf.Any values = 10;</code>
   */
  java.util.List<com.google.protobuf.Any> 
      getValuesList();
  /**
   * <code>repeated .google.protobuf.Any values = 10;</code>
   */
  com.google.protobuf.Any getValues(int index);
  /**
   * <code>repeated .google.protobuf.Any values = 10;</code>
   */
  int getValuesCount();
  /**
   * <code>repeated .google.protobuf.Any values = 10;</code>
   */
  java.util.List<? extends com.google.protobuf.AnyOrBuilder> 
      getValuesOrBuilderList();
  /**
   * <code>repeated .google.protobuf.Any values = 10;</code>
   */
  com.google.protobuf.AnyOrBuilder getValuesOrBuilder(
      int index);
}
