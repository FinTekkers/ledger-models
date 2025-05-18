package protos.serializers.position;

import common.models.portfolio.Portfolio;
import common.models.postion.PositionFilter;
import common.models.security.Security;
import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.position.FieldProto;
import fintekkers.models.position.PositionFilterOperator;
import fintekkers.models.position.PositionFilterProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import testutil.DummyEquityObjects;

import java.util.ArrayList;
import java.util.List;

class PositionFilterSerializerTest {

    @Test
    public void testOperator() {
        List<PositionFilterOperator> list = new ArrayList<>() {{
            add(PositionFilterOperator.EQUALS);
            add(PositionFilterOperator.NOT_EQUALS);
            add(PositionFilterOperator.LESS_THAN);
            add(PositionFilterOperator.LESS_THAN_OR_EQUALS);
            add(PositionFilterOperator.MORE_THAN);
            add(PositionFilterOperator.MORE_THAN_OR_EQUALS);
        }};

        list.forEach(input -> {
            PositionFilter.Operator tmp = PositionFilterSerializer.getOperator(input);
            PositionFilterOperator operator = PositionFilterSerializer.getOperatorProto(tmp);
            Assertions.assertEquals(input, operator);
        });
    }

    @Test
    public void testPositionFilter() {
        Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();
        Security security = DummyEquityObjects.getDummySecurity();

        //Serialize a position filter
        PositionFilter filter = PositionFilter.from(portfolio, security);
        PositionFilterProto filterProto = PositionFilterSerializer.getInstance().serialize(filter);
        List<FieldMapEntry> filtersList = filterProto.getFiltersList();

        //Check security
        FieldMapEntry securityMapEntry = filtersList.stream().filter(x -> FieldProto.SECURITY == x.getField()).toList().get(0);
        Security securityDeserialized = (Security) PositionSerializer.getObject(securityMapEntry);
        Assertions.assertEquals(security.getID().toString(), securityDeserialized.getID().toString());

        //Check portfolio
        FieldMapEntry portfolioMapEntry = filtersList.stream().filter(x -> FieldProto.PORTFOLIO == x.getField()).toList().get(0);
        Portfolio portfolioDeserialized = (Portfolio) PositionSerializer.getObject(portfolioMapEntry);
        Assertions.assertEquals(portfolio.getID().toString(), portfolioDeserialized.getID().toString());
    }
}