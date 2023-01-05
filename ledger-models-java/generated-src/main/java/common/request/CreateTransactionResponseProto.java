// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: requests/transaction/create_transaction_response.proto

package common.request;

/**
 * Protobuf type {@code transaction.CreateTransactionResponseProto}
 */
public final class CreateTransactionResponseProto extends
    com.google.protobuf.GeneratedMessageV3 implements
    // @@protoc_insertion_point(message_implements:transaction.CreateTransactionResponseProto)
    CreateTransactionResponseProtoOrBuilder {
private static final long serialVersionUID = 0L;
  // Use CreateTransactionResponseProto.newBuilder() to construct.
  private CreateTransactionResponseProto(com.google.protobuf.GeneratedMessageV3.Builder<?> builder) {
    super(builder);
  }
  private CreateTransactionResponseProto() {
    objectClass_ = "";
    version_ = "";
  }

  @java.lang.Override
  @SuppressWarnings({"unused"})
  protected java.lang.Object newInstance(
      UnusedPrivateParameter unused) {
    return new CreateTransactionResponseProto();
  }

  @java.lang.Override
  public final com.google.protobuf.UnknownFieldSet
  getUnknownFields() {
    return this.unknownFields;
  }
  private CreateTransactionResponseProto(
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
            common.request.CreateTransactionRequestProto.Builder subBuilder = null;
            if (createTransactionRequest_ != null) {
              subBuilder = createTransactionRequest_.toBuilder();
            }
            createTransactionRequest_ = input.readMessage(common.request.CreateTransactionRequestProto.parser(), extensionRegistry);
            if (subBuilder != null) {
              subBuilder.mergeFrom(createTransactionRequest_);
              createTransactionRequest_ = subBuilder.buildPartial();
            }

            break;
          }
          case 242: {
            common.models.transaction.TransactionProto.Builder subBuilder = null;
            if (transactionResponse_ != null) {
              subBuilder = transactionResponse_.toBuilder();
            }
            transactionResponse_ = input.readMessage(common.models.transaction.TransactionProto.parser(), extensionRegistry);
            if (subBuilder != null) {
              subBuilder.mergeFrom(transactionResponse_);
              transactionResponse_ = subBuilder.buildPartial();
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
    return common.request.CreateTransactionResponseProtos.internal_static_transaction_CreateTransactionResponseProto_descriptor;
  }

  @java.lang.Override
  protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internalGetFieldAccessorTable() {
    return common.request.CreateTransactionResponseProtos.internal_static_transaction_CreateTransactionResponseProto_fieldAccessorTable
        .ensureFieldAccessorsInitialized(
            common.request.CreateTransactionResponseProto.class, common.request.CreateTransactionResponseProto.Builder.class);
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

  public static final int CREATE_TRANSACTION_REQUEST_FIELD_NUMBER = 20;
  private common.request.CreateTransactionRequestProto createTransactionRequest_;
  /**
   * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
   * @return Whether the createTransactionRequest field is set.
   */
  @java.lang.Override
  public boolean hasCreateTransactionRequest() {
    return createTransactionRequest_ != null;
  }
  /**
   * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
   * @return The createTransactionRequest.
   */
  @java.lang.Override
  public common.request.CreateTransactionRequestProto getCreateTransactionRequest() {
    return createTransactionRequest_ == null ? common.request.CreateTransactionRequestProto.getDefaultInstance() : createTransactionRequest_;
  }
  /**
   * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
   */
  @java.lang.Override
  public common.request.CreateTransactionRequestProtoOrBuilder getCreateTransactionRequestOrBuilder() {
    return getCreateTransactionRequest();
  }

  public static final int TRANSACTION_RESPONSE_FIELD_NUMBER = 30;
  private common.models.transaction.TransactionProto transactionResponse_;
  /**
   * <code>.transaction.TransactionProto transaction_response = 30;</code>
   * @return Whether the transactionResponse field is set.
   */
  @java.lang.Override
  public boolean hasTransactionResponse() {
    return transactionResponse_ != null;
  }
  /**
   * <code>.transaction.TransactionProto transaction_response = 30;</code>
   * @return The transactionResponse.
   */
  @java.lang.Override
  public common.models.transaction.TransactionProto getTransactionResponse() {
    return transactionResponse_ == null ? common.models.transaction.TransactionProto.getDefaultInstance() : transactionResponse_;
  }
  /**
   * <code>.transaction.TransactionProto transaction_response = 30;</code>
   */
  @java.lang.Override
  public common.models.transaction.TransactionProtoOrBuilder getTransactionResponseOrBuilder() {
    return getTransactionResponse();
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
    if (createTransactionRequest_ != null) {
      output.writeMessage(20, getCreateTransactionRequest());
    }
    if (transactionResponse_ != null) {
      output.writeMessage(30, getTransactionResponse());
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
    if (createTransactionRequest_ != null) {
      size += com.google.protobuf.CodedOutputStream
        .computeMessageSize(20, getCreateTransactionRequest());
    }
    if (transactionResponse_ != null) {
      size += com.google.protobuf.CodedOutputStream
        .computeMessageSize(30, getTransactionResponse());
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
    if (!(obj instanceof common.request.CreateTransactionResponseProto)) {
      return super.equals(obj);
    }
    common.request.CreateTransactionResponseProto other = (common.request.CreateTransactionResponseProto) obj;

    if (!getObjectClass()
        .equals(other.getObjectClass())) return false;
    if (!getVersion()
        .equals(other.getVersion())) return false;
    if (hasCreateTransactionRequest() != other.hasCreateTransactionRequest()) return false;
    if (hasCreateTransactionRequest()) {
      if (!getCreateTransactionRequest()
          .equals(other.getCreateTransactionRequest())) return false;
    }
    if (hasTransactionResponse() != other.hasTransactionResponse()) return false;
    if (hasTransactionResponse()) {
      if (!getTransactionResponse()
          .equals(other.getTransactionResponse())) return false;
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
    if (hasCreateTransactionRequest()) {
      hash = (37 * hash) + CREATE_TRANSACTION_REQUEST_FIELD_NUMBER;
      hash = (53 * hash) + getCreateTransactionRequest().hashCode();
    }
    if (hasTransactionResponse()) {
      hash = (37 * hash) + TRANSACTION_RESPONSE_FIELD_NUMBER;
      hash = (53 * hash) + getTransactionResponse().hashCode();
    }
    hash = (29 * hash) + unknownFields.hashCode();
    memoizedHashCode = hash;
    return hash;
  }

  public static common.request.CreateTransactionResponseProto parseFrom(
      java.nio.ByteBuffer data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
      java.nio.ByteBuffer data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
      com.google.protobuf.ByteString data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
      com.google.protobuf.ByteString data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(byte[] data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
      byte[] data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return PARSER.parseFrom(data, extensionRegistry);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input, extensionRegistry);
  }
  public static common.request.CreateTransactionResponseProto parseDelimitedFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input);
  }
  public static common.request.CreateTransactionResponseProto parseDelimitedFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseDelimitedWithIOException(PARSER, input, extensionRegistry);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
      com.google.protobuf.CodedInputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageV3
        .parseWithIOException(PARSER, input);
  }
  public static common.request.CreateTransactionResponseProto parseFrom(
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
  public static Builder newBuilder(common.request.CreateTransactionResponseProto prototype) {
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
   * Protobuf type {@code transaction.CreateTransactionResponseProto}
   */
  public static final class Builder extends
      com.google.protobuf.GeneratedMessageV3.Builder<Builder> implements
      // @@protoc_insertion_point(builder_implements:transaction.CreateTransactionResponseProto)
      common.request.CreateTransactionResponseProtoOrBuilder {
    public static final com.google.protobuf.Descriptors.Descriptor
        getDescriptor() {
      return common.request.CreateTransactionResponseProtos.internal_static_transaction_CreateTransactionResponseProto_descriptor;
    }

    @java.lang.Override
    protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
        internalGetFieldAccessorTable() {
      return common.request.CreateTransactionResponseProtos.internal_static_transaction_CreateTransactionResponseProto_fieldAccessorTable
          .ensureFieldAccessorsInitialized(
              common.request.CreateTransactionResponseProto.class, common.request.CreateTransactionResponseProto.Builder.class);
    }

    // Construct using common.request.CreateTransactionResponseProto.newBuilder()
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

      if (createTransactionRequestBuilder_ == null) {
        createTransactionRequest_ = null;
      } else {
        createTransactionRequest_ = null;
        createTransactionRequestBuilder_ = null;
      }
      if (transactionResponseBuilder_ == null) {
        transactionResponse_ = null;
      } else {
        transactionResponse_ = null;
        transactionResponseBuilder_ = null;
      }
      return this;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.Descriptor
        getDescriptorForType() {
      return common.request.CreateTransactionResponseProtos.internal_static_transaction_CreateTransactionResponseProto_descriptor;
    }

    @java.lang.Override
    public common.request.CreateTransactionResponseProto getDefaultInstanceForType() {
      return common.request.CreateTransactionResponseProto.getDefaultInstance();
    }

    @java.lang.Override
    public common.request.CreateTransactionResponseProto build() {
      common.request.CreateTransactionResponseProto result = buildPartial();
      if (!result.isInitialized()) {
        throw newUninitializedMessageException(result);
      }
      return result;
    }

    @java.lang.Override
    public common.request.CreateTransactionResponseProto buildPartial() {
      common.request.CreateTransactionResponseProto result = new common.request.CreateTransactionResponseProto(this);
      result.objectClass_ = objectClass_;
      result.version_ = version_;
      if (createTransactionRequestBuilder_ == null) {
        result.createTransactionRequest_ = createTransactionRequest_;
      } else {
        result.createTransactionRequest_ = createTransactionRequestBuilder_.build();
      }
      if (transactionResponseBuilder_ == null) {
        result.transactionResponse_ = transactionResponse_;
      } else {
        result.transactionResponse_ = transactionResponseBuilder_.build();
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
      if (other instanceof common.request.CreateTransactionResponseProto) {
        return mergeFrom((common.request.CreateTransactionResponseProto)other);
      } else {
        super.mergeFrom(other);
        return this;
      }
    }

    public Builder mergeFrom(common.request.CreateTransactionResponseProto other) {
      if (other == common.request.CreateTransactionResponseProto.getDefaultInstance()) return this;
      if (!other.getObjectClass().isEmpty()) {
        objectClass_ = other.objectClass_;
        onChanged();
      }
      if (!other.getVersion().isEmpty()) {
        version_ = other.version_;
        onChanged();
      }
      if (other.hasCreateTransactionRequest()) {
        mergeCreateTransactionRequest(other.getCreateTransactionRequest());
      }
      if (other.hasTransactionResponse()) {
        mergeTransactionResponse(other.getTransactionResponse());
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
      common.request.CreateTransactionResponseProto parsedMessage = null;
      try {
        parsedMessage = PARSER.parsePartialFrom(input, extensionRegistry);
      } catch (com.google.protobuf.InvalidProtocolBufferException e) {
        parsedMessage = (common.request.CreateTransactionResponseProto) e.getUnfinishedMessage();
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

    private common.request.CreateTransactionRequestProto createTransactionRequest_;
    private com.google.protobuf.SingleFieldBuilderV3<
        common.request.CreateTransactionRequestProto, common.request.CreateTransactionRequestProto.Builder, common.request.CreateTransactionRequestProtoOrBuilder> createTransactionRequestBuilder_;
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     * @return Whether the createTransactionRequest field is set.
     */
    public boolean hasCreateTransactionRequest() {
      return createTransactionRequestBuilder_ != null || createTransactionRequest_ != null;
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     * @return The createTransactionRequest.
     */
    public common.request.CreateTransactionRequestProto getCreateTransactionRequest() {
      if (createTransactionRequestBuilder_ == null) {
        return createTransactionRequest_ == null ? common.request.CreateTransactionRequestProto.getDefaultInstance() : createTransactionRequest_;
      } else {
        return createTransactionRequestBuilder_.getMessage();
      }
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    public Builder setCreateTransactionRequest(common.request.CreateTransactionRequestProto value) {
      if (createTransactionRequestBuilder_ == null) {
        if (value == null) {
          throw new NullPointerException();
        }
        createTransactionRequest_ = value;
        onChanged();
      } else {
        createTransactionRequestBuilder_.setMessage(value);
      }

      return this;
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    public Builder setCreateTransactionRequest(
        common.request.CreateTransactionRequestProto.Builder builderForValue) {
      if (createTransactionRequestBuilder_ == null) {
        createTransactionRequest_ = builderForValue.build();
        onChanged();
      } else {
        createTransactionRequestBuilder_.setMessage(builderForValue.build());
      }

      return this;
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    public Builder mergeCreateTransactionRequest(common.request.CreateTransactionRequestProto value) {
      if (createTransactionRequestBuilder_ == null) {
        if (createTransactionRequest_ != null) {
          createTransactionRequest_ =
            common.request.CreateTransactionRequestProto.newBuilder(createTransactionRequest_).mergeFrom(value).buildPartial();
        } else {
          createTransactionRequest_ = value;
        }
        onChanged();
      } else {
        createTransactionRequestBuilder_.mergeFrom(value);
      }

      return this;
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    public Builder clearCreateTransactionRequest() {
      if (createTransactionRequestBuilder_ == null) {
        createTransactionRequest_ = null;
        onChanged();
      } else {
        createTransactionRequest_ = null;
        createTransactionRequestBuilder_ = null;
      }

      return this;
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    public common.request.CreateTransactionRequestProto.Builder getCreateTransactionRequestBuilder() {
      
      onChanged();
      return getCreateTransactionRequestFieldBuilder().getBuilder();
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    public common.request.CreateTransactionRequestProtoOrBuilder getCreateTransactionRequestOrBuilder() {
      if (createTransactionRequestBuilder_ != null) {
        return createTransactionRequestBuilder_.getMessageOrBuilder();
      } else {
        return createTransactionRequest_ == null ?
            common.request.CreateTransactionRequestProto.getDefaultInstance() : createTransactionRequest_;
      }
    }
    /**
     * <code>.transaction.CreateTransactionRequestProto create_transaction_request = 20;</code>
     */
    private com.google.protobuf.SingleFieldBuilderV3<
        common.request.CreateTransactionRequestProto, common.request.CreateTransactionRequestProto.Builder, common.request.CreateTransactionRequestProtoOrBuilder> 
        getCreateTransactionRequestFieldBuilder() {
      if (createTransactionRequestBuilder_ == null) {
        createTransactionRequestBuilder_ = new com.google.protobuf.SingleFieldBuilderV3<
            common.request.CreateTransactionRequestProto, common.request.CreateTransactionRequestProto.Builder, common.request.CreateTransactionRequestProtoOrBuilder>(
                getCreateTransactionRequest(),
                getParentForChildren(),
                isClean());
        createTransactionRequest_ = null;
      }
      return createTransactionRequestBuilder_;
    }

    private common.models.transaction.TransactionProto transactionResponse_;
    private com.google.protobuf.SingleFieldBuilderV3<
        common.models.transaction.TransactionProto, common.models.transaction.TransactionProto.Builder, common.models.transaction.TransactionProtoOrBuilder> transactionResponseBuilder_;
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     * @return Whether the transactionResponse field is set.
     */
    public boolean hasTransactionResponse() {
      return transactionResponseBuilder_ != null || transactionResponse_ != null;
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     * @return The transactionResponse.
     */
    public common.models.transaction.TransactionProto getTransactionResponse() {
      if (transactionResponseBuilder_ == null) {
        return transactionResponse_ == null ? common.models.transaction.TransactionProto.getDefaultInstance() : transactionResponse_;
      } else {
        return transactionResponseBuilder_.getMessage();
      }
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    public Builder setTransactionResponse(common.models.transaction.TransactionProto value) {
      if (transactionResponseBuilder_ == null) {
        if (value == null) {
          throw new NullPointerException();
        }
        transactionResponse_ = value;
        onChanged();
      } else {
        transactionResponseBuilder_.setMessage(value);
      }

      return this;
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    public Builder setTransactionResponse(
        common.models.transaction.TransactionProto.Builder builderForValue) {
      if (transactionResponseBuilder_ == null) {
        transactionResponse_ = builderForValue.build();
        onChanged();
      } else {
        transactionResponseBuilder_.setMessage(builderForValue.build());
      }

      return this;
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    public Builder mergeTransactionResponse(common.models.transaction.TransactionProto value) {
      if (transactionResponseBuilder_ == null) {
        if (transactionResponse_ != null) {
          transactionResponse_ =
            common.models.transaction.TransactionProto.newBuilder(transactionResponse_).mergeFrom(value).buildPartial();
        } else {
          transactionResponse_ = value;
        }
        onChanged();
      } else {
        transactionResponseBuilder_.mergeFrom(value);
      }

      return this;
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    public Builder clearTransactionResponse() {
      if (transactionResponseBuilder_ == null) {
        transactionResponse_ = null;
        onChanged();
      } else {
        transactionResponse_ = null;
        transactionResponseBuilder_ = null;
      }

      return this;
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    public common.models.transaction.TransactionProto.Builder getTransactionResponseBuilder() {
      
      onChanged();
      return getTransactionResponseFieldBuilder().getBuilder();
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    public common.models.transaction.TransactionProtoOrBuilder getTransactionResponseOrBuilder() {
      if (transactionResponseBuilder_ != null) {
        return transactionResponseBuilder_.getMessageOrBuilder();
      } else {
        return transactionResponse_ == null ?
            common.models.transaction.TransactionProto.getDefaultInstance() : transactionResponse_;
      }
    }
    /**
     * <code>.transaction.TransactionProto transaction_response = 30;</code>
     */
    private com.google.protobuf.SingleFieldBuilderV3<
        common.models.transaction.TransactionProto, common.models.transaction.TransactionProto.Builder, common.models.transaction.TransactionProtoOrBuilder> 
        getTransactionResponseFieldBuilder() {
      if (transactionResponseBuilder_ == null) {
        transactionResponseBuilder_ = new com.google.protobuf.SingleFieldBuilderV3<
            common.models.transaction.TransactionProto, common.models.transaction.TransactionProto.Builder, common.models.transaction.TransactionProtoOrBuilder>(
                getTransactionResponse(),
                getParentForChildren(),
                isClean());
        transactionResponse_ = null;
      }
      return transactionResponseBuilder_;
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


    // @@protoc_insertion_point(builder_scope:transaction.CreateTransactionResponseProto)
  }

  // @@protoc_insertion_point(class_scope:transaction.CreateTransactionResponseProto)
  private static final common.request.CreateTransactionResponseProto DEFAULT_INSTANCE;
  static {
    DEFAULT_INSTANCE = new common.request.CreateTransactionResponseProto();
  }

  public static common.request.CreateTransactionResponseProto getDefaultInstance() {
    return DEFAULT_INSTANCE;
  }

  private static final com.google.protobuf.Parser<CreateTransactionResponseProto>
      PARSER = new com.google.protobuf.AbstractParser<CreateTransactionResponseProto>() {
    @java.lang.Override
    public CreateTransactionResponseProto parsePartialFrom(
        com.google.protobuf.CodedInputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return new CreateTransactionResponseProto(input, extensionRegistry);
    }
  };

  public static com.google.protobuf.Parser<CreateTransactionResponseProto> parser() {
    return PARSER;
  }

  @java.lang.Override
  public com.google.protobuf.Parser<CreateTransactionResponseProto> getParserForType() {
    return PARSER;
  }

  @java.lang.Override
  public common.request.CreateTransactionResponseProto getDefaultInstanceForType() {
    return DEFAULT_INSTANCE;
  }

}

