// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/portfolio/create_portfolio_request.proto

package common.request;

/**
 * Protobuf type {@code portfolio.CreatePortfolioRequestProto}
 */
public final class CreatePortfolioRequestProto extends
    com.google.protobuf.GeneratedMessageV3 implements
    // @@protoc_insertion_point(message_implements:portfolio.CreatePortfolioRequestProto)
    CreatePortfolioRequestProtoOrBuilder {
private static final long serialVersionUID = 0L;
  // Use CreatePortfolioRequestProto.newBuilder() to construct.
  private CreatePortfolioRequestProto(com.google.protobuf.GeneratedMessageV3.Builder<?> builder) {
    super(builder);
  }
  private CreatePortfolioRequestProto() {
    objectClass_ = "";
    version_ = "";
  }

  @java.lang.Override
  @SuppressWarnings({"unused"})
  protected java.lang.Object newInstance(
      UnusedPrivateParameter unused) {
    return new CreatePortfolioRequestProto();
  }

  @java.lang.Override
  public final com.google.protobuf.UnknownFieldSet
  getUnknownFields() {
    return this.unknownFields;
  }
  private CreatePortfolioRequestProto(
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
          case 162: {
            common.models.portfolio.PortfolioProto.Builder subBuilder = null;
            if (createPortfolioInput_ != null) {
              subBuilder = createPortfolioInput_.toBuilder();
            }
            createPortfolioInput_ = input.readMessage(common.models.portfolio.PortfolioProto.parser(), extensionRegistry);
            if (subBuilder != null) {
              subBuilder.mergeFrom(createPortfolioInput_);
              createPortfolioInput_ = subBuilder.buildPartial();
            }

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
    return common.request.CreatePortfolioRequestProtos.internal_static_portfolio_CreatePortfolioRequestProto_descriptor;
  }

  @java.lang.Override
  protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internalGetFieldAccessorTable() {
    return common.request.CreatePortfolioRequestProtos.internal_static_portfolio_CreatePortfolioRequestProto_fieldAccessorTable
        .ensureFieldAccessorsInitialized(
            common.request.CreatePortfolioRequestProto.class, common.request.CreatePortfolioRequestProto.Builder.class);
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

  public static final int CREATE_PORTFOLIO_INPUT_FIELD_NUMBER = 20;
  private common.models.portfolio.PortfolioProto createPortfolioInput_;
  /**
   * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
   * @return Whether the createPortfolioInput field is set.
   */
  @java.lang.Override
  public boolean hasCreatePortfolioInput() {
    return createPortfolioInput_ != null;
  }
  /**
   * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
   * @return The createPortfolioInput.
   */
  @java.lang.Override
  public common.models.portfolio.PortfolioProto getCreatePortfolioInput() {
    return createPortfolioInput_ == null ? common.models.portfolio.PortfolioProto.getDefaultInstance() : createPortfolioInput_;
  }
  /**
   * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
   */
  @java.lang.Override
  public common.models.portfolio.PortfolioProtoOrBuilder getCreatePortfolioInputOrBuilder() {
    return getCreatePortfolioInput();
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
    if (createPortfolioInput_ != null) {
      output.writeMessage(20, getCreatePortfolioInput());
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
    if (createPortfolioInput_ != null) {
      size += com.google.protobuf.CodedOutputStream
        .computeMessageSize(20, getCreatePortfolioInput());
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
    if (!(obj instanceof common.request.CreatePortfolioRequestProto)) {
      return super.equals(obj);
    }
    common.request.CreatePortfolioRequestProto other = (common.request.CreatePortfolioRequestProto) obj;

    if (!getObjectClass()
        .equals(other.getObjectClass())) return false;
    if (!getVersion()
        .equals(other.getVersion())) return false;
    if (hasCreatePortfolioInput() != other.hasCreatePortfolioInput()) return false;
    if (hasCreatePortfolioInput()) {
      if (!getCreatePortfolioInput()
          .equals(other.getCreatePortfolioInput())) return false;
    }
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
    if (hasCreatePortfolioInput()) {
      hash = (37 * hash) + CREATE_PORTFOLIO_INPUT_FIELD_NUMBER;
      hash = (53 * hash) + getCreatePortfolioInput().hashCode();
    }
    hash = (29 * hash) + unknownFields.hashCode();
    memoizedHashCode = hash;
    return hash;
  }

  public static common.request.CreatePortfolioRequestProto parseFrom(
      java.nio.ByteBuffer data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
      java.nio.ByteBuffer data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
      com.google.protobuf.ByteString data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
      com.google.protobuf.ByteString data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(byte[] data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
      byte[] data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input, extensionRegistry);
  }
  public static common.request.CreatePortfolioRequestProto parseDelimitedFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input);
  }
  public static common.request.CreatePortfolioRequestProto parseDelimitedFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input, extensionRegistry);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
      com.google.protobuf.CodedInputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static common.request.CreatePortfolioRequestProto parseFrom(
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
  public static Builder newBuilder(common.request.CreatePortfolioRequestProto prototype) {
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
   * Protobuf type {@code portfolio.CreatePortfolioRequestProto}
   */
  public static final class Builder extends
      com.google.protobuf.GeneratedMessageV3.Builder<Builder> implements
      // @@protoc_insertion_point(builder_implements:portfolio.CreatePortfolioRequestProto)
      common.request.CreatePortfolioRequestProtoOrBuilder {
    public static final com.google.protobuf.Descriptors.Descriptor
        getDescriptor() {
      return common.request.CreatePortfolioRequestProtos.internal_static_portfolio_CreatePortfolioRequestProto_descriptor;
    }

    @java.lang.Override
    protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
        internalGetFieldAccessorTable() {
      return common.request.CreatePortfolioRequestProtos.internal_static_portfolio_CreatePortfolioRequestProto_fieldAccessorTable
          .ensureFieldAccessorsInitialized(
              common.request.CreatePortfolioRequestProto.class, common.request.CreatePortfolioRequestProto.Builder.class);
    }

    // Construct using common.request.CreatePortfolioRequestProto.newBuilder()
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

      if (createPortfolioInputBuilder_ == null) {
        createPortfolioInput_ = null;
      } else {
        createPortfolioInput_ = null;
        createPortfolioInputBuilder_ = null;
      }
      return this;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.Descriptor
        getDescriptorForType() {
      return common.request.CreatePortfolioRequestProtos.internal_static_portfolio_CreatePortfolioRequestProto_descriptor;
    }

    @java.lang.Override
    public common.request.CreatePortfolioRequestProto getDefaultInstanceForType() {
      return common.request.CreatePortfolioRequestProto.getDefaultInstance();
    }

    @java.lang.Override
    public common.request.CreatePortfolioRequestProto build() {
      common.request.CreatePortfolioRequestProto result = buildPartial();
      if (!result.isInitialized()) {
        throw newUninitializedMessageException(result);
      }
      return result;
    }

    @java.lang.Override
    public common.request.CreatePortfolioRequestProto buildPartial() {
      common.request.CreatePortfolioRequestProto result = new common.request.CreatePortfolioRequestProto(this);
      result.objectClass_ = objectClass_;
      result.version_ = version_;
      if (createPortfolioInputBuilder_ == null) {
        result.createPortfolioInput_ = createPortfolioInput_;
      } else {
        result.createPortfolioInput_ = createPortfolioInputBuilder_.build();
      }
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
      if (other instanceof common.request.CreatePortfolioRequestProto) {
        return mergeFrom((common.request.CreatePortfolioRequestProto)other);
      } else {
        super.mergeFrom(other);
        return this;
      }
    }

    public Builder mergeFrom(common.request.CreatePortfolioRequestProto other) {
      if (other == common.request.CreatePortfolioRequestProto.getDefaultInstance()) return this;
      if (!other.getObjectClass().isEmpty()) {
        objectClass_ = other.objectClass_;
        onChanged();
      }
      if (!other.getVersion().isEmpty()) {
        version_ = other.version_;
        onChanged();
      }
      if (other.hasCreatePortfolioInput()) {
        mergeCreatePortfolioInput(other.getCreatePortfolioInput());
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
      common.request.CreatePortfolioRequestProto parsedMessage = null;
      try {
        parsedMessage = PARSER.parsePartialFrom(input, extensionRegistry);
      } catch (com.google.protobuf.InvalidProtocolBufferException e) {
        parsedMessage = (common.request.CreatePortfolioRequestProto) e.getUnfinishedMessage();
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

    private common.models.portfolio.PortfolioProto createPortfolioInput_;
    private com.google.protobuf.SingleFieldBuilderV3<
        common.models.portfolio.PortfolioProto, common.models.portfolio.PortfolioProto.Builder, common.models.portfolio.PortfolioProtoOrBuilder> createPortfolioInputBuilder_;
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     * @return Whether the createPortfolioInput field is set.
     */
    public boolean hasCreatePortfolioInput() {
      return createPortfolioInputBuilder_ != null || createPortfolioInput_ != null;
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     * @return The createPortfolioInput.
     */
    public common.models.portfolio.PortfolioProto getCreatePortfolioInput() {
      if (createPortfolioInputBuilder_ == null) {
        return createPortfolioInput_ == null ? common.models.portfolio.PortfolioProto.getDefaultInstance() : createPortfolioInput_;
      } else {
        return createPortfolioInputBuilder_.getMessage();
      }
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    public Builder setCreatePortfolioInput(common.models.portfolio.PortfolioProto value) {
      if (createPortfolioInputBuilder_ == null) {
        if (value == null) {
          throw new NullPointerException();
        }
        createPortfolioInput_ = value;
        onChanged();
      } else {
        createPortfolioInputBuilder_.setMessage(value);
      }

      return this;
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    public Builder setCreatePortfolioInput(
        common.models.portfolio.PortfolioProto.Builder builderForValue) {
      if (createPortfolioInputBuilder_ == null) {
        createPortfolioInput_ = builderForValue.build();
        onChanged();
      } else {
        createPortfolioInputBuilder_.setMessage(builderForValue.build());
      }

      return this;
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    public Builder mergeCreatePortfolioInput(common.models.portfolio.PortfolioProto value) {
      if (createPortfolioInputBuilder_ == null) {
        if (createPortfolioInput_ != null) {
          createPortfolioInput_ =
            common.models.portfolio.PortfolioProto.newBuilder(createPortfolioInput_).mergeFrom(value).buildPartial();
        } else {
          createPortfolioInput_ = value;
        }
        onChanged();
      } else {
        createPortfolioInputBuilder_.mergeFrom(value);
      }

      return this;
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    public Builder clearCreatePortfolioInput() {
      if (createPortfolioInputBuilder_ == null) {
        createPortfolioInput_ = null;
        onChanged();
      } else {
        createPortfolioInput_ = null;
        createPortfolioInputBuilder_ = null;
      }

      return this;
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    public common.models.portfolio.PortfolioProto.Builder getCreatePortfolioInputBuilder() {
      
      onChanged();
      return getCreatePortfolioInputFieldBuilder().getBuilder();
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    public common.models.portfolio.PortfolioProtoOrBuilder getCreatePortfolioInputOrBuilder() {
      if (createPortfolioInputBuilder_ != null) {
        return createPortfolioInputBuilder_.getMessageOrBuilder();
      } else {
        return createPortfolioInput_ == null ?
            common.models.portfolio.PortfolioProto.getDefaultInstance() : createPortfolioInput_;
      }
    }
    /**
     * <code>.portfolio.PortfolioProto create_portfolio_input = 20;</code>
     */
    private com.google.protobuf.SingleFieldBuilderV3<
        common.models.portfolio.PortfolioProto, common.models.portfolio.PortfolioProto.Builder, common.models.portfolio.PortfolioProtoOrBuilder> 
        getCreatePortfolioInputFieldBuilder() {
      if (createPortfolioInputBuilder_ == null) {
        createPortfolioInputBuilder_ = new com.google.protobuf.SingleFieldBuilderV3<
            common.models.portfolio.PortfolioProto, common.models.portfolio.PortfolioProto.Builder, common.models.portfolio.PortfolioProtoOrBuilder>(
                getCreatePortfolioInput(),
                getParentForChildren(),
                isClean());
        createPortfolioInput_ = null;
      }
      return createPortfolioInputBuilder_;
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


    // @@protoc_insertion_point(builder_scope:portfolio.CreatePortfolioRequestProto)
  }

  // @@protoc_insertion_point(class_scope:portfolio.CreatePortfolioRequestProto)
  private static final common.request.CreatePortfolioRequestProto DEFAULT_INSTANCE;
  static {
    DEFAULT_INSTANCE = new common.request.CreatePortfolioRequestProto();
  }

  public static common.request.CreatePortfolioRequestProto getDefaultInstance() {
    return DEFAULT_INSTANCE;
  }

  private static final com.google.protobuf.Parser<CreatePortfolioRequestProto>
      PARSER = new com.google.protobuf.AbstractParser<CreatePortfolioRequestProto>() {
    @java.lang.Override
    public CreatePortfolioRequestProto parsePartialFrom(
        com.google.protobuf.CodedInputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return new CreatePortfolioRequestProto(input, extensionRegistry);
    }
  };

  public static com.google.protobuf.Parser<CreatePortfolioRequestProto> parser() {
    return PARSER;
  }

  @java.lang.Override
  public com.google.protobuf.Parser<CreatePortfolioRequestProto> getParserForType() {
    return PARSER;
  }

  @java.lang.Override
  public common.request.CreatePortfolioRequestProto getDefaultInstanceForType() {
    return DEFAULT_INSTANCE;
  }

}

