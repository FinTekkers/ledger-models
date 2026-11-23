package fintekkers.services.security_metric_service;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Per-security metric series such as shares outstanding, NAV per share and
 * total net assets (LM-484). See SecurityMetricSeriesProto and
 * docs/adr/security_metric_series.md.
 * Absent means unknown, never 0, in every RPC: a missing point is never
 * filled with 0 or with another date's value.
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
   * Per-security metric series such as shares outstanding, NAV per share and
   * total net assets (LM-484). See SecurityMetricSeriesProto and
   * docs/adr/security_metric_series.md.
   * Absent means unknown, never 0, in every RPC: a missing point is never
   * filled with 0 or with another date's value.
   * </pre>
   */
  public interface AsyncService {

    /**
     * <pre>
     * Store the points of one series. One series per request.
     * The server ignores the request's series.as_of and stamps its own receive
     * time as the knowledge time of the write. Each point is an upsert keyed by
     * (security_id, metric, observation_date):
     *   - a new date is inserted;
     *   - a correction (a different value for a date already stored) closes
     *     the old stored row by setting its valid_to to the new as_of, then
     *     stores the new value from that as_of. A query at an earlier as_of
     *     still returns the old value;
     *   - the same value again is a no-op;
     *   - dates not in the request are untouched. There is no delete here.
     * The response is the header only (security_id, metric and the stamped
     * as_of) with zero points; the points are not echoed.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; metric UNKNOWN_SECURITY_METRIC; zero
     *     points; a point with no observation_date or no value; two points
     *     with the same observation_date; a SHARES_OUTSTANDING value with a
     *     fractional part.
     *   NOT_FOUND: the security does not exist, where the server checks.
     * </pre>
     */
    default void createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCreateOrUpdateMethod(), responseObserver);
    }

    /**
     * <pre>
     * Every point of the requested metrics of one security with an
     * observation_date in [start_date, end_date], as known at as_of (the
     * request's, else the server's now).
     * Stream rules:
     *   - one series per (security, metric), metrics in request order (a
     *     repeated metric once, at its first position);
     *   - a long series is split into chunks: consecutive messages that each
     *     repeat the same security_id, metric and as_of. Points ascend by
     *     observation_date within and across chunks, with no date in two
     *     chunks. The client appends the chunks' points to get the series.
     *     Chunk size is the server's choice;
     *   - every chunk has at least one point, except that a metric with no
     *     points in the range yields exactly one message with zero points
     *     (unknown, never 0);
     *   - as_of on every message is the knowledge time used.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; start_date after end_date.
     * </pre>
     */
    default void search(fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSearchMethod(), responseObserver);
    }

    /**
     * <pre>
     * The latest point on or before the request's date for each distinct
     * (security_id, metric) pair, as known at as_of (the request's, else the
     * server's now).
     * One series per pair, securities in request order then metrics in request
     * order. Each series holds at most one point: the one with the latest
     * observation_date on or before the date. A pair with no such point holds
     * zero points, meaning unknown, never 0. A point is never carried forward
     * past a later correction: the value is the one known at as_of.
     * Errors:
     *   INVALID_ARGUMENT: empty security_ids; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; no date.
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
   * Per-security metric series such as shares outstanding, NAV per share and
   * total net assets (LM-484). See SecurityMetricSeriesProto and
   * docs/adr/security_metric_series.md.
   * Absent means unknown, never 0, in every RPC: a missing point is never
   * filled with 0 or with another date's value.
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
   * Per-security metric series such as shares outstanding, NAV per share and
   * total net assets (LM-484). See SecurityMetricSeriesProto and
   * docs/adr/security_metric_series.md.
   * Absent means unknown, never 0, in every RPC: a missing point is never
   * filled with 0 or with another date's value.
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
     * Store the points of one series. One series per request.
     * The server ignores the request's series.as_of and stamps its own receive
     * time as the knowledge time of the write. Each point is an upsert keyed by
     * (security_id, metric, observation_date):
     *   - a new date is inserted;
     *   - a correction (a different value for a date already stored) closes
     *     the old stored row by setting its valid_to to the new as_of, then
     *     stores the new value from that as_of. A query at an earlier as_of
     *     still returns the old value;
     *   - the same value again is a no-op;
     *   - dates not in the request are untouched. There is no delete here.
     * The response is the header only (security_id, metric and the stamped
     * as_of) with zero points; the points are not echoed.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; metric UNKNOWN_SECURITY_METRIC; zero
     *     points; a point with no observation_date or no value; two points
     *     with the same observation_date; a SHARES_OUTSTANDING value with a
     *     fractional part.
     *   NOT_FOUND: the security does not exist, where the server checks.
     * </pre>
     */
    public void createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Every point of the requested metrics of one security with an
     * observation_date in [start_date, end_date], as known at as_of (the
     * request's, else the server's now).
     * Stream rules:
     *   - one series per (security, metric), metrics in request order (a
     *     repeated metric once, at its first position);
     *   - a long series is split into chunks: consecutive messages that each
     *     repeat the same security_id, metric and as_of. Points ascend by
     *     observation_date within and across chunks, with no date in two
     *     chunks. The client appends the chunks' points to get the series.
     *     Chunk size is the server's choice;
     *   - every chunk has at least one point, except that a metric with no
     *     points in the range yields exactly one message with zero points
     *     (unknown, never 0);
     *   - as_of on every message is the knowledge time used.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; start_date after end_date.
     * </pre>
     */
    public void search(fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request,
        io.grpc.stub.StreamObserver<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getSearchMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * The latest point on or before the request's date for each distinct
     * (security_id, metric) pair, as known at as_of (the request's, else the
     * server's now).
     * One series per pair, securities in request order then metrics in request
     * order. Each series holds at most one point: the one with the latest
     * observation_date on or before the date. A pair with no such point holds
     * zero points, meaning unknown, never 0. A point is never carried forward
     * past a later correction: the value is the one known at as_of.
     * Errors:
     *   INVALID_ARGUMENT: empty security_ids; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; no date.
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
   * Per-security metric series such as shares outstanding, NAV per share and
   * total net assets (LM-484). See SecurityMetricSeriesProto and
   * docs/adr/security_metric_series.md.
   * Absent means unknown, never 0, in every RPC: a missing point is never
   * filled with 0 or with another date's value.
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
     * Store the points of one series. One series per request.
     * The server ignores the request's series.as_of and stamps its own receive
     * time as the knowledge time of the write. Each point is an upsert keyed by
     * (security_id, metric, observation_date):
     *   - a new date is inserted;
     *   - a correction (a different value for a date already stored) closes
     *     the old stored row by setting its valid_to to the new as_of, then
     *     stores the new value from that as_of. A query at an earlier as_of
     *     still returns the old value;
     *   - the same value again is a no-op;
     *   - dates not in the request are untouched. There is no delete here.
     * The response is the header only (security_id, metric and the stamped
     * as_of) with zero points; the points are not echoed.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; metric UNKNOWN_SECURITY_METRIC; zero
     *     points; a point with no observation_date or no value; two points
     *     with the same observation_date; a SHARES_OUTSTANDING value with a
     *     fractional part.
     *   NOT_FOUND: the security does not exist, where the server checks.
     * </pre>
     */
    public fintekkers.requests.security_metric.CreateSecurityMetricResponseProto createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request) throws io.grpc.StatusException {
      return io.grpc.stub.ClientCalls.blockingV2UnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Every point of the requested metrics of one security with an
     * observation_date in [start_date, end_date], as known at as_of (the
     * request's, else the server's now).
     * Stream rules:
     *   - one series per (security, metric), metrics in request order (a
     *     repeated metric once, at its first position);
     *   - a long series is split into chunks: consecutive messages that each
     *     repeat the same security_id, metric and as_of. Points ascend by
     *     observation_date within and across chunks, with no date in two
     *     chunks. The client appends the chunks' points to get the series.
     *     Chunk size is the server's choice;
     *   - every chunk has at least one point, except that a metric with no
     *     points in the range yields exactly one message with zero points
     *     (unknown, never 0);
     *   - as_of on every message is the knowledge time used.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; start_date after end_date.
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
     * The latest point on or before the request's date for each distinct
     * (security_id, metric) pair, as known at as_of (the request's, else the
     * server's now).
     * One series per pair, securities in request order then metrics in request
     * order. Each series holds at most one point: the one with the latest
     * observation_date on or before the date. A pair with no such point holds
     * zero points, meaning unknown, never 0. A point is never carried forward
     * past a later correction: the value is the one known at as_of.
     * Errors:
     *   INVALID_ARGUMENT: empty security_ids; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; no date.
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
   * Per-security metric series such as shares outstanding, NAV per share and
   * total net assets (LM-484). See SecurityMetricSeriesProto and
   * docs/adr/security_metric_series.md.
   * Absent means unknown, never 0, in every RPC: a missing point is never
   * filled with 0 or with another date's value.
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
     * Store the points of one series. One series per request.
     * The server ignores the request's series.as_of and stamps its own receive
     * time as the knowledge time of the write. Each point is an upsert keyed by
     * (security_id, metric, observation_date):
     *   - a new date is inserted;
     *   - a correction (a different value for a date already stored) closes
     *     the old stored row by setting its valid_to to the new as_of, then
     *     stores the new value from that as_of. A query at an earlier as_of
     *     still returns the old value;
     *   - the same value again is a no-op;
     *   - dates not in the request are untouched. There is no delete here.
     * The response is the header only (security_id, metric and the stamped
     * as_of) with zero points; the points are not echoed.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; metric UNKNOWN_SECURITY_METRIC; zero
     *     points; a point with no observation_date or no value; two points
     *     with the same observation_date; a SHARES_OUTSTANDING value with a
     *     fractional part.
     *   NOT_FOUND: the security does not exist, where the server checks.
     * </pre>
     */
    public fintekkers.requests.security_metric.CreateSecurityMetricResponseProto createOrUpdate(fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCreateOrUpdateMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Every point of the requested metrics of one security with an
     * observation_date in [start_date, end_date], as known at as_of (the
     * request's, else the server's now).
     * Stream rules:
     *   - one series per (security, metric), metrics in request order (a
     *     repeated metric once, at its first position);
     *   - a long series is split into chunks: consecutive messages that each
     *     repeat the same security_id, metric and as_of. Points ascend by
     *     observation_date within and across chunks, with no date in two
     *     chunks. The client appends the chunks' points to get the series.
     *     Chunk size is the server's choice;
     *   - every chunk has at least one point, except that a metric with no
     *     points in the range yields exactly one message with zero points
     *     (unknown, never 0);
     *   - as_of on every message is the knowledge time used.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; start_date after end_date.
     * </pre>
     */
    public java.util.Iterator<fintekkers.requests.security_metric.SearchSecurityMetricResponseProto> search(
        fintekkers.requests.security_metric.SearchSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getSearchMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * The latest point on or before the request's date for each distinct
     * (security_id, metric) pair, as known at as_of (the request's, else the
     * server's now).
     * One series per pair, securities in request order then metrics in request
     * order. Each series holds at most one point: the one with the latest
     * observation_date on or before the date. A pair with no such point holds
     * zero points, meaning unknown, never 0. A point is never carried forward
     * past a later correction: the value is the one known at as_of.
     * Errors:
     *   INVALID_ARGUMENT: empty security_ids; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; no date.
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
   * Per-security metric series such as shares outstanding, NAV per share and
   * total net assets (LM-484). See SecurityMetricSeriesProto and
   * docs/adr/security_metric_series.md.
   * Absent means unknown, never 0, in every RPC: a missing point is never
   * filled with 0 or with another date's value.
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
     * Store the points of one series. One series per request.
     * The server ignores the request's series.as_of and stamps its own receive
     * time as the knowledge time of the write. Each point is an upsert keyed by
     * (security_id, metric, observation_date):
     *   - a new date is inserted;
     *   - a correction (a different value for a date already stored) closes
     *     the old stored row by setting its valid_to to the new as_of, then
     *     stores the new value from that as_of. A query at an earlier as_of
     *     still returns the old value;
     *   - the same value again is a no-op;
     *   - dates not in the request are untouched. There is no delete here.
     * The response is the header only (security_id, metric and the stamped
     * as_of) with zero points; the points are not echoed.
     * Errors:
     *   INVALID_ARGUMENT: no security_id; metric UNKNOWN_SECURITY_METRIC; zero
     *     points; a point with no observation_date or no value; two points
     *     with the same observation_date; a SHARES_OUTSTANDING value with a
     *     fractional part.
     *   NOT_FOUND: the security does not exist, where the server checks.
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<fintekkers.requests.security_metric.CreateSecurityMetricResponseProto> createOrUpdate(
        fintekkers.requests.security_metric.CreateSecurityMetricRequestProto request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCreateOrUpdateMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * The latest point on or before the request's date for each distinct
     * (security_id, metric) pair, as known at as_of (the request's, else the
     * server's now).
     * One series per pair, securities in request order then metrics in request
     * order. Each series holds at most one point: the one with the latest
     * observation_date on or before the date. A pair with no such point holds
     * zero points, meaning unknown, never 0. A point is never carried forward
     * past a later correction: the value is the one known at as_of.
     * Errors:
     *   INVALID_ARGUMENT: empty security_ids; empty metrics; a metric
     *     UNKNOWN_SECURITY_METRIC; no date.
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
