package fintekkers.services;

import java.util.function.Function;

/**
 * Finds the address of a FinTekkers service from the environment. Every
 * default client ({@link SecurityService}, {@link TransactionService},
 * {@link PortfolioService}, {@link ValuationService}) resolves through here,
 * in this order:
 *
 * <ol>
 *   <li>{@code BROKER_HOST} ({@code host[:port]}, port defaults to
 *       {@link #BROKER_PORT}): all calls go through the broker.</li>
 *   <li>Only if that is unset, {@code <SERVICE>_SERVICE_HOST} with
 *       {@code <SERVICE>_SERVICE_PORT} (or the service's standard port).
 *       {@code _PORT} without {@code _HOST} is ignored.</li>
 *   <li>{@code API_URL}, with the service's standard port unless it carries
 *       one.</li>
 *   <li>{@code localhost} on the service's standard port.</li>
 * </ol>
 *
 * <p>An empty value counts as unset. A leading {@code http://} or
 * {@code https://} is ignored. Loopback hosts ({@code localhost},
 * {@code 127.0.0.1}) are plaintext; any other host uses TLS. A port that is
 * not a number throws {@link IllegalArgumentException} naming the variable.
 *
 * <p>The same cases are checked in every language against
 * {@code test-fixtures/service-address-cases.json}.
 */
public final class ServiceAddress {

    public static final int BROKER_PORT = 8085;
    public static final int LEDGER_PORT = 8082;
    public static final int VALUATION_PORT = 8080;
    public static final int PRICE_PORT = 8083;

    public enum Service {
        BROKER("BROKER", BROKER_PORT),
        SECURITY("LEDGER", LEDGER_PORT),
        TRANSACTION("LEDGER", LEDGER_PORT),
        PORTFOLIO("LEDGER", LEDGER_PORT),
        VALUATION("VALUATION", VALUATION_PORT),
        PRICE("PRICE", PRICE_PORT);

        private final String envPrefix;
        private final int standardPort;

        Service(String envPrefix, int standardPort) {
            this.envPrefix = envPrefix;
            this.standardPort = standardPort;
        }

        /** Prefix of this service's {@code <SERVICE>_SERVICE_HOST/_PORT} variables. */
        public String envPrefix() {
            return envPrefix;
        }

        public int standardPort() {
            return standardPort;
        }
    }

    private ServiceAddress() {
    }

    public static Endpoint resolve(Service service) {
        return resolve(service, System::getenv);
    }

    /** Resolves {@code service} against {@code env}, a variable-name lookup returning null when unset. */
    public static Endpoint resolve(Service service, Function<String, String> env) {
        String broker = read(env, "BROKER_HOST");
        if (broker != null) {
            return parse(broker, "BROKER_HOST", BROKER_PORT);
        }

        String hostVar = service.envPrefix() + "_SERVICE_HOST";
        String host = read(env, hostVar);
        if (host != null) {
            String portVar = service.envPrefix() + "_SERVICE_PORT";
            String port = read(env, portVar);
            Endpoint endpoint = parse(host, hostVar, service.standardPort());
            return port == null
                    ? endpoint
                    : endpoint(endpoint.url(), parsePort(port, portVar));
        }

        String apiUrl = read(env, "API_URL");
        if (apiUrl != null) {
            return parse(apiUrl, "API_URL", service.standardPort());
        }

        return endpoint("localhost", service.standardPort());
    }

    private static String read(Function<String, String> env, String name) {
        String value = env.apply(name);
        if (value == null) return null;
        value = value.trim();
        return value.isEmpty() ? null : value;
    }

    private static Endpoint parse(String value, String variable, int defaultPort) {
        String address = value;
        int scheme = address.indexOf("://");
        if (scheme >= 0) address = address.substring(scheme + 3);
        while (address.endsWith("/")) address = address.substring(0, address.length() - 1);

        String host = address;
        int port = defaultPort;
        int colon = address.lastIndexOf(':');
        if (colon >= 0) {
            host = address.substring(0, colon);
            port = parsePort(address.substring(colon + 1), variable);
        }
        if (host.isEmpty()) {
            throw new IllegalArgumentException(variable + " has no host: '" + value + "'");
        }
        return endpoint(host, port);
    }

    private static int parsePort(String value, String variable) {
        int port;
        try {
            port = Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw invalidPort(value, variable);
        }
        if (port < 1 || port > 65535) throw invalidPort(value, variable);
        return port;
    }

    private static IllegalArgumentException invalidPort(String value, String variable) {
        return new IllegalArgumentException(variable + " has an invalid port: '" + value + "'");
    }

    private static Endpoint endpoint(String host, int port) {
        boolean plaintext = "localhost".equals(host) || "127.0.0.1".equals(host);
        return new Endpoint(host, port, plaintext);
    }
}
