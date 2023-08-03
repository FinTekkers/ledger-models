// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/models/position/position_util.proto

package fintekkers.models.position;

public interface FieldMapEntryOrBuilder extends
    // @@protoc_insertion_point(interface_extends:fintekkers.models.position.FieldMapEntry)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>.fintekkers.models.position.FieldProto field = 1;</code>
   * @return The enum numeric value on the wire for field.
   */
  int getFieldValue();
  /**
   * <code>.fintekkers.models.position.FieldProto field = 1;</code>
   * @return The field.
   */
  fintekkers.models.position.FieldProto getField();

  /**
   * <pre>
   *If the field is a 'complex' proto type (e.g. a full enum) we serialize the enum and wrap it in an Any. You can think of the Any as a string describing the type, and a binary of the proto itself
   * </pre>
   *
   * <code>.google.protobuf.Any field_value_packed = 4;</code>
   * @return Whether the fieldValuePacked field is set.
   */
  boolean hasFieldValuePacked();
  /**
   * <pre>
   *If the field is a 'complex' proto type (e.g. a full enum) we serialize the enum and wrap it in an Any. You can think of the Any as a string describing the type, and a binary of the proto itself
   * </pre>
   *
   * <code>.google.protobuf.Any field_value_packed = 4;</code>
   * @return The fieldValuePacked.
   */
  com.google.protobuf.Any getFieldValuePacked();
  /**
   * <pre>
   *If the field is a 'complex' proto type (e.g. a full enum) we serialize the enum and wrap it in an Any. You can think of the Any as a string describing the type, and a binary of the proto itself
   * </pre>
   *
   * <code>.google.protobuf.Any field_value_packed = 4;</code>
   */
  com.google.protobuf.AnyOrBuilder getFieldValuePackedOrBuilder();

  /**
   * <pre>
   *If the field is an enum type, then we use the number to denote which value it is
   * </pre>
   *
   * <code>int32 enum_value = 5;</code>
   * @return The enumValue.
   */
  int getEnumValue();

  /**
   * <pre>
   *If the field is a string type, we just serialize the string (packing has an overhead)
   * </pre>
   *
   * <code>string string_value = 6;</code>
   * @return The stringValue.
   */
  java.lang.String getStringValue();
  /**
   * <pre>
   *If the field is a string type, we just serialize the string (packing has an overhead)
   * </pre>
   *
   * <code>string string_value = 6;</code>
   * @return The bytes for stringValue.
   */
  com.google.protobuf.ByteString
      getStringValueBytes();

  /**
   * <pre>
   *Used for position filters, but not for responses
   * </pre>
   *
   * <code>.fintekkers.models.position.PositionFilterOperator operator = 20;</code>
   * @return The enum numeric value on the wire for operator.
   */
  int getOperatorValue();
  /**
   * <pre>
   *Used for position filters, but not for responses
   * </pre>
   *
   * <code>.fintekkers.models.position.PositionFilterOperator operator = 20;</code>
   * @return The operator.
   */
  fintekkers.models.position.PositionFilterOperator getOperator();

  public fintekkers.models.position.FieldMapEntry.FieldMapValueOneOfCase getFieldMapValueOneOfCase();
}
