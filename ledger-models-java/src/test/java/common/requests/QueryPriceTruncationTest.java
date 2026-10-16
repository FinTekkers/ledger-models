package common.requests;

import fintekkers.models.price.PriceProto;
import fintekkers.requests.price.QueryPriceResponseProto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Wire tests for QueryPriceResponseProto.truncated / row_cap.
 * See docs/adr/query_price_truncation.md.
 */
class QueryPriceTruncationTest {

    private static QueryPriceResponseProto.Builder pagedResponse() {
        return QueryPriceResponseProto.newBuilder()
                .addPriceResponse(PriceProto.newBuilder().setIsLink(true))
                .setNextPageToken("opaque-def");
    }

    @Test
    void truncationFieldsRoundTripWithExistingFields() throws Exception {
        QueryPriceResponseProto response = pagedResponse().setTruncated(true).setRowCap(1000).build();

        QueryPriceResponseProto parsed = QueryPriceResponseProto.parseFrom(response.toByteArray());

        assertTrue(parsed.getTruncated());
        assertEquals(1000, parsed.getRowCap());
        assertEquals("opaque-def", parsed.getNextPageToken());
        assertEquals(1, parsed.getPriceResponseCount());
        assertTrue(parsed.getPriceResponse(0).getIsLink());
    }

    @Test
    void responseWithoutNewFieldsReadsDefaults() throws Exception {
        QueryPriceResponseProto old = pagedResponse().build();
        QueryPriceResponseProto explicit = pagedResponse().setTruncated(false).setRowCap(0).build();

        QueryPriceResponseProto parsed = QueryPriceResponseProto.parseFrom(old.toByteArray());

        assertFalse(parsed.getTruncated());
        assertEquals(0, parsed.getRowCap());
        assertArrayEquals(old.toByteArray(), explicit.toByteArray());
    }
}
