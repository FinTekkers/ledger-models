package client.security;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SecurityRequestSerializerTest {
    @Test
    public void testSearchRequestDeserialization() {
//        String json = "{\n" +
//                "\t\"context\": {\n" +
//                "\t\t\"operation\": \"SEARCH\"\n" +
//                "\t},\n" +
//                "\t\"search\": [{\n" +
//                "\t\t\"field_name\": \"IDENTIFIER\",\n" +
//                "\t\t\"field_display_value\": {\n" +
//                "\t\t\t\"identifier_type\": \"EXCH_TICKER\",\n" +
//                "\t\t\t\"identifier_value\": \"NYSE:1142\"\n" +
//                "\t\t},\n" +
//                "\t\t\"field_type\": \"Identifier\"\n" +
//                "\t}]\n" +
//                "}";
//
//
//        CreateSecurityRequestProto requestProto = null;
//        System.out.println(json);
//        requestProto = SecurityRequestSerializer.getInstance().deserializeFromJson(json);
//
//
//        PositionFilterProto searchSecurityInput = requestProto.getSecurityInput();
//        Assertions.assertEquals(1, searchSecurityInput.getFiltersList().size());
//        FieldProto field = searchSecurityInput.getFiltersList().get(0).getField();
//        Assertions.assertEquals(FieldProto.IDENTIFIER, field);

//        from fintekkers.models.position.field_pb2 import FieldProto
//        from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
//        from fintekkers.wrappers.services.portfolio import PortfolioService
//
//                portfolio_to_find = "Federal Reserve SOMA Holdings"
//        portfolioService = PortfolioService()
//
//        request = QueryPortfolioRequest.create_query_request({
//                FieldProto.PORTFOLIO_NAME: portfolio_to_find,
//        })
//
//        searchResults: list[Portfolio] = list(portfolioService.search(request))
//        print(searchResults[0].get_name())

    }
}