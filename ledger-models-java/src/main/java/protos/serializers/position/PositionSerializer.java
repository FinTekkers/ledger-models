package protos.serializers.position;

import com.google.gson.*;
import com.google.protobuf.Any;
import com.google.protobuf.GeneratedMessageV3;
import com.google.protobuf.ProtocolMessageEnum;
import common.models.JSONFieldNames;
import common.models.postion.Field;
import common.models.postion.Measure;
import common.models.postion.Position;
import common.models.transaction.TransactionType;
import fintekkers.models.position.*;
import org.apache.commons.text.WordUtils;
import protos.serializers.IRawDataModelObjectSerializer;
import protos.serializers.util.json.JsonSerializationUtil;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.util.List;

import static common.models.JSONFieldNames.*;
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
public class PositionSerializer implements IRawDataModelObjectSerializer<PositionProto, Position> {

    private static final class InstanceHolder {
        private static final PositionSerializer INSTANCE = new PositionSerializer();
    }

    public static PositionSerializer getInstance() {
        return PositionSerializer.InstanceHolder.INSTANCE;
    }

    private PositionSerializer() {
    }

    @Override
    public PositionProto serialize(Position position) {
        PositionProto.Builder builder = PositionProto.newBuilder()
            .setObjectClass(Position.class.getSimpleName())
            .setVersion("0.0.1")
            //Primary Key
            .setPositionType(PositionTypeProto.valueOf(position.getPositionType().name()))
            .setPositionView(PositionViewProto.valueOf(position.getPositionView().name()));

        position.getMeasures().forEach(measure -> {
            MeasureMapEntry entry = MeasureMapEntry.newBuilder()
                .setMeasure(MeasureProto.valueOf(measure.name()))
                .setMeasureDecimalValue(ProtoSerializationUtil.serializeBigDecimal(
                    position.getMeasure(measure)
                )).build();
            builder.addMeasures(entry);
        });

        position.getFields().forEach(field -> {
            Object fieldValue = position.getField(field);

            FieldMapEntry fieldMapEntry = getFieldMapEntry(field, null, fieldValue);

            builder.addFields(fieldMapEntry);
        });

        return builder.build();
    }

    
    public static FieldMapEntry getFieldMapEntry(Field field, PositionFilterOperator operator, Object fieldValue) {
        FieldMapEntry.Builder fieldBuilder =
                FieldMapEntry.newBuilder().setField(FieldProto.valueOf(field.name()));

        if(fieldValue instanceof TransactionType)
            fieldValue = ((TransactionType)fieldValue).getProto();

        if(fieldValue instanceof ProtocolMessageEnum)
            fieldBuilder.setEnumValue(((ProtocolMessageEnum)fieldValue).getNumber());
        else if (fieldValue != null){
            Any valuePacked = ProtoSerializationUtil.serializeToAny(fieldValue);
            fieldBuilder.setFieldValuePacked(valuePacked);
        }

        if(operator != null)
            fieldBuilder.setOperator(operator);

        return fieldBuilder.build();
    }

    public static Object getObject(FieldMapEntry entry) {
        Field field = Field.valueOf(entry.getField().name());

        Object fieldValue;

        if(ENUM_VALUE.equals(entry.getFieldMapValueOneOfCase())) {
            //Dynamically sources the appropriate enum, and gets it based on the number serialized in the proto.
            fieldValue = field.getType().getEnumConstants()[entry.getEnumValue()];
        } else {
            fieldValue = ProtoSerializationUtil.deserialize(entry.getFieldValuePacked());
        }

        return fieldValue;
    }

    @Override
    public Position deserialize(PositionProto proto) {
        final Position position = new Position(
            Position.PositionView.valueOf(proto.getPositionView().name()),
            Position.PositionType.valueOf(proto.getPositionType().name())
        );

        proto.getFieldsList().forEach(fieldProto -> {
            Field field = Field.valueOf(fieldProto.getField().name());
            Object fieldValue;

            if(ENUM_VALUE.equals(fieldProto.getFieldMapValueOneOfCase())) {
                //Dynamically sources the appropriate enum, and gets it based on the number serialized in the proto.
                fieldValue = field.getType().getEnumConstants()[fieldProto.getEnumValue()];
            } else {
                fieldValue = ProtoSerializationUtil.deserialize(fieldProto.getFieldValuePacked());
            }
            position.setFieldValue(field, fieldValue);
        });

        List<MeasureMapEntry> measuresList = proto.getMeasuresList();

        measuresList.forEach(measureProto -> {
            Measure measure = Measure.valueOf(measureProto.getMeasure().name());
            BigDecimal value = ProtoSerializationUtil.deserializeBigDecimal(measureProto.getMeasureDecimalValue());

            position.setMeasureValue(measure, value);
        });

        return position;
    }

    // JSON serialize/deserialize removed in FinTekkers/second-brain#338.
    // The display-name helpers below are retained because they are used by
    // the position UI/CLI display layers, not by JSON serialization.

    public static String convertToDisplayName(String rawFieldName) {
        String displayFieldName = rawFieldName.replaceAll("_", " ");
        displayFieldName = displayFieldName.toLowerCase();
        displayFieldName = org.apache.commons.text.WordUtils.capitalize(displayFieldName);
        return displayFieldName;
    }

    public static String convertFromDisplayName(String str) {
        return str.replaceAll(" ", "_").toUpperCase();
    }
}
