package fintekkers.services.price_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@io.grpc.stub.annotations.GrpcGenerated
public final class PriceGrpc {

  private PriceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "fintekkers.services.price_service.Price";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.price.CreatePriceResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.price.CreatePriceRequestProto.class,
      responseType = fintekkers.requests.price.CreatePriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.price.CreatePriceResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.price.CreatePriceResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = PriceGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getCreateOrUpdateMethod = PriceGrpc.getCreateOrUpdateMethod) == null) {
          PriceGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.price.CreatePriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.CreatePriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.CreatePriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getGetByIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIds",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.price.QueryPriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getGetByIdsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto> getGetByIdsMethod;
    if ((getGetByIdsMethod = PriceGrpc.getGetByIdsMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getGetByIdsMethod = PriceGrpc.getGetByIdsMethod) == null) {
          PriceGrpc.getGetByIdsMethod = getGetByIdsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("GetByIds"))
              .build();
        }
      }
    }
    return getGetByIdsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.price.QueryPriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto> getSearchMethod;
    if ((getSearchMethod = PriceGrpc.getSearchMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getSearchMethod = PriceGrpc.getSearchMethod) == null) {
          PriceGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getListIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIds",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.price.QueryPriceResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.price.QueryPriceResponseProto> getListIdsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto> getListIdsMethod;
    if ((getListIdsMethod = PriceGrpc.getListIdsMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getListIdsMethod = PriceGrpc.getListIdsMethod) == null) {
          PriceGrpc.getListIdsMethod = getListIdsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.price.QueryPriceResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("ListIds"))
              .build();
        }
      }
    }
    return getListIdsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = fintekkers.requests.price.CreatePriceRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = PriceGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = PriceGrpc.getValidateCreateOrUpdateMethod) == null) {
          PriceGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.CreatePriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.CreatePriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = fintekkers.requests.price.QueryPriceRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = PriceGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (PriceGrpc.class) {
        if ((getValidateQueryRequestMethod = PriceGrpc.getValidateQueryRequestMethod) == null) {
          PriceGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.price.QueryPriceRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.price.QueryPriceRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PriceMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static PriceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceStub>() {
        @java.lang.Override
        public PriceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceStub(channel, callOptions);
        }
      };
    return PriceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports all types of calls on the service
   */
  public static PriceBlockingV2Stub newBlockingV2Stub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceBlockingV2Stub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceBlockingV2Stub>() {
        @java.lang.Override
        public PriceBlockingV2Stub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceBlockingV2Stub(channel, callOptions);
        }
      };
    return PriceBlockingV2Stub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static PriceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceBlockingStub>() {
        @java.lang.Override
        public PriceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceBlockingStub(channel, callOptions);
        }
      };
    return PriceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static PriceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PriceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PriceFutureStub>() {
        @java.lang.Override
        public PriceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PriceFutureStub(channel, callOptions);
        }
      };
    return PriceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.CreatePriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    default void getByIds(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIdsMethod(), responseObserver);
    }

    /**
     */
    default void search(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    default void listIds(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIdsMethod(), responseObserver);
    }

    /**
     */
    default void validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    default void validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service Price.
   */
  public static abstract class PriceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return PriceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service Price.
   */
  public static final class PriceStub
      extends io.grpc.stub.AbstractAsyncStub<PriceStub> {
    private PriceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceStub(channel, callOptions);
    }

    /**
     */
    public void createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.CreatePriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIds(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIdsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIds(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIdsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service Price.
   */
  public static final class PriceBlockingV2Stub
      extends io.grpc.stub.AbstractBlockingStub<PriceBlockingV2Stub> {
    private PriceBlockingV2Stub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceBlockingV2Stub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceBlockingV2Stub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.price.CreatePriceResponseProto createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.price.QueryPriceResponseProto getByIds(fintekkers.requests.price.QueryPriceRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getGetByIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    @io.grpc.ExperimentalApi("https://github.com/grpc/grpc-java/issues/10918")
    public io.grpc.stub.BlockingClientCall<?, fintekkers.requests.price.QueryPriceResponseProto>
        search(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingV2ServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.price.QueryPriceResponseProto listIds(fintekkers.requests.price.QueryPriceRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getListIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do limited synchronous rpc calls to service Price.
   */
  public static final class PriceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<PriceBlockingStub> {
    private PriceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceBlockingStub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.price.CreatePriceResponseProto createOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.price.QueryPriceResponseProto getByIds(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<fintekkers.requests.price.QueryPriceResponseProto> search(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.price.QueryPriceResponseProto listIds(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service Price.
   */
  public static final class PriceFutureStub
      extends io.grpc.stub.AbstractFutureStub<PriceFutureStub> {
    private PriceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PriceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PriceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.price.CreatePriceResponseProto> createOrUpdate(
        fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.price.QueryPriceResponseProto> getByIds(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIdsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.price.QueryPriceResponseProto> listIds(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIdsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateCreateOrUpdate(
        fintekkers.requests.price.CreatePriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateQueryRequest(
        fintekkers.requests.price.QueryPriceRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CREATE_OR_UPDATE = 0;
  private static final int METHODID_GET_BY_IDS = 1;
  private static final int METHODID_SEARCH = 2;
  private static final int METHODID_LIST_IDS = 3;
  private static final int METHODID_VALIDATE_CREATE_OR_UPDATE = 4;
  private static final int METHODID_VALIDATE_QUERY_REQUEST = 5;

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
          serviceImpl.createOrUpdate((fintekkers.requests.price.CreatePriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.CreatePriceResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIds((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIds((fintekkers.requests.price.QueryPriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.price.QueryPriceResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((fintekkers.requests.price.CreatePriceRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((fintekkers.requests.price.QueryPriceRequestProto) request,
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
              fintekkers.requests.price.CreatePriceRequestProto,
              fintekkers.requests.price.CreatePriceResponseProto>(
                service, METHODID_CREATE_OR_UPDATE)))
        .addMethod(
          getGetByIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.price.QueryPriceRequestProto,
              fintekkers.requests.price.QueryPriceResponseProto>(
                service, METHODID_GET_BY_IDS)))
        .addMethod(
          getSearchMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              fintekkers.requests.price.QueryPriceRequestProto,
              fintekkers.requests.price.QueryPriceResponseProto>(
                service, METHODID_SEARCH)))
        .addMethod(
          getListIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.price.QueryPriceRequestProto,
              fintekkers.requests.price.QueryPriceResponseProto>(
                service, METHODID_LIST_IDS)))
        .addMethod(
          getValidateCreateOrUpdateMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.price.CreatePriceRequestProto,
              fintekkers.requests.util.errors.Summary.SummaryProto>(
                service, METHODID_VALIDATE_CREATE_OR_UPDATE)))
        .addMethod(
          getValidateQueryRequestMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.price.QueryPriceRequestProto,
              fintekkers.requests.util.errors.Summary.SummaryProto>(
                service, METHODID_VALIDATE_QUERY_REQUEST)))
        .build();
  }

  private static abstract class PriceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    PriceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.price_service.PriceService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Price");
    }
  }

  private static final class PriceFileDescriptorSupplier
      extends PriceBaseDescriptorSupplier {
    PriceFileDescriptorSupplier() {}
  }

  private static final class PriceMethodDescriptorSupplier
      extends PriceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    PriceMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (PriceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new PriceFileDescriptorSupplier())
              .addMethod(getCreateOrUpdateMethod())
              .addMethod(getGetByIdsMethod())
              .addMethod(getSearchMethod())
              .addMethod(getListIdsMethod())
              .addMethod(getValidateCreateOrUpdateMethod())
              .addMethod(getValidateQueryRequestMethod())
              .build();
        }
      }
    }
    return result;
  }
}
