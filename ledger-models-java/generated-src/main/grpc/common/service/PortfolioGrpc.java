package common.service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: services/portfolio-service/portfolio_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class PortfolioGrpc {

  private PortfolioGrpc() {}

  public static final String SERVICE_NAME = "security_service.Portfolio";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<common.request.CreatePortfolioRequestProto,
      common.request.CreatePortfolioResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = common.request.CreatePortfolioRequestProto.class,
      responseType = common.request.CreatePortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.CreatePortfolioRequestProto,
      common.request.CreatePortfolioResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<common.request.CreatePortfolioRequestProto, common.request.CreatePortfolioResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = PortfolioGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getCreateOrUpdateMethod = PortfolioGrpc.getCreateOrUpdateMethod) == null) {
          PortfolioGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<common.request.CreatePortfolioRequestProto, common.request.CreatePortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.CreatePortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.CreatePortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      common.request.QueryPortfolioResponseProto> getGetByIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIDs",
      requestType = common.request.QueryPortfolioRequestProto.class,
      responseType = common.request.QueryPortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      common.request.QueryPortfolioResponseProto> getGetByIDsMethod() {
    io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto, common.request.QueryPortfolioResponseProto> getGetByIDsMethod;
    if ((getGetByIDsMethod = PortfolioGrpc.getGetByIDsMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getGetByIDsMethod = PortfolioGrpc.getGetByIDsMethod) == null) {
          PortfolioGrpc.getGetByIDsMethod = getGetByIDsMethod =
              io.grpc.MethodDescriptor.<common.request.QueryPortfolioRequestProto, common.request.QueryPortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("GetByIDs"))
              .build();
        }
      }
    }
    return getGetByIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      common.request.QueryPortfolioResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = common.request.QueryPortfolioRequestProto.class,
      responseType = common.request.QueryPortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      common.request.QueryPortfolioResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto, common.request.QueryPortfolioResponseProto> getSearchMethod;
    if ((getSearchMethod = PortfolioGrpc.getSearchMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getSearchMethod = PortfolioGrpc.getSearchMethod) == null) {
          PortfolioGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<common.request.QueryPortfolioRequestProto, common.request.QueryPortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      common.request.QueryPortfolioResponseProto> getListIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIDs",
      requestType = common.request.QueryPortfolioRequestProto.class,
      responseType = common.request.QueryPortfolioResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      common.request.QueryPortfolioResponseProto> getListIDsMethod() {
    io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto, common.request.QueryPortfolioResponseProto> getListIDsMethod;
    if ((getListIDsMethod = PortfolioGrpc.getListIDsMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getListIDsMethod = PortfolioGrpc.getListIDsMethod) == null) {
          PortfolioGrpc.getListIDsMethod = getListIDsMethod =
              io.grpc.MethodDescriptor.<common.request.QueryPortfolioRequestProto, common.request.QueryPortfolioResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("ListIDs"))
              .build();
        }
      }
    }
    return getListIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.CreatePortfolioRequestProto,
      util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = common.request.CreatePortfolioRequestProto.class,
      responseType = util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.CreatePortfolioRequestProto,
      util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<common.request.CreatePortfolioRequestProto, util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = PortfolioGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = PortfolioGrpc.getValidateCreateOrUpdateMethod) == null) {
          PortfolioGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<common.request.CreatePortfolioRequestProto, util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.CreatePortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new PortfolioMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = common.request.QueryPortfolioRequestProto.class,
      responseType = util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto,
      util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<common.request.QueryPortfolioRequestProto, util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = PortfolioGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (PortfolioGrpc.class) {
        if ((getValidateQueryRequestMethod = PortfolioGrpc.getValidateQueryRequestMethod) == null) {
          PortfolioGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<common.request.QueryPortfolioRequestProto, util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  common.request.QueryPortfolioRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  util.errors.Summary.SummaryProto.getDefaultInstance()))
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
  public static abstract class PortfolioImplBase implements io.grpc.BindableService {

    /**
     */
    public void createOrUpdate(common.request.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.CreatePortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void getByIDs(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIDsMethod(), responseObserver);
    }

    /**
     */
    public void search(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    public void listIDs(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIDsMethod(), responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(common.request.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void validateQueryRequest(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.CreatePortfolioRequestProto,
                common.request.CreatePortfolioResponseProto>(
                  this, METHODID_CREATE_OR_UPDATE)))
          .addMethod(
            getGetByIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QueryPortfolioRequestProto,
                common.request.QueryPortfolioResponseProto>(
                  this, METHODID_GET_BY_IDS)))
          .addMethod(
            getSearchMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QueryPortfolioRequestProto,
                common.request.QueryPortfolioResponseProto>(
                  this, METHODID_SEARCH)))
          .addMethod(
            getListIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QueryPortfolioRequestProto,
                common.request.QueryPortfolioResponseProto>(
                  this, METHODID_LIST_IDS)))
          .addMethod(
            getValidateCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.CreatePortfolioRequestProto,
                util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_CREATE_OR_UPDATE)))
          .addMethod(
            getValidateQueryRequestMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                common.request.QueryPortfolioRequestProto,
                util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_QUERY_REQUEST)))
          .build();
    }
  }

  /**
   */
  public static final class PortfolioStub extends io.grpc.stub.AbstractAsyncStub<PortfolioStub> {
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
    public void createOrUpdate(common.request.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.CreatePortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIDs(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIDs(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(common.request.CreatePortfolioRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(common.request.QueryPortfolioRequestProto request,
        io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class PortfolioBlockingStub extends io.grpc.stub.AbstractBlockingStub<PortfolioBlockingStub> {
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
    public common.request.CreatePortfolioResponseProto createOrUpdate(common.request.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public common.request.QueryPortfolioResponseProto getByIDs(common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public common.request.QueryPortfolioResponseProto search(common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public common.request.QueryPortfolioResponseProto listIDs(common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public util.errors.Summary.SummaryProto validateCreateOrUpdate(common.request.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public util.errors.Summary.SummaryProto validateQueryRequest(common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class PortfolioFutureStub extends io.grpc.stub.AbstractFutureStub<PortfolioFutureStub> {
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
    public com.google.common.util.concurrent.ListenableFuture<common.request.CreatePortfolioResponseProto> createOrUpdate(
        common.request.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.QueryPortfolioResponseProto> getByIDs(
        common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.QueryPortfolioResponseProto> search(
        common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<common.request.QueryPortfolioResponseProto> listIDs(
        common.request.QueryPortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<util.errors.Summary.SummaryProto> validateCreateOrUpdate(
        common.request.CreatePortfolioRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<util.errors.Summary.SummaryProto> validateQueryRequest(
        common.request.QueryPortfolioRequestProto request) {
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
    private final PortfolioImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(PortfolioImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_CREATE_OR_UPDATE:
          serviceImpl.createOrUpdate((common.request.CreatePortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.CreatePortfolioResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIDs((common.request.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((common.request.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIDs((common.request.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<common.request.QueryPortfolioResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((common.request.CreatePortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((common.request.QueryPortfolioRequestProto) request,
              (io.grpc.stub.StreamObserver<util.errors.Summary.SummaryProto>) responseObserver);
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

  private static abstract class PortfolioBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    PortfolioBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return common.service.PortfolioService.getDescriptor();
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
    private final String methodName;

    PortfolioMethodDescriptorSupplier(String methodName) {
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
              .addMethod(getGetByIDsMethod())
              .addMethod(getSearchMethod())
              .addMethod(getListIDsMethod())
              .addMethod(getValidateCreateOrUpdateMethod())
              .addMethod(getValidateQueryRequestMethod())
              .build();
        }
      }
    }
    return result;
  }
}
