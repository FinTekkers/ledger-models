// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/get_fields_response.proto

package fintekkers.requests.security;

public interface GetFieldsResponseProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.requests.security.GetFieldsResponseProto)
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
   * <code>repeated .fintekkers.models.position.FieldProto fields = 10;</code>
   * @return A list containing the fields.
   */
  java.util.List<fintekkers.models.position.FieldProto> getFieldsList();
  /**
   * <code>repeated .fintekkers.models.position.FieldProto fields = 10;</code>
   * @return The count of fields.
   */
  int getFieldsCount();
  /**
   * <code>repeated .fintekkers.models.position.FieldProto fields = 10;</code>
   * @param index The index of the element to return.
   * @return The fields at the given index.
   */
  fintekkers.models.position.FieldProto getFields(int index);
  /**
   * <code>repeated .fintekkers.models.position.FieldProto fields = 10;</code>
   * @return A list containing the enum numeric values on the wire for fields.
   */
  java.util.List<java.lang.Integer>
  getFieldsValueList();
  /**
   * <code>repeated .fintekkers.models.position.FieldProto fields = 10;</code>
   * @param index The index of the value to return.
   * @return The enum numeric value on the wire of fields at the given index.
   */
  int getFieldsValue(int index);
}
