// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/security/get_field_values_request.proto

package fintekkers.requests.security;

/**
 * Protobuf type {@code fintekkers.requests.security.GetFieldValuesRequestProto}
 */
public final class GetFieldValuesRequestProto extends
    com.google.protobuf.GeneratedMessageV3 implements
    // @@protoc_insertion_point(message_implements:fintekkers.requests.security.GetFieldValuesRequestProto)
    GetFieldValuesRequestProtoOrBuilder {
private static final long serialVersionUID = 0L;
  // Use GetFieldValuesRequestProto.newBuilder() to construct.
  private GetFieldValuesRequestProto(com.google.protobuf.GeneratedMessageV3.Builder<?> builder) {
    super(builder);
  }
  private GetFieldValuesRequestProto() {
    objectClass_ = "";
    version_ = "";
    field_ = 0;
  }

  @java.lang.Override
  @SuppressWarnings({"unused"})
  protected java.lang.Object newInstance(
      UnusedPrivateParameter unused) {
    return new GetFieldValuesRequestProto();
  }

  @java.lang.Override
  public final com.google.protobuf.UnknownFieldSet
  getUnknownFields() {
    return this.unknownFields;
  }
  private GetFieldValuesRequestProto(
      com.google.protobuf.CodedInputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    this();
    if (extensionRegistry == null) {
      throw new java.lang.NullPointerException();
    }
    com.google.protobuf.UnknownFieldSet.Builder unknownFields =
        com.google.protobuf.UnknownFieldSet.newBuilder();
    try {
      boolean done = false;
      while (!done) {
        int tag = input.readTag();
        switch (tag) {
          case 0:
            done = true;
            break;
          case 10: {
            java.lang.String s = input.readStringRequireUtf8();

            objectClass_ = s;
            break;
          }
          case 18: {
            java.lang.String s = input.readStringRequireUtf8();

            version_ = s;
            break;
          }
          case 80: {
            int rawValue = input.readEnum();

            field_ = rawValue;
            break;
          }
          default: {
            if (!parseUnknownField(
                input, unknownFields, extensionRegistry, tag)) {
              done = true;
            }
            break;
          }
        }
      }
    } catch (com.google.protobuf.InvalidProtocolBufferException e) {
      throw e.setUnfinishedMessage(this);
    } catch (java.io.IOException e) {
      throw new com.google.protobuf.InvalidProtocolBufferException(
          e).setUnfinishedMessage(this);
    } finally {
      this.unknownFields = unknownFields.build();
      makeExtensionsImmutable();
    }
  }
  public static final com.google.protobuf.Descriptors.Descriptor
      getDescriptor() {
    return fintekkers.requests.security.GetFieldValuesRequestProtos.internal_static_fintekkers_requests_security_GetFieldValuesRequestProto_descriptor;
  }

  @java.lang.Override
  protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internalGetFieldAccessorTable() {
    return fintekkers.requests.security.GetFieldValuesRequestProtos.internal_static_fintekkers_requests_security_GetFieldValuesRequestProto_fieldAccessorTable
        .ensureFieldAccessorsInitialized(
            fintekkers.requests.security.GetFieldValuesRequestProto.class, fintekkers.requests.security.GetFieldValuesRequestProto.Builder.class);
  }

  public static final int OBJECT_CLASS_FIELD_NUMBER = 1;
  private volatile java.lang.Object objectClass_;
  /**
   * <code>string object_class = 1;</code>
   * @return The objectClass.
   */
  @java.lang.Override
  public java.lang.String getObjectClass() {
    java.lang.Object ref = objectClass_;
    if (ref instanceof java.lang.String) {
      return (java.lang.String) ref;
    } else {
      com.google.protobuf.ByteString bs = 
          (com.google.protobuf.ByteString) ref;
      java.lang.String s = bs.toStringUtf8();
      objectClass_ = s;
      return s;
    }
  }
  /**
   * <code>string object_class = 1;</code>
   * @return The bytes for objectClass.
   */
  @java.lang.Override
  public com.google.protobuf.ByteString
      getObjectClassBytes() {
    java.lang.Object ref = objectClass_;
    if (ref instanceof java.lang.String) {
      com.google.protobuf.ByteString b = 
          com.google.protobuf.ByteString.copyFromUtf8(
              (java.lang.String) ref);
      objectClass_ = b;
      return b;
    } else {
      return (com.google.protobuf.ByteString) ref;
    }
  }

  public static final int VERSION_FIELD_NUMBER = 2;
  private volatile java.lang.Object version_;
  /**
   * <code>string version = 2;</code>
   * @return The version.
   */
  @java.lang.Override
  public java.lang.String getVersion() {
    java.lang.Object ref = version_;
    if (ref instanceof java.lang.String) {
      return (java.lang.String) ref;
    } else {
      com.google.protobuf.ByteString bs = 
          (com.google.protobuf.ByteString) ref;
      java.lang.String s = bs.toStringUtf8();
      version_ = s;
      return s;
    }
  }
  /**
   * <code>string version = 2;</code>
   * @return The bytes for version.
   */
  @java.lang.Override
  public com.google.protobuf.ByteString
      getVersionBytes() {
    java.lang.Object ref = version_;
    if (ref instanceof java.lang.String) {
      com.google.protobuf.ByteString b = 
          com.google.protobuf.ByteString.copyFromUtf8(
              (java.lang.String) ref);
      version_ = b;
      return b;
    } else {
      return (com.google.protobuf.ByteString) ref;
    }
  }

  public static final int FIELD_FIELD_NUMBER = 10;
  private int field_;
  /**
   * <code>.fintekkers.models.position.FieldProto field = 10;</code>
   * @return The enum numeric value on the wire for field.
   */
  @java.lang.Override public int getFieldValue() {
    return field_;
  }
  /**
   * <code>.fintekkers.models.position.FieldProto field = 10;</code>
   * @return The field.
   */
  @java.lang.Override public fintekkers.models.position.FieldProto getField() {
    @SuppressWarnings("deprecation")
    fintekkers.models.position.FieldProto result = fintekkers.models.position.FieldProto.valueOf(field_);
    return result == null ? fintekkers.models.position.FieldProto.UNRECOGNIZED : result;
  }

  private byte memoizedIsInitialized = -1;
  @java.lang.Override
  public final boolean isInitialized() {
    byte isInitialized = memoizedIsInitialized;
    if (isInitialized == 1) return true;
    if (isInitialized == 0) return false;

    memoizedIsInitialized = 1;
    return true;
  }

  @java.lang.Override
  public void writeTo(com.google.protobuf.CodedOutputStream output)
                      throws java.io.IOException {
    if (!getObjectClassBytes().isEmpty()) {
      com.google.protobuf.GeneratedMessageV3.writeString(output, 1, objectClass_);
    }
    if (!getVersionBytes().isEmpty()) {
      com.google.protobuf.GeneratedMessageV3.writeString(output, 2, version_);
    }
    if (field_ != fintekkers.models.position.FieldProto.UNKNOWN_FIELD.getNumber()) {
      output.writeEnum(10, field_);
    }
    unknownFields.writeTo(output);
  }

  @java.lang.Override
  public int getSerializedSize() {
    int size = memoizedSize;
    if (size != -1) return size;

    size = 0;
    if (!getObjectClassBytes().isEmpty()) {
      size += com.google.protobuf.GeneratedMessageV3.computeStringSize(1, objectClass_);
    }
    if (!getVersionBytes().isEmpty()) {
      size += com.google.protobuf.GeneratedMessageV3.computeStringSize(2, version_);
    }
    if (field_ != fintekkers.models.position.FieldProto.UNKNOWN_FIELD.getNumber()) {
      size += com.google.protobuf.CodedOutputStream
        .computeEnumSize(10, field_);
    }
    size += unknownFields.getSerializedSize();
    memoizedSize = size;
    return size;
  }

  @java.lang.Override
  public boolean equals(final java.lang.Object obj) {
    if (obj == this) {
     return true;
    }
    if (!(obj instanceof fintekkers.requests.security.GetFieldValuesRequestProto)) {
      return super.equals(obj);
    }
    fintekkers.requests.security.GetFieldValuesRequestProto other = (fintekkers.requests.security.GetFieldValuesRequestProto) obj;

    if (!getObjectClass()
        .equals(other.getObjectClass())) return false;
    if (!getVersion()
        .equals(other.getVersion())) return false;
    if (field_ != other.field_) return false;
    if (!unknownFields.equals(other.unknownFields)) return false;
    return true;
  }

  @java.lang.Override
  public int hashCode() {
    if (memoizedHashCode != 0) {
      return memoizedHashCode;
    }
    int hash = 41;
    hash = (19 * hash) + getDescriptor().hashCode();
    hash = (37 * hash) + OBJECT_CLASS_FIELD_NUMBER;
    hash = (53 * hash) + getObjectClass().hashCode();
    hash = (37 * hash) + VERSION_FIELD_NUMBER;
    hash = (53 * hash) + getVersion().hashCode();
    hash = (37 * hash) + FIELD_FIELD_NUMBER;
    hash = (53 * hash) + field_;
    hash = (29 * hash) + unknownFields.hashCode();
    memoizedHashCode = hash;
    return hash;
  }

  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      java.nio.ByteBuffer data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      java.nio.ByteBuffer data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      com.google.protobuf.ByteString data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      com.google.protobuf.ByteString data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(byte[] data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      byte[] data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input, extensionRegistry);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseDelimitedFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseDelimitedFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input, extensionRegistry);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      com.google.protobuf.CodedInputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static fintekkers.requests.security.GetFieldValuesRequestProto parseFrom(
      com.google.protobuf.CodedInputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input, extensionRegistry);
  }

  @java.lang.Override
  public Builder newBuilderForType() { return newBuilder(); }
  public static Builder newBuilder() {
    return DEFAULT_INSTANCE.toBuilder();
  }
  public static Builder newBuilder(fintekkers.requests.security.GetFieldValuesRequestProto prototype) {
    return DEFAULT_INSTANCE.toBuilder().mergeFrom(prototype);
  }
  @java.lang.Override
  public Builder toBuilder() {
    return this == DEFAULT_INSTANCE
        ? new Builder() : new Builder().mergeFrom(this);
  }

  @java.lang.Override
  protected Builder newBuilderForType(
      com.google.protobuf.GeneratedMessageV3.BuilderParent parent) {
    Builder builder = new Builder(parent);
    return builder;
  }
  /**
   * Protobuf type {@code fintekkers.requests.security.GetFieldValuesRequestProto}
   */
  public static final class Builder extends
      com.google.protobuf.GeneratedMessageV3.Builder<Builder> implements
      // @@protoc_insertion_point(builder_implements:fintekkers.requests.security.GetFieldValuesRequestProto)
      fintekkers.requests.security.GetFieldValuesRequestProtoOrBuilder {
    public static final com.google.protobuf.Descriptors.Descriptor
        getDescriptor() {
      return fintekkers.requests.security.GetFieldValuesRequestProtos.internal_static_fintekkers_requests_security_GetFieldValuesRequestProto_descriptor;
    }

    @java.lang.Override
    protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
        internalGetFieldAccessorTable() {
      return fintekkers.requests.security.GetFieldValuesRequestProtos.internal_static_fintekkers_requests_security_GetFieldValuesRequestProto_fieldAccessorTable
          .ensureFieldAccessorsInitialized(
              fintekkers.requests.security.GetFieldValuesRequestProto.class, fintekkers.requests.security.GetFieldValuesRequestProto.Builder.class);
    }

    // Construct using fintekkers.requests.security.GetFieldValuesRequestProto.newBuilder()
    private Builder() {
      maybeForceBuilderInitialization();
    }

    private Builder(
        com.google.protobuf.GeneratedMessageV3.BuilderParent parent) {
      super(parent);
      maybeForceBuilderInitialization();
    }
    private void maybeForceBuilderInitialization() {
      if (com.google.protobuf.GeneratedMessageV3
              .alwaysUseFieldBuilders) {
      }
    }
    @java.lang.Override
    public Builder clear() {
      super.clear();
      objectClass_ = "";

      version_ = "";

      field_ = 0;

      return this;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.Descriptor
        getDescriptorForType() {
      return fintekkers.requests.security.GetFieldValuesRequestProtos.internal_static_fintekkers_requests_security_GetFieldValuesRequestProto_descriptor;
    }

    @java.lang.Override
    public fintekkers.requests.security.GetFieldValuesRequestProto getDefaultInstanceForType() {
      return fintekkers.requests.security.GetFieldValuesRequestProto.getDefaultInstance();
    }

    @java.lang.Override
    public fintekkers.requests.security.GetFieldValuesRequestProto build() {
      fintekkers.requests.security.GetFieldValuesRequestProto result = buildPartial();
      if (!result.isInitialized()) {
        throw newUninitializedMessageException(result);
      }
      return result;
    }

    @java.lang.Override
    public fintekkers.requests.security.GetFieldValuesRequestProto buildPartial() {
      fintekkers.requests.security.GetFieldValuesRequestProto result = new fintekkers.requests.security.GetFieldValuesRequestProto(this);
      result.objectClass_ = objectClass_;
      result.version_ = version_;
      result.field_ = field_;
      onBuilt();
      return result;
    }

    @java.lang.Override
    public Builder clone() {
      return super.clone();
    }
    @java.lang.Override
    public Builder setField(
        com.google.protobuf.Descriptors.FieldDescriptor field,
        java.lang.Object value) {
      return super.setField(field, value);
    }
    @java.lang.Override
    public Builder clearField(
        com.google.protobuf.Descriptors.FieldDescriptor field) {
      return super.clearField(field);
    }
    @java.lang.Override
    public Builder clearOneof(
        com.google.protobuf.Descriptors.OneofDescriptor oneof) {
      return super.clearOneof(oneof);
    }
    @java.lang.Override
    public Builder setRepeatedField(
        com.google.protobuf.Descriptors.FieldDescriptor field,
        int index, java.lang.Object value) {
      return super.setRepeatedField(field, index, value);
    }
    @java.lang.Override
    public Builder addRepeatedField(
        com.google.protobuf.Descriptors.FieldDescriptor field,
        java.lang.Object value) {
      return super.addRepeatedField(field, value);
    }
    @java.lang.Override
    public Builder mergeFrom(com.google.protobuf.Message other) {
      if (other instanceof fintekkers.requests.security.GetFieldValuesRequestProto) {
        return mergeFrom((fintekkers.requests.security.GetFieldValuesRequestProto)other);
      } else {
        super.mergeFrom(other);
        return this;
      }
    }

    public Builder mergeFrom(fintekkers.requests.security.GetFieldValuesRequestProto other) {
      if (other == fintekkers.requests.security.GetFieldValuesRequestProto.getDefaultInstance()) return this;
      if (!other.getObjectClass().isEmpty()) {
        objectClass_ = other.objectClass_;
        onChanged();
      }
      if (!other.getVersion().isEmpty()) {
        version_ = other.version_;
        onChanged();
      }
      if (other.field_ != 0) {
        setFieldValue(other.getFieldValue());
      }
      this.mergeUnknownFields(other.unknownFields);
      onChanged();
      return this;
    }

    @java.lang.Override
    public final boolean isInitialized() {
      return true;
    }

    @java.lang.Override
    public Builder mergeFrom(
        com.google.protobuf.CodedInputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws java.io.IOException {
      fintekkers.requests.security.GetFieldValuesRequestProto parsedMessage = null;
      try {
        parsedMessage = PARSER.parsePartialFrom(input, extensionRegistry);
      } catch (com.google.protobuf.InvalidProtocolBufferException e) {
        parsedMessage = (fintekkers.requests.security.GetFieldValuesRequestProto) e.getUnfinishedMessage();
        throw e.unwrapIOException();
      } finally {
        if (parsedMessage != null) {
          mergeFrom(parsedMessage);
        }
      }
      return this;
    }

    private java.lang.Object objectClass_ = "";
    /**
     * <code>string object_class = 1;</code>
     * @return The objectClass.
     */
    public java.lang.String getObjectClass() {
      java.lang.Object ref = objectClass_;
      if (!(ref instanceof java.lang.String)) {
        com.google.protobuf.ByteString bs =
            (com.google.protobuf.ByteString) ref;
        java.lang.String s = bs.toStringUtf8();
        objectClass_ = s;
        return s;
      } else {
        return (java.lang.String) ref;
      }
    }
    /**
     * <code>string object_class = 1;</code>
     * @return The bytes for objectClass.
     */
    public com.google.protobuf.ByteString
        getObjectClassBytes() {
      java.lang.Object ref = objectClass_;
      if (ref instanceof String) {
        com.google.protobuf.ByteString b = 
            com.google.protobuf.ByteString.copyFromUtf8(
                (java.lang.String) ref);
        objectClass_ = b;
        return b;
      } else {
        return (com.google.protobuf.ByteString) ref;
      }
    }
    /**
     * <code>string object_class = 1;</code>
     * @param value The objectClass to set.
     * @return This builder for chaining.
     */
    public Builder setObjectClass(
        java.lang.String value) {
      if (value == null) {
    throw new NullPointerException();
  }
  
      objectClass_ = value;
      onChanged();
      return this;
    }
    /**
     * <code>string object_class = 1;</code>
     * @return This builder for chaining.
     */
    public Builder clearObjectClass() {
      
      objectClass_ = getDefaultInstance().getObjectClass();
      onChanged();
      return this;
    }
    /**
     * <code>string object_class = 1;</code>
     * @param value The bytes for objectClass to set.
     * @return This builder for chaining.
     */
    public Builder setObjectClassBytes(
        com.google.protobuf.ByteString value) {
      if (value == null) {
    throw new NullPointerException();
  }
  checkByteStringIsUtf8(value);
      
      objectClass_ = value;
      onChanged();
      return this;
    }

    private java.lang.Object version_ = "";
    /**
     * <code>string version = 2;</code>
     * @return The version.
     */
    public java.lang.String getVersion() {
      java.lang.Object ref = version_;
      if (!(ref instanceof java.lang.String)) {
        com.google.protobuf.ByteString bs =
            (com.google.protobuf.ByteString) ref;
        java.lang.String s = bs.toStringUtf8();
        version_ = s;
        return s;
      } else {
        return (java.lang.String) ref;
      }
    }
    /**
     * <code>string version = 2;</code>
     * @return The bytes for version.
     */
    public com.google.protobuf.ByteString
        getVersionBytes() {
      java.lang.Object ref = version_;
      if (ref instanceof String) {
        com.google.protobuf.ByteString b = 
            com.google.protobuf.ByteString.copyFromUtf8(
                (java.lang.String) ref);
        version_ = b;
        return b;
      } else {
        return (com.google.protobuf.ByteString) ref;
      }
    }
    /**
     * <code>string version = 2;</code>
     * @param value The version to set.
     * @return This builder for chaining.
     */
    public Builder setVersion(
        java.lang.String value) {
      if (value == null) {
    throw new NullPointerException();
  }
  
      version_ = value;
      onChanged();
      return this;
    }
    /**
     * <code>string version = 2;</code>
     * @return This builder for chaining.
     */
    public Builder clearVersion() {
      
      version_ = getDefaultInstance().getVersion();
      onChanged();
      return this;
    }
    /**
     * <code>string version = 2;</code>
     * @param value The bytes for version to set.
     * @return This builder for chaining.
     */
    public Builder setVersionBytes(
        com.google.protobuf.ByteString value) {
      if (value == null) {
    throw new NullPointerException();
  }
  checkByteStringIsUtf8(value);
      
      version_ = value;
      onChanged();
      return this;
    }

    private int field_ = 0;
    /**
     * <code>.fintekkers.models.position.FieldProto field = 10;</code>
     * @return The enum numeric value on the wire for field.
     */
    @java.lang.Override public int getFieldValue() {
      return field_;
    }
    /**
     * <code>.fintekkers.models.position.FieldProto field = 10;</code>
     * @param value The enum numeric value on the wire for field to set.
     * @return This builder for chaining.
     */
    public Builder setFieldValue(int value) {
      
      field_ = value;
      onChanged();
      return this;
    }
    /**
     * <code>.fintekkers.models.position.FieldProto field = 10;</code>
     * @return The field.
     */
    @java.lang.Override
    public fintekkers.models.position.FieldProto getField() {
      @SuppressWarnings("deprecation")
      fintekkers.models.position.FieldProto result = fintekkers.models.position.FieldProto.valueOf(field_);
      return result == null ? fintekkers.models.position.FieldProto.UNRECOGNIZED : result;
    }
    /**
     * <code>.fintekkers.models.position.FieldProto field = 10;</code>
     * @param value The field to set.
     * @return This builder for chaining.
     */
    public Builder setField(fintekkers.models.position.FieldProto value) {
      if (value == null) {
        throw new NullPointerException();
      }
      
      field_ = value.getNumber();
      onChanged();
      return this;
    }
    /**
     * <code>.fintekkers.models.position.FieldProto field = 10;</code>
     * @return This builder for chaining.
     */
    public Builder clearField() {
      
      field_ = 0;
      onChanged();
      return this;
    }
    @java.lang.Override
    public final Builder setUnknownFields(
        final com.google.protobuf.UnknownFieldSet unknownFields) {
      return super.setUnknownFields(unknownFields);
    }

    @java.lang.Override
    public final Builder mergeUnknownFields(
        final com.google.protobuf.UnknownFieldSet unknownFields) {
      return super.mergeUnknownFields(unknownFields);
    }


    // @@protoc_insertion_point(builder_scope:fintekkers.requests.security.GetFieldValuesRequestProto)
  }

  // @@protoc_insertion_point(class_scope:fintekkers.requests.security.GetFieldValuesRequestProto)
  private static final fintekkers.requests.security.GetFieldValuesRequestProto DEFAULT_INSTANCE;
  static {
    DEFAULT_INSTANCE = new fintekkers.requests.security.GetFieldValuesRequestProto();
  }

  public static fintekkers.requests.security.GetFieldValuesRequestProto getDefaultInstance() {
    return DEFAULT_INSTANCE;
  }

  private static final com.google.protobuf.Parser<GetFieldValuesRequestProto>
      PARSER = new com.google.protobuf.AbstractParser<GetFieldValuesRequestProto>() {
    @java.lang.Override
    public GetFieldValuesRequestProto parsePartialFrom(
        com.google.protobuf.CodedInputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return new GetFieldValuesRequestProto(input, extensionRegistry);
    }
  };

  public static com.google.protobuf.Parser<GetFieldValuesRequestProto> parser() {
    return PARSER;
  }

  @java.lang.Override
  public com.google.protobuf.Parser<GetFieldValuesRequestProto> getParserForType() {
    return PARSER;
  }

  @java.lang.Override
  public fintekkers.requests.security.GetFieldValuesRequestProto getDefaultInstanceForType() {
    return DEFAULT_INSTANCE;
  }

}

