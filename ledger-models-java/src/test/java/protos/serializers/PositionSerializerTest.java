package protos.serializers;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.JSONFieldNames;
import common.models.portfolio.Portfolio;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.Position;
import common.models.security.Security;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.position.PositionProto;
import fintekkers.models.position.PositionStatusProto;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import protos.serializers.position.PositionSerializer;
import testutil.DummyEquityObjects;

import java.math.BigDecimal;
import java.util.UUID;

class PositionSerializerTest {
    @Test
    public void testPositionSerialization() {
        final Position position = createPosition();

        final PositionProto positionProto = PositionSerializer.getInstance().serialize(position);
        final Position positionCopy = PositionSerializer.getInstance().deserialize(positionProto);

        Assertions.assertEquals(position.getPositionType(), positionCopy.getPositionType());
        Assertions.assertEquals(position.getPositionView(), positionCopy.getPositionView());

        Assertions.assertEquals(position.getFields().size(), positionCopy.getFields().size());
        Assertions.assertEquals(position.getMeasures().size(), positionCopy.getMeasures().size());

        for(Field field : position.getFields()) {
            Object fieldValue = position.getField(field);
            Object fieldValueCopy = positionCopy.getField(field);

            Assertions.assertEquals(fieldValue, fieldValueCopy);
        }
    }

    
    private Position createPosition() {
        final Position position = new Position(
            Position.PositionView.DEFAULT_VIEW,
            Position.PositionType.TRANSACTION
        );

        final Security equitySecurity = DummyEquityObjects.getDummySecurity();
        final Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();
        final var transaction = DummyEquityObjects.getDummyTransaction();
//
//        position.setFieldValue(Field.ID, UUID.randomUUID());
//        position.setFieldValue(Field.TRADE_DATE, transaction.getTradeDate());
//        position.setFieldValue(Field.SETTLEMENT_DATE, transaction.getTradeDate());

//        position.setFieldValue(Field.PORTFOLIO, portfolio);
//
//        position.setFieldValue(Field.SECURITY, equitySecurity);
//        position.setFieldValue(Field.CASH_IMPACT_SECURITY, equitySecurity.getSettlementCurrency());
//        position.setFieldValue(Field.ASSET_CLASS, equitySecurity.getAssetClass());
//        position.setFieldValue(Field.PRODUCT_CLASS, equitySecurity.getClass().getSimpleName());
//        position.setFieldValue(Field.PRODUCT_TYPE, ProductType.BOND.name());
//
//        position.setFieldValue(Field.POSITION_STATUS, PositionStatusProto.HYPOTHETICAL);
        position.setFieldValue(Field.STRATEGY, transaction.getStrategyAllocation());
        position.setFieldValue(Field.PRICE, transaction.getPrice());

        position.setFieldValue(Field.IDENTIFIER, new Identifier(IdentifierType.CUSIP, "92928301"));

        position.setMeasureValue(Measure.DIRECTED_QUANTITY, BigDecimal.TEN);
        position.setMeasureValue(Measure.MARKET_VALUE, BigDecimal.TEN.multiply(transaction.getPrice().getPrice()));
        position.setMeasureValue(Measure.UNADJUSTED_COST_BASIS, BigDecimal.TEN.multiply(transaction.getPrice().getPrice()));

        return position;
    }

    @Test
    public void testConvertDisplayName() {
        String positionStatusEnumValue = Field.POSITION_STATUS.name();
        String positionStatusDisplayValue = PositionSerializer.convertToDisplayName(positionStatusEnumValue);

        Assertions.assertEquals("Position Status", positionStatusDisplayValue);

        String positionStatusEnumValueCopy = PositionSerializer.convertFromDisplayName(positionStatusDisplayValue);
        Assertions.assertEquals(positionStatusEnumValue, positionStatusEnumValueCopy);
    }

    // testJSONSerialization removed in FinTekkers/second-brain#338 — JSON
    // serialize/deserialize methods on PositionSerializer were deleted.
}