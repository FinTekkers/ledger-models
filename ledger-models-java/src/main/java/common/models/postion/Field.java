package common.models.postion;

import common.models.portfolio.Portfolio;
import common.models.price.Price;
import common.models.security.ProductType;
import common.models.security.Security;
import common.models.security.Tenor;
import common.models.security.identifier.Identifier;
import common.models.strategy.Strategy;
import common.models.transaction.TransactionType;
import fintekkers.models.position.PositionStatusProto;
import fintekkers.models.transaction.TransactionTypeProto;

import java.time.LocalDate;
import java.util.UUID;

/***
 * Position will need a number of fields depending on the circumstance. For example, to calculate
 * cost basis the position needs the cost basis. There are a couple options for modelling this:
 *    * Use the weighted average cost basis, and have a single position instance
 *    * Use multiple position objects and return one position per unique cost basis (and/or trade/settlement date)
 *
 * For the latter, the position aggregator will need to be evolved to make it easy to source
 * data at multiple levels
 */

public enum Field {
    ID(UUID.class, "A UUID representing the primary key of the record. This is a system field used " +
            "to ensure uniqueness of data, e.g. for circumstances such as when two bonds have the same security " +
            "identifier, but represent different instruments"),

    // Attribute fields. Likely to be fields that one would pivot on.
    EFFECTIVE_DATE(LocalDate.class, "The date to be used to derive data that is time-sensitive. For " +
            "example when a valuation of a market value occurs, the effective date would be used to define the " +
            "market data to source for the valuation"),
    STRATEGY(Strategy.class, "The strategy used to derive why a specific transaction " +
            "has been executed. Can be leveraged for hypothetical trades also, and will carry through to tax lots"),
    IS_CANCELLED(Boolean.class, "Represents whether an object version has been cancelled, whether by the " +
            "user or for system reasons"),
    POSITION_STATUS(PositionStatusProto.class, "Represents the stage of the lifecycle of a transaction which " +
            "carries through to tax lots. 1/ Hypothetical is used when exploring potential changes to a portfolio. " +
            "2/ Intended is used when the a transaction is expected to be executed but hasn't yet. " +
            "3/ Executed signifies the stage at which a transaction has been legally executed. " +
            "Note, this field does not models clearing nor settlement status"),

    //Security fields
    SECURITY(Security.class, "A fully fledged security object"),
    SECURITY_ID(UUID.class, "A UUID specific to securities"),
    IDENTIFIER(Identifier.class, "The market identifier for a security instrument"),
    SECURITY_DESCRIPTION(String.class, "A human readable description of a security. This is meant for " +
            "display purposes only. This is not meant for interpretation by code. The system may introduce small " +
            "variations of descriptions explicitly to disincentive mis-use of this field"),
    MATURITY_DATE(LocalDate.class, "The date that the security or trade matures. A bond's maturity date " +
            "is self-explanatory. A cash equity is a perpetual security and the maturity date will be arbitrarily " +
            "far in the future."),

    CASH_IMPACT_SECURITY(Security.class, "A fully fledged security object representing" +
            " a cash instrument. Generally any security transaction will have an offsetting cash transaction " +
            "representing the flow of funds. Note, this isn't always guaranteed to exist. Securities that have a " +
            "zero NPV on initiation (e.g. IRS, CDS ,etc) may not have a cash impact."),

    //Portfolio Fields

    PORTFOLIO(Portfolio.class, "A fully fledged portfolio object"),
    PORTFOLIO_ID(UUID.class, "A UUID specific to portfolios"),
    PORTFOLIO_NAME(String.class, "The name of the portfolio"),
    PORTFOLIO_OWNER(String.class, "The owner of a portfolio"),

    //Price
    PRICE(Price.class, "A fully fledged price object"),

    //Transaction only
    TRADE_DATE(LocalDate.class, "The date a legal agreement is made on a transaction. This may differ " +
            "from spot date when we get to edge cases such as JGBs"),
    SETTLEMENT_DATE(LocalDate.class, "The date that the settlement of a security occurs, i.e. the date " +
            "that the buyer of a security is officially registered as the owner"),
    TRANSACTION_TYPE(TransactionType.class, "The type of transaction, such as Buy, Sell, Deposit, Withdrawal, " +
            "and so on"),

    //Tax Lot only
    TAX_LOT_OPEN_DATE(LocalDate.class, "The date a tax lot is established for a given portfolio and security"),
    TAX_LOT_CLOSE_DATE(LocalDate.class, "The date a tax lot transitioned from having an open quantity to " +
            "not having any quantity remaining"),

    //Security Fields
    ASSET_CLASS(String.class, "The theme of the security, FixedIncome, Equity, and so on. Please see " +
            "<TODO> for modelling your own asset class hierarchy"), //FixedIncome, Equity, etc
    PRODUCT_CLASS(String.class, "The financial product, as modelled in the system. These are the " +
            "representations used to express financial instruments in code. "+ productExplanation()), //Bond, CashEquity, etc
    PRODUCT_TYPE(String.class, "The financial product, as modelled by the financial world. Currently " +
            "this is static. <TODO> for modelling your own product hierarchy. "+ productExplanation()),

    //To be implemented
    TENOR(Tenor.class, "The original tenor of the financial instrument. This will vary by product type: " +
            "equities essentially do not have a tenor per se, and therefore labelled perpetual. Bond securities generally" +
            " have a term upon initiating which will have a specific tenor value. Securities with uncertain " +
            "terms (e.g. callables, American options, etc) will exhibit their initial tenor with max tenor. "),
    ADJUSTED_TENOR(Tenor.class, String.format("Same concept as %s though adjusted for the current/asOf date. " +
            "For example a 30 year bond issued 20 years ago has a remaining time to maturity of 10 years, therefore " +
            "the adjusted tenor is 10 years.", TENOR.name()))
    ;


    private static String productExplanation() { return "An example is US treasuries. The US Treasury typically " +
            "models their bonds as Bills (short maturity, no coupon, issued at discount), Notes (intermediate tenor " +
            "securities with a coupon) & Bonds (long dated bonds, with a coupon). However all of these are modelled as" +
            "'Bond' in our system, as the system has the flexibility to define bonds as coupon or non-coupon paying " +
            "bonds.";}

    private final Class clazz;
    private final String description;

    Field(Class clazz, String description) {
        this.clazz = clazz;
        this.description = description;
    }

    public Class getType() {
        return this.clazz;
    }

    /**
     * @return A human-readable description that explains what the field represents.
     */
    public String getDescription() {
        return description;
    }

    public boolean validateFieldValue(Object value) {
        return value == EMPTY || this.getType().isAssignableFrom(value.getClass());
    }

    public static final Object EMPTY = new Object();
}
