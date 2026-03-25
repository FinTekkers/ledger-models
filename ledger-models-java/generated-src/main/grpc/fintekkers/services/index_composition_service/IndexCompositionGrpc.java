package fintekkers.services.index_composition_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@io.grpc.stub.annotations.GrpcGenerated
public final class IndexCompositionGrpc {

  private IndexCompositionGrpc() {}

  public static final java.lang.String SERVICE_NAME = "fintekkers.services.index_composition_service.IndexComposition";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.index_composition.CreateIndexCompositionRequestProto,
      fintekkers.requests.index_composition.CreateIndexCompositionResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.index_composition.CreateIndexCompositionRequestProto.class,
      responseType = fintekkers.requests.index_composition.CreateIndexCompositionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.index_composition.CreateIndexCompositionRequestProto,
      fintekkers.requests.index_composition.CreateIndexCompositionResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.index_composition.CreateIndexCompositionRequestProto, fintekkers.requests.index_composition.CreateIndexCompositionResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = IndexCompositionGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (IndexCompositionGrpc.class) {
        if ((getCreateOrUpdateMethod = IndexCompositionGrpc.getCreateOrUpdateMethod) == null) {
          IndexCompositionGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.index_composition.CreateIndexCompositionRequestProto, fintekkers.requests.index_composition.CreateIndexCompositionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.index_composition.CreateIndexCompositionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.index_composition.CreateIndexCompositionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new IndexCompositionMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.index_composition.GetIndexCompositionRequestProto,
      fintekkers.requests.index_composition.GetIndexCompositionResponseProto> getGetIndexCompositionMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetIndexComposition",
      requestType = fintekkers.requests.index_composition.GetIndexCompositionRequestProto.class,
      responseType = fintekkers.requests.index_composition.GetIndexCompositionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.index_composition.GetIndexCompositionRequestProto,
      fintekkers.requests.index_composition.GetIndexCompositionResponseProto> getGetIndexCompositionMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.index_composition.GetIndexCompositionRequestProto, fintekkers.requests.index_composition.GetIndexCompositionResponseProto> getGetIndexCompositionMethod;
    if ((getGetIndexCompositionMethod = IndexCompositionGrpc.getGetIndexCompositionMethod) == null) {
      synchronized (IndexCompositionGrpc.class) {
        if ((getGetIndexCompositionMethod = IndexCompositionGrpc.getGetIndexCompositionMethod) == null) {
          IndexCompositionGrpc.getGetIndexCompositionMethod = getGetIndexCompositionMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.index_composition.GetIndexCompositionRequestProto, fintekkers.requests.index_composition.GetIndexCompositionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetIndexComposition"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.index_composition.GetIndexCompositionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.index_composition.GetIndexCompositionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new IndexCompositionMethodDescriptorSupplier("GetIndexComposition"))
              .build();
        }
      }
    }
    return getGetIndexCompositionMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static IndexCompositionStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<IndexCompositionStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<IndexCompositionStub>() {
        @java.lang.Override
        public IndexCompositionStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new IndexCompositionStub(channel, callOptions);
        }
      };
    return IndexCompositionStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports all types of calls on the service
   */
  public static IndexCompositionBlockingV2Stub newBlockingV2Stub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<IndexCompositionBlockingV2Stub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<IndexCompositionBlockingV2Stub>() {
        @java.lang.Override
        public IndexCompositionBlockingV2Stub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new IndexCompositionBlockingV2Stub(channel, callOptions);
        }
      };
    return IndexCompositionBlockingV2Stub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static IndexCompositionBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<IndexCompositionBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<IndexCompositionBlockingStub>() {
        @java.lang.Override
        public IndexCompositionBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new IndexCompositionBlockingStub(channel, callOptions);
        }
      };
    return IndexCompositionBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static IndexCompositionFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<IndexCompositionFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<IndexCompositionFutureStub>() {
        @java.lang.Override
        public IndexCompositionFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new IndexCompositionFutureStub(channel, callOptions);
        }
      };
    return IndexCompositionFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     * <pre>
     * Store (or replace) an IndexCompositionProto record.
     * If a record with the same (index_uuid, effective_date) already exists it is
     * replaced (last-writer-wins). A UUID is auto-generated when absent.
     * </pre>
     */
    default void createOrUpdate(fintekkers.requests.index_composition.CreateIndexCompositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.index_composition.CreateIndexCompositionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     * <pre>
     * Temporal resolution: return the composition of the given index that was
     * active on as_of_date. Returns the most recent composition where
     * effective_date &lt;= as_of_date.
     * This is the primary query for analytics and portfolio valuation.
     * It is the equity-index analogue of PriceService.Search(security, as_of).
     * </pre>
     */
    default void getIndexComposition(fintekkers.requests.index_composition.GetIndexCompositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.index_composition.GetIndexCompositionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetIndexCompositionMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service IndexComposition.
   */
  public static abstract class IndexCompositionImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return IndexCompositionGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service IndexComposition.
   */
  public static final class IndexCompositionStub
      extends io.grpc.stub.AbstractAsyncStub<IndexCompositionStub> {
    private IndexCompositionStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected IndexCompositionStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new IndexCompositionStub(channel, callOptions);
    }

    /**
     * <pre>
     * Store (or replace) an IndexCompositionProto record.
     * If a record with the same (index_uuid, effective_date) already exists it is
     * replaced (last-writer-wins). A UUID is auto-generated when absent.
     * </pre>
     */
    public void createOrUpdate(fintekkers.requests.index_composition.CreateIndexCompositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.index_composition.CreateIndexCompositionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Temporal resolution: return the composition of the given index that was
     * active on as_of_date. Returns the most recent composition where
     * effective_date &lt;= as_of_date.
     * This is the primary query for analytics and portfolio valuation.
     * It is the equity-index analogue of PriceService.Search(security, as_of).
     * </pre>
     */
    public void getIndexComposition(fintekkers.requests.index_composition.GetIndexCompositionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.index_composition.GetIndexCompositionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetIndexCompositionMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service IndexComposition.
   */
  public static final class IndexCompositionBlockingV2Stub
      extends io.grpc.stub.AbstractBlockingStub<IndexCompositionBlockingV2Stub> {
    private IndexCompositionBlockingV2Stub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected IndexCompositionBlockingV2Stub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new IndexCompositionBlockingV2Stub(channel, callOptions);
    }

    /**
     * <pre>
     * Store (or replace) an IndexCompositionProto record.
     * If a record with the same (index_uuid, effective_date) already exists it is
     * replaced (last-writer-wins). A UUID is auto-generated when absent.
     * </pre>
     */
    public fintekkers.requests.index_composition.CreateIndexCompositionResponseProto createOrUpdate(fintekkers.requests.index_composition.CreateIndexCompositionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Temporal resolution: return the composition of the given index that was
     * active on as_of_date. Returns the most recent composition where
     * effective_date &lt;= as_of_date.
     * This is the primary query for analytics and portfolio valuation.
     * It is the equity-index analogue of PriceService.Search(security, as_of).
     * </pre>
     */
    public fintekkers.requests.index_composition.GetIndexCompositionResponseProto getIndexComposition(fintekkers.requests.index_composition.GetIndexCompositionRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getGetIndexCompositionMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do limited synchronous rpc calls to service IndexComposition.
   */
  public static final class IndexCompositionBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<IndexCompositionBlockingStub> {
    private IndexCompositionBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected IndexCompositionBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new IndexCompositionBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Store (or replace) an IndexCompositionProto record.
     * If a record with the same (index_uuid, effective_date) already exists it is
     * replaced (last-writer-wins). A UUID is auto-generated when absent.
     * </pre>
     */
    public fintekkers.requests.index_composition.CreateIndexCompositionResponseProto createOrUpdate(fintekkers.requests.index_composition.CreateIndexCompositionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Temporal resolution: return the composition of the given index that was
     * active on as_of_date. Returns the most recent composition where
     * effective_date &lt;= as_of_date.
     * This is the primary query for analytics and portfolio valuation.
     * It is the equity-index analogue of PriceService.Search(security, as_of).
     * </pre>
     */
    public fintekkers.requests.index_composition.GetIndexCompositionResponseProto getIndexComposition(fintekkers.requests.index_composition.GetIndexCompositionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetIndexCompositionMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service IndexComposition.
   */
  public static final class IndexCompositionFutureStub
      extends io.grpc.stub.AbstractFutureStub<IndexCompositionFutureStub> {
    private IndexCompositionFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected IndexCompositionFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new IndexCompositionFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Store (or replace) an IndexCompositionProto record.
     * If a record with the same (index_uuid, effective_date) already exists it is
     * replaced (last-writer-wins). A UUID is auto-generated when absent.
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.index_composition.CreateIndexCompositionResponseProto> createOrUpdate(
        fintekkers.requests.index_composition.CreateIndexCompositionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Temporal resolution: return the composition of the given index that was
     * active on as_of_date. Returns the most recent composition where
     * effective_date &lt;= as_of_date.
     * This is the primary query for analytics and portfolio valuation.
     * It is the equity-index analogue of PriceService.Search(security, as_of).
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.index_composition.GetIndexCompositionResponseProto> getIndexComposition(
        fintekkers.requests.index_composition.GetIndexCompositionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetIndexCompositionMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CREATE_OR_UPDATE = 0;
  private static final int METHODID_GET_INDEX_COMPOSITION = 1;

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
          serviceImpl.createOrUpdate((fintekkers.requests.index_composition.CreateIndexCompositionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.index_composition.CreateIndexCompositionResponseProto>) responseObserver);
          break;
        case METHODID_GET_INDEX_COMPOSITION:
          serviceImpl.getIndexComposition((fintekkers.requests.index_composition.GetIndexCompositionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.index_composition.GetIndexCompositionResponseProto>) responseObserver);
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
              fintekkers.requests.index_composition.CreateIndexCompositionRequestProto,
              fintekkers.requests.index_composition.CreateIndexCompositionResponseProto>(
                service, METHODID_CREATE_OR_UPDATE)))
        .addMethod(
          getGetIndexCompositionMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.index_composition.GetIndexCompositionRequestProto,
              fintekkers.requests.index_composition.GetIndexCompositionResponseProto>(
                service, METHODID_GET_INDEX_COMPOSITION)))
        .build();
  }

  private static abstract class IndexCompositionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    IndexCompositionBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.index_composition_service.IndexCompositionServiceProtos.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("IndexComposition");
    }
  }

  private static final class IndexCompositionFileDescriptorSupplier
      extends IndexCompositionBaseDescriptorSupplier {
    IndexCompositionFileDescriptorSupplier() {}
  }

  private static final class IndexCompositionMethodDescriptorSupplier
      extends IndexCompositionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    IndexCompositionMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (IndexCompositionGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new IndexCompositionFileDescriptorSupplier())
              .addMethod(getCreateOrUpdateMethod())
              .addMethod(getGetIndexCompositionMethod())
              .build();
        }
      }
    }
    return result;
  }
}
