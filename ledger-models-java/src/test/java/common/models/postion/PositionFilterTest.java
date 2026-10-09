package common.models.postion;

import common.models.IFinancialModelObject;
import common.models.portfolio.Portfolio;
import common.models.security.BondSecurity;
import common.models.security.Security;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PositionFilterTest {
    @Test
    public void testEquals() {
        Portfolio portfolio = DummyEquityObjects.getDummyPortfolio();
        List<IFinancialModelObject> portfolios = new ArrayList<>() {{
            add(portfolio);
        }};

        PositionFilter filter = PositionFilter.fromString(Field.PORTFOLIO_NAME, portfolio.getPortfolioName());
        portfolios = PositionFilter.filter(portfolios, filter);
        assertEquals(1, portfolios.size());

        filter = PositionFilter.fromString(Field.PORTFOLIO_NAME, "Doesn't match");
        portfolios = PositionFilter.filter(portfolios, filter);
        assertEquals(0, portfolios.size());
    }

    @Test
    public void testMoreThan() {
        BondSecurity security = DummyBondObjects.getDummySecurity();
        List<Security> securities = new ArrayList<>() {{ add(security);}};

        //Check the security maturity date is beyond today
        PositionFilter filter = PositionFilter.from(Field.MATURITY_DATE,
                PositionFilter.Operator.MORE_THAN,
                LocalDate.now());
        securities = PositionFilter.filter(securities, filter);
        assertEquals(1, securities.size());

        //Check the security maturity date is over 100 years from now (shouldn't match)
        filter = PositionFilter.from(Field.MATURITY_DATE,
                PositionFilter.Operator.MORE_THAN,
                LocalDate.now().plusYears(100));
        securities = PositionFilter.filter(securities, filter);
        assertEquals(0, securities.size());


        //Check the security maturity date is under 100 years from now (should be)
        securities = new ArrayList<>() {{ add(security);}}; //Need to reinitialize the list as it was filtered out above
        filter = PositionFilter.from(Field.MATURITY_DATE,
                PositionFilter.Operator.LESS_THAN,
                LocalDate.now().plusYears(200));
        securities = PositionFilter.filter(securities, filter);
        assertEquals(1, securities.size());
    }

    @Test
    public void testNulls() {
        final BondSecurity security = DummyBondObjects.getDummySecurity();
        security.setMaturityDate(null);
        List<Security> securities = new ArrayList<>() {{ add(security);}};

        //Check the security maturity date is beyond today
        PositionFilter filter = PositionFilter.from(Field.MATURITY_DATE,
                PositionFilter.Operator.MORE_THAN,
                LocalDate.now());
        securities = PositionFilter.filter(securities, filter);
        assertEquals(0, securities.size());


        final BondSecurity security2 = DummyBondObjects.getDummySecurity();
        securities = new ArrayList<>() {{ add(security2);}};
        filter = PositionFilter.from(Field.MATURITY_DATE,
                PositionFilter.Operator.LESS_THAN,
                null);
        securities = PositionFilter.filter(securities, filter);
        assertEquals(1, securities.size());
    }

    private static Position positionWith(Field field, Object value, ZonedDateTime asOf) {
        Position position = new Position(Position.PositionType.TRANSACTION);
        position.setAsOfDate(asOf);
        position.setFieldValue(field, value);
        return position;
    }

    private static PositionFilter assetClassFilter(PositionFilter.Operator operator, ZonedDateTime asOf) {
        PositionFilter filter = new PositionFilter(asOf);
        filter.addFilter(Field.ASSET_CLASS, operator, "FIXED_INCOME");
        return filter;
    }

    @Test
    public void testAssetClassEqualsMatchesGroupMembers() {
        ZonedDateTime filterAsOf = ZonedDateTime.now();
        ZonedDateTime rowAsOf = filterAsOf.minusDays(1);
        Position rates = positionWith(Field.ASSET_CLASS, "RATES", rowAsOf);
        Position credit = positionWith(Field.ASSET_CLASS, "CREDIT", rowAsOf);
        Position fixedIncome = positionWith(Field.ASSET_CLASS, "Fixed Income", rowAsOf);
        Position equity = positionWith(Field.ASSET_CLASS, "EQUITY", rowAsOf);
        List<Position> rows = new ArrayList<>(Arrays.asList(rates, credit, fixedIncome, equity));

        List<Position> result = PositionFilter.filter(rows, assetClassFilter(PositionFilter.Operator.EQUALS, filterAsOf));

        assertEquals(Arrays.asList(rates, credit, fixedIncome), result);
    }

    @Test
    public void testAssetClassNotEqualsKeepsOnlyNonMembers() {
        ZonedDateTime filterAsOf = ZonedDateTime.now();
        ZonedDateTime rowAsOf = filterAsOf.minusDays(1);
        Position rates = positionWith(Field.ASSET_CLASS, "RATES", rowAsOf);
        Position credit = positionWith(Field.ASSET_CLASS, "CREDIT", rowAsOf);
        Position fixedIncome = positionWith(Field.ASSET_CLASS, "Fixed Income", rowAsOf);
        Position equity = positionWith(Field.ASSET_CLASS, "EQUITY", rowAsOf);
        List<Position> rows = new ArrayList<>(Arrays.asList(rates, credit, fixedIncome, equity));

        List<Position> result = PositionFilter.filter(rows, assetClassFilter(PositionFilter.Operator.NOT_EQUALS, filterAsOf));

        assertEquals(Arrays.asList(equity), result);
    }

    @Test
    public void testAssetClassNullEmptyUnknownNeverThrow() {
        ZonedDateTime filterAsOf = ZonedDateTime.now();
        ZonedDateTime rowAsOf = filterAsOf.minusDays(1);
        Position nullRow = positionWith(Field.ASSET_CLASS, null, rowAsOf);
        Position emptyRow = positionWith(Field.ASSET_CLASS, "", rowAsOf);
        Position unknownRow = positionWith(Field.ASSET_CLASS, "NOT_A_CLASS", rowAsOf);
        List<Position> rows = new ArrayList<>(Arrays.asList(nullRow, emptyRow, unknownRow));

        List<Position> equalsResult = assertDoesNotThrow(
                () -> PositionFilter.filter(rows, assetClassFilter(PositionFilter.Operator.EQUALS, filterAsOf)));
        assertTrue(equalsResult.isEmpty());

        List<Position> notEqualsResult = assertDoesNotThrow(
                () -> PositionFilter.filter(rows, assetClassFilter(PositionFilter.Operator.NOT_EQUALS, filterAsOf)));
        assertEquals(Arrays.asList(nullRow, emptyRow, unknownRow), notEqualsResult);
    }

    @Test
    public void testNonAssetClassEqualsAndNotEquals() {
        ZonedDateTime filterAsOf = ZonedDateTime.now();
        ZonedDateTime rowAsOf = filterAsOf.minusDays(1);
        LocalDate d1 = LocalDate.of(2030, 1, 1);
        LocalDate d2 = LocalDate.of(2032, 5, 16);
        Position a = positionWith(Field.MATURITY_DATE, d1, rowAsOf);
        Position b = positionWith(Field.MATURITY_DATE, d2, rowAsOf);
        Position c = positionWith(Field.MATURITY_DATE, d2, rowAsOf);
        List<Position> rows = new ArrayList<>(Arrays.asList(a, b, c));

        PositionFilter equals = new PositionFilter(filterAsOf);
        equals.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.EQUALS, d2);
        assertEquals(Arrays.asList(b, c), PositionFilter.filter(rows, equals));

        PositionFilter notEquals = new PositionFilter(filterAsOf);
        notEquals.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.NOT_EQUALS, d2);
        assertEquals(Arrays.asList(a), PositionFilter.filter(rows, notEquals));
    }

    @Test
    public void testOrderingOperators() {
        ZonedDateTime filterAsOf = ZonedDateTime.now();
        ZonedDateTime rowAsOf = filterAsOf.minusDays(1);
        LocalDate d1 = LocalDate.of(2030, 1, 1);
        LocalDate d2 = LocalDate.of(2031, 6, 15);
        LocalDate d3 = LocalDate.of(2032, 12, 31);
        Position below = positionWith(Field.MATURITY_DATE, d1, rowAsOf);
        Position equal = positionWith(Field.MATURITY_DATE, d2, rowAsOf);
        Position above = positionWith(Field.MATURITY_DATE, d3, rowAsOf);
        List<Position> rows = new ArrayList<>(Arrays.asList(below, equal, above));

        PositionFilter moreThan = new PositionFilter(filterAsOf);
        moreThan.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.MORE_THAN, d2);
        assertEquals(Arrays.asList(above), PositionFilter.filter(rows, moreThan));

        PositionFilter moreThanOrEquals = new PositionFilter(filterAsOf);
        moreThanOrEquals.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.MORE_THAN_OR_EQUALS, d2);
        assertEquals(Arrays.asList(equal, above), PositionFilter.filter(rows, moreThanOrEquals));

        PositionFilter lessThan = new PositionFilter(filterAsOf);
        lessThan.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.LESS_THAN, d2);
        assertEquals(Arrays.asList(below), PositionFilter.filter(rows, lessThan));

        PositionFilter lessThanOrEquals = new PositionFilter(filterAsOf);
        lessThanOrEquals.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.LESS_THAN_OR_EQUALS, d2);
        assertEquals(Arrays.asList(below, equal), PositionFilter.filter(rows, lessThanOrEquals));
    }

    @Test
    public void testNotEqualsDropsNullOnOtherFields() {
        // LM-284 owner ruling: null stored values never throw, and on fields
        // other than ASSET_CLASS NOT_EQUALS drops the row, as filter did
        // before LM-281. Only ASSET_CLASS keeps a null under NOT_EQUALS.
        ZonedDateTime filterAsOf = ZonedDateTime.now();
        ZonedDateTime rowAsOf = filterAsOf.minusDays(1);
        LocalDate d1 = LocalDate.of(2030, 1, 1);
        Position row = positionWith(Field.MATURITY_DATE, null, rowAsOf);
        List<Position> rows = new ArrayList<>(Arrays.asList(row));

        PositionFilter notEquals = new PositionFilter(filterAsOf);
        notEquals.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.NOT_EQUALS, d1);
        assertTrue(PositionFilter.filter(rows, notEquals).isEmpty());

        PositionFilter equals = new PositionFilter(filterAsOf);
        equals.addFilter(Field.MATURITY_DATE, PositionFilter.Operator.EQUALS, d1);
        assertTrue(PositionFilter.filter(rows, equals).isEmpty());
    }

    // Cases come from ledger-models-protos/fixtures/position_filter_null_cases.json,
    // shared with the JS, Python and Rust tests (LM-284).
    @Test
    public void testNullCasesSharedFixture() throws IOException {
        Path path = Paths.get("..", "ledger-models-protos", "fixtures", "position_filter_null_cases.json");
        JsonObject root;
        try (Reader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            root = new Gson().fromJson(r, JsonObject.class);
        }
        JsonArray cases = root.getAsJsonArray("cases");
        assertTrue(cases.size() >= 7, "fixture has too few cases");
        for (JsonElement e : cases) {
            JsonObject c = e.getAsJsonObject();
            Field field = Field.valueOf(c.get("field").getAsString());
            PositionFilter.Operator operator = PositionFilter.Operator.valueOf(c.get("operator").getAsString());
            String filterValue = c.get("filter").getAsString();
            boolean expected = c.get("expected").getAsBoolean();
            assertEquals(expected,
                    PositionFilter.matches(field, new PositionFilter.PositionComparator(operator, filterValue), null),
                    field + " " + operator + " " + filterValue + " on null");
        }
    }
}