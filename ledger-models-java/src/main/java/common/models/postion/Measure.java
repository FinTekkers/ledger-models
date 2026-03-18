package common.models.postion;

import fintekkers.models.position.MeasureProto;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A measure is a financial unit that describes a security and/or a position's characteristic. A measure
 * could be pivoted by attributes.
 */
public enum Measure {
    DIRECTED_QUANTITY("The number of units of a given instrument. See {{Security.QuantityType}} for " +
            "instruction as to what the unit refers to. Generally, the idea is for the directed quantity to display " +
            "in a way that resonates with portfolio managers." +
            System.lineSeparator() + System.lineSeparator() +
            "Note that you may observe differences when comparing across transactions and tax lots, or across asset " +
            "types. For example, when creating a buy transaction on a bond, the tax lot will show a directed quantity " +
            "of the face amount. However the corresponding impact on cash of the bond will be based on the " +
            "'transacted value'. So if you buy 1 bond @ $99 with par of $100. The directed quantity for the bond tax " +
            "lot will be $100. However the cash impact is $99, hence you will see a tax lot impact on the cash " +
            "security."), //TODO: I'm not liking this approach. Currently it seems like tax lots are off

    MARKET_VALUE("The mark-to-market value of a given position, use prevailing market data."),

    UNADJUSTED_COST_BASIS("The unadjusted price of a tax lot when established"),

    ADJUSTED_COST_BASIS("The unadjusted price of a tax lot, then adjusted for changes in cost-basis. " +
            "For example, accretions/amortizations on bonds; return of capital on cash equities; etc"),

    CURRENT_YIELD("The current yield of the security, essentially coupon / current price. " +
            "For equity securities, TTM dividends are used as a coupon equivalent."),

    YIELD_TO_MATURITY("The yield if the security is held to maturity. For bonds this is calculated " +
            "using the standard YTM formula. Not applicable to equity securities."),

    MACAULAY_DURATION("The weighted average time to receive the bond's cash flows, measured in years.");

    static {
        Set<String> measureNames = Arrays.stream(Measure.values())
                .map(Enum::name)
                .collect(Collectors.toSet());

        for (MeasureProto proto : MeasureProto.values()) {
            if (proto == MeasureProto.UNKNOWN_MEASURE || proto == MeasureProto.UNRECOGNIZED) continue;
            if (!measureNames.contains(proto.name())) {
                System.err.println(
                        "MeasureProto." + proto.name() + " has no corresponding Measure enum constant. " +
                        "Add it to common.models.postion.Measure.");
            }
        }
    }

    private final Class clazz;
    private final String description;

    Measure(String description) {
        this.description = description;
        this.clazz = BigDecimal.class;
    }

    Class getType() {
        return this.clazz;
    }

    public String getDescription() {
        return description;
    }
}