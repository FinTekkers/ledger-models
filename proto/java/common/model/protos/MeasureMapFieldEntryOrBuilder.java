// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: protos/models/position/position.proto

package common.model.protos;

public interface MeasureMapFieldEntryOrBuilder extends
    // @@protoc_insertion_point(interface_extends:position.MeasureMapFieldEntry)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>.position.MeasureProto measure = 1;</code>
   * @return The enum numeric value on the wire for measure.
   */
  int getMeasureValue();
  /**
   * <code>.position.MeasureProto measure = 1;</code>
   * @return The measure.
   */
  common.model.protos.MeasureProto getMeasure();

  /**
   * <code>.util.DecimalValueProto measure_decimal_value = 2;</code>
   * @return Whether the measureDecimalValue field is set.
   */
  boolean hasMeasureDecimalValue();
  /**
   * <code>.util.DecimalValueProto measure_decimal_value = 2;</code>
   * @return The measureDecimalValue.
   */
  common.model.protoUtils.DecimalValue.DecimalValueProto getMeasureDecimalValue();
  /**
   * <code>.util.DecimalValueProto measure_decimal_value = 2;</code>
   */
  common.model.protoUtils.DecimalValue.DecimalValueProtoOrBuilder getMeasureDecimalValueOrBuilder();
}
