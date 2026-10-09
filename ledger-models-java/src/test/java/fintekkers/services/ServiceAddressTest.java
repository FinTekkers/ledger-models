package fintekkers.services;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Lookup order (LM-278), checked against the cases every language shares in
 * {@code test-fixtures/service-address-cases.json}. Env is injected, so these
 * run in the normal test JVM whatever its environment holds.
 */
class ServiceAddressTest {

    private static final Path FIXTURE = Path.of("..", "test-fixtures", "service-address-cases.json");

    private static JsonObject fixture() throws IOException {
        return JsonParser.parseString(Files.readString(FIXTURE)).getAsJsonObject();
    }

    static Stream<Arguments> cases() throws IOException {
        List<Arguments> out = new ArrayList<>();
        for (JsonElement el : fixture().getAsJsonArray("cases")) {
            JsonObject c = el.getAsJsonObject();
            Map<String, String> env = new HashMap<>();
            for (Map.Entry<String, JsonElement> e : c.getAsJsonObject("env").entrySet()) {
                env.put(e.getKey(), e.getValue().getAsString());
            }
            for (JsonElement s : c.getAsJsonArray("services")) {
                out.add(Arguments.of(c.get("name").getAsString() + " [" + s.getAsString() + "]",
                        ServiceAddress.Service.valueOf(s.getAsString()), env, c));
            }
        }
        return out.stream();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("cases")
    void resolvesAsTheSharedFixtureSays(String name, ServiceAddress.Service service,
                                        Map<String, String> env, JsonObject c) {
        if (c.has("error")) {
            String variable = c.get("error").getAsString();
            IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                    () -> ServiceAddress.resolve(service, env::get));
            assertTrue(e.getMessage().contains(variable), e.getMessage());
            return;
        }
        JsonObject expected = c.getAsJsonObject("expected");
        assertEquals(new Endpoint(expected.get("host").getAsString(),
                        expected.get("port").getAsInt(),
                        expected.get("plaintext").getAsBoolean()),
                ServiceAddress.resolve(service, env::get));
    }

    @Test
    void fixtureCoversEveryStep() throws IOException {
        JsonArray cases = fixture().getAsJsonArray("cases");
        Set<String> steps = new HashSet<>();
        cases.forEach(c -> steps.add(c.getAsJsonObject().get("step").getAsString()));
        assertEquals(Set.of("a", "b", "c", "d"), steps);
    }

    @Test
    void standardPorts() {
        assertEquals(8085, ServiceAddress.BROKER_PORT);
        assertEquals(8082, ServiceAddress.LEDGER_PORT);
        assertEquals(8080, ServiceAddress.VALUATION_PORT);
        assertEquals(8083, ServiceAddress.PRICE_PORT);
    }

    @Test
    void standardPortsMatchTheSharedFixture() throws IOException {
        JsonObject ports = fixture().getAsJsonObject("standard_ports");
        assertEquals(ports.get("BROKER").getAsInt(), ServiceAddress.BROKER_PORT);
        assertEquals(ports.get("LEDGER").getAsInt(), ServiceAddress.LEDGER_PORT);
        assertEquals(ports.get("VALUATION").getAsInt(), ServiceAddress.VALUATION_PORT);
        assertEquals(ports.get("PRICE").getAsInt(), ServiceAddress.PRICE_PORT);
    }

    @Test
    void everyClientTargetsTheBrokerWhenOnlyBrokerHostIsSet() {
        Map<String, String> env = Map.of("BROKER_HOST", "127.0.0.1:8085");
        Endpoint broker = new Endpoint("127.0.0.1", 8085, true);
        assertEquals(broker, SecurityService.fromEnv(env::get).getEndpoint());
        assertEquals(broker, TransactionService.fromEnv(env::get).getEndpoint());
        assertEquals(broker, PortfolioService.fromEnv(env::get).getEndpoint());
        assertEquals(broker, ValuationService.fromEnv(env::get).getEndpoint());
    }

    @Test
    void explicitConstructorKeepsTheCallersHostAndPort() {
        assertEquals(new Endpoint("h", 1, true), new SecurityService("h", 1, true).getEndpoint());
    }
}
