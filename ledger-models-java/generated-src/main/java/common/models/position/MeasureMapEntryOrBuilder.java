// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: models/position/position_util.proto

package common.models.position;

public interface MeasureMapEntryOrBuilder extends
    // @@protoc_insertion_point(interface_extends:position.MeasureMapEntry)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>.position.MeasureProto field = 1;</code>
   * @return The enum numeric value on the wire for field.
   */
  int getFieldValue();
  /**
   * <code>.position.MeasureProto field = 1;</code>
   * @return The field.
   */
  common.models.position.MeasureProto getField();

  /**
   * <code>.util.DecimalValueProto measure_value = 2;</code>
   * @return Whether the measureValue field is set.
   */
  boolean hasMeasureValue();
  /**
   * <code>.util.DecimalValueProto measure_value = 2;</code>
   * @return The measureValue.
   */
  common.models.protoUtils.DecimalValue.DecimalValueProto getMeasureValue();
  /**
   * <code>.util.DecimalValueProto measure_value = 2;</code>
   */
  common.models.protoUtils.DecimalValue.DecimalValueProtoOrBuilder getMeasureValueOrBuilder();
}
