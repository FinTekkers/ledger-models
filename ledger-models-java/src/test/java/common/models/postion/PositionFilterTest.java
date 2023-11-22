package common.models.postion;

import common.models.IFinancialModelObject;
import common.models.portfolio.Portfolio;
import common.models.security.BondSecurity;
import common.models.security.Security;
import org.junit.jupiter.api.Test;
import testutil.DummyBondObjects;
import testutil.DummyEquityObjects;

import java.time.LocalDate;
import java.util.ArrayList;
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
}