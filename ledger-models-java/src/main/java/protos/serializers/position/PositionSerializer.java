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
import static fintekkers.models.position.FieldMapEntry.FieldMapValueOneOfCase.STRING_VALUE;

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
    public PositionProto serialize( Position position) {
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
                Object enumConstant = field.getType().getEnumConstants()[fieldProto.getEnumValue()];
                fieldValue = enumConstant;
            }
            //TODO: Uncomment this and test it
            /* else if(STRING_VALUE.equals(fieldProto.getFieldMapValueOneOfCase())) {
                fieldValue = fieldProto.getStringValue();
            }*/ else {
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

    @Override
    public String serializeToJson(PositionProto proto) {
        Gson gson = JsonSerializationUtil.getGsonBuilder();

        JsonObject map = new JsonObject();
        addContext(proto, map);

        JsonArray array = new JsonArray();
        serializeSinglePositionToJson(proto, gson, array);
        map.add(JSONFieldNames.RECORDS, array);

        return gson.toJson(map);
    }

    public void serializeSinglePositionToJson(PositionProto proto, Gson gson, JsonArray array) {
        JsonArray positionRecordArray = new JsonArray();
        serializeFields(positionRecordArray, proto, gson);
        serializeMeasures(positionRecordArray, proto);
        array.add(positionRecordArray);
    }

    private void addContext(PositionProto proto, JsonObject map) {
        JsonObject contextMap = new JsonObject();
        String positionType = proto.getPositionType().name();
        contextMap.add("PositionType", new JsonPrimitive(convertToDisplayName(positionType)));
        String positionView = proto.getPositionView().name();
        contextMap.add("PositionView", new JsonPrimitive(convertToDisplayName(positionView)));
        map.add(JSONFieldNames.CONTEXT, contextMap);
    }

    public static void serializeMeasures(JsonArray array, PositionProto proto) {
        List<MeasureMapEntry> measuresList = proto.getMeasuresList();

        for(MeasureMapEntry measure : measuresList) {
            try {
                serializeMeasure(array, measure);
            } catch (JsonSyntaxException | UnsupportedOperationException e) {
                throw new RuntimeException("Problem serialization the position to JSON. Position: "+ proto, e);
            }
        }
    }

    public static void serializeMeasure(JsonArray array, MeasureMapEntry measure) {
        JsonObject map = new JsonObject();
        String rawFieldName = measure.getMeasure().name();
        map.add(FIELD_NAME, new JsonPrimitive(rawFieldName));
        serializeMeasure(measure, map);

        String displayFieldName = convertToDisplayName(rawFieldName);
        map.add(FIELD_DISPLAY_NAME, new JsonPrimitive(displayFieldName));

        array.add(map);
    }

    public static void serializeMeasure(MeasureMapEntry measure, JsonObject map) {
        MeasureProto measureType = measure.getMeasure();
        BigDecimal value = ProtoSerializationUtil.deserializeBigDecimal(measure.getMeasureDecimalValue());

        String fieldName = measureType.name();
        map.add(FIELD_NAME, new JsonPrimitive(fieldName));
        map.add(FIELD_TYPE, new JsonPrimitive("Decimal"));
        map.add(FIELD_DISPLAY_NAME, new JsonPrimitive(convertToDisplayName(fieldName)));
        map.add(FIELD_DISPLAY_VALUE, new JsonPrimitive(value.doubleValue()));
    }

    public static void serializeFields(JsonArray array, PositionProto proto, Gson gson) {
        List<FieldMapEntry> fieldsList = proto.getFieldsList();

        for(FieldMapEntry field : fieldsList) {
            try {
                serializeField(gson, array, field);
            } catch (JsonSyntaxException | UnsupportedOperationException e) {
                throw new RuntimeException("Problem serialization the position to JSON. Position: "+ proto, e);
            }
        }
    }

    public static void serializeField(Gson gson, JsonArray array, FieldMapEntry field) {
        JsonObject map = new JsonObject();
        String rawFieldName = field.getField().name();
        map.add(FIELD_NAME, new JsonPrimitive(rawFieldName));
        serializeField(gson, field, map);

        String displayFieldName = convertToDisplayName(rawFieldName);
        map.add(FIELD_DISPLAY_NAME, new JsonPrimitive(displayFieldName));

        if(field.getOperatorValue() != 0)
            map.add(FIELD_OPERATOR, new JsonPrimitive(field.getOperator().name()));

        array.add(map);
    }

    
    public static String convertToDisplayName(String rawFieldName) {
        String displayFieldName = rawFieldName.replaceAll("_", " ");
        displayFieldName = displayFieldName.toLowerCase();
        displayFieldName = WordUtils.capitalize(displayFieldName);
        return displayFieldName;
    }

    
    public static String convertFromDisplayName(String str) {
        return str.replaceAll(" ", "_").toUpperCase();
    }

    public static void serializeField(Gson gson, FieldMapEntry field, JsonObject outputJson) {
        Any fieldValuePacked = field.getFieldValuePacked();

        //If the packed value size is zero then it doesn't exist; we should assume it's an enum
        if(fieldValuePacked.getValue().size() == 0) {
            int enumValue = field.getEnumValue();

            serializeEnum(outputJson, field.getField().name(), enumValue);
            return;
        }

        Object deserialized = ProtoSerializationUtil.deserialize(fieldValuePacked);

        if(String.class.equals(deserialized.getClass())) {
            serializeStringType(outputJson, "String", deserialized.toString());
            return;
        }

        serializeComplexType(gson, outputJson, deserialized);
    }


    public static void serializeEnum(JsonObject fieldMap, String enumName, int fieldValue) {
        fieldMap.add(FIELD_TYPE, new JsonPrimitive(enumName));
        fieldMap.add(FIELD_DISPLAY_VALUE, new JsonPrimitive(fieldValue));
    }

    public static void serializeStringType(JsonObject fieldMap, String fieldType, String fieldValue) {
        fieldMap.add(FIELD_TYPE, new JsonPrimitive(fieldType));
        fieldMap.add(FIELD_DISPLAY_VALUE, new JsonPrimitive(fieldValue));
    }

    public static void serializeComplexType(Gson gson, JsonObject fieldMap, Object deserialized) {
        GeneratedMessageV3 msgProto = ProtoSerializationUtil.serialize(deserialized);

        Gson gsonField = JsonSerializationUtil.getGsonBuilder();
        String string = gsonField.toJson(msgProto);

        //Quotes are getting added by JsonWriter.java. Removing them here. Ideally we'd remove this!
        if("UUIDProto".equals(msgProto.getDescriptorForType().getName())) {
            string = string.replaceAll("\"", "");
        }

        fieldMap.add(FIELD_DISPLAY_VALUE, new JsonPrimitive(deserialized.toString()));
        fieldMap.add(FIELD_TYPE, new JsonPrimitive(deserialized.getClass().getSimpleName()));
    }

    @Override
    public PositionProto deserializeFromJson(String json) {
        throw new UnsupportedOperationException("Positions are serialized to JSON for display purposes only. They" +
                " represent a simplified version of the data");
    }
}
