package common.models.security;

import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.SecurityTypeProto;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

/***
 * Generally shouldn't be used except for tests, or absolute emergencies.
 */
public class CashSecurity extends Security {
    public final static CashSecurity USD = new CashSecurity(
            new UUID(1, 1),
            "USD",
            ZonedDateTime.of(1000, 1, 1, 0, 0, 0, 0, ZoneId.of("America/New_York"))
    ) {{ setIssuerName("US Government"); }};

    public final static String ASSET_CLASS = "Cash";
    private final String cashId;

    public CashSecurity(UUID id, String cashId, ZonedDateTime asOf) {
        super(id, cashId, asOf, null);
        this.cashId = cashId;
        this.identifier = new Identifier(IdentifierType.CASH, cashId);
    }

    @Override
    public String getAssetClass() {
        return ASSET_CLASS;
    }

    @Override
    public boolean isCash() {
        return true;
    }

    public String getCashId() {
        return cashId;
    }

    @Override
    public SecurityTypeProto getSecurityType() {
        return SecurityTypeProto.CASH_SECURITY;
    }

    @Override
    public String getDescription() {
        return this.identifier.getIdentifier();
    }

    @Override
    public ProductType getProductType() {
        return ProductType.CASH;
    }
}
