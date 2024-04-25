package fintekkers.services;

import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.position.FieldProto;
import fintekkers.models.position.PositionFilterProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.services.portfolio_service.PortfolioGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

import java.util.Iterator;

public class PortfolioService {
    private static PortfolioService DEFAULT_VALUATION_SERVICE_INSTANCE = new PortfolioService("api.fintekkers.org", 8080, false);
    private final Endpoint endpoint;

    public PortfolioService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if(isHttp) builder.usePlaintext();

        ManagedChannel channel = builder.build();
        this.portfolioGrpc = PortfolioGrpc.newBlockingStub(channel);

        this.endpoint = new Endpoint(url, port, isHttp);
    }

    public Endpoint getEndpoint() {
        return endpoint;
    }

    public static PortfolioService getInstance() {
        return DEFAULT_VALUATION_SERVICE_INSTANCE;
    }

    private PortfolioGrpc.PortfolioBlockingStub portfolioGrpc;

    public Iterator<QueryPortfolioResponseProto> search(QueryPortfolioRequestProto requestProto) {
        return this.portfolioGrpc.search(requestProto);
    }

    public static void main(String[] args) {
        PortfolioService portfolioService = PortfolioService.getInstance();

        QueryPortfolioRequestProto request = QueryPortfolioRequestProto.newBuilder()
                .setSearchPortfolioInput(PositionFilterProto.newBuilder()
                        .addFilters(
                                FieldMapEntry.newBuilder()
                                        .setField(FieldProto.PORTFOLIO_NAME)
                                        .setStringValue("Federal Reserve SOMA Holdings").build()
                        ).build()).build();

        QueryPortfolioResponseProto result = portfolioService.search(request).next();
        System.out.println(result.getPortfolioResponseList().get(0).getPortfolioName());
    }
}
