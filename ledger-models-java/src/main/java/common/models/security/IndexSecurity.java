package common.models.security;

import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.index.IndexTypeProto;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Reference-only security for index products (e.g. CPI-U, SOFR, S&P 500).
 *
 * <p>Post-#338 refactor: thin proto wrapper.
 */
public class IndexSecurity extends Security {

    /** Primary constructor — wraps a SecurityProto. */
    public IndexSecurity(SecurityProto proto) {
        super(proto);
    }

    /** @deprecated Field-by-field test helper. */
    @Deprecated
    public IndexSecurity(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    public IndexTypeProto getIndexType() {
        SecurityProto active = getProto();
        if (!active.hasIndexDetails()) {
            return IndexTypeProto.UNKNOWN_INDEX_TYPE;
        }
        return active.getIndexDetails().getIndexType();
    }
}
