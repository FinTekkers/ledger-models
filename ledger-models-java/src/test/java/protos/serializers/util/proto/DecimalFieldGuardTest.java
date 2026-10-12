package protos.serializers.util.proto;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-304 guardrails. DecimalCodec is the only main code that touches the
 * deprecated field 10, so LM-295 and LM-296 edit one file. And the codec has
 * no float, double or rounding anywhere: lossless or an error.
 */
class DecimalFieldGuardTest {

    private static final Path MAIN = Paths.get("src", "main", "java");
    private static final Path CODEC = MAIN.resolve(Paths.get("protos", "serializers", "util", "proto", "DecimalCodec.java"));
    private static final Pattern COMMENT_LINE = Pattern.compile("^\\s*(//|/?\\*)");
    private static final Pattern LOSSY = Pattern.compile(
            "\\b(double|float|Double|Float|doubleValue|floatValue|MathContext|RoundingMode)\\b");

    @Test
    public void onlyTheCodecTouchesTheDeprecatedString() throws IOException {
        List<String> hits = new ArrayList<>();
        List<Path> sources;
        try (Stream<Path> files = Files.walk(MAIN)) {
            sources = files.filter(p -> p.toString().endsWith(".java")).collect(Collectors.toList());
        }
        assertTrue(sources.contains(CODEC), CODEC.toString());
        for (Path p : sources) {
            if (p.equals(CODEC)) continue;
            List<String> lines = Files.readAllLines(p, StandardCharsets.UTF_8);
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                if (line.contains("ArbitraryPrecisionValue(") && !COMMENT_LINE.matcher(line).find()) {
                    hits.add(p + ":" + (i + 1) + ": " + line.trim());
                }
            }
        }
        assertTrue(hits.isEmpty(), "field 10 read or written outside DecimalCodec:\n" + String.join("\n", hits));
    }

    @Test
    public void codecHasNoFloatOrRounding() throws IOException {
        List<String> lines = Files.readAllLines(CODEC, StandardCharsets.UTF_8);
        List<String> hits = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            if (LOSSY.matcher(lines.get(i)).find()) hits.add((i + 1) + ": " + lines.get(i).trim());
        }
        assertTrue(hits.isEmpty(), "DecimalCodec must stay lossless:\n" + String.join("\n", hits));
    }
}
