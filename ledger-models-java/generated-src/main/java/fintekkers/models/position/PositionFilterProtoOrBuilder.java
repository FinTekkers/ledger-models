// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/position/position_filter.proto

package fintekkers.models.position;

public interface PositionFilterProtoOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.models.position.PositionFilterProto)
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
   * <code>repeated .fintekkers.models.position.FieldMapEntry filters = 21;</code>
   */
  java.util.List<fintekkers.models.position.FieldMapEntry> 
      getFiltersList();
  /**
   * <code>repeated .fintekkers.models.position.FieldMapEntry filters = 21;</code>
   */
  fintekkers.models.position.FieldMapEntry getFilters(int index);
  /**
   * <code>repeated .fintekkers.models.position.FieldMapEntry filters = 21;</code>
   */
  int getFiltersCount();
  /**
   * <code>repeated .fintekkers.models.position.FieldMapEntry filters = 21;</code>
   */
  java.util.List<? extends fintekkers.models.position.FieldMapEntryOrBuilder> 
      getFiltersOrBuilderList();
  /**
   * <code>repeated .fintekkers.models.position.FieldMapEntry filters = 21;</code>
   */
  fintekkers.models.position.FieldMapEntryOrBuilder getFiltersOrBuilder(
      int index);
}
