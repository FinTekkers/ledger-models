// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: protos/models/position/position_util.proto

package common.model.protos;

/**
 * Protobuf enum {@code position.PositionFilterOperator}
 */
public enum PositionFilterOperator
    implements com.google.protobuf.ProtocolMessageEnum {
  /**
   * <code>UNKNOWN_OPERATOR = 0;</code>
   */
  UNKNOWN_OPERATOR(0),
  /**
   * <code>EQUALS = 1;</code>
   */
  EQUALS(1),
  /**
   * <code>NOT_EQUALS = 2;</code>
   */
  NOT_EQUALS(2),
  /**
   * <code>LESS_THAN = 3;</code>
   */
  LESS_THAN(3),
  /**
   * <code>LESS_THAN_OR_EQUALS = 4;</code>
   */
  LESS_THAN_OR_EQUALS(4),
  /**
   * <code>MORE_THAN = 5;</code>
   */
  MORE_THAN(5),
  /**
   * <code>MORE_THAN_OR_EQUALS = 6;</code>
   */
  MORE_THAN_OR_EQUALS(6),
  UNRECOGNIZED(-1),
  ;

  /**
   * <code>UNKNOWN_OPERATOR = 0;</code>
   */
  public static final int UNKNOWN_OPERATOR_VALUE = 0;
  /**
   * <code>EQUALS = 1;</code>
   */
  public static final int EQUALS_VALUE = 1;
  /**
   * <code>NOT_EQUALS = 2;</code>
   */
  public static final int NOT_EQUALS_VALUE = 2;
  /**
   * <code>LESS_THAN = 3;</code>
   */
  public static final int LESS_THAN_VALUE = 3;
  /**
   * <code>LESS_THAN_OR_EQUALS = 4;</code>
   */
  public static final int LESS_THAN_OR_EQUALS_VALUE = 4;
  /**
   * <code>MORE_THAN = 5;</code>
   */
  public static final int MORE_THAN_VALUE = 5;
  /**
   * <code>MORE_THAN_OR_EQUALS = 6;</code>
   */
  public static final int MORE_THAN_OR_EQUALS_VALUE = 6;


  public final int getNumber() {
    if (this == UNRECOGNIZED) {
      throw new java.lang.IllegalArgumentException(
          "Can't get the number of an unknown enum value.");
    }
    return value;
  }

  /**
   * @param value The numeric wire value of the corresponding enum entry.
   * @return The enum associated with the given numeric wire value.
   * @deprecated Use {@link #forNumber(int)} instead.
   */
  @java.lang.Deprecated
  public static PositionFilterOperator valueOf(int value) {
    return forNumber(value);
  }

  /**
   * @param value The numeric wire value of the corresponding enum entry.
   * @return The enum associated with the given numeric wire value.
   */
  public static PositionFilterOperator forNumber(int value) {
    switch (value) {
      case 0: return UNKNOWN_OPERATOR;
      case 1: return EQUALS;
      case 2: return NOT_EQUALS;
      case 3: return LESS_THAN;
      case 4: return LESS_THAN_OR_EQUALS;
      case 5: return MORE_THAN;
      case 6: return MORE_THAN_OR_EQUALS;
      default: return null;
    }
  }

  public static com.google.protobuf.Internal.EnumLiteMap<PositionFilterOperator>
      internalGetValueMap() {
    return internalValueMap;
  }
  private static final com.google.protobuf.Internal.EnumLiteMap<
      PositionFilterOperator> internalValueMap =
        new com.google.protobuf.Internal.EnumLiteMap<PositionFilterOperator>() {
          public PositionFilterOperator findValueByNumber(int number) {
            return PositionFilterOperator.forNumber(number);
          }
        };

  public final com.google.protobuf.Descriptors.EnumValueDescriptor
      getValueDescriptor() {
    if (this == UNRECOGNIZED) {
      throw new java.lang.IllegalStateException(
          "Can't get the descriptor of an unrecognized enum value.");
    }
    return getDescriptor().getValues().get(ordinal());
  }
  public final com.google.protobuf.Descriptors.EnumDescriptor
      getDescriptorForType() {
    return getDescriptor();
  }
  public static final com.google.protobuf.Descriptors.EnumDescriptor
      getDescriptor() {
    return common.model.protos.PositionUtilProtos.getDescriptor().getEnumTypes().get(0);
  }

  private static final PositionFilterOperator[] VALUES = values();

  public static PositionFilterOperator valueOf(
      com.google.protobuf.Descriptors.EnumValueDescriptor desc) {
    if (desc.getType() != getDescriptor()) {
      throw new java.lang.IllegalArgumentException(
        "EnumValueDescriptor is not for this type.");
    }
    if (desc.getIndex() == -1) {
      return UNRECOGNIZED;
    }
    return VALUES[desc.getIndex()];
  }

  private final int value;

  private PositionFilterOperator(int value) {
    this.value = value;
  }

  // @@protoc_insertion_point(enum_scope:position.PositionFilterOperator)
}

