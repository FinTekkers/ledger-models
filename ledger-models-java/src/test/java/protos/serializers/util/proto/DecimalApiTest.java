package protos.serializers.util.proto;

import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.DecimalValue.DecimalValueProtoOrBuilder;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-304 metric 3, the same API as Rust (LM-307, owner ruling 12 Oct): across
 * every compiled main class there is exactly one public decode method, taking
 * only a {@code DecimalValueProto}, and the string accessor is deprecated.
 */
class DecimalApiTest {

    private static List<Class<?>> mainClasses() throws Exception {
        Path root = Paths.get(ProtoSerializationUtil.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        List<Class<?>> out = new ArrayList<>();
        ClassLoader loader = ProtoSerializationUtil.class.getClassLoader();
        try (Stream<Path> files = Files.walk(root)) {
            for (Path p : files.filter(f -> f.toString().endsWith(".class")).collect(Collectors.toList())) {
                String name = root.relativize(p).toString().replace(p.getFileSystem().getSeparator(), ".");
                out.add(Class.forName(name.substring(0, name.length() - ".class".length()), false, loader));
            }
        } catch (IOException e) {
            throw new AssertionError(e);
        }
        assertTrue(out.contains(ProtoSerializationUtil.class) && out.contains(DecimalCodec.class), root.toString());
        return out;
    }

    @Test
    public void exactlyOnePublicDecodeTakingOnlyTheProto() throws Exception {
        List<Method> decoders = new ArrayList<>();
        for (Class<?> c : mainClasses()) {
            for (Method m : c.getDeclaredMethods()) {
                if (!Modifier.isPublic(m.getModifiers()) || m.getReturnType() != BigDecimal.class) continue;
                boolean takesDecimal = Arrays.stream(m.getParameterTypes()).anyMatch(
                        t -> DecimalValueProtoOrBuilder.class.isAssignableFrom(t));
                if (takesDecimal) decoders.add(m);
            }
        }
        assertEquals(1, decoders.size(), decoders.toString());
        Method decode = decoders.get(0);
        assertEquals(ProtoSerializationUtil.class, decode.getDeclaringClass());
        assertEquals("deserializeBigDecimal", decode.getName());
        assertArrayEquals(new Class<?>[]{DecimalValueProto.class}, decode.getParameterTypes());
        assertTrue(Modifier.isStatic(decode.getModifiers()));
    }

    @Test
    public void codecIsNotPublic() {
        assertFalse(Modifier.isPublic(DecimalCodec.class.getModifiers()));
        for (Method m : DecimalCodec.class.getDeclaredMethods()) {
            assertFalse(Modifier.isPublic(m.getModifiers()), m.toString());
        }
    }

    @Test
    public void stringAccessorIsDeprecated() throws NoSuchMethodException {
        assertTrue(DecimalValueProto.class.getMethod("getArbitraryPrecisionValue").isAnnotationPresent(Deprecated.class));
        assertTrue(DecimalValueProtoOrBuilder.class.getMethod("getArbitraryPrecisionValue").isAnnotationPresent(Deprecated.class));
    }
}
