package fintekkers.services;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Runs only in the {@code badEnvTest} Gradle task, whose JVM has
 * {@code BROKER_HOST=127.0.0.1:notaport}. The bad value must not block
 * explicit constructors, and every {@code getInstance()} call, not just the
 * first, must name the variable.
 */
@Tag("bad-env")
class BadEnvDefaultsTest {

    @Test
    void explicitConstructorsKeepTheCallersHostAndPort() {
        Endpoint explicit = new Endpoint("h", 1, true);
        assertEquals(explicit, new SecurityService("h", 1, true).getEndpoint());
        assertEquals(explicit, new TransactionService("h", 1, true).getEndpoint());
        assertEquals(explicit, new PortfolioService("h", 1, true).getEndpoint());
        assertEquals(explicit, new ValuationService("h", 1, true).getEndpoint());
    }

    @Test
    void securityServiceDefaultNamesTheVariableOnEveryCall() {
        assertNamesBrokerHostTwice(SecurityService::getInstance);
    }

    @Test
    void transactionServiceDefaultNamesTheVariableOnEveryCall() {
        assertNamesBrokerHostTwice(TransactionService::getInstance);
    }

    @Test
    void portfolioServiceDefaultNamesTheVariableOnEveryCall() {
        assertNamesBrokerHostTwice(PortfolioService::getInstance);
    }

    @Test
    void valuationServiceDefaultNamesTheVariableOnEveryCall() {
        assertNamesBrokerHostTwice(ValuationService::getInstance);
    }

    private static void assertNamesBrokerHostTwice(Executable getInstance) {
        for (int call = 1; call <= 2; call++) {
            IllegalArgumentException e = assertThrows(IllegalArgumentException.class, getInstance,
                    "call " + call);
            assertTrue(e.getMessage().contains("BROKER_HOST"), "call " + call + ": " + e.getMessage());
        }
    }
}
