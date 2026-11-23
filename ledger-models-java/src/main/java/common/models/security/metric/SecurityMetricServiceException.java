package common.models.security.metric;

/**
 * The SecurityMetric service failed or answered with something unusable
 * (LM-485). Messages from the gRPC client name the service address
 * ({@code host:port}) and the gRPC status code.
 */
public class SecurityMetricServiceException extends RuntimeException {

    /** gRPC status code name, e.g. {@code NOT_FOUND}; {@code null} when the failure was not a gRPC status. */
    private final String statusCode;

    public SecurityMetricServiceException(String message) {
        this(message, null, null);
    }

    public SecurityMetricServiceException(String message, String statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public String getStatusCode() {
        return statusCode;
    }

    /** The service could not be reached (gRPC UNAVAILABLE). The message names {@code host:port}. */
    public static class ServiceUnavailable extends SecurityMetricServiceException {
        public ServiceUnavailable(String message, Throwable cause) {
            super(message, "UNAVAILABLE", cause);
        }
    }
}
