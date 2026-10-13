package common.util;

import com.google.protobuf.DescriptorProtos.DescriptorProto;
import com.google.protobuf.DescriptorProtos.FieldDescriptorProto;
import com.google.protobuf.DescriptorProtos.FileDescriptorProto;
import com.google.protobuf.DescriptorProtos.FileDescriptorSet;
import com.google.protobuf.Descriptors.Descriptor;
import com.google.protobuf.Message;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.models.util.Uuid.UUIDProto;
import fintekkers.models.util.VersionProto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Every message with object_type has an own-type stamp (LM-320).
 *
 * <p>Walks the descriptor set for messages whose field 1 is
 * {@code fintekkers.models.util.ObjectTypeProto}, and fails when {@link ObjectTypes#stampOwn}
 * has no entry for one. Stamps each and checks its own type and version (0, 0, 1).
 */
class ObjectTypeCoverageTest {

    /** The descriptor set compile.sh writes for every language. */
    private static final Path DESCRIPTOR_SET = Path.of("..", "ledger-models-rust", "ledger_models_file_descriptor_set_v_todo.bin");

    private static final String OBJECT_TYPE_ENUM = ".fintekkers.models.util.ObjectTypeProto";

    private static final VersionProto V_0_0_1 = VersionProto.newBuilder().setPatch(1).build();

    /** The 13 types LM-320 names: every *ResponseProto and the index-composition requests and responses. */
    private static final List<String> NAMED = List.of(
            "fintekkers.requests.price.CreatePriceResponseProto",
            "fintekkers.requests.price.QueryPriceResponseProto",
            "fintekkers.requests.security.CreateSecurityResponseProto",
            "fintekkers.requests.security.QuerySecurityResponseProto",
            "fintekkers.requests.portfolio.CreatePortfolioResponseProto",
            "fintekkers.requests.portfolio.QueryPortfolioResponseProto",
            "fintekkers.requests.transaction.CreateTransactionResponseProto",
            "fintekkers.requests.transaction.QueryTransactionResponseProto",
            "fintekkers.requests.position.QueryPositionResponseProto",
            "fintekkers.requests.index_composition.CreateIndexCompositionRequestProto",
            "fintekkers.requests.index_composition.CreateIndexCompositionResponseProto",
            "fintekkers.requests.index_composition.GetIndexCompositionRequestProto",
            "fintekkers.requests.index_composition.GetIndexCompositionResponseProto");

    /** Walked full name to its generated Java class name. */
    private static Map<String, String> walked;

    @BeforeAll
    static void walk() throws IOException {
        assertTrue(Files.exists(DESCRIPTOR_SET), "descriptor set not found at " + DESCRIPTOR_SET.toAbsolutePath());
        walked = new LinkedHashMap<>();
        for (FileDescriptorProto file : FileDescriptorSet.parseFrom(Files.readAllBytes(DESCRIPTOR_SET)).getFileList()) {
            String prefix = javaPackage(file) + "." + (file.getOptions().getJavaMultipleFiles() ? "" : outerClassName(file) + "$");
            for (DescriptorProto message : file.getMessageTypeList()) {
                walk(file.getPackage() + "." + message.getName(), prefix + message.getName(), message);
            }
        }
    }

    private static void walk(String fullName, String className, DescriptorProto message) {
        for (FieldDescriptorProto field : message.getFieldList()) {
            if (field.getNumber() == 1 && field.getTypeName().equals(OBJECT_TYPE_ENUM)) {
                walked.put(fullName, className);
            }
        }
        for (DescriptorProto nested : message.getNestedTypeList()) {
            walk(fullName + "." + nested.getName(), className + "$" + nested.getName(), nested);
        }
    }

    private static String javaPackage(FileDescriptorProto file) {
        return file.getOptions().hasJavaPackage() ? file.getOptions().getJavaPackage() : file.getPackage();
    }

    /** protoc's outer class: java_outer_classname, else the file name in CamelCase, plus OuterClass on a clash. */
    private static String outerClassName(FileDescriptorProto file) {
        if (file.getOptions().hasJavaOuterClassname()) {
            return file.getOptions().getJavaOuterClassname();
        }
        String base = Path.of(file.getName()).getFileName().toString().replaceFirst("\\.proto$", "");
        StringBuilder camel = new StringBuilder();
        boolean upper = true;
        for (char c : base.toCharArray()) {
            if (c == '_') {
                upper = true;
            } else if (Character.isDigit(c)) {
                camel.append(c);
                upper = true;
            } else {
                camel.append(upper ? Character.toUpperCase(c) : c);
                upper = false;
            }
        }
        String name = camel.toString();
        Set<String> topLevel = new HashSet<>();
        file.getMessageTypeList().forEach(m -> topLevel.add(m.getName()));
        file.getEnumTypeList().forEach(e -> topLevel.add(e.getName()));
        file.getServiceList().forEach(s -> topLevel.add(s.getName()));
        return topLevel.contains(name) ? name + "OuterClass" : name;
    }

    private static Message.Builder newBuilder(String fullName) {
        String className = walked.get(fullName);
        try {
            return (Message.Builder) Class.forName(className).getMethod("newBuilder").invoke(null);
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(fullName + ": no generated class " + className, e);
        }
    }

    /** The walked names that {@code lookup} has no own type for. */
    static List<String> missingTypes(Iterable<String> walked, Function<String, Optional<ObjectTypeProto>> lookup) {
        List<String> missing = new ArrayList<>();
        walked.forEach(name -> {
            if (lookup.apply(name).isEmpty()) {
                missing.add(name);
            }
        });
        return missing;
    }

    private static Optional<ObjectTypeProto> lookup(String fullName) {
        return ObjectTypes.ownType(newBuilder(fullName).getDescriptorForType());
    }

    /** The value the naming rule gives: message name without Proto, in SCREAMING_SNAKE, prefixed OBJECT_TYPE_. */
    private static ObjectTypeProto expectedType(String fullName) {
        String name = fullName.substring(fullName.lastIndexOf('.') + 1).replaceFirst("Proto$", "");
        String snake = name.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
        return ObjectTypeProto.valueOf("OBJECT_TYPE_" + snake);
    }

    @Test
    void theWalkFindsEveryTypedMessageIncludingTheNamedOnes() {
        assertTrue(walked.size() >= 49, "walk found only " + walked.size() + " messages");
        for (String name : NAMED) {
            assertTrue(walked.containsKey(name), "walk is missing " + name);
        }
    }

    @Test
    void filesWithoutJavaPackageResolve() {
        for (String name : List.of(
                "fintekkers.models.util.DateRangeProto",
                "fintekkers.models.util.api.API_Key",
                "fintekkers.models.util.lock.NodeState",
                "fintekkers.models.util.lock.NodePartition")) {
            assertEquals(name, newBuilder(name).getDescriptorForType().getFullName());
        }
    }

    @Test
    void everyTypedMessageHasAnOwnType() {
        assertEquals(List.of(), missingTypes(walked.keySet(), ObjectTypeCoverageTest::lookup));
    }

    @Test
    void aMissingEntryIsReported() {
        String dropped = "fintekkers.requests.price.QueryPriceResponseProto";
        Function<String, Optional<ObjectTypeProto>> without = name -> name.equals(dropped) ? Optional.empty() : lookup(name);
        assertEquals(List.of(dropped), missingTypes(walked.keySet(), without));
    }

    @Test
    void stampingEachWalkedMessageSetsItsOwnTypeAndVersion() {
        Set<ObjectTypeProto> seen = new HashSet<>();
        for (String name : walked.keySet()) {
            Message stamped = ObjectTypes.stampOwn(newBuilder(name)).build();
            ObjectTypeProto expected = expectedType(name);
            assertNotEquals(ObjectTypeProto.OBJECT_TYPE_UNKNOWN, expected, name);
            assertEquals(expected, ObjectTypes.readType(stamped), name);
            assertEquals(Optional.of(V_0_0_1), ObjectTypes.readVersion(stamped), name);
            assertTrue(seen.add(expected), name + " shares " + expected + " with another message");
        }
        assertTrue(seen.containsAll(NAMED.stream().map(ObjectTypeCoverageTest::expectedType).collect(Collectors.toList())));
    }

    @Test
    void theLm318EntriesKeepTheirValues() {
        Map<String, ObjectTypeProto> lm318 = new LinkedHashMap<>();
        lm318.put("fintekkers.models.portfolio.PortfolioProto", ObjectTypeProto.OBJECT_TYPE_PORTFOLIO);
        lm318.put("fintekkers.models.position.PositionProto", ObjectTypeProto.OBJECT_TYPE_POSITION);
        lm318.put("fintekkers.models.position.PositionFilterProto", ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER);
        lm318.put("fintekkers.models.price.PriceProto", ObjectTypeProto.OBJECT_TYPE_PRICE);
        lm318.put("fintekkers.models.security.IdentifierProto", ObjectTypeProto.OBJECT_TYPE_IDENTIFIER);
        lm318.put("fintekkers.models.security.SecurityProto", ObjectTypeProto.OBJECT_TYPE_SECURITY);
        lm318.put("fintekkers.models.security.TenorProto", ObjectTypeProto.OBJECT_TYPE_TENOR);
        lm318.put("fintekkers.models.strategy.StrategyProto", ObjectTypeProto.OBJECT_TYPE_STRATEGY);
        lm318.put("fintekkers.models.strategy.StrategyAllocationProto", ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION);
        lm318.put("fintekkers.models.transaction.TransactionProto", ObjectTypeProto.OBJECT_TYPE_TRANSACTION);
        lm318.put("fintekkers.requests.portfolio.CreatePortfolioRequestProto", ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST);
        lm318.put("fintekkers.requests.portfolio.QueryPortfolioRequestProto", ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST);
        lm318.put("fintekkers.requests.price.CreatePriceRequestProto", ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST);
        lm318.put("fintekkers.requests.price.QueryPriceRequestProto", ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST);
        lm318.put("fintekkers.requests.security.CreateSecurityRequestProto", ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST);
        lm318.put("fintekkers.requests.security.QuerySecurityRequestProto", ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST);
        lm318.put("fintekkers.requests.transaction.CreateTransactionRequestProto", ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST);
        lm318.put("fintekkers.requests.transaction.QueryTransactionRequestProto", ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST);
        lm318.forEach((name, type) -> assertEquals(Optional.of(type), lookup(name), name));
    }

    @Test
    void stampOwnOnAMessageWithoutObjectTypeNamesIt() {
        Descriptor uuid = UUIDProto.getDescriptor();
        assertEquals(Optional.empty(), ObjectTypes.ownType(uuid));
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> ObjectTypes.stampOwn(UUIDProto.newBuilder()));
        assertTrue(e.getMessage().contains(uuid.getFullName()), e.getMessage());
    }
}
