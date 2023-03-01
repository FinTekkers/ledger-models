package common.models.security;

/**
 * The type of security, as modelled in code. This should not be used for business purposes
 * as code might be refactored.
 */
public enum ProductType {
    FRN("FRN", "Floating Rate Note (FRN)"),
    TIPS("TIPS", "Treasury Inflation Protected Security (TIPS)"),
    BILL("Bill", "Treasury Bill"),
    NOTE("Note", "Treasury Note"),
    BOND("Bond", "Treasury Bond"),
    EQUITY("Equity", "Cash Equity"),
    CASH("Cash", "Cash"),
    UNCLASSIFIED("N/A", "Unclassified");

    private final String shortName;
    private final String longName;

    ProductType(String shortName, String longName) {
        this.shortName = shortName;
        this.longName = longName;
    }

    public String getShortName() {
        return shortName;
    }

    public String getLongName() {
        return longName;
    }
}
