package fintekkers.services.transaction_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@io.grpc.stub.annotations.GrpcGenerated
public final class TransactionGrpc {

  private TransactionGrpc() {}

  public static final java.lang.String SERVICE_NAME = "fintekkers.services.transaction_service.Transaction";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.transaction.CreateTransactionRequestProto,
      fintekkers.requests.transaction.CreateTransactionResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.transaction.CreateTransactionRequestProto.class,
      responseType = fintekkers.requests.transaction.CreateTransactionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.CreateTransactionRequestProto,
      fintekkers.requests.transaction.CreateTransactionResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.CreateTransactionRequestProto, fintekkers.requests.transaction.CreateTransactionResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = TransactionGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getCreateOrUpdateMethod = TransactionGrpc.getCreateOrUpdateMethod) == null) {
          TransactionGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.CreateTransactionRequestProto, fintekkers.requests.transaction.CreateTransactionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.CreateTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.CreateTransactionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getGetByIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIds",
      requestType = fintekkers.requests.transaction.QueryTransactionRequestProto.class,
      responseType = fintekkers.requests.transaction.QueryTransactionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getGetByIdsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto> getGetByIdsMethod;
    if ((getGetByIdsMethod = TransactionGrpc.getGetByIdsMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getGetByIdsMethod = TransactionGrpc.getGetByIdsMethod) == null) {
          TransactionGrpc.getGetByIdsMethod = getGetByIdsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("GetByIds"))
              .build();
        }
      }
    }
    return getGetByIdsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.transaction.QueryTransactionRequestProto.class,
      responseType = fintekkers.requests.transaction.QueryTransactionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto> getSearchMethod;
    if ((getSearchMethod = TransactionGrpc.getSearchMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getSearchMethod = TransactionGrpc.getSearchMethod) == null) {
          TransactionGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getListIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIds",
      requestType = fintekkers.requests.transaction.QueryTransactionRequestProto.class,
      responseType = fintekkers.requests.transaction.QueryTransactionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getListIdsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto> getListIdsMethod;
    if ((getListIdsMethod = TransactionGrpc.getListIdsMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getListIdsMethod = TransactionGrpc.getListIdsMethod) == null) {
          TransactionGrpc.getListIdsMethod = getListIdsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("ListIds"))
              .build();
        }
      }
    }
    return getListIdsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.util.DeleteRequestProto,
      fintekkers.requests.util.DeleteResponseProto> getDeleteMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Delete",
      requestType = fintekkers.requests.util.DeleteRequestProto.class,
      responseType = fintekkers.requests.util.DeleteResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.util.DeleteRequestProto,
      fintekkers.requests.util.DeleteResponseProto> getDeleteMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.util.DeleteRequestProto, fintekkers.requests.util.DeleteResponseProto> getDeleteMethod;
    if ((getDeleteMethod = TransactionGrpc.getDeleteMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getDeleteMethod = TransactionGrpc.getDeleteMethod) == null) {
          TransactionGrpc.getDeleteMethod = getDeleteMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.util.DeleteRequestProto, fintekkers.requests.util.DeleteResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Delete"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.DeleteRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.DeleteResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("Delete"))
              .build();
        }
      }
    }
    return getDeleteMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.transaction.CreateTransactionRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = fintekkers.requests.transaction.CreateTransactionRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.CreateTransactionRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.CreateTransactionRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = TransactionGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = TransactionGrpc.getValidateCreateOrUpdateMethod) == null) {
          TransactionGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.CreateTransactionRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.CreateTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = fintekkers.requests.transaction.QueryTransactionRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = TransactionGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getValidateQueryRequestMethod = TransactionGrpc.getValidateQueryRequestMethod) == null) {
          TransactionGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static TransactionStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<TransactionStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<TransactionStub>() {
        @java.lang.Override
        public TransactionStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new TransactionStub(channel, callOptions);
        }
      };
    return TransactionStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports all types of calls on the service
   */
  public static TransactionBlockingV2Stub newBlockingV2Stub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<TransactionBlockingV2Stub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<TransactionBlockingV2Stub>() {
        @java.lang.Override
        public TransactionBlockingV2Stub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new TransactionBlockingV2Stub(channel, callOptions);
        }
      };
    return TransactionBlockingV2Stub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static TransactionBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<TransactionBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<TransactionBlockingStub>() {
        @java.lang.Override
        public TransactionBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new TransactionBlockingStub(channel, callOptions);
        }
      };
    return TransactionBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static TransactionFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<TransactionFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<TransactionFutureStub>() {
        @java.lang.Override
        public TransactionFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new TransactionFutureStub(channel, callOptions);
        }
      };
    return TransactionFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void createOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.CreateTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    default void getByIds(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIdsMethod(), responseObserver);
    }

    /**
     */
    default void search(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    default void listIds(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIdsMethod(), responseObserver);
    }

    /**
     */
    default void delete(fintekkers.requests.util.DeleteRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.DeleteResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getDeleteMethod(), responseObserver);
    }

    /**
     */
    default void validateCreateOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    default void validateQueryRequest(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service Transaction.
   */
  public static abstract class TransactionImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return TransactionGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service Transaction.
   */
  public static final class TransactionStub
      extends io.grpc.stub.AbstractAsyncStub<TransactionStub> {
    private TransactionStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected TransactionStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new TransactionStub(channel, callOptions);
    }

    /**
     */
    public void createOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.CreateTransactionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIds(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIdsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIds(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIdsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void delete(fintekkers.requests.util.DeleteRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.DeleteResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getDeleteMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service Transaction.
   */
  public static final class TransactionBlockingV2Stub
      extends io.grpc.stub.AbstractBlockingStub<TransactionBlockingV2Stub> {
    private TransactionBlockingV2Stub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected TransactionBlockingV2Stub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new TransactionBlockingV2Stub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.transaction.CreateTransactionResponseProto createOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.transaction.QueryTransactionResponseProto getByIds(fintekkers.requests.transaction.QueryTransactionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getGetByIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    @io.grpc.ExperimentalApi("https://github.com/grpc/grpc-java/issues/10918")
    public io.grpc.stub.BlockingClientCall<?, fintekkers.requests.transaction.QueryTransactionResponseProto>
        search(fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingV2ServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.transaction.QueryTransactionResponseProto listIds(fintekkers.requests.transaction.QueryTransactionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getListIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.DeleteResponseProto delete(fintekkers.requests.util.DeleteRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getDeleteMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.transaction.QueryTransactionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do limited synchronous rpc calls to service Transaction.
   */
  public static final class TransactionBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<TransactionBlockingStub> {
    private TransactionBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected TransactionBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new TransactionBlockingStub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.transaction.CreateTransactionResponseProto createOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.transaction.QueryTransactionResponseProto getByIds(fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<fintekkers.requests.transaction.QueryTransactionResponseProto> search(
        fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.transaction.QueryTransactionResponseProto listIds(fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.DeleteResponseProto delete(fintekkers.requests.util.DeleteRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getDeleteMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service Transaction.
   */
  public static final class TransactionFutureStub
      extends io.grpc.stub.AbstractFutureStub<TransactionFutureStub> {
    private TransactionFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected TransactionFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new TransactionFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.transaction.CreateTransactionResponseProto> createOrUpdate(
        fintekkers.requests.transaction.CreateTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.transaction.QueryTransactionResponseProto> getByIds(
        fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIdsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.transaction.QueryTransactionResponseProto> listIds(
        fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIdsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.DeleteResponseProto> delete(
        fintekkers.requests.util.DeleteRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getDeleteMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateCreateOrUpdate(
        fintekkers.requests.transaction.CreateTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateQueryRequest(
        fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CREATE_OR_UPDATE = 0;
  private static final int METHODID_GET_BY_IDS = 1;
  private static final int METHODID_SEARCH = 2;
  private static final int METHODID_LIST_IDS = 3;
  private static final int METHODID_DELETE = 4;
  private static final int METHODID_VALIDATE_CREATE_OR_UPDATE = 5;
  private static final int METHODID_VALIDATE_QUERY_REQUEST = 6;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_CREATE_OR_UPDATE:
          serviceImpl.createOrUpdate((fintekkers.requests.transaction.CreateTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.CreateTransactionResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIds((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIds((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto>) responseObserver);
          break;
        case METHODID_DELETE:
          serviceImpl.delete((fintekkers.requests.util.DeleteRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.DeleteResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((fintekkers.requests.transaction.CreateTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getCreateOrUpdateMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.transaction.CreateTransactionRequestProto,
              fintekkers.requests.transaction.CreateTransactionResponseProto>(
                service, METHODID_CREATE_OR_UPDATE)))
        .addMethod(
          getGetByIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.transaction.QueryTransactionRequestProto,
              fintekkers.requests.transaction.QueryTransactionResponseProto>(
                service, METHODID_GET_BY_IDS)))
        .addMethod(
          getSearchMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              fintekkers.requests.transaction.QueryTransactionRequestProto,
              fintekkers.requests.transaction.QueryTransactionResponseProto>(
                service, METHODID_SEARCH)))
        .addMethod(
          getListIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.transaction.QueryTransactionRequestProto,
              fintekkers.requests.transaction.QueryTransactionResponseProto>(
                service, METHODID_LIST_IDS)))
        .addMethod(
          getDeleteMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.util.DeleteRequestProto,
              fintekkers.requests.util.DeleteResponseProto>(
                service, METHODID_DELETE)))
        .addMethod(
          getValidateCreateOrUpdateMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.transaction.CreateTransactionRequestProto,
              fintekkers.requests.util.errors.Summary.SummaryProto>(
                service, METHODID_VALIDATE_CREATE_OR_UPDATE)))
        .addMethod(
          getValidateQueryRequestMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.transaction.QueryTransactionRequestProto,
              fintekkers.requests.util.errors.Summary.SummaryProto>(
                service, METHODID_VALIDATE_QUERY_REQUEST)))
        .build();
  }

  private static abstract class TransactionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    TransactionBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.transaction_service.TransactionService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Transaction");
    }
  }

  private static final class TransactionFileDescriptorSupplier
      extends TransactionBaseDescriptorSupplier {
    TransactionFileDescriptorSupplier() {}
  }

  private static final class TransactionMethodDescriptorSupplier
      extends TransactionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    TransactionMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (TransactionGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new TransactionFileDescriptorSupplier())
              .addMethod(getCreateOrUpdateMethod())
              .addMethod(getGetByIdsMethod())
              .addMethod(getSearchMethod())
              .addMethod(getListIdsMethod())
              .addMethod(getDeleteMethod())
              .addMethod(getValidateCreateOrUpdateMethod())
              .addMethod(getValidateQueryRequestMethod())
              .build();
        }
      }
    }
    return result;
  }
}
