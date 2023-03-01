package fintekkers.services.position_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: fintekkers/services/position-service/position_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class PositionGrpc {

  private PositionGrpc() {}

  public static final String SERVICE_NAME = "fintekkers.services.position_service.Position";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.position.QueryPositionRequestProto,
      fintekkers.requests.position.QueryPositionResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.position.QueryPositionRequestProto.class,
      responseType = fintekkers.requests.position.QueryPositionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.position.QueryPositionRequestProto,
      fintekkers.requests.position.QueryPositionResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.position.QueryPositionRequestProto, fintekkers.requests.position.QueryPositionResponseProto> getSearchMethod;
    if ((getSearchMethod = PositionGrpc.getSearchMethod) == null) {
      synchronized (PositionGrpc.class) {
        if ((getSearchMethod = PositionGrpc.getSearchMethod) == null) {
          PositionGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.position.QueryPositionRequestProto, fintekkers.requests.position.QueryPositionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.position.QueryPositionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.position.QueryPositionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PositionMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.position.QueryPositionRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = fintekkers.requests.position.QueryPositionRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.position.QueryPositionRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.position.QueryPositionRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = PositionGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (PositionGrpc.class) {
        if ((getValidateQueryRequestMethod = PositionGrpc.getValidateQueryRequestMethod) == null) {
          PositionGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.position.QueryPositionRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.position.QueryPositionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PositionMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static PositionStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PositionStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PositionStub>() {
        @java.lang.Override
        public PositionStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PositionStub(channel, callOptions);
        }
      };
    return PositionStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static PositionBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PositionBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PositionBlockingStub>() {
        @java.lang.Override
        public PositionBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PositionBlockingStub(channel, callOptions);
        }
      };
    return PositionBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static PositionFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<PositionFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<PositionFutureStub>() {
        @java.lang.Override
        public PositionFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new PositionFutureStub(channel, callOptions);
        }
      };
    return PositionFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class PositionImplBase implements io.grpc.BindableService {

    /**
     * <pre>
     *    rpc GetByIDs (position.QueryPositionRequestProto) returns (position.QueryPositionResponseProto);
     * </pre>
     */
    public void search(fintekkers.requests.position.QueryPositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.position.QueryPositionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     * <pre>
     *    rpc ValidateCreateOrUpdate (transaction.CreateTransactionRequestProto) returns (util.errors.SummaryProto);
     * </pre>
     */
    public void validateQueryRequest(fintekkers.requests.position.QueryPositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getSearchMethod(),
            io.grpc.stub.ServerCalls.asyncServerStreamingCall(
              new MethodHandlers<
                fintekkers.requests.position.QueryPositionRequestProto,
                fintekkers.requests.position.QueryPositionResponseProto>(
                  this, METHODID_SEARCH)))
          .addMethod(
            getValidateQueryRequestMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.position.QueryPositionRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_QUERY_REQUEST)))
          .build();
    }
  }

  /**
   */
  public static final class PositionStub extends io.grpc.stub.AbstractAsyncStub<PositionStub> {
    private PositionStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PositionStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PositionStub(channel, callOptions);
    }

    /**
     * <pre>
     *    rpc GetByIDs (position.QueryPositionRequestProto) returns (position.QueryPositionResponseProto);
     * </pre>
     */
    public void search(fintekkers.requests.position.QueryPositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.position.QueryPositionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     *    rpc ValidateCreateOrUpdate (transaction.CreateTransactionRequestProto) returns (util.errors.SummaryProto);
     * </pre>
     */
    public void validateQueryRequest(fintekkers.requests.position.QueryPositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class PositionBlockingStub extends io.grpc.stub.AbstractBlockingStub<PositionBlockingStub> {
    private PositionBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PositionBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PositionBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     *    rpc GetByIDs (position.QueryPositionRequestProto) returns (position.QueryPositionResponseProto);
     * </pre>
     */
    public java.util.Iterator<fintekkers.requests.position.QueryPositionResponseProto> search(
        fintekkers.requests.position.QueryPositionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     *    rpc ValidateCreateOrUpdate (transaction.CreateTransactionRequestProto) returns (util.errors.SummaryProto);
     * </pre>
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.position.QueryPositionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class PositionFutureStub extends io.grpc.stub.AbstractFutureStub<PositionFutureStub> {
    private PositionFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected PositionFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new PositionFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     *    rpc ValidateCreateOrUpdate (transaction.CreateTransactionRequestProto) returns (util.errors.SummaryProto);
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateQueryRequest(
        fintekkers.requests.position.QueryPositionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_SEARCH = 0;
  private static final int METHODID_VALIDATE_QUERY_REQUEST = 1;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final PositionImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(PositionImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.position.QueryPositionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.position.QueryPositionResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((fintekkers.requests.position.QueryPositionRequestProto) request,
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

  private static abstract class PositionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    PositionBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.position_service.PositionService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Position");
    }
  }

  private static final class PositionFileDescriptorSupplier
      extends PositionBaseDescriptorSupplier {
    PositionFileDescriptorSupplier() {}
  }

  private static final class PositionMethodDescriptorSupplier
      extends PositionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    PositionMethodDescriptorSupplier(String methodName) {
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
      synchronized (PositionGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new PositionFileDescriptorSupplier())
              .addMethod(getSearchMethod())
              .addMethod(getValidateQueryRequestMethod())
              .build();
        }
      }
    }
    return result;
  }
}
