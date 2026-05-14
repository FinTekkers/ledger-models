package common.models.security;

import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.index.IndexTypeProto;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Reference-only security for index products (e.g. CPI-U, SOFR, S&P 500).
 * Carries an {@link IndexTypeProto} via the stashed proto's
 * {@code index_details.index_type} (the non_bond_details oneof variant).
 *
 * <p>Index securities are observational — they have a price/level over
 * time but are not directly positionable in the same way as bonds or
 * equities. The constituent set, when materialized, lives on
 * {@code IndexDetailsProto.constituents}.
 */
public class IndexSecurity extends Security {

    public IndexSecurity(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    /**
     * The kind of index this security represents (e.g. CPI_U, SOFR,
     * EQUITY_INDEX). Reads from the stashed proto's
     * {@code index_details.index_type}; returns {@code UNKNOWN_INDEX_TYPE}
     * if no index_details are present.
     */
    public IndexTypeProto getIndexType() {
        SecurityProto proto = getSecurityProto();
        if (proto == null || !proto.hasIndexDetails()) {
            return IndexTypeProto.UNKNOWN_INDEX_TYPE;
        }
        return proto.getIndexDetails().getIndexType();
    }
}
