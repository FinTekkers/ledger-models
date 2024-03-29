// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/util/operation.proto

package fintekkers.requests.util;

/**
 * Protobuf enum {@code fintekkers.requests.util.RequestOperationTypeProto}
 */
public enum RequestOperationTypeProto
    implements com.google.protobuf.ProtocolMessageEnum {
  /**
   * <code>UNKNOWN_OPERATION = 0;</code>
   */
  UNKNOWN_OPERATION(0),
  /**
   * <pre>
   *Validate whether an object is well-formed. The proto schema provides the syntax, but validation
   *ensures semantic meaning is correct.
   * </pre>
   *
   * <code>VALIDATE = 1;</code>
   */
  VALIDATE(1),
  /**
   * <pre>
   *Create an object in the back-end
   * </pre>
   *
   * <code>CREATE = 2;</code>
   */
  CREATE(2),
  /**
   * <pre>
   *Retrieve an object
   * </pre>
   *
   * <code>GET = 3;</code>
   */
  GET(3),
  /**
   * <pre>
   *Search for an object
   * </pre>
   *
   * <code>SEARCH = 4;</code>
   */
  SEARCH(4),
  UNRECOGNIZED(-1),
  ;

  /**
   * <code>UNKNOWN_OPERATION = 0;</code>
   */
  public static final int UNKNOWN_OPERATION_VALUE = 0;
  /**
   * <pre>
   *Validate whether an object is well-formed. The proto schema provides the syntax, but validation
   *ensures semantic meaning is correct.
   * </pre>
   *
   * <code>VALIDATE = 1;</code>
   */
  public static final int VALIDATE_VALUE = 1;
  /**
   * <pre>
   *Create an object in the back-end
   * </pre>
   *
   * <code>CREATE = 2;</code>
   */
  public static final int CREATE_VALUE = 2;
  /**
   * <pre>
   *Retrieve an object
   * </pre>
   *
   * <code>GET = 3;</code>
   */
  public static final int GET_VALUE = 3;
  /**
   * <pre>
   *Search for an object
   * </pre>
   *
   * <code>SEARCH = 4;</code>
   */
  public static final int SEARCH_VALUE = 4;


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
  public static RequestOperationTypeProto valueOf(int value) {
    return forNumber(value);
  }

  /**
   * @param value The numeric wire value of the corresponding enum entry.
   * @return The enum associated with the given numeric wire value.
   */
  public static RequestOperationTypeProto forNumber(int value) {
    switch (value) {
      case 0: return UNKNOWN_OPERATION;
      case 1: return VALIDATE;
      case 2: return CREATE;
      case 3: return GET;
      case 4: return SEARCH;
      default: return null;
    }
  }

  public static com.google.protobuf.Internal.EnumLiteMap<RequestOperationTypeProto>
      internalGetValueMap() {
    return internalValueMap;
  }
  private static final com.google.protobuf.Internal.EnumLiteMap<
      RequestOperationTypeProto> internalValueMap =
        new com.google.protobuf.Internal.EnumLiteMap<RequestOperationTypeProto>() {
          public RequestOperationTypeProto findValueByNumber(int number) {
            return RequestOperationTypeProto.forNumber(number);
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
    return fintekkers.requests.util.Operation.getDescriptor().getEnumTypes().get(0);
  }

  private static final RequestOperationTypeProto[] VALUES = values();

  public static RequestOperationTypeProto valueOf(
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

  private RequestOperationTypeProto(int value) {
    this.value = value;
  }

  // @@protoc_insertion_point(enum_scope:fintekkers.requests.util.RequestOperationTypeProto)
}

