package fintekkers.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Runs only in the {@code brokerEnvTest} Gradle task, whose JVM has
 * {@code BROKER_HOST=127.0.0.1:18085} and nothing else set by the build.
 * Every default client must target the broker.
 */
@Tag("broker-env")
class BrokerEnvDefaultsTest {

    private static final Endpoint BROKER = new Endpoint("127.0.0.1", 18085, true);

    @Test
    void securityServiceDefaultTargetsTheBroker() {
        assertEquals(BROKER, SecurityService.getInstance().getEndpoint());
    }

    @Test
    void transactionServiceDefaultTargetsTheBroker() {
        assertEquals(BROKER, TransactionService.getInstance().getEndpoint());
    }

    @Test
    void portfolioServiceDefaultTargetsTheBroker() {
        assertEquals(BROKER, PortfolioService.getInstance().getEndpoint());
    }

    @Test
    void valuationServiceDefaultTargetsTheBroker() {
        assertEquals(BROKER, ValuationService.getInstance().getEndpoint());
    }
}
