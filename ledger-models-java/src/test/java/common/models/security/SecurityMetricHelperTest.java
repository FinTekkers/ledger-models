package common.models.security;

import common.util.LinkCache;
import fintekkers.models.security.SecurityMetricTypeProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * LM-482: {@link Security#getSecurityMetric} and
 * {@link Security#getSecurityMetricSeries} read only from the installed
 * {@link SecurityMetricFetcher}, a fake here.
 */
class SecurityMetricHelperTest {

    /** Returns canned observations and records each call's arguments. */
    private static final class FakeFetcher implements SecurityMetricFetcher {
        final SecurityMetricObservation latest;
        final List<SecurityMetricObservation> series;
        final List<List<Object>> calls = new ArrayList<>();

        FakeFetcher(SecurityMetricObservation latest, List<SecurityMetricObservation> series) {
            this.latest = latest;
            this.series = series;
        }

        @Override
        public SecurityMetricObservation latest(UUID securityId, SecurityMetricTypeProto metric, LocalDate date) {
            calls.add(List.of("latest", securityId, metric, date));
            return latest;
        }

        @Override
        public List<SecurityMetricObservation> series(UUID securityId, SecurityMetricTypeProto metric,
                                                      LocalDate from, LocalDate to) {
            calls.add(List.of("series", securityId, metric, from, to));
            return series;
        }
    }

    private UUID id;
    private Security security;

    private static SecurityMetricObservation observation(String value, LocalDate date) {
        return new SecurityMetricObservation(new BigDecimal(value), date);
    }

    @BeforeEach
    void setup() {
        id = UUID.randomUUID();
        // A link-only security: uuid set, nothing else.
        security = new Security(Security.linkOfLatest(id));
        LinkCache.SECURITY.evict(id);
        // Any link-fetcher call fails the test: the helpers must not hydrate.
        Security.setFetcher((u, t) -> fail("the link fetcher was called for " + u));
        Security.setMetricFetcher(null);
    }

    @AfterEach
    void teardown() {
        Security.setMetricFetcher(null);
        Security.setFetcher(null);
        LinkCache.SECURITY.evict(id);
    }

    @Test
    void aHitReturnsTheFetchersValueAndObservationDate() {
        FakeFetcher fake = new FakeFetcher(observation("1003282116", LocalDate.of(2024, 5, 31)), List.of());
        Security.setMetricFetcher(fake);

        SecurityMetricObservation got =
                security.getSecurityMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2024, 6, 3));

        // The observation's own date, not the date asked for.
        assertEquals(observation("1003282116", LocalDate.of(2024, 5, 31)), got);
        assertEquals(List.of(List.of("latest", id, SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2024, 6, 3))),
                fake.calls);
    }

    @Test
    void aMissReturnsNullNeverZero() {
        Security.setMetricFetcher(new FakeFetcher(null, List.of()));
        assertNull(security.getSecurityMetric(SecurityMetricTypeProto.NAV_PER_SHARE, LocalDate.of(2024, 6, 3)));
    }

    @Test
    void aRealZeroIsReturnedAsZero() {
        Security.setMetricFetcher(new FakeFetcher(observation("0", LocalDate.of(2024, 5, 31)), List.of()));
        SecurityMetricObservation got =
                security.getSecurityMetric(SecurityMetricTypeProto.TOTAL_NET_ASSETS, LocalDate.of(2024, 6, 3));
        assertEquals(0, BigDecimal.ZERO.compareTo(got.value()));
    }

    @Test
    void theSeriesComesBackInDateOrderFromShuffledInput() {
        FakeFetcher fake = new FakeFetcher(null, List.of(
                observation("3", LocalDate.of(2024, 1, 4)),
                observation("1", LocalDate.of(2024, 1, 2)),
                observation("2", LocalDate.of(2024, 1, 3))));
        Security.setMetricFetcher(fake);

        List<SecurityMetricObservation> got = security.getSecurityMetricSeries(
                SecurityMetricTypeProto.NAV_PER_SHARE, LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));

        assertEquals(List.of(
                observation("1", LocalDate.of(2024, 1, 2)),
                observation("2", LocalDate.of(2024, 1, 3)),
                observation("3", LocalDate.of(2024, 1, 4))), got);
        assertEquals(List.of(List.of("series", id, SecurityMetricTypeProto.NAV_PER_SHARE,
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31))), fake.calls);
    }

    private void assertNoFetcherError() {
        for (Runnable call : List.<Runnable>of(
                () -> security.getSecurityMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2024, 6, 3)),
                () -> security.getSecurityMetricSeries(SecurityMetricTypeProto.SHARES_OUTSTANDING,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 3)))) {
            IllegalStateException e = assertThrows(IllegalStateException.class, call::run);
            assertTrue(e.getMessage().contains("SecurityMetricFetcher"), e.getMessage());
            assertTrue(e.getMessage().contains("setMetricFetcher"), e.getMessage());
        }
    }

    @Test
    void withNoFetcherBothHelpersNameTheMissingFetcherAndClearRestoresIt() {
        assertNoFetcherError();

        Security.setMetricFetcher(new FakeFetcher(null, List.of()));
        assertNull(security.getSecurityMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, LocalDate.of(2024, 6, 3)));
        Security.setMetricFetcher(null);

        assertNoFetcherError();
    }

    @Test
    void aLinkOnlySecurityReturnsMetricDataWithoutCallingTheLinkFetcher() {
        Security.setMetricFetcher(new FakeFetcher(observation("512.3456", LocalDate.of(2024, 5, 31)),
                List.of(observation("1", LocalDate.of(2024, 1, 2)))));

        assertEquals(observation("512.3456", LocalDate.of(2024, 5, 31)),
                security.getSecurityMetric(SecurityMetricTypeProto.NAV_PER_SHARE, LocalDate.of(2024, 6, 3)));
        assertEquals(List.of(observation("1", LocalDate.of(2024, 1, 2))),
                security.getSecurityMetricSeries(SecurityMetricTypeProto.NAV_PER_SHARE,
                        LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 3)));
        assertTrue(security.isLink(), "the helpers must not hydrate the link");
    }

    @Test
    void aSeriesWithFromAfterToIsRejectedBeforeTheFetcher() {
        FakeFetcher fake = new FakeFetcher(null, List.of());
        Security.setMetricFetcher(fake);
        assertThrows(IllegalArgumentException.class, () -> security.getSecurityMetricSeries(
                SecurityMetricTypeProto.NAV_PER_SHARE, LocalDate.of(2024, 2, 1), LocalDate.of(2024, 1, 1)));
        assertTrue(fake.calls.isEmpty());
    }
}
