package common.requests;

import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Message;
import common.util.ObjectTypes;
import fintekkers.models.util.DateRange.DateRangeProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.requests.price.PriceHorizonProto;
import fintekkers.requests.price.QueryPriceRequestProto;
import fintekkers.requests.price.QueryPriceResponseProto;
import fintekkers.requests.security.QuerySecurityRequestProto;
import fintekkers.requests.security.QuerySecurityResponseProto;
import fintekkers.requests.transaction.QueryTransactionRequestProto;
import fintekkers.requests.transaction.QueryTransactionResponseProto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Wire tests for the paging fields (limit, page_token, next_page_token) on all four
 * query messages. See docs/adr/query_paging.md.
 */
class QueryPagingTest {

    // Serialized with the bindings on main (0a0c9657), before the paging fields existed.
    // Command: see ledger-models-python/test/requests/test_query_paging.py.
    private static final String FIELD_LIMIT = "limit";
    private static final String FIELD_PAGE_TOKEN = "page_token";
    private static final String FIELD_NEXT_PAGE_TOKEN = "next_page_token";

    private static List<Message> oldRequests() {
        return List.of(
                QuerySecurityRequestProto.newBuilder().build(),
                QueryTransactionRequestProto.newBuilder().build(),
                QueryPortfolioRequestProto.newBuilder().build(),
                QueryPriceRequestProto.newBuilder().build());
    }

    private static List<Message> pagedRequests() {
        return List.of(
                QuerySecurityRequestProto.newBuilder().setLimit(25).setPageToken("opaque-abc").build(),
                QueryTransactionRequestProto.newBuilder().setLimit(25).setPageToken("opaque-abc").build(),
                QueryPortfolioRequestProto.newBuilder().setLimit(25).setPageToken("opaque-abc").build(),
                QueryPriceRequestProto.newBuilder().setLimit(25).setPageToken("opaque-abc").build());
    }

    private static List<Message> pagedResponses() {
        return List.of(
                QuerySecurityResponseProto.newBuilder().setNextPageToken("opaque-def").build(),
                QueryTransactionResponseProto.newBuilder().setNextPageToken("opaque-def").build(),
                QueryPortfolioResponseProto.newBuilder().setNextPageToken("opaque-def").build(),
                QueryPriceResponseProto.newBuilder().setNextPageToken("opaque-def").build());
    }

    private static Object field(Message message, String name) {
        return message.getField(message.getDescriptorForType().findFieldByName(name));
    }

    private static Message roundTrip(Message message) throws InvalidProtocolBufferException {
        return message.getParserForType().parseFrom(message.toByteArray());
    }

    @Test
    void oldRequestReadsDefaults() throws Exception {
        for (Message request : oldRequests()) {
            Message parsed = roundTrip(request);
            String name = request.getDescriptorForType().getName();
            assertEquals(0, field(parsed, FIELD_LIMIT), name);
            assertEquals("", field(parsed, FIELD_PAGE_TOKEN), name);
        }
        assertEquals("", QuerySecurityResponseProto.parseFrom(new byte[0]).getNextPageToken());
        assertEquals("", QueryTransactionResponseProto.parseFrom(new byte[0]).getNextPageToken());
        assertEquals("", QueryPortfolioResponseProto.parseFrom(new byte[0]).getNextPageToken());
        assertEquals("", QueryPriceResponseProto.parseFrom(new byte[0]).getNextPageToken());
    }

    @Test
    void pagingFieldsRoundTrip() throws Exception {
        for (Message request : pagedRequests()) {
            Message parsed = roundTrip(request);
            String name = request.getDescriptorForType().getName();
            assertEquals(25, field(parsed, FIELD_LIMIT), name);
            assertEquals("opaque-abc", field(parsed, FIELD_PAGE_TOKEN), name);
        }
        for (Message response : pagedResponses()) {
            Message parsed = roundTrip(response);
            assertEquals("opaque-def", field(parsed, FIELD_NEXT_PAGE_TOKEN), response.getDescriptorForType().getName());
        }
    }

    @Test
    void emptyNextPageTokenEncodesAsUnset() {
        for (Message response : pagedResponses()) {
            Message unset = response.toBuilder().clearField(
                    response.getDescriptorForType().findFieldByName(FIELD_NEXT_PAGE_TOKEN)).build();
            Message empty = response.toBuilder().setField(
                    response.getDescriptorForType().findFieldByName(FIELD_NEXT_PAGE_TOKEN), "").build();
            assertArrayEquals(unset.toByteArray(), empty.toByteArray(), response.getDescriptorForType().getName());
        }
    }

    @Test
    void pricePageTokenRoundTripsWithHorizon() throws Exception {
        QueryPriceRequestProto request = QueryPriceRequestProto.newBuilder()
                .setHorizon(PriceHorizonProto.PRICE_HORIZON_1_YEAR).setPageToken("opaque-abc").setLimit(10).build();

        QueryPriceRequestProto parsed = QueryPriceRequestProto.parseFrom(request.toByteArray());

        assertEquals(QueryPriceRequestProto.TimeRangeCase.HORIZON, parsed.getTimeRangeCase());
        assertEquals(PriceHorizonProto.PRICE_HORIZON_1_YEAR, parsed.getHorizon());
        assertEquals("opaque-abc", parsed.getPageToken());
        assertEquals(10, parsed.getLimit());
    }

    @Test
    void pricePageTokenRoundTripsWithDateRange() throws Exception {
        QueryPriceRequestProto request = QueryPriceRequestProto.newBuilder()
                .setDateRange(DateRangeProto.newBuilder().setVersion(ObjectTypes.SCHEMA_VERSION)).setPageToken("opaque-abc").setLimit(10)
                .build();

        QueryPriceRequestProto parsed = QueryPriceRequestProto.parseFrom(request.toByteArray());

        assertEquals(QueryPriceRequestProto.TimeRangeCase.DATE_RANGE, parsed.getTimeRangeCase());
        assertEquals(ObjectTypes.SCHEMA_VERSION, parsed.getDateRange().getVersion());
        assertEquals("opaque-abc", parsed.getPageToken());
        assertEquals(10, parsed.getLimit());
    }
}
