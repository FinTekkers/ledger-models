package protos.serializers.position;

import common.models.postion.Field;
import common.models.postion.PositionFilter;
import fintekkers.models.position.*;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.proto.ProtoSerializationUtil;

import static fintekkers.models.position.FieldMapEntry.FieldMapValueOneOfCase.ENUM_VALUE;

/**
 * Serializes/deserializes between position protos and position objects. Note that positions are a derived form of
 * information, so are structured to easily communicate information to users.
 *
 * When you serialize a position to JSON you are receiving something suitable for display, but you will not be able
 * to deserialize back into first class objects. To do that we would have to serialize all the dependent objects
 * such as securities/etc. That is currently not supported, though much of the code exists. The reason for not supporting
 * it is the JSON version would become very large and it is not clear if it would be useful.
 */
public class PositionFilterSerializer {

    private static final class InstanceHolder {
        private static final PositionFilterSerializer INSTANCE = new PositionFilterSerializer();
    }

    public static PositionFilterSerializer getInstance() {
        return PositionFilterSerializer.InstanceHolder.INSTANCE;
    }

    private PositionFilterSerializer() {
    }

    public PositionFilterProto serialize(PositionFilter filter) {
        PositionFilterProto.Builder builder = PositionFilterProto.newBuilder();

        filter.getFilters().forEach((field, positionComparator) -> {
            PositionFilter.Operator operator = positionComparator.getOperator();
            Object value = positionComparator.getValue();

            PositionFilterOperator operatorProto = getOperatorProto(operator);
            FieldMapEntry entry = PositionSerializer.getFieldMapEntry(field, operatorProto, value);

            builder.addFilters(entry);
        });

        return builder.build();
    }

    public static PositionFilterOperator getOperatorProto(PositionFilter.Operator operator) {
        PositionFilterOperator operatorProto;

        switch (operator) {
            case NOT_EQUALS -> operatorProto = PositionFilterOperator.NOT_EQUALS;
            case EQUALS -> operatorProto = PositionFilterOperator.EQUALS;
            case LESS_THAN -> operatorProto = PositionFilterOperator.LESS_THAN;
            case LESS_THAN_OR_EQUALS -> operatorProto = PositionFilterOperator.LESS_THAN_OR_EQUALS;
            case MORE_THAN -> operatorProto = PositionFilterOperator.MORE_THAN;
            case MORE_THAN_OR_EQUALS -> operatorProto = PositionFilterOperator.MORE_THAN_OR_EQUALS;
            default -> operatorProto = PositionFilterOperator.UNKNOWN_OPERATOR;
        }

        return operatorProto;
    }

    public static PositionFilter.Operator getOperator(PositionFilterOperator operatorProto) {
        PositionFilter.Operator operator;

        switch (operatorProto) {
            case NOT_EQUALS -> operator = PositionFilter.Operator.NOT_EQUALS;
            case EQUALS -> operator = PositionFilter.Operator.EQUALS;
            case LESS_THAN -> operator = PositionFilter.Operator.LESS_THAN;
            case LESS_THAN_OR_EQUALS -> operator = PositionFilter.Operator.LESS_THAN_OR_EQUALS;
            case MORE_THAN -> operator = PositionFilter.Operator.MORE_THAN;
            case MORE_THAN_OR_EQUALS -> operator = PositionFilter.Operator.MORE_THAN_OR_EQUALS;
            default -> throw new RuntimeException("Received unrecognized operator");
        }

        return operator;
    }

    public PositionFilter deserialize(PositionFilterProto proto) {
        PositionFilter filter = new PositionFilter();

        proto.getFiltersList().forEach(fieldMapEntry -> {
            FieldProto fieldProto = fieldMapEntry.getField();
            Field field = Field.valueOf(fieldProto.name());

            PositionFilterOperator operatorProto = fieldMapEntry.getOperator();
            PositionFilter.Operator operator = getOperator(operatorProto);

            Object fieldValue;

            if(ENUM_VALUE.equals(fieldMapEntry.getFieldMapValueOneOfCase())) {
                //Dynamically sources the appropriate enum, and gets it based on the number serialized in the proto.
                fieldValue = field.getType().getEnumConstants()[fieldMapEntry.getEnumValue()];
            } else {
                fieldValue = ProtoSerializationUtil.deserialize(fieldMapEntry.getFieldValuePacked());
            }

            filter.addFilter(field, operator, fieldValue);
        });


        return filter;
    }
}
