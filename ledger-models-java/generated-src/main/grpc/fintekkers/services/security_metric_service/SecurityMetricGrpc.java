package fintekkers.services.security_metric_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Dated security metrics (LM-482): figures about a security that are not
 * prices, such as shares outstanding, NAV per share and total net assets.
 * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
 * The rules every RPC follows:
 *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
 *     or an amount in the security's currency.
 *   - Absent is unknown: an observation that does not exist is left out of a
 *     response, never sent as 0.
 *   - A correction for the same (security_id, metric, observation_date) is a
 *     new version with a later as_of. Reads return only the latest as_of
 *     version of each.
 *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
 *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
 *     value or observation_date on write, or a from_date after to_date.
 * </pre>
 */
@io.grpc.stub.annotations.GrpcGenerated
public final class SecurityMetricGrpc {

  private SecurityMetricGrpc() {}

  public static final java.lang.String SERVICE_NAME = "fintekkers.services.security_metric_service.SecurityMetric";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security_metric.CreateSecurityMetricRequestProto,
      fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> getCreateOrUpdateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CreateOrUpdate",
      requestType = fintekkers.requests.security_metric.CreateSecurityMetricRequestProto.class,
      responseType = fintekkers.requests.security_metric.CreateSecurityMetricResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security_metric.CreateSecurityMetricRequestProto,
      fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> getCreateOrUpdateMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security_metric.CreateSecurityMetricRequestProto, fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> getCreateOrUpdateMethod;
    if ((getCreateOrUpdateMethod = SecurityMetricGrpc.getCreateOrUpdateMethod) == null) {
      synchronized (SecurityMetricGrpc.class) {
        if ((getCreateOrUpdateMethod = SecurityMetricGrpc.getCreateOrUpdateMethod) == null) {
          SecurityMetricGrpc.getCreateOrUpdateMethod = getCreateOrUpdateMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security_metric.CreateSecurityMetricRequestProto, fintekkers.requests.security_metric.CreateSecurityMetricResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CreateOrUpdate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security_metric.CreateSecurityMetricRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security_metric.CreateSecurityMetricResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMetricMethodDescriptorSupplier("CreateOrUpdate"))
              .build();
        }
      }
    }
    return getCreateOrUpdateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security_metric.SearchSecurityMetricRequestProto,
      fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> getSearchMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Search",
      requestType = fintekkers.requests.security_metric.SearchSecurityMetricRequestProto.class,
      responseType = fintekkers.requests.security_metric.SearchSecurityMetricResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security_metric.SearchSecurityMetricRequestProto,
      fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> getSearchMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security_metric.SearchSecurityMetricRequestProto, fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> getSearchMethod;
    if ((getSearchMethod = SecurityMetricGrpc.getSearchMethod) == null) {
      synchronized (SecurityMetricGrpc.class) {
        if ((getSearchMethod = SecurityMetricGrpc.getSearchMethod) == null) {
          SecurityMetricGrpc.getSearchMethod = getSearchMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security_metric.SearchSecurityMetricRequestProto, fintekkers.requests.security_metric.SearchSecurityMetricResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Search"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security_metric.SearchSecurityMetricRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security_metric.SearchSecurityMetricResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMetricMethodDescriptorSupplier("Search"))
              .build();
        }
      }
    }
    return getSearchMethod;
  }

  private static volatile io.grpc.MethodDescriptor<fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto,
      fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto> getGetLatestMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetLatest",
      requestType = fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto.class,
      responseType = fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto,
      fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto> getGetLatestMethod() {
    io.grpc.MethodDescriptor<fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto, fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto> getGetLatestMethod;
    if ((getGetLatestMethod = SecurityMetricGrpc.getGetLatestMethod) == null) {
      synchronized (SecurityMetricGrpc.class) {
        if ((getGetLatestMethod = SecurityMetricGrpc.getGetLatestMethod) == null) {
          SecurityMetricGrpc.getGetLatestMethod = getGetLatestMethod =
              io.grpc.MethodDescriptor.<fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto, fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetLatest"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto.getDefaultInstance()))
              .setSchemaDescriptor(new SecurityMetricMethodDescriptorSupplier("GetLatest"))
              .build();
        }
      }
    }
    return getGetLatestMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static SecurityMetricStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityMetricStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityMetricStub>() {
        @java.lang.Override
        public SecurityMetricStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityMetricStub(channel, callOptions);
        }
      };
    return SecurityMetricStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports all types of calls on the service
   */
  public static SecurityMetricBlockingV2Stub newBlockingV2Stub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityMetricBlockingV2Stub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityMetricBlockingV2Stub>() {
        @java.lang.Override
        public SecurityMetricBlockingV2Stub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityMetricBlockingV2Stub(channel, callOptions);
        }
      };
    return SecurityMetricBlockingV2Stub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static SecurityMetricBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityMetricBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityMetricBlockingStub>() {
        @java.lang.Override
        public SecurityMetricBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityMetricBlockingStub(channel, callOptions);
        }
      };
    return SecurityMetricBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static SecurityMetricFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SecurityMetricFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SecurityMetricFutureStub>() {
        @java.lang.Override
        public SecurityMetricFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SecurityMetricFutureStub(channel, callOptions);
        }
      };
    return SecurityMetricFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Dated security metrics (LM-482): figures about a security that are not
   * prices, such as shares outstanding, NAV per share and total net assets.
   * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
   * The rules every RPC follows:
   *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
   *     or an amount in the security's currency.
   *   - Absent is unknown: an observation that does not exist is left out of a
   *     response, never sent as 0.
   *   - A correction for the same (security_id, metric, observation_date) is a
   *     new version with a later as_of. Reads return only the latest as_of
   *     version of each.
   *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
   *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
   *     value or observation_date on write, or a from_date after to_date.
   * </pre>
   */
  public interface AsyncService {

    /**
     * <pre>
     * Store one observation. A write for an existing (security_id, metric,
     * observation_date) is a correction, stored as a new version with a later
     * as_of.
     * </pre>
     */
    default void createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     * <pre>
     * Stream one security's observations with observation_date in
     * [from_date, to_date] (inclusive; an unset bound is unbounded), for the
     * requested metrics (empty means all), ordered by observation_date, then
     * metric.
     * </pre>
     */
    default void search(fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     * <pre>
     * Latest on or before: for each (security_id, metric), the observation
     * with the latest observation_date on or before date. At most one per
     * pair; a pair with none is absent. An empty security_id list gives an
     * empty response, not an error.
     * </pre>
     */
    default void getLatest(fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetLatestMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service SecurityMetric.
   * <pre>
   * Dated security metrics (LM-482): figures about a security that are not
   * prices, such as shares outstanding, NAV per share and total net assets.
   * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
   * The rules every RPC follows:
   *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
   *     or an amount in the security's currency.
   *   - Absent is unknown: an observation that does not exist is left out of a
   *     response, never sent as 0.
   *   - A correction for the same (security_id, metric, observation_date) is a
   *     new version with a later as_of. Reads return only the latest as_of
   *     version of each.
   *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
   *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
   *     value or observation_date on write, or a from_date after to_date.
   * </pre>
   */
  public static abstract class SecurityMetricImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return SecurityMetricGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service SecurityMetric.
   * <pre>
   * Dated security metrics (LM-482): figures about a security that are not
   * prices, such as shares outstanding, NAV per share and total net assets.
   * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
   * The rules every RPC follows:
   *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
   *     or an amount in the security's currency.
   *   - Absent is unknown: an observation that does not exist is left out of a
   *     response, never sent as 0.
   *   - A correction for the same (security_id, metric, observation_date) is a
   *     new version with a later as_of. Reads return only the latest as_of
   *     version of each.
   *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
   *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
   *     value or observation_date on write, or a from_date after to_date.
   * </pre>
   */
  public static final class SecurityMetricStub
      extends io.grpc.stub.AbstractAsyncStub<SecurityMetricStub> {
    private SecurityMetricStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityMetricStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityMetricStub(channel, callOptions);
    }

    /**
     * <pre>
     * Store one observation. A write for an existing (security_id, metric,
     * observation_date) is a correction, stored as a new version with a later
     * as_of.
     * </pre>
     */
    public void createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Stream one security's observations with observation_date in
     * [from_date, to_date] (inclusive; an unset bound is unbounded), for the
     * requested metrics (empty means all), ordered by observation_date, then
     * metric.
     * </pre>
     */
    public void search(fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Latest on or before: for each (security_id, metric), the observation
     * with the latest observation_date on or before date. At most one per
     * pair; a pair with none is absent. An empty security_id list gives an
     * empty response, not an error.
     * </pre>
     */
    public void getLatest(fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetLatestMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service SecurityMetric.
   * <pre>
   * Dated security metrics (LM-482): figures about a security that are not
   * prices, such as shares outstanding, NAV per share and total net assets.
   * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
   * The rules every RPC follows:
   *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
   *     or an amount in the security's currency.
   *   - Absent is unknown: an observation that does not exist is left out of a
   *     response, never sent as 0.
   *   - A correction for the same (security_id, metric, observation_date) is a
   *     new version with a later as_of. Reads return only the latest as_of
   *     version of each.
   *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
   *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
   *     value or observation_date on write, or a from_date after to_date.
   * </pre>
   */
  public static final class SecurityMetricBlockingV2Stub
      extends io.grpc.stub.AbstractBlockingStub<SecurityMetricBlockingV2Stub> {
    private SecurityMetricBlockingV2Stub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityMetricBlockingV2Stub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityMetricBlockingV2Stub(channel, callOptions);
    }

    /**
     * <pre>
     * Store one observation. A write for an existing (security_id, metric,
     * observation_date) is a correction, stored as a new version with a later
     * as_of.
     * </pre>
     */
    public fintekkers.requests.security_metric.CreateSecurityMetricResponseProto createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Stream one security's observations with observation_date in
     * [from_date, to_date] (inclusive; an unset bound is unbounded), for the
     * requested metrics (empty means all), ordered by observation_date, then
     * metric.
     * </pre>
     */
    @io.grpc.ExperimentalApi("https://github.com/grpc/grpc-java/issues/10918")
    public io.grpc.stub.BlockingClientCall<?, fintekkers.requests.security_metric.SearchSecurityMetricResponseProto>
        search(fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingV2ServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Latest on or before: for each (security_id, metric), the observation
     * with the latest observation_date on or before date. At most one per
     * pair; a pair with none is absent. An empty security_id list gives an
     * empty response, not an error.
     * </pre>
     */
    public fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto getLatest(fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getGetLatestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do limited synchronous rpc calls to service SecurityMetric.
   * <pre>
   * Dated security metrics (LM-482): figures about a security that are not
   * prices, such as shares outstanding, NAV per share and total net assets.
   * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
   * The rules every RPC follows:
   *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
   *     or an amount in the security's currency.
   *   - Absent is unknown: an observation that does not exist is left out of a
   *     response, never sent as 0.
   *   - A correction for the same (security_id, metric, observation_date) is a
   *     new version with a later as_of. Reads return only the latest as_of
   *     version of each.
   *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
   *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
   *     value or observation_date on write, or a from_date after to_date.
   * </pre>
   */
  public static final class SecurityMetricBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<SecurityMetricBlockingStub> {
    private SecurityMetricBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityMetricBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityMetricBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Store one observation. A write for an existing (security_id, metric,
     * observation_date) is a correction, stored as a new version with a later
     * as_of.
     * </pre>
     */
    public fintekkers.requests.security_metric.CreateSecurityMetricResponseProto createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Stream one security's observations with observation_date in
     * [from_date, to_date] (inclusive; an unset bound is unbounded), for the
     * requested metrics (empty means all), ordered by observation_date, then
     * metric.
     * </pre>
     */
    public java.util.Iterator<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> search(
        fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Latest on or before: for each (security_id, metric), the observation
     * with the latest observation_date on or before date. At most one per
     * pair; a pair with none is absent. An empty security_id list gives an
     * empty response, not an error.
     * </pre>
     */
    public fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto getLatest(fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetLatestMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service SecurityMetric.
   * <pre>
   * Dated security metrics (LM-482): figures about a security that are not
   * prices, such as shares outstanding, NAV per share and total net assets.
   * Hosted in price-service-rust (PSR-53). See docs/adr/security_metric.md.
   * The rules every RPC follows:
   *   - Units are per metric, on SecurityMetricTypeProto: a whole share count,
   *     or an amount in the security's currency.
   *   - Absent is unknown: an observation that does not exist is left out of a
   *     response, never sent as 0.
   *   - A correction for the same (security_id, metric, observation_date) is a
   *     new version with a later as_of. Reads return only the latest as_of
   *     version of each.
   *   - INVALID_ARGUMENT for an unset security_id (Search, CreateOrUpdate), an
   *     unset date (GetLatest), a metric of UNKNOWN_SECURITY_METRIC, an unset
   *     value or observation_date on write, or a from_date after to_date.
   * </pre>
   */
  public static final class SecurityMetricFutureStub
      extends io.grpc.stub.AbstractFutureStub<SecurityMetricFutureStub> {
    private SecurityMetricFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SecurityMetricFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SecurityMetricFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Store one observation. A write for an existing (security_id, metric,
     * observation_date) is a correction, stored as a new version with a later
     * as_of.
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> createOrUpdate(
        fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Latest on or before: for each (security_id, metric), the observation
     * with the latest observation_date on or before date. At most one per
     * pair; a pair with none is absent. An empty security_id list gives an
     * empty response, not an error.
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto> getLatest(
        fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetLatestMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_CREATE_OR_UPDATE = 0;
  private static final int METHODID_SEARCH = 1;
  private static final int METHODID_GET_LATEST = 2;

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
          serviceImpl.createOrUpdate((fintekkers.requests.security_metric.CreateSecurityMetricRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto>) responseObserver);
          break;
        case METHODID_SEARCH:
          serviceImpl.search((fintekkers.requests.security_metric.SearchSecurityMetricRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto>) responseObserver);
          break;
        case METHODID_GET_LATEST:
          serviceImpl.getLatest((fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto) request,
              (io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto>) responseObserver);
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
              fintekkers.requests.security_metric.CreateSecurityMetricRequestProto,
              fintekkers.requests.security_metric.CreateSecurityMetricResponseProto>(
                service, METHODID_CREATE_OR_UPDATE)))
        .addMethod(
          getSearchMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              fintekkers.requests.security_metric.SearchSecurityMetricRequestProto,
              fintekkers.requests.security_metric.SearchSecurityMetricResponseProto>(
                service, METHODID_SEARCH)))
        .addMethod(
          getGetLatestMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              fintekkers.requests.security_metric.GetLatestSecurityMetricRequestProto,
              fintekkers.requests.security_metric.GetLatestSecurityMetricResponseProto>(
                service, METHODID_GET_LATEST)))
        .build();
  }

  private static abstract class SecurityMetricBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    SecurityMetricBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return fintekkers.services.security_metric_service.SecurityMetricServiceProtos.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("SecurityMetric");
    }
  }

  private static final class SecurityMetricFileDescriptorSupplier
      extends SecurityMetricBaseDescriptorSupplier {
    SecurityMetricFileDescriptorSupplier() {}
  }

  private static final class SecurityMetricMethodDescriptorSupplier
      extends SecurityMetricBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    SecurityMetricMethodDescriptorSupplier(java.lang.String methodName) {
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
      synchronized (SecurityMetricGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new SecurityMetricFileDescriptorSupplier())
              .addMethod(getCreateOrUpdateMethod())
              .addMethod(getSearchMethod())
              .addMethod(getGetLatestMethod())
              .build();
        }
      }
    }
    return result;
  }
}
