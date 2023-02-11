// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: fintekkers/requests/util/errors/message.proto

package fintekkers.requests.util.errors;

public final class MessageOuterClass {
  private MessageOuterClass() {}
  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistryLite registry) {
  }

  public static void registerAllExtensions(
      com.google.protobuf.ExtensionRegistry registry) {
    registerAllExtensions(
        (com.google.protobuf.ExtensionRegistryLite) registry);
  }
  public interface MessageOrBuilder extends
      // @@protoc_insertion_point(interface_extends:fintekkers.requests.util.errors.Message)
      com.google.protobuf.MessageOrBuilder {

    /**
     * <pre>
     *This message should not have any technical knowledge requirements to be understood
     *and provide a suggested action for how to avoid. Examples:
     * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
     * contact customer support".
     * A bond security is set as having a fixed coupon, but a reference index and spread is
     * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
     * or spread provided."
     * </pre>
     *
     * <code>string message_for_user = 1;</code>
     * @return The messageForUser.
     */
    java.lang.String getMessageForUser();
    /**
     * <pre>
     *This message should not have any technical knowledge requirements to be understood
     *and provide a suggested action for how to avoid. Examples:
     * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
     * contact customer support".
     * A bond security is set as having a fixed coupon, but a reference index and spread is
     * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
     * or spread provided."
     * </pre>
     *
     * <code>string message_for_user = 1;</code>
     * @return The bytes for messageForUser.
     */
    com.google.protobuf.ByteString
        getMessageForUserBytes();

    /**
     * <pre>
     *This message can be used to instruct a developer operating on APIs how best to approach
     *resolving this issue.
     * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
     *  Please consider whether you are spamming the backend server and reach out to developer
     *  support to see how to optimize your usage".
     * </pre>
     *
     * <code>string message_for_developer = 2;</code>
     * @return The messageForDeveloper.
     */
    java.lang.String getMessageForDeveloper();
    /**
     * <pre>
     *This message can be used to instruct a developer operating on APIs how best to approach
     *resolving this issue.
     * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
     *  Please consider whether you are spamming the backend server and reach out to developer
     *  support to see how to optimize your usage".
     * </pre>
     *
     * <code>string message_for_developer = 2;</code>
     * @return The bytes for messageForDeveloper.
     */
    com.google.protobuf.ByteString
        getMessageForDeveloperBytes();
  }
  /**
   * Protobuf type {@code fintekkers.requests.util.errors.Message}
   */
  public static final class Message extends
      com.google.protobuf.GeneratedMessageV3 implements
      // @@protoc_insertion_point(message_implements:fintekkers.requests.util.errors.Message)
      MessageOrBuilder {
  private static final long serialVersionUID = 0L;
    // Use Message.newBuilder() to construct.
    private Message(com.google.protobuf.GeneratedMessageV3.Builder<?> builder) {
      super(builder);
    }
    private Message() {
      messageForUser_ = "";
      messageForDeveloper_ = "";
    }

    @java.lang.Override
    @SuppressWarnings({"unused"})
    protected java.lang.Object newInstance(
        UnusedPrivateParameter unused) {
      return new Message();
    }

    @java.lang.Override
    public final com.google.protobuf.UnknownFieldSet
    getUnknownFields() {
      return this.unknownFields;
    }
    private Message(
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

              messageForUser_ = s;
              break;
            }
            case 18: {
              java.lang.String s = input.readStringRequireUtf8();

              messageForDeveloper_ = s;
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
      return fintekkers.requests.util.errors.MessageOuterClass.internal_static_fintekkers_requests_util_errors_Message_descriptor;
    }

    @java.lang.Override
    protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
        internalGetFieldAccessorTable() {
      return fintekkers.requests.util.errors.MessageOuterClass.internal_static_fintekkers_requests_util_errors_Message_fieldAccessorTable
          .ensureFieldAccessorsInitialized(
              fintekkers.requests.util.errors.MessageOuterClass.Message.class, fintekkers.requests.util.errors.MessageOuterClass.Message.Builder.class);
    }

    public static final int MESSAGE_FOR_USER_FIELD_NUMBER = 1;
    private volatile java.lang.Object messageForUser_;
    /**
     * <pre>
     *This message should not have any technical knowledge requirements to be understood
     *and provide a suggested action for how to avoid. Examples:
     * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
     * contact customer support".
     * A bond security is set as having a fixed coupon, but a reference index and spread is
     * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
     * or spread provided."
     * </pre>
     *
     * <code>string message_for_user = 1;</code>
     * @return The messageForUser.
     */
    @java.lang.Override
    public java.lang.String getMessageForUser() {
      java.lang.Object ref = messageForUser_;
      if (ref instanceof java.lang.String) {
        return (java.lang.String) ref;
      } else {
        com.google.protobuf.ByteString bs = 
            (com.google.protobuf.ByteString) ref;
        java.lang.String s = bs.toStringUtf8();
        messageForUser_ = s;
        return s;
      }
    }
    /**
     * <pre>
     *This message should not have any technical knowledge requirements to be understood
     *and provide a suggested action for how to avoid. Examples:
     * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
     * contact customer support".
     * A bond security is set as having a fixed coupon, but a reference index and spread is
     * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
     * or spread provided."
     * </pre>
     *
     * <code>string message_for_user = 1;</code>
     * @return The bytes for messageForUser.
     */
    @java.lang.Override
    public com.google.protobuf.ByteString
        getMessageForUserBytes() {
      java.lang.Object ref = messageForUser_;
      if (ref instanceof java.lang.String) {
        com.google.protobuf.ByteString b = 
            com.google.protobuf.ByteString.copyFromUtf8(
                (java.lang.String) ref);
        messageForUser_ = b;
        return b;
      } else {
        return (com.google.protobuf.ByteString) ref;
      }
    }

    public static final int MESSAGE_FOR_DEVELOPER_FIELD_NUMBER = 2;
    private volatile java.lang.Object messageForDeveloper_;
    /**
     * <pre>
     *This message can be used to instruct a developer operating on APIs how best to approach
     *resolving this issue.
     * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
     *  Please consider whether you are spamming the backend server and reach out to developer
     *  support to see how to optimize your usage".
     * </pre>
     *
     * <code>string message_for_developer = 2;</code>
     * @return The messageForDeveloper.
     */
    @java.lang.Override
    public java.lang.String getMessageForDeveloper() {
      java.lang.Object ref = messageForDeveloper_;
      if (ref instanceof java.lang.String) {
        return (java.lang.String) ref;
      } else {
        com.google.protobuf.ByteString bs = 
            (com.google.protobuf.ByteString) ref;
        java.lang.String s = bs.toStringUtf8();
        messageForDeveloper_ = s;
        return s;
      }
    }
    /**
     * <pre>
     *This message can be used to instruct a developer operating on APIs how best to approach
     *resolving this issue.
     * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
     *  Please consider whether you are spamming the backend server and reach out to developer
     *  support to see how to optimize your usage".
     * </pre>
     *
     * <code>string message_for_developer = 2;</code>
     * @return The bytes for messageForDeveloper.
     */
    @java.lang.Override
    public com.google.protobuf.ByteString
        getMessageForDeveloperBytes() {
      java.lang.Object ref = messageForDeveloper_;
      if (ref instanceof java.lang.String) {
        com.google.protobuf.ByteString b = 
            com.google.protobuf.ByteString.copyFromUtf8(
                (java.lang.String) ref);
        messageForDeveloper_ = b;
        return b;
      } else {
        return (com.google.protobuf.ByteString) ref;
      }
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
      if (!getMessageForUserBytes().isEmpty()) {
        com.google.protobuf.GeneratedMessageV3.writeString(output, 1, messageForUser_);
      }
      if (!getMessageForDeveloperBytes().isEmpty()) {
        com.google.protobuf.GeneratedMessageV3.writeString(output, 2, messageForDeveloper_);
      }
      unknownFields.writeTo(output);
    }

    @java.lang.Override
    public int getSerializedSize() {
      int size = memoizedSize;
      if (size != -1) return size;

      size = 0;
      if (!getMessageForUserBytes().isEmpty()) {
        size += com.google.protobuf.GeneratedMessageV3.computeStringSize(1, messageForUser_);
      }
      if (!getMessageForDeveloperBytes().isEmpty()) {
        size += com.google.protobuf.GeneratedMessageV3.computeStringSize(2, messageForDeveloper_);
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
      if (!(obj instanceof fintekkers.requests.util.errors.MessageOuterClass.Message)) {
        return super.equals(obj);
      }
      fintekkers.requests.util.errors.MessageOuterClass.Message other = (fintekkers.requests.util.errors.MessageOuterClass.Message) obj;

      if (!getMessageForUser()
          .equals(other.getMessageForUser())) return false;
      if (!getMessageForDeveloper()
          .equals(other.getMessageForDeveloper())) return false;
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
      hash = (37 * hash) + MESSAGE_FOR_USER_FIELD_NUMBER;
      hash = (53 * hash) + getMessageForUser().hashCode();
      hash = (37 * hash) + MESSAGE_FOR_DEVELOPER_FIELD_NUMBER;
      hash = (53 * hash) + getMessageForDeveloper().hashCode();
      hash = (29 * hash) + unknownFields.hashCode();
      memoizedHashCode = hash;
      return hash;
    }

    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        java.nio.ByteBuffer data)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return PARSER.parseFrom(data);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        java.nio.ByteBuffer data,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return PARSER.parseFrom(data, extensionRegistry);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        com.google.protobuf.ByteString data)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return PARSER.parseFrom(data);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        com.google.protobuf.ByteString data,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return PARSER.parseFrom(data, extensionRegistry);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(byte[] data)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return PARSER.parseFrom(data);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        byte[] data,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws com.google.protobuf.InvalidProtocolBufferException {
      return PARSER.parseFrom(data, extensionRegistry);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(java.io.InputStream input)
        throws java.io.IOException {
      return com.google.protobuf.GeneratedMessageV3
          .parseWithIOException(PARSER, input);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        java.io.InputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws java.io.IOException {
      return com.google.protobuf.GeneratedMessageV3
          .parseWithIOException(PARSER, input, extensionRegistry);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseDelimitedFrom(java.io.InputStream input)
        throws java.io.IOException {
      return com.google.protobuf.GeneratedMessageV3
          .parseDelimitedWithIOException(PARSER, input);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseDelimitedFrom(
        java.io.InputStream input,
        com.google.protobuf.ExtensionRegistryLite extensionRegistry)
        throws java.io.IOException {
      return com.google.protobuf.GeneratedMessageV3
          .parseDelimitedWithIOException(PARSER, input, extensionRegistry);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
        com.google.protobuf.CodedInputStream input)
        throws java.io.IOException {
      return com.google.protobuf.GeneratedMessageV3
          .parseWithIOException(PARSER, input);
    }
    public static fintekkers.requests.util.errors.MessageOuterClass.Message parseFrom(
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
    public static Builder newBuilder(fintekkers.requests.util.errors.MessageOuterClass.Message prototype) {
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
     * Protobuf type {@code fintekkers.requests.util.errors.Message}
     */
    public static final class Builder extends
        com.google.protobuf.GeneratedMessageV3.Builder<Builder> implements
        // @@protoc_insertion_point(builder_implements:fintekkers.requests.util.errors.Message)
        fintekkers.requests.util.errors.MessageOuterClass.MessageOrBuilder {
      public static final com.google.protobuf.Descriptors.Descriptor
          getDescriptor() {
        return fintekkers.requests.util.errors.MessageOuterClass.internal_static_fintekkers_requests_util_errors_Message_descriptor;
      }

      @java.lang.Override
      protected com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
          internalGetFieldAccessorTable() {
        return fintekkers.requests.util.errors.MessageOuterClass.internal_static_fintekkers_requests_util_errors_Message_fieldAccessorTable
            .ensureFieldAccessorsInitialized(
                fintekkers.requests.util.errors.MessageOuterClass.Message.class, fintekkers.requests.util.errors.MessageOuterClass.Message.Builder.class);
      }

      // Construct using fintekkers.requests.util.errors.MessageOuterClass.Message.newBuilder()
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
        messageForUser_ = "";

        messageForDeveloper_ = "";

        return this;
      }

      @java.lang.Override
      public com.google.protobuf.Descriptors.Descriptor
          getDescriptorForType() {
        return fintekkers.requests.util.errors.MessageOuterClass.internal_static_fintekkers_requests_util_errors_Message_descriptor;
      }

      @java.lang.Override
      public fintekkers.requests.util.errors.MessageOuterClass.Message getDefaultInstanceForType() {
        return fintekkers.requests.util.errors.MessageOuterClass.Message.getDefaultInstance();
      }

      @java.lang.Override
      public fintekkers.requests.util.errors.MessageOuterClass.Message build() {
        fintekkers.requests.util.errors.MessageOuterClass.Message result = buildPartial();
        if (!result.isInitialized()) {
          throw newUninitializedMessageException(result);
        }
        return result;
      }

      @java.lang.Override
      public fintekkers.requests.util.errors.MessageOuterClass.Message buildPartial() {
        fintekkers.requests.util.errors.MessageOuterClass.Message result = new fintekkers.requests.util.errors.MessageOuterClass.Message(this);
        result.messageForUser_ = messageForUser_;
        result.messageForDeveloper_ = messageForDeveloper_;
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
        if (other instanceof fintekkers.requests.util.errors.MessageOuterClass.Message) {
          return mergeFrom((fintekkers.requests.util.errors.MessageOuterClass.Message)other);
        } else {
          super.mergeFrom(other);
          return this;
        }
      }

      public Builder mergeFrom(fintekkers.requests.util.errors.MessageOuterClass.Message other) {
        if (other == fintekkers.requests.util.errors.MessageOuterClass.Message.getDefaultInstance()) return this;
        if (!other.getMessageForUser().isEmpty()) {
          messageForUser_ = other.messageForUser_;
          onChanged();
        }
        if (!other.getMessageForDeveloper().isEmpty()) {
          messageForDeveloper_ = other.messageForDeveloper_;
          onChanged();
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
        fintekkers.requests.util.errors.MessageOuterClass.Message parsedMessage = null;
        try {
          parsedMessage = PARSER.parsePartialFrom(input, extensionRegistry);
        } catch (com.google.protobuf.InvalidProtocolBufferException e) {
          parsedMessage = (fintekkers.requests.util.errors.MessageOuterClass.Message) e.getUnfinishedMessage();
          throw e.unwrapIOException();
        } finally {
          if (parsedMessage != null) {
            mergeFrom(parsedMessage);
          }
        }
        return this;
      }

      private java.lang.Object messageForUser_ = "";
      /**
       * <pre>
       *This message should not have any technical knowledge requirements to be understood
       *and provide a suggested action for how to avoid. Examples:
       * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
       * contact customer support".
       * A bond security is set as having a fixed coupon, but a reference index and spread is
       * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
       * or spread provided."
       * </pre>
       *
       * <code>string message_for_user = 1;</code>
       * @return The messageForUser.
       */
      public java.lang.String getMessageForUser() {
        java.lang.Object ref = messageForUser_;
        if (!(ref instanceof java.lang.String)) {
          com.google.protobuf.ByteString bs =
              (com.google.protobuf.ByteString) ref;
          java.lang.String s = bs.toStringUtf8();
          messageForUser_ = s;
          return s;
        } else {
          return (java.lang.String) ref;
        }
      }
      /**
       * <pre>
       *This message should not have any technical knowledge requirements to be understood
       *and provide a suggested action for how to avoid. Examples:
       * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
       * contact customer support".
       * A bond security is set as having a fixed coupon, but a reference index and spread is
       * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
       * or spread provided."
       * </pre>
       *
       * <code>string message_for_user = 1;</code>
       * @return The bytes for messageForUser.
       */
      public com.google.protobuf.ByteString
          getMessageForUserBytes() {
        java.lang.Object ref = messageForUser_;
        if (ref instanceof String) {
          com.google.protobuf.ByteString b = 
              com.google.protobuf.ByteString.copyFromUtf8(
                  (java.lang.String) ref);
          messageForUser_ = b;
          return b;
        } else {
          return (com.google.protobuf.ByteString) ref;
        }
      }
      /**
       * <pre>
       *This message should not have any technical knowledge requirements to be understood
       *and provide a suggested action for how to avoid. Examples:
       * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
       * contact customer support".
       * A bond security is set as having a fixed coupon, but a reference index and spread is
       * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
       * or spread provided."
       * </pre>
       *
       * <code>string message_for_user = 1;</code>
       * @param value The messageForUser to set.
       * @return This builder for chaining.
       */
      public Builder setMessageForUser(
          java.lang.String value) {
        if (value == null) {
    throw new NullPointerException();
  }
  
        messageForUser_ = value;
        onChanged();
        return this;
      }
      /**
       * <pre>
       *This message should not have any technical knowledge requirements to be understood
       *and provide a suggested action for how to avoid. Examples:
       * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
       * contact customer support".
       * A bond security is set as having a fixed coupon, but a reference index and spread is
       * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
       * or spread provided."
       * </pre>
       *
       * <code>string message_for_user = 1;</code>
       * @return This builder for chaining.
       */
      public Builder clearMessageForUser() {
        
        messageForUser_ = getDefaultInstance().getMessageForUser();
        onChanged();
        return this;
      }
      /**
       * <pre>
       *This message should not have any technical knowledge requirements to be understood
       *and provide a suggested action for how to avoid. Examples:
       * A server throws an exception -&gt; "Please retry your operation, and if it fails again,
       * contact customer support".
       * A bond security is set as having a fixed coupon, but a reference index and spread is
       * provided -&gt; "A fixed income bond needs a static coupon, and shouldn't have an index
       * or spread provided."
       * </pre>
       *
       * <code>string message_for_user = 1;</code>
       * @param value The bytes for messageForUser to set.
       * @return This builder for chaining.
       */
      public Builder setMessageForUserBytes(
          com.google.protobuf.ByteString value) {
        if (value == null) {
    throw new NullPointerException();
  }
  checkByteStringIsUtf8(value);
        
        messageForUser_ = value;
        onChanged();
        return this;
      }

      private java.lang.Object messageForDeveloper_ = "";
      /**
       * <pre>
       *This message can be used to instruct a developer operating on APIs how best to approach
       *resolving this issue.
       * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
       *  Please consider whether you are spamming the backend server and reach out to developer
       *  support to see how to optimize your usage".
       * </pre>
       *
       * <code>string message_for_developer = 2;</code>
       * @return The messageForDeveloper.
       */
      public java.lang.String getMessageForDeveloper() {
        java.lang.Object ref = messageForDeveloper_;
        if (!(ref instanceof java.lang.String)) {
          com.google.protobuf.ByteString bs =
              (com.google.protobuf.ByteString) ref;
          java.lang.String s = bs.toStringUtf8();
          messageForDeveloper_ = s;
          return s;
        } else {
          return (java.lang.String) ref;
        }
      }
      /**
       * <pre>
       *This message can be used to instruct a developer operating on APIs how best to approach
       *resolving this issue.
       * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
       *  Please consider whether you are spamming the backend server and reach out to developer
       *  support to see how to optimize your usage".
       * </pre>
       *
       * <code>string message_for_developer = 2;</code>
       * @return The bytes for messageForDeveloper.
       */
      public com.google.protobuf.ByteString
          getMessageForDeveloperBytes() {
        java.lang.Object ref = messageForDeveloper_;
        if (ref instanceof String) {
          com.google.protobuf.ByteString b = 
              com.google.protobuf.ByteString.copyFromUtf8(
                  (java.lang.String) ref);
          messageForDeveloper_ = b;
          return b;
        } else {
          return (com.google.protobuf.ByteString) ref;
        }
      }
      /**
       * <pre>
       *This message can be used to instruct a developer operating on APIs how best to approach
       *resolving this issue.
       * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
       *  Please consider whether you are spamming the backend server and reach out to developer
       *  support to see how to optimize your usage".
       * </pre>
       *
       * <code>string message_for_developer = 2;</code>
       * @param value The messageForDeveloper to set.
       * @return This builder for chaining.
       */
      public Builder setMessageForDeveloper(
          java.lang.String value) {
        if (value == null) {
    throw new NullPointerException();
  }
  
        messageForDeveloper_ = value;
        onChanged();
        return this;
      }
      /**
       * <pre>
       *This message can be used to instruct a developer operating on APIs how best to approach
       *resolving this issue.
       * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
       *  Please consider whether you are spamming the backend server and reach out to developer
       *  support to see how to optimize your usage".
       * </pre>
       *
       * <code>string message_for_developer = 2;</code>
       * @return This builder for chaining.
       */
      public Builder clearMessageForDeveloper() {
        
        messageForDeveloper_ = getDefaultInstance().getMessageForDeveloper();
        onChanged();
        return this;
      }
      /**
       * <pre>
       *This message can be used to instruct a developer operating on APIs how best to approach
       *resolving this issue.
       * A server throws an exception -&gt; "The &lt;x&gt; service timed out or rejected this message.
       *  Please consider whether you are spamming the backend server and reach out to developer
       *  support to see how to optimize your usage".
       * </pre>
       *
       * <code>string message_for_developer = 2;</code>
       * @param value The bytes for messageForDeveloper to set.
       * @return This builder for chaining.
       */
      public Builder setMessageForDeveloperBytes(
          com.google.protobuf.ByteString value) {
        if (value == null) {
    throw new NullPointerException();
  }
  checkByteStringIsUtf8(value);
        
        messageForDeveloper_ = value;
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


      // @@protoc_insertion_point(builder_scope:fintekkers.requests.util.errors.Message)
    }

    // @@protoc_insertion_point(class_scope:fintekkers.requests.util.errors.Message)
    private static final fintekkers.requests.util.errors.MessageOuterClass.Message DEFAULT_INSTANCE;
    static {
      DEFAULT_INSTANCE = new fintekkers.requests.util.errors.MessageOuterClass.Message();
    }

    public static fintekkers.requests.util.errors.MessageOuterClass.Message getDefaultInstance() {
      return DEFAULT_INSTANCE;
    }

    private static final com.google.protobuf.Parser<Message>
        PARSER = new com.google.protobuf.AbstractParser<Message>() {
      @java.lang.Override
      public Message parsePartialFrom(
          com.google.protobuf.CodedInputStream input,
          com.google.protobuf.ExtensionRegistryLite extensionRegistry)
          throws com.google.protobuf.InvalidProtocolBufferException {
        return new Message(input, extensionRegistry);
      }
    };

    public static com.google.protobuf.Parser<Message> parser() {
      return PARSER;
    }

    @java.lang.Override
    public com.google.protobuf.Parser<Message> getParserForType() {
      return PARSER;
    }

    @java.lang.Override
    public fintekkers.requests.util.errors.MessageOuterClass.Message getDefaultInstanceForType() {
      return DEFAULT_INSTANCE;
    }

  }

  private static final com.google.protobuf.Descriptors.Descriptor
    internal_static_fintekkers_requests_util_errors_Message_descriptor;
  private static final 
    com.google.protobuf.GeneratedMessageV3.FieldAccessorTable
      internal_static_fintekkers_requests_util_errors_Message_fieldAccessorTable;

  public static com.google.protobuf.Descriptors.FileDescriptor
      getDescriptor() {
    return descriptor;
  }
  private static  com.google.protobuf.Descriptors.FileDescriptor
      descriptor;
  static {
    java.lang.String[] descriptorData = {
      "\n-fintekkers/requests/util/errors/messag" +
      "e.proto\022\037fintekkers.requests.util.errors" +
      "\"B\n\007Message\022\030\n\020message_for_user\030\001 \001(\t\022\035\n" +
      "\025message_for_developer\030\002 \001(\tb\006proto3"
    };
    descriptor = com.google.protobuf.Descriptors.FileDescriptor
      .internalBuildGeneratedFileFrom(descriptorData,
        new com.google.protobuf.Descriptors.FileDescriptor[] {
        });
    internal_static_fintekkers_requests_util_errors_Message_descriptor =
      getDescriptor().getMessageTypes().get(0);
    internal_static_fintekkers_requests_util_errors_Message_fieldAccessorTable = new
      com.google.protobuf.GeneratedMessageV3.FieldAccessorTable(
        internal_static_fintekkers_requests_util_errors_Message_descriptor,
        new java.lang.String[] { "MessageForUser", "MessageForDeveloper", });
  }

  // @@protoc_insertion_point(outer_class_scope)
}