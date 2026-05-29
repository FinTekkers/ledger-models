package fintekkers.services;

import fintekkers.models.portfolio.PortfolioProto;
import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.position.FieldProto;
import fintekkers.models.position.PositionFilterProto;
import fintekkers.requests.portfolio.QueryPortfolioRequestProto;
import fintekkers.requests.portfolio.QueryPortfolioResponseProto;
import fintekkers.services.portfolio_service.PortfolioGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.ZonedDateTime;
import java.util.Iterator;
import java.util.UUID;

public class PortfolioService {
    // Port 8082 matches Python EnvConfig.ServiceType.PORTFOLIO_SERVICE —
    // Security / Portfolio / Transaction all multiplex on the ledger-service
    // 8082 port in the deployed topology.
    private static PortfolioService DEFAULT_VALUATION_SERVICE_INSTANCE = new PortfolioService("api.fintekkers.org", 8082, false);
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

    /**
     * Single-UUID resolution via the unary {@code GetByIds} RPC. Mirrors
     * {@link SecurityService#getByUuid}. The default Portfolio fetcher in
     * {@code common.models.portfolio.Portfolio.defaultGrpcFetcher} delegates here.
     * Returns {@code null} when no record exists for the UUID.
     */
    public PortfolioProto getByUuid(UUID uuid, ZonedDateTime asOf) {
        QueryPortfolioRequestProto.Builder reqB = QueryPortfolioRequestProto.newBuilder()
                .setObjectClass("PortfolioRequest")
                .setVersion("0.0.1")
                .addUuIds(ProtoSerializationUtil.serializeUUID(uuid));
        if (asOf != null) {
            reqB.setAsOf(ProtoSerializationUtil.serializeTimestamp(asOf));
        }
        QueryPortfolioResponseProto resp = portfolioGrpc.getByIds(reqB.build());
        return resp.getPortfolioResponseCount() > 0 ? resp.getPortfolioResponse(0) : null;
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
