package fintekkers.services.portfolio_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@io.grpc.stub.annotations.GrpcGenerated
public final class PortfolioGrpc {

  private PortfolioGrpc() {}

  public static final java.lang.String SERVICE_NAME = "fintekkers.services.portfolio_service.Portfolio";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.portfolio.CreatePortfolioRequestProto,
      fintekkers.requests.portfolio.CreatePortfolioResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.portfolio.CreatePortfolioRequestProto.class,
      responseType = fintekkers.requests.portfolio.CreatePortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.portfolio.CreatePortfolioRequestProto,
      fintekkers.requests.portfolio.CreatePortfolioResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.portfolio.CreatePortfolioRequestProto, fintekkers.requests.portfolio.CreatePortfolioResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = PortfolioGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getCreateOrUpdateMethod = PortfolioGrpc.getCreateOrUpdateMethod) == null) {
          PortfolioGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.portfolio.CreatePortfolioRequestProto, fintekkers.requests.portfolio.CreatePortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.CreatePortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.CreatePortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.portfolio.QueryPortfolioResponseProto> getGetByIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIds",
      requestType = fintekkers.requests.portfolio.QueryPortfolioRequestProto.class,
      responseType = fintekkers.requests.portfolio.QueryPortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.portfolio.QueryPortfolioResponseProto> getGetByIdsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.portfolio.QueryPortfolioResponseProto> getGetByIdsMethod;
    if ((getGetByIdsMethod = PortfolioGrpc.getGetByIdsMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getGetByIdsMethod = PortfolioGrpc.getGetByIdsMethod) == null) {
          PortfolioGrpc.getGetByIdsMethod = getGetByIdsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.portfolio.QueryPortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("GetByIds"))
              .build();
        }
      }
    }
    return getGetByIdsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.portfolio.QueryPortfolioResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.portfolio.QueryPortfolioRequestProto.class,
      responseType = fintekkers.requests.portfolio.QueryPortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.portfolio.QueryPortfolioResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.portfolio.QueryPortfolioResponseProto> getSearchMethod;
    if ((getSearchMethod = PortfolioGrpc.getSearchMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getSearchMethod = PortfolioGrpc.getSearchMethod) == null) {
          PortfolioGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.portfolio.QueryPortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.portfolio.QueryPortfolioResponseProto> getListIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIds",
      requestType = fintekkers.requests.portfolio.QueryPortfolioRequestProto.class,
      responseType = fintekkers.requests.portfolio.QueryPortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.portfolio.QueryPortfolioResponseProto> getListIdsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.portfolio.QueryPortfolioResponseProto> getListIdsMethod;
    if ((getListIdsMethod = PortfolioGrpc.getListIdsMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getListIdsMethod = PortfolioGrpc.getListIdsMethod) == null) {
          PortfolioGrpc.getListIdsMethod = getListIdsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.portfolio.QueryPortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("ListIds"))
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
    if ((getDeleteMethod = PortfolioGrpc.getDeleteMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getDeleteMethod = PortfolioGrpc.getDeleteMethod) == null) {
          PortfolioGrpc.getDeleteMethod = getDeleteMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.util.DeleteRequestProto, fintekkers.requests.util.DeleteResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Delete"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.DeleteRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.DeleteResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("Delete"))
              .build();
        }
      }
    }
    return getDeleteMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.portfolio.CreatePortfolioRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = fintekkers.requests.portfolio.CreatePortfolioRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.portfolio.CreatePortfolioRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.portfolio.CreatePortfolioRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = PortfolioGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = PortfolioGrpc.getValidateCreateOrUpdateMethod) == null) {
          PortfolioGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.portfolio.CreatePortfolioRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.CreatePortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = fintekkers.requests.portfolio.QueryPortfolioRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = PortfolioGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getValidateQueryRequestMethod = PortfolioGrpc.getValidateQueryRequestMethod) == null) {
          PortfolioGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.portfolio.QueryPortfolioRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.portfolio.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static PortfolioStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PortfolioStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PortfolioStub>() {
        @java.lang.Override
        public PortfolioStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PortfolioStub(channel, callOptions);
        }
      };
    return PortfolioStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports all types of calls on the service
   */
  public static PortfolioBlockingV2Stub newBlockingV2Stub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PortfolioBlockingV2Stub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PortfolioBlockingV2Stub>() {
        @java.lang.Override
        public PortfolioBlockingV2Stub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PortfolioBlockingV2Stub(channel, callOptions);
        }
      };
    return PortfolioBlockingV2Stub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static PortfolioBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PortfolioBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PortfolioBlockingStub>() {
        @java.lang.Override
        public PortfolioBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PortfolioBlockingStub(channel, callOptions);
        }
      };
    return PortfolioBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static PortfolioFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PortfolioFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PortfolioFutureStub>() {
        @java.lang.Override
        public PortfolioFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PortfolioFutureStub(channel, callOptions);
        }
      };
    return PortfolioFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void createOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.CreatePortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    default void getByIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIdsMethod(), responseObserver);
    }

    /**
     */
    default void search(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    default void listIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto> responseObserver) {
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
    default void validateCreateOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    default void validateQueryRequest(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service Portfolio.
   */
  public static abstract class PortfolioImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return PortfolioGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service Portfolio.
   */
  public static final class PortfolioStub
      extends io.grpc.stub.AbstractAsyncStub<PortfolioStub> {
    private PortfolioStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PortfolioStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PortfolioStub(channel, callOptions);
    }

    /**
     */
    public void createOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.CreatePortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIdsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto> responseObserver) {
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
    public void validateCreateOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.portfolio.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service Portfolio.
   */
  public static final class PortfolioBlockingV2Stub
      extends io.grpc.stub.AbstractBlockingStub<PortfolioBlockingV2Stub> {
    private PortfolioBlockingV2Stub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PortfolioBlockingV2Stub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PortfolioBlockingV2Stub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.portfolio.CreatePortfolioResponseProto createOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.portfolio.QueryPortfolioResponseProto getByIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getGetByIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    @io.grpc.ExperimentalApi("https://github.com/grpc/grpc-java/issues/10918")
    public io.grpc.stub.BlockingClientCall<?, fintekkers.requests.portfolio.QueryPortfolioResponseProto>
        search(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingV2ServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.portfolio.QueryPortfolioResponseProto listIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) throws io.grpc.StatusException {
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
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do limited synchronous rpc calls to service Portfolio.
   */
  public static final class PortfolioBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<PortfolioBlockingStub> {
    private PortfolioBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PortfolioBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PortfolioBlockingStub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.portfolio.CreatePortfolioResponseProto createOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.portfolio.QueryPortfolioResponseProto getByIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIdsMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<fintekkers.requests.portfolio.QueryPortfolioResponseProto> search(
        fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.portfolio.QueryPortfolioResponseProto listIds(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
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
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.portfolio.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service Portfolio.
   */
  public static final class PortfolioFutureStub
      extends io.grpc.stub.AbstractFutureStub<PortfolioFutureStub> {
    private PortfolioFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PortfolioFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PortfolioFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.portfolio.CreatePortfolioResponseProto> createOrUpdate(
        fintekkers.requests.portfolio.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.portfolio.QueryPortfolioResponseProto> getByIds(
        fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIdsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.portfolio.QueryPortfolioResponseProto> listIds(
        fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
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
        fintekkers.requests.portfolio.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateQueryRequest(
        fintekkers.requests.portfolio.QueryPortfolioRequestProto request) {
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
          serviceImpl.createOrUpdate((fintekkers.requests.portfolio.CreatePortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.CreatePortfolioResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIds((fintekkers.requests.portfolio.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.portfolio.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIds((fintekkers.requests.portfolio.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.portfolio.QueryPortfolioResponseProto>) responseObserver);
          break;
        case METHODID_DELETE:
          serviceImpl.delete((fintekkers.requests.util.DeleteRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.DeleteResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((fintekkers.requests.portfolio.CreatePortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((fintekkers.requests.portfolio.QueryPortfolioRequestProto) request,
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
              fintekkers.requests.portfolio.CreatePortfolioRequestProto,
              fintekkers.requests.portfolio.CreatePortfolioResponseProto>(
                service, METHODID_CREATE_OR_UPDATE)))
        .addMethod(
          getGetByIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.portfolio.QueryPortfolioRequestProto,
              fintekkers.requests.portfolio.QueryPortfolioResponseProto>(
                service, METHODID_GET_BY_IDS)))
        .addMethod(
          getSearchMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              fintekkers.requests.portfolio.QueryPortfolioRequestProto,
              fintekkers.requests.portfolio.QueryPortfolioResponseProto>(
                service, METHODID_SEARCH)))
        .addMethod(
          getListIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.portfolio.QueryPortfolioRequestProto,
              fintekkers.requests.portfolio.QueryPortfolioResponseProto>(
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
              fintekkers.requests.portfolio.CreatePortfolioRequestProto,
              fintekkers.requests.util.errors.Summary.SummaryProto>(
                service, METHODID_VALIDATE_CREATE_OR_UPDATE)))
        .addMethod(
          getValidateQueryRequestMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.portfolio.QueryPortfolioRequestProto,
              fintekkers.requests.util.errors.Summary.SummaryProto>(
                service, METHODID_VALIDATE_QUERY_REQUEST)))
        .build();
  }

  private static abstract class PortfolioBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    PortfolioBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.portfolio_service.PortfolioService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Portfolio");
    }
  }

  private static final class PortfolioFileDescriptorSupplier
      extends PortfolioBaseDescriptorSupplier {
    PortfolioFileDescriptorSupplier() {}
  }

  private static final class PortfolioMethodDescriptorSupplier
      extends PortfolioBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    PortfolioMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (PortfolioGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new PortfolioFileDescriptorSupplier())
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
