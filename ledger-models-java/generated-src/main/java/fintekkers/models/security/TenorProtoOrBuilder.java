// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/security/tenor.proto

package fintekkers.models.security;

public interface TenorProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.models.security.TenorProto)
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
   * <code>string term_value = 5;</code>
   * @return The termValue.
   */
  java.lang.String getTermValue();
  /**
   * <code>string term_value = 5;</code>
   * @return The bytes for termValue.
   */
  com.google.protobuf.ByteString
      getTermValueBytes();

  /**
   * <code>.fintekkers.models.security.TenorTypeProto tenor_type = 6;</code>
   * @return The enum numeric value on the wire for tenorType.
   */
  int getTenorTypeValue();
  /**
   * <code>.fintekkers.models.security.TenorTypeProto tenor_type = 6;</code>
   * @return The tenorType.
   */
  fintekkers.models.security.TenorTypeProto getTenorType();
}
