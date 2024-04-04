package client.security;

import fintekkers.requests.portfolio.CreatePortfolioRequestProto;
import fintekkers.requests.portfolio.CreatePortfolioResponseProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.services.portfolio_service.PortfolioService;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.junit.jupiter.api.Test;

class SecurityRequestTest {
    @Test
    public void testSearchRequestDeserialization() {
        String portfolio_to_find = "Federal Reserve SOMA Holdings";


//                ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 8082)
//                        .usePlaintext()
//                        .build();
//
//                // Create a stub for making calls to the service
//                PortfolioService.Portfolio.Interface portfolioStub = PortfolioService.Portfolio.newStub(channel);
//
//                // Create a request object
//                QueryPortfolioRequestProto request = QueryPortfolioRequestProto.newBuilder()
//                        .se // Set the necessary fields
//                        .build();
//
//                // Call the service method
//                portfolioStub.search(request, response -> {
//                    if (response != null) {
//                        // Handle the response
//                        CreatePortfolioResponseProto portfolioResponse = response;
//                        // Process the response
//                    } else {
//                        // Handle error
//                    }
//                });
//
//                // Don't forget to shut down the channel
//                channel.shutdown();
//            }
//        }
        ;

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