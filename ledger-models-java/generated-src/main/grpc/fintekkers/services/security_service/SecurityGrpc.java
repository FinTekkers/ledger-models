package fintekkers.services.security_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.51.0)",
    comments = "Source: fintekkers/services/security-service/security_service.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class SecurityGrpc {

  private SecurityGrpc() {}

  public static final String SERVICE_NAME = "fintekkers.services.security_service.Security";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security.CreateSecurityRequestProto,
      fintekkers.requests.security.CreateSecurityResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.security.CreateSecurityRequestProto.class,
      responseType = fintekkers.requests.security.CreateSecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security.CreateSecurityRequestProto,
      fintekkers.requests.security.CreateSecurityResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security.CreateSecurityRequestProto, fintekkers.requests.security.CreateSecurityResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = SecurityGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getCreateOrUpdateMethod = SecurityGrpc.getCreateOrUpdateMethod) == null) {
          SecurityGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security.CreateSecurityRequestProto, fintekkers.requests.security.CreateSecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.CreateSecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.CreateSecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.security.QuerySecurityResponseProto> getGetByIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetByIDs",
      requestType = fintekkers.requests.security.QuerySecurityRequestProto.class,
      responseType = fintekkers.requests.security.QuerySecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.security.QuerySecurityResponseProto> getGetByIDsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.security.QuerySecurityResponseProto> getGetByIDsMethod;
    if ((getGetByIDsMethod = SecurityGrpc.getGetByIDsMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getGetByIDsMethod = SecurityGrpc.getGetByIDsMethod) == null) {
          SecurityGrpc.getGetByIDsMethod = getGetByIDsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.security.QuerySecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetByIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("GetByIDs"))
              .build();
        }
      }
    }
    return getGetByIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.security.QuerySecurityResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.security.QuerySecurityRequestProto.class,
      responseType = fintekkers.requests.security.QuerySecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.security.QuerySecurityResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.security.QuerySecurityResponseProto> getSearchMethod;
    if ((getSearchMethod = SecurityGrpc.getSearchMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getSearchMethod = SecurityGrpc.getSearchMethod) == null) {
          SecurityGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.security.QuerySecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.security.QuerySecurityResponseProto> getListIDsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ListIDs",
      requestType = fintekkers.requests.security.QuerySecurityRequestProto.class,
      responseType = fintekkers.requests.security.QuerySecurityResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.security.QuerySecurityResponseProto> getListIDsMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.security.QuerySecurityResponseProto> getListIDsMethod;
    if ((getListIDsMethod = SecurityGrpc.getListIDsMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getListIDsMethod = SecurityGrpc.getListIDsMethod) == null) {
          SecurityGrpc.getListIDsMethod = getListIDsMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.security.QuerySecurityResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ListIDs"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("ListIDs"))
              .build();
        }
      }
    }
    return getListIDsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security.CreateSecurityRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateCreateOrUpdate",
      requestType = fintekkers.requests.security.CreateSecurityRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security.CreateSecurityRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security.CreateSecurityRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateCreateOrUpdateMethod;
    if ((getValidateCreateOrUpdateMethod = SecurityGrpc.getValidateCreateOrUpdateMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getValidateCreateOrUpdateMethod = SecurityGrpc.getValidateCreateOrUpdateMethod) == null) {
          SecurityGrpc.getValidateCreateOrUpdateMethod = getValidateCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security.CreateSecurityRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateCreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.CreateSecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("ValidateCreateOrUpdate"))
              .build();
        }
      }
    }
    return getValidateCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "ValidateQueryRequest",
      requestType = fintekkers.requests.security.QuerySecurityRequestProto.class,
      responseType = fintekkers.requests.util.errors.Summary.SummaryProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto,
      fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto> getValidateQueryRequestMethod;
    if ((getValidateQueryRequestMethod = SecurityGrpc.getValidateQueryRequestMethod) == null) {
      synchronized (SecurityGrpc.class) {
        if ((getValidateQueryRequestMethod = SecurityGrpc.getValidateQueryRequestMethod) == null) {
          SecurityGrpc.getValidateQueryRequestMethod = getValidateQueryRequestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security.QuerySecurityRequestProto, fintekkers.requests.util.errors.Summary.SummaryProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "ValidateQueryRequest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security.QuerySecurityRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.util.errors.Summary.SummaryProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMethodDescriptorSupplier("ValidateQueryRequest"))
              .build();
        }
      }
    }
    return getValidateQueryRequestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static SecurityStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityStub>() {
        @java.lang.Override
        public SecurityStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityStub(channel, callOptions);
        }
      };
    return SecurityStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static SecurityBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityBlockingStub>() {
        @java.lang.Override
        public SecurityBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityBlockingStub(channel, callOptions);
        }
      };
    return SecurityBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static SecurityFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityFutureStub>() {
        @java.lang.Override
        public SecurityFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityFutureStub(channel, callOptions);
        }
      };
    return SecurityFutureStub.newStub(factory, channel);
  }

  /**
   */
  public static abstract class SecurityImplBase implements io.grpc.BindableService {

    /**
     */
    public void createOrUpdate(fintekkers.requests.security.CreateSecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.CreateSecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void getByIDs(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetByIDsMethod(), responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     */
    public void listIDs(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getListIDsMethod(), responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.security.CreateSecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateCreateOrUpdateMethod(), responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getValidateQueryRequestMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.security.CreateSecurityRequestProto,
                fintekkers.requests.security.CreateSecurityResponseProto>(
                  this, METHODID_CREATE_OR_UPDATE)))
          .addMethod(
            getGetByIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.security.QuerySecurityRequestProto,
                fintekkers.requests.security.QuerySecurityResponseProto>(
                  this, METHODID_GET_BY_IDS)))
          .addMethod(
            getSearchMethod(),
            io.grpc.stub.ServerCalls.asyncServerStreamingCall(
              new MethodHandlers<
                fintekkers.requests.security.QuerySecurityRequestProto,
                fintekkers.requests.security.QuerySecurityResponseProto>(
                  this, METHODID_SEARCH)))
          .addMethod(
            getListIDsMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.security.QuerySecurityRequestProto,
                fintekkers.requests.security.QuerySecurityResponseProto>(
                  this, METHODID_LIST_IDS)))
          .addMethod(
            getValidateCreateOrUpdateMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.security.CreateSecurityRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_CREATE_OR_UPDATE)))
          .addMethod(
            getValidateQueryRequestMethod(),
            io.grpc.stub.ServerCalls.asyncUnaryCall(
              new MethodHandlers<
                fintekkers.requests.security.QuerySecurityRequestProto,
                fintekkers.requests.util.errors.Summary.SummaryProto>(
                  this, METHODID_VALIDATE_QUERY_REQUEST)))
          .build();
    }
  }

  /**
   */
  public static final class SecurityStub extends io.grpc.stub.AbstractAsyncStub<SecurityStub> {
    private SecurityStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityStub(channel, callOptions);
    }

    /**
     */
    public void createOrUpdate(fintekkers.requests.security.CreateSecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.CreateSecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getByIDs(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void search(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void listIDs(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateCreateOrUpdate(fintekkers.requests.security.CreateSecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void validateQueryRequest(fintekkers.requests.security.QuerySecurityRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getValidateQueryRequestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class SecurityBlockingStub extends io.grpc.stub.AbstractBlockingStub<SecurityBlockingStub> {
    private SecurityBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityBlockingStub(channel, callOptions);
    }

    /**
     */
    public fintekkers.requests.security.CreateSecurityResponseProto createOrUpdate(fintekkers.requests.security.CreateSecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.security.QuerySecurityResponseProto getByIDs(fintekkers.requests.security.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetByIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public java.util.Iterator<fintekkers.requests.security.QuerySecurityResponseProto> search(
        fintekkers.requests.security.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.security.QuerySecurityResponseProto listIDs(fintekkers.requests.security.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getListIDsMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateCreateOrUpdate(fintekkers.requests.security.CreateSecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     */
    public fintekkers.requests.util.errors.Summary.SummaryProto validateQueryRequest(fintekkers.requests.security.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getValidateQueryRequestMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class SecurityFutureStub extends io.grpc.stub.AbstractFutureStub<SecurityFutureStub> {
    private SecurityFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.security.CreateSecurityResponseProto> createOrUpdate(
        fintekkers.requests.security.CreateSecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.security.QuerySecurityResponseProto> getByIDs(
        fintekkers.requests.security.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetByIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.security.QuerySecurityResponseProto> listIDs(
        fintekkers.requests.security.QuerySecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getListIDsMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateCreateOrUpdate(
        fintekkers.requests.security.CreateSecurityRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getValidateCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.util.errors.Summary.SummaryProto> validateQueryRequest(
        fintekkers.requests.security.QuerySecurityRequestProto request) {
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
    private final SecurityImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(SecurityImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_CREATE_OR_UPDATE:
          serviceImpl.createOrUpdate((fintekkers.requests.security.CreateSecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security.CreateSecurityResponseProto>) responseObserver);
          break;
        case METHODID_GET_BY_IDS:
          serviceImpl.getByIDs((fintekkers.requests.security.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.security.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto>) responseObserver);
          break;
        case METHODID_LIST_IDS:
          serviceImpl.listIDs((fintekkers.requests.security.QuerySecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security.QuerySecurityResponseProto>) responseObserver);
          break;
        case METHODID_VALIDATE_CREATE_OR_UPDATE:
          serviceImpl.validateCreateOrUpdate((fintekkers.requests.security.CreateSecurityRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.util.errors.Summary.SummaryProto>) responseObserver);
          break;
        case METHODID_VALIDATE_QUERY_REQUEST:
          serviceImpl.validateQueryRequest((fintekkers.requests.security.QuerySecurityRequestProto) request,
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

  private static abstract class SecurityBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    SecurityBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.security_service.SecurityService.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("Security");
    }
  }

  private static final class SecurityFileDescriptorSupplier
      extends SecurityBaseDescriptorSupplier {
    SecurityFileDescriptorSupplier() {}
  }

  private static final class SecurityMethodDescriptorSupplier
      extends SecurityBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    SecurityMethodDescriptorSupplier(String methodName) {
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
      synchronized (SecurityGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new SecurityFileDescriptorSupplier())
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
