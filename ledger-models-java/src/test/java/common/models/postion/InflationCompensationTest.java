package common.models.postion;

import fintekkers.models.position.MeasureProto;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * LM-433: MeasureProto.INFLATION_COMPENSATION resolves by name to the number
 * declared in measure.proto, which is read here rather than written down.
 */
class InflationCompensationTest {

    private static final Path MEASURE_PROTO =
            Path.of("..", "ledger-models-protos", "fintekkers", "models", "position", "measure.proto");

    private static int declaredNumber() throws IOException {
        Matcher m = Pattern.compile("(?m)^\\s*INFLATION_COMPENSATION\\s*=\\s*(\\d+)\\s*;")
                .matcher(Files.readString(MEASURE_PROTO));
        assertTrue(m.find(), "INFLATION_COMPENSATION is not declared in measure.proto");
        return Integer.parseInt(m.group(1));
    }

    @Test
    void resolvesByNameToTheNumberInMeasureProto() throws IOException {
        int number = declaredNumber();
        assertEquals(number, MeasureProto.valueOf("INFLATION_COMPENSATION").getNumber());
        assertEquals(MeasureProto.INFLATION_COMPENSATION, MeasureProto.forNumber(number));
    }

    @Test
    void hasAMeasureConstant() {
        assertEquals("INFLATION_COMPENSATION", Measure.valueOf("INFLATION_COMPENSATION").name());
    }
}
