package fintekkers.services.security_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: fintekkers/services/transaction-service/transaction_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class TransactionGrpc {

  private TransactionGrpc() {}

  public static final String SERVICE_NAME = "fintekkers.services.security_service.Transaction";

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
      fintekkers.requests.transaction.QueryTransactionResponseProto> getGetByIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIDs",
      requestType = fintekkers.requests.transaction.QueryTransactionRequestProto.class,
      responseType = fintekkers.requests.transaction.QueryTransactionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getGetByIDsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto> getGetByIDsMethod;
    if ((getGetByIDsMethod = TransactionGrpc.getGetByIDsMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getGetByIDsMethod = TransactionGrpc.getGetByIDsMethod) == null) {
          TransactionGrpc.getGetByIDsMethod = getGetByIDsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("GetByIDs"))
              .build();
        }
      }
    }
    return getGetByIDsMethod;
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
      fintekkers.requests.transaction.QueryTransactionResponseProto> getListIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIDs",
      requestType = fintekkers.requests.transaction.QueryTransactionRequestProto.class,
      responseType = fintekkers.requests.transaction.QueryTransactionResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto,
      fintekkers.requests.transaction.QueryTransactionResponseProto> getListIDsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto> getListIDsMethod;
    if ((getListIDsMethod = TransactionGrpc.getListIDsMethod) == null) {
      synchronized (TransactionGrpc.class) {
        if ((getListIDsMethod = TransactionGrpc.getListIDsMethod) == null) {
          TransactionGrpc.getListIDsMethod = getListIDsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.transaction.QueryTransactionRequestProto, fintekkers.requests.transaction.QueryTransactionResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.transaction.QueryTransactionResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new TransactionMethodDescriptorSupplier("ListIDs"))
              .build();
        }
      }
    }
    return getListIDsMethod;
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
  public static abstract class TransactionImplBase implements io.grpc.BindableService {

    /**
     */
    public void createOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.CreateTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void getByIDs(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIDsMethod(), responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    public void listIDs(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIDsMethod(), responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.transaction.CreateTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.transaction.CreateTransactionRequestProto,
                fintekkers.requests.transaction.CreateTransactionResponseProto>(
                  this, METHODID_CREATE_OR_UPDATE)))
          .addMethod(
            getGetByIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.transaction.QueryTransactionRequestProto,
                fintekkers.requests.transaction.QueryTransactionResponseProto>(
                  this, METHODID_GET_BY_IDS)))
          .addMethod(
            getSearchMethod(),
            io.grpc.stub.ServerCalls.asyncServerStreamingCall(
              new MethodHandlers<
                fintekkers.requests.transaction.QueryTransactionRequestProto,
                fintekkers.requests.transaction.QueryTransactionResponseProto>(
                  this, METHODID_SEARCH)))
          .addMethod(
            getListIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.transaction.QueryTransactionRequestProto,
                fintekkers.requests.transaction.QueryTransactionResponseProto>(
                  this, METHODID_LIST_IDS)))
          .addMethod(
            getValidateCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.transaction.CreateTransactionRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_CREATE_OR_UPDATE)))
          .addMethod(
            getValidateQueryRequestMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.transaction.QueryTransactionRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_QUERY_REQUEST)))
          .build();
    }
  }

  /**
   */
  public static final class TransactionStub extends io.grpc.stub.AbstractAsyncStub<TransactionStub> {
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
    public void getByIDs(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request, responseObserver);
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
    public void listIDs(fintekkers.requests.transaction.QueryTransactionRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request, responseObserver);
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
   */
  public static final class TransactionBlockingStub extends io.grpc.stub.AbstractBlockingStub<TransactionBlockingStub> {
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
    public fintekkers.requests.transaction.QueryTransactionResponseProto getByIDs(fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIDsMethod(), getCallOptions(), request);
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
    public fintekkers.requests.transaction.QueryTransactionResponseProto listIDs(fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIDsMethod(), getCallOptions(), request);
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
   */
  public static final class TransactionFutureStub extends io.grpc.stub.AbstractFutureStub<TransactionFutureStub> {
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
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.transaction.QueryTransactionResponseProto> getByIDs(
        fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.transaction.QueryTransactionResponseProto> listIDs(
        fintekkers.requests.transaction.QueryTransactionRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request);
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
  private static final int METHODID_VALIDATE_CREATE_OR_UPDATE = 4;
  private static final int METHODID_VALIDATE_QUERY_REQUEST = 5;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final TransactionImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(TransactionImplBase serviceImpl, int methodId) {
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
          serviceImpl.getByIDs((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIDs((fintekkers.requests.transaction.QueryTransactionRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.transaction.QueryTransactionResponseProto>) responseObserver);
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

  private static abstract class TransactionBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    TransactionBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.security_service.TransactionService.getDescriptor();
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
    private final String methodName;

    TransactionMethodDescriptorSupplier(String methodName) {
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
