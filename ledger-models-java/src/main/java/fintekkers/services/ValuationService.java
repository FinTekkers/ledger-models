package fintekkers.services;

import com.google.protobuf.Timestamp;
import fintekkers.models.position.MeasureMapEntry;
import fintekkers.models.position.MeasureProto;
import fintekkers.models.position.PositionProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.SecurityQuantityTypeProto;
import fintekkers.models.security.SecurityTypeProto;
import fintekkers.models.util.DecimalValue;
import fintekkers.models.util.LocalTimestamp;
import fintekkers.requests.valuation.ValuationRequestProto;
import fintekkers.requests.valuation.ValuationResponseProto;
import fintekkers.services.valuation_service.ValuationGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;

public class ValuationService {
    private static ValuationService DEFAULT_VALUATION_SERVICE_INSTANCE = new ValuationService("api.fintekkers.org", 8080, false);
    private final Endpoint endpoint;

    public ValuationService(String url, int port, boolean isHttp) {
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forAddress(url, port);
        if(isHttp) builder.usePlaintext();

        ManagedChannel channel = builder.build();
        this.valuationGrpc = ValuationGrpc.newBlockingStub(channel);

        this.endpoint = new Endpoint(url, port, isHttp);
    }

    public Endpoint getEndpoint() {
        return endpoint;
    }

    public static ValuationService getInstance() {
        return DEFAULT_VALUATION_SERVICE_INSTANCE;
    }

    private ValuationGrpc.ValuationBlockingStub valuationGrpc;

    public ValuationResponseProto runValuation(ValuationRequestProto requestProto) {
        return this.valuationGrpc.runValuation(requestProto);
    }

    public static void main(String[] args) {

        LocalTimestamp.LocalTimestampProto asOf = LocalTimestamp.LocalTimestampProto.newBuilder()
                .setTimestamp(Timestamp.newBuilder().setSeconds(1).setNanos(1).build())
                .setTimeZone("America/New_York")
                .build();

        SecurityProto usd = SecurityProto.newBuilder()
                .setAsOf(asOf)
                .setSecurityType(SecurityTypeProto.CASH_SECURITY)
                .setAssetClass("Cash")
                .setCashId("USD").build();

        SecurityProto equitySecurity = SecurityProto.newBuilder()
                .setAsOf(asOf)
                .setSecurityType(SecurityTypeProto.EQUITY_SECURITY)
                .setAssetClass("Equity")
                .setObjectClass("Security")
                .setIsLink(false)
                .setIssuerName("ACME LLC")
                .setSettlementCurrency(usd).setQuantityType(SecurityQuantityTypeProto.UNITS).build();


        DecimalValue.DecimalValueProto priceDecimal = ProtoSerializationUtil.serializeBigDecimal(BigDecimal.TEN);

        PriceProto price = PriceProto.newBuilder().setSecurity(equitySecurity).setAsOf(asOf).setPrice(priceDecimal).build();

        PositionProto.Builder position = PositionProto.newBuilder().addMeasures(MeasureMapEntry.newBuilder()
                .setMeasure(MeasureProto.DIRECTED_QUANTITY)
                .setMeasureDecimalValue(ProtoSerializationUtil.serializeBigDecimal(BigDecimal.valueOf(-100)))
                .build());

        ValuationRequestProto requestProto = ValuationRequestProto.newBuilder()
                .setSecurityInput(equitySecurity)
                .setPriceInput(price)
                .setPositionInput(position)
                .addMeasures(MeasureProto.MARKET_VALUE)
                .build();


        ValuationResponseProto responseProto = getInstance().runValuation(requestProto);
        BigDecimal result = ProtoSerializationUtil.deserializeBigDecimal(responseProto.getMeasureResults(0).getMeasureDecimalValue());
        System.out.println(responseProto);

        System.out.println("*************************************************************************************");
        System.out.println("*************************************************************************************");
        System.out.println("*************************************************************************************");

        DecimalValue.DecimalValueProto oneHundred = ProtoSerializationUtil.serializeBigDecimal(BigDecimal.valueOf(-100));
        System.out.println(oneHundred.getArbitraryPrecisionValue());

        System.out.println(result);

        System.out.println("*************************************************************************************");
        System.out.println("*************************************************************************************");
        System.out.println("*************************************************************************************");
    }
}
