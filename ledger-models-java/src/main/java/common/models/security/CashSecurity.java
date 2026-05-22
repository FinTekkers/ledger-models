package common.models.security;

import common.models.security.identifier.Identifier;
import common.models.security.identifier.IdentifierType;
import fintekkers.models.security.CashDetailsProto;
import fintekkers.models.security.IdentifierProto;
import fintekkers.models.security.IdentifierTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.util.Uuid.UUIDProto;
import com.google.protobuf.ByteString;

import java.nio.ByteBuffer;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

/***
 * Cash security. Currency identity lives on the active proto's
 * {@code cash_details.cash_id} via the {@code non_bond_details} oneof.
 *
 * <p>Post-#338 refactor: thin proto wrapper.
 */
public class CashSecurity extends Security {

    public final static String ASSET_CLASS = "Cash";

    /** USD singleton — constructed via the proto path. */
    public final static CashSecurity USD = buildUsd();

    private static CashSecurity buildUsd() {
        UUID id = new UUID(1, 1);
        ZonedDateTime asOf = ZonedDateTime.of(
                1000, 1, 1, 0, 0, 0, 0, ZoneId.of("America/New_York"));
        return new CashSecurity(id, "USD", asOf);
    }

    /** Primary constructor — wraps a SecurityProto. */
    public CashSecurity(SecurityProto proto) {
        super(proto);
    }

    /**
     * @deprecated Field-by-field test helper. Builds a SecurityProto carrying
     *             {@code cash_details.cash_id = cashId}.
     */
    @Deprecated
    public CashSecurity(UUID id, String cashId, ZonedDateTime asOf) {
        super(buildCashProto(id, cashId, asOf));
        // Mirror the cash identifier into the subclass-visible list for
        // toString helpers. Avoid going through addIdentifier (which would
        // re-emit a duplicate into the overlay we just populated).
        this.identifiers.add(new Identifier(IdentifierType.CASH, cashId));
    }

    private static SecurityProto buildCashProto(UUID id, String cashId, ZonedDateTime asOf) {
        SecurityProto.Builder b = SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.CURRENCY)
                .setAssetClass(ASSET_CLASS);
        if (cashId != null) b.setIssuerName(cashId);
        if (id != null) b.setUuid(toUuidProto(id));
        if (asOf != null) {
            b.setAsOf(fintekkers.models.util.LocalTimestamp.LocalTimestampProto.newBuilder()
                    .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                            .setSeconds(asOf.toInstant().getEpochSecond())
                            .setNanos(asOf.toInstant().getNano())
                            .build())
                    .setTimeZone(asOf.getZone().getId())
                    .build());
        }
        if (cashId != null) {
            b.setCashDetails(CashDetailsProto.newBuilder().setCashId(cashId).build());
            b.addIdentifiers(IdentifierProto.newBuilder()
                    .setIdentifierType(IdentifierTypeProto.CASH)
                    .setIdentifierValue(cashId)
                    .build());
        }
        return b.build();
    }

    private static UUIDProto toUuidProto(UUID uuid) {
        ByteBuffer bb = ByteBuffer.allocate(16);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return UUIDProto.newBuilder().setRawUuid(ByteString.copyFrom(bb.array())).build();
    }

    @Override
    public String getAssetClass() {
        return ASSET_CLASS;
    }

    @Override
    public boolean isCash() {
        return true;
    }

    /**
     * Currency identifier (e.g. "USD"). Reads {@code cash_details.cash_id}.
     */
    public String getCashId() {
        SecurityProto active = getProto();
        if (active.hasCashDetails()) {
            return active.getCashDetails().getCashId();
        }
        return active.getIssuerName();
    }

    @Override
    public ProductTypeProto getProductType() {
        return ProductTypeProto.CURRENCY;
    }

    @Override
    protected ProductTypeProto getSubclassProductType() {
        return ProductTypeProto.CURRENCY;
    }

    @Override
    public String getDescription() {
        return getCashId();
    }
}
