package common.util;

import com.google.protobuf.Descriptors.EnumValueDescriptor;
import common.models.security.Tenor;
import common.models.security.TenorType;
import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.ObjectTypeProtos;
import org.junit.jupiter.api.Test;
import protos.serializers.security.IdentifierSerializer;
import protos.serializers.security.TenorSerializer;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * TenorSerializer and IdentifierSerializer write {@code getClass().getSimpleName()}
 * as object_class, so the string is decided at runtime (LM-297). Each one must
 * be a legacy string on exactly one ObjectTypeProto value. The library has no
 * subclasses of Tenor or Identifier; a new one adds its name here and to the enum.
 */
@SuppressWarnings("deprecation")
class ObjectTypeRuntimeStringsTest {

    private static List<ObjectTypeProto> valuesWithLegacyString(String legacy) {
        List<ObjectTypeProto> owners = new ArrayList<>();
        for (EnumValueDescriptor value : ObjectTypeProto.getDescriptor().getValues()) {
            if (value.getOptions().getExtension(ObjectTypeProtos.legacyObjectClass).contains(legacy)) {
                owners.add(ObjectTypeProto.valueOf(value));
            }
        }
        return owners;
    }

    @Test
    void tenorSerializerStringMapsToTenor() {
        for (Tenor tenor : List.of(new Tenor(TenorType.UNKNOWN), new Tenor(TenorType.PERPETUAL), new Tenor(TenorType.TERM, "1Y"))) {
            String written = TenorSerializer.getInstance().serialize(tenor).getObjectClass();
            assertEquals(List.of(ObjectTypeProto.OBJECT_TYPE_TENOR), valuesWithLegacyString(written), written);
        }
    }

    @Test
    void identifierSerializerStringMapsToIdentifier() {
        for (IdentifierType type : IdentifierType.values()) {
            String written = IdentifierSerializer.getInstance().serialize(new Identifier(type, "X")).getObjectClass();
            assertEquals(List.of(ObjectTypeProto.OBJECT_TYPE_IDENTIFIER), valuesWithLegacyString(written), written);
        }
    }
}
