package fintekkers.services;

import common.models.security.Security;
import common.models.security.metric.MetricResult;
import common.models.security.metric.MetricSeries;
import fintekkers.models.security.SecurityMetricTypeProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-485: the security metrics example in {@code ledger-models-java/README.md}
 * runs against {@link FakeSecurityMetricServer}, and the README shows exactly
 * the code between the README markers below.
 */
class SecurityMetricReadmeTest {

    private static final Path THIS_FILE = Path.of("src", "test", "java", "fintekkers", "services",
            "SecurityMetricReadmeTest.java");
    private static final Path README = Path.of("README.md");
    private static final String HEADING = "## Security metrics (LM-485)";

    private FakeSecurityMetricServer fake;

    @BeforeEach
    void setUp() throws IOException {
        fake = new FakeSecurityMetricServer();
        SecurityMetricService.setInstanceForTests(SecurityMetricService.fromEnv(
                Map.of("PRICE_SERVICE_HOST", "127.0.0.1", "PRICE_SERVICE_PORT", String.valueOf(fake.port()))::get));
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        SecurityMetricService.resetForTests();
        fake.close();
    }

    @Test
    void readmeExampleRuns() {
        UUID spyId = FakeSecurityMetricServer.SPY;
        UUID qqqId = UUID.randomUUID();
        fake.seed(qqqId, SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2026, 11, 18), "566950000");
        Security security = new Security(Security.linkOfLatest(spyId));

        // README:start
        // Any Security whose proto carries a UUID works: a link is enough, nothing is hydrated.
        MetricResult shares = security.getMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2026, 11, 23));
        if (shares != null) { // null means no value: never 0
            System.out.println(shares.value() + " on " + shares.date() + ", " + shares.ageDays() + " days old");
        }
        MetricResult nav = security.navPerShare(); // latest on or before today, or null

        SecurityMetricService metrics = SecurityMetricService.getInstance();
        Map<UUID, MetricResult> batch = metrics.get(SecurityMetricTypeProto.SHARES_OUTSTANDING,
                List.of(spyId, qqqId), LocalDate.of(2026, 11, 23)); // one call; every UUID is a key

        MetricSeries history = security.sharesOutstandingHistory(LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 23));
        for (MetricSeries.MetricPoint point : history.points()) {
            System.out.println(point.date() + " " + point.value());
        }

        ZonedDateTime storedAsOf = metrics.record(SecurityMetricTypeProto.SHARES_OUTSTANDING, spyId,
                Map.of(LocalDate.of(2026, 11, 23), new BigDecimal("15220000000")));
        // README:end

        assertEquals(new BigDecimal("15210000000"), shares.value());
        assertEquals(LocalDate.of(2026, 11, 20), shares.date());
        assertEquals(3, shares.ageDays());
        assertNull(nav);
        assertEquals(List.of(spyId, qqqId), new ArrayList<>(batch.keySet()));
        assertEquals(new BigDecimal("566950000"), batch.get(qqqId).value());
        assertEquals(2, history.points().size());
        assertEquals(fake.stampedAsOfs.get(0), storedAsOf);
        assertEquals(1, fake.createCalls.get());
    }

    @Test
    void readmeShowsTheTestedExample() throws IOException {
        String test = Files.readString(THIS_FILE);
        int start = test.indexOf("// README:start");
        int end = test.indexOf("// README:end");
        assertTrue(start >= 0 && end > start, "README markers not found in " + THIS_FILE);
        String tested = test.substring(test.indexOf('\n', start) + 1, end);

        String readme = Files.readString(README);
        int heading = readme.indexOf(HEADING);
        assertTrue(heading >= 0, "README has no '" + HEADING + "' section");
        int open = readme.indexOf("```java\n", heading);
        assertTrue(open >= 0, "no ```java block under " + HEADING);
        int close = readme.indexOf("```", open + 8);
        String shown = readme.substring(open + 8, close);

        assertEquals(normalise(tested), normalise(shown));
    }

    /** Strips trailing whitespace, surrounding blank lines and the common indentation. */
    private static String normalise(String block) {
        List<String> lines = new ArrayList<>();
        for (String line : block.split("\n", -1)) lines.add(line.stripTrailing());
        while (!lines.isEmpty() && lines.get(0).isEmpty()) lines.remove(0);
        while (!lines.isEmpty() && lines.get(lines.size() - 1).isEmpty()) lines.remove(lines.size() - 1);
        int indent = lines.stream().filter(l -> !l.isEmpty())
                .mapToInt(l -> l.length() - l.stripLeading().length()).min().orElse(0);
        StringBuilder out = new StringBuilder();
        for (String line : lines) out.append(line.isEmpty() ? "" : line.substring(indent)).append('\n');
        return out.toString();
    }
}
