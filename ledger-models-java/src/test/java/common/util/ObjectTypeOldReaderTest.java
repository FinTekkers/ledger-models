package common.util;

import com.google.protobuf.DescriptorProtos.DescriptorProto;
import com.google.protobuf.DescriptorProtos.FileDescriptorProto;
import com.google.protobuf.DescriptorProtos.FileDescriptorSet;
import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Descriptors.DescriptorValidationException;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Descriptors.FileDescriptor;
import com.google.protobuf.DynamicMessage;
import com.google.protobuf.Message;
import com.google.protobuf.UnknownFieldSet;
import fintekkers.models.util.ObjectTypeProto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Old readers still work (LM-297): bytes written in the new form, strings plus
 * object_type / version_major / version_minor / version_patch, decode with the
 * previous release's .proto files and give the same object_class and version.
 * The new fields survive as unknown fields. Descriptors come from
 * {@code test-fixtures/object-type/legacy-descriptors-v0.4.33.binpb}
 * (scripts/fixtures/make-legacy-descriptors.sh).
 */
class ObjectTypeOldReaderTest {

    private static final Path LEGACY = Path.of("..", "test-fixtures", "object-type", "legacy-descriptors-v0.4.33.binpb");
    private static final Path PROTOS = Path.of("..", "ledger-models-protos");
    private static final Pattern OBJECT_CLASS = Pattern.compile("(?m)^\\s*string\\s+object_class\\s*=\\s*1\\b");

    private static final List<Descriptor> legacyMessages = new ArrayList<>();
    private static final Map<String, FileDescriptorProto> legacyFiles = new HashMap<>();

    @BeforeAll
    static void loadLegacyDescriptors() throws IOException, DescriptorValidationException {
        FileDescriptorSet set = FileDescriptorSet.parseFrom(Files.readAllBytes(LEGACY));
        Map<String, FileDescriptor> built = new HashMap<>();
        // --include_imports writes files in dependency order.
        for (FileDescriptorProto file : set.getFileList()) {
            FileDescriptor[] deps = file.getDependencyList().stream().map(built::get).toArray(FileDescriptor[]::new);
            FileDescriptor fd = FileDescriptor.buildFrom(file, deps);
            built.put(file.getName(), fd);
            legacyFiles.put(file.getName(), file);
            for (Descriptor message : fd.getMessageTypes()) {
                FieldDescriptor first = message.findFieldByNumber(1);
                if (first != null && first.getName().equals("object_class")) {
                    legacyMessages.add(message);
                }
            }
        }
    }

    @Test
    void everyObjectClassMessageIsCheckedAndNoneSkipped() throws IOException {
        int expected = 0;
        try (Stream<Path> files = Files.walk(PROTOS)) {
            for (Path p : files.filter(f -> f.toString().endsWith(".proto")).collect(Collectors.toList())) {
                Matcher m = OBJECT_CLASS.matcher(Files.readString(p));
                while (m.find()) expected++;
            }
        }
        assertTrue(expected >= 49);
        assertEquals(expected, legacyMessages.size(), "messages in the sources vs in " + LEGACY);

        List<String> skipped = new ArrayList<>();
        for (Descriptor old : legacyMessages) {
            try {
                newBuilderFor(old);
            } catch (ReflectiveOperationException e) {
                skipped.add(old.getFullName() + ": " + e);
            }
        }
        assertEquals(List.of(), skipped);
    }

    @Test
    void newFormBytesDecodeWithTheOldProtos() throws Exception {
        Set<String> checked = new HashSet<>();
        for (Descriptor old : legacyMessages) {
            Message.Builder builder = newBuilderFor(old);
            Descriptor current = builder.getDescriptorForType();
            ObjectTypeProto type = ObjectTypeProto.valueOf(expectedValueName(current.getName()));

            byte[] bytes = builder
                    .setField(current.findFieldByName("object_class"), "Legacy" + current.getName())
                    .setField(current.findFieldByName("version"), "1.2.3")
                    .setField(current.findFieldByName("object_type"), type.getValueDescriptor())
                    .setField(current.findFieldByName("version_major"), 1)
                    .setField(current.findFieldByName("version_minor"), 2)
                    .setField(current.findFieldByName("version_patch"), 3)
                    .build().toByteArray();

            DynamicMessage decoded = DynamicMessage.parseFrom(old, bytes);
            String name = old.getFullName();
            assertEquals("Legacy" + current.getName(), decoded.getField(old.findFieldByName("object_class")), name);
            assertEquals("1.2.3", decoded.getField(old.findFieldByName("version")), name);

            UnknownFieldSet unknown = decoded.getUnknownFields();
            assertEquals(List.of((long) type.getNumber()), unknown.getField(1001).getVarintList(), name);
            assertEquals(List.of(1L), unknown.getField(1002).getVarintList(), name);
            assertEquals(List.of(2L), unknown.getField(1003).getVarintList(), name);
            assertEquals(List.of(3L), unknown.getField(1004).getVarintList(), name);

            // An old reader that re-writes the message keeps the new fields.
            Message reread = newBuilderFor(old).mergeFrom(decoded.toByteArray()).build();
            assertEquals(type.getValueDescriptor(), reread.getField(current.findFieldByName("object_type")), name);
            assertEquals(1, reread.getField(current.findFieldByName("version_major")), name);
            assertEquals(2, reread.getField(current.findFieldByName("version_minor")), name);
            assertEquals(3, reread.getField(current.findFieldByName("version_patch")), name);
            checked.add(name);
        }
        assertEquals(legacyMessages.size(), checked.size());
    }

    /** {@code QuerySecurityRequestProto} -> {@code OBJECT_TYPE_QUERY_SECURITY_REQUEST}. */
    static String expectedValueName(String messageName) {
        String base = messageName.endsWith("Proto") ? messageName.substring(0, messageName.length() - 5) : messageName;
        String snake = base.replaceAll("(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_").replaceAll("_+", "_");
        return "OBJECT_TYPE_" + snake.toUpperCase();
    }

    /** The generated builder for the current message with the legacy message's name (no java_package is set). */
    private static Message.Builder newBuilderFor(Descriptor old) throws ReflectiveOperationException {
        FileDescriptorProto file = legacyFiles.get(old.getFile().getName());
        String pkg = file.getPackage();
        String className = file.getOptions().getJavaMultipleFiles()
                ? pkg + "." + old.getName()
                : pkg + "." + outerClassName(file) + "$" + old.getName();
        return (Message.Builder) Class.forName(className).getMethod("newBuilder").invoke(null);
    }

    private static String outerClassName(FileDescriptorProto file) {
        if (file.getOptions().hasJavaOuterClassname()) return file.getOptions().getJavaOuterClassname();
        String base = Path.of(file.getName()).getFileName().toString().replaceFirst("\\.proto$", "");
        StringBuilder camel = new StringBuilder();
        boolean upper = true;
        for (char c : base.toCharArray()) {
            if (!Character.isLetterOrDigit(c)) { upper = true; continue; }
            camel.append(upper ? Character.toUpperCase(c) : c);
            upper = Character.isDigit(c);
        }
        String name = camel.toString();
        Set<String> clashes = new HashSet<>();
        for (DescriptorProto m : file.getMessageTypeList()) clashes.add(m.getName());
        file.getEnumTypeList().forEach(e -> clashes.add(e.getName()));
        file.getServiceList().forEach(s -> clashes.add(s.getName()));
        return clashes.contains(name) ? name + "OuterClass" : name;
    }
}
