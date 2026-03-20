package fintekkers.services.valuation_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@io.grpc.stub.annotations.GrpcGenerated
public final class ValuationGrpc {

  private ValuationGrpc() {}

  public static final java.lang.String SERVICE_NAME = "fintekkers.services.valuation_service.Valuation";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.valuation.ValuationRequestProto,
      fintekkers.requests.valuation.ValuationResponseProto> getRunValuationMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RunValuation",
      requestType = fintekkers.requests.valuation.ValuationRequestProto.class,
      responseType = fintekkers.requests.valuation.ValuationResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.valuation.ValuationRequestProto,
      fintekkers.requests.valuation.ValuationResponseProto> getRunValuationMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.valuation.ValuationRequestProto, fintekkers.requests.valuation.ValuationResponseProto> getRunValuationMethod;
    if ((getRunValuationMethod = ValuationGrpc.getRunValuationMethod) == null) {
      synchronized (ValuationGrpc.class) {
        if ((getRunValuationMethod = ValuationGrpc.getRunValuationMethod) == null) {
          ValuationGrpc.getRunValuationMethod = getRunValuationMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.valuation.ValuationRequestProto, fintekkers.requests.valuation.ValuationResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RunValuation"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.valuation.ValuationRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.valuation.ValuationResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new ValuationMethodDescriptorSupplier("RunValuation"))
              .build();
        }
      }
    }
    return getRunValuationMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static ValuationStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationStub>() {
        @java.lang.Override
        public ValuationStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationStub(channel, callOptions);
        }
      };
    return ValuationStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports all types of calls on the service
   */
  public static ValuationBlockingV2Stub newBlockingV2Stub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationBlockingV2Stub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationBlockingV2Stub>() {
        @java.lang.Override
        public ValuationBlockingV2Stub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationBlockingV2Stub(channel, callOptions);
        }
      };
    return ValuationBlockingV2Stub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static ValuationBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationBlockingStub>() {
        @java.lang.Override
        public ValuationBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationBlockingStub(channel, callOptions);
        }
      };
    return ValuationBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static ValuationFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ValuationFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ValuationFutureStub>() {
        @java.lang.Override
        public ValuationFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ValuationFutureStub(channel, callOptions);
        }
      };
    return ValuationFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void runValuation(fintekkers.requests.valuation.ValuationRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.valuation.ValuationResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRunValuationMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service Valuation.
   */
  public static abstract class ValuationImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return ValuationGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service Valuation.
   */
  public static final class ValuationStub
      extends io.grpc.stub.AbstractAsyncStub<ValuationStub> {
    private ValuationStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationStub(channel, callOptions);
    }

    /**
     */
    public void runValuation(fintekkers.requests.valuation.ValuationRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.valuation.ValuationResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRunValuationMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service Valuation.
   */
  public static final class ValuationBlockingV2Stub
      extends io.grpc.stub.AbstractBlockingStub<ValuationBlockingV2Stub> {
    private ValuationBlockingV2Stub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationBlockingV2Stub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationBlockingV2Stub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.valuation.ValuationResponseProto runValuation(fintekkers.requests.valuation.ValuationRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getRunValuationMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do limited synchronous rpc calls to service Valuation.
   */
  public static final class ValuationBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<ValuationBlockingStub> {
    private ValuationBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationBlockingStub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.valuation.ValuationResponseProto runValuation(fintekkers.requests.valuation.ValuationRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRunValuationMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service Valuation.
   */
  public static final class ValuationFutureStub
      extends io.grpc.stub.AbstractFutureStub<ValuationFutureStub> {
    private ValuationFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ValuationFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ValuationFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.valuation.ValuationResponseProto> runValuation(
        fintekkers.requests.valuation.ValuationRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRunValuationMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_RUN_VALUATION = 0;

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
        case METHODID_RUN_VALUATION:
          serviceImpl.runValuation((fintekkers.requests.valuation.ValuationRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.valuation.ValuationResponseProto>) responseObserver);
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
          getRunValuationMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.valuation.ValuationRequestProto,
              fintekkers.requests.valuation.ValuationResponseProto>(
                service, METHODID_RUN_VALUATION)))
        .build();
  }

  private static abstract class ValuationBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    ValuationBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.valuation_service.ValuationService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Valuation");
    }
  }

  private static final class ValuationFileDescriptorSupplier
      extends ValuationBaseDescriptorSupplier {
    ValuationFileDescriptorSupplier() {}
  }

  private static final class ValuationMethodDescriptorSupplier
      extends ValuationBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    ValuationMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (ValuationGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new ValuationFileDescriptorSupplier())
              .addMethod(getRunValuationMethod())
              .build();
        }
      }
    }
    return result;
  }
}
