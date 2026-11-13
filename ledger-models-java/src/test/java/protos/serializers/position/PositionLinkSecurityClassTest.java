package protos.serializers.position;

import com.google.protobuf.Any;
import com.google.protobuf.InvalidProtocolBufferException;
import common.models.postion.Field;
import common.models.postion.Position;
import common.models.security.BondSecurity;
import common.models.security.CashSecurity;
import common.models.security.Security;
import common.util.LinkCache;
import fintekkers.models.position.FieldMapEntry;
import fintekkers.models.position.FieldProto;
import fintekkers.models.position.PositionProto;
import fintekkers.models.position.PositionTypeProto;
import fintekkers.models.position.PositionViewProto;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-442: a position's security stored as a link reads as the class its
 * resolved product type implies — a Treasury link is a {@link BondSecurity},
 * and {@code Position.getField(MATURITY_DATE)} is the note's real maturity.
 * The link is resolved once, at deserialize, and written back unchanged.
 */
class PositionLinkSecurityClassTest {

    private static final ZonedDateTime AS_OF =
            ZonedDateTime.of(2026, 11, 4, 17, 0, 0, 0, ZoneId.of("America/New_York"));
    private static final LocalDate PLACEHOLDER = LocalDate.of(2999, 12, 31);
    private static final LocalDate MATURITY = LocalDate.of(2031, 5, 15);

    private final Security.Fetcher originalFetcher = Security.getFetcher();
    private final List<UUID> ids = new ArrayList<>();
    private final AtomicInteger fetches = new AtomicInteger();

    @BeforeEach
    void noFetcher() {
        Security.setFetcher(null);
    }

    @AfterEach
    void restore() {
        Security.setFetcher(originalFetcher);
        ids.forEach(LinkCache.SECURITY::evict);
    }

    private UUID newId() {
        UUID id = UUID.randomUUID();
        ids.add(id);
        LinkCache.SECURITY.evict(id);
        return id;
    }

    private static SecurityProto treasuryNote(UUID id) {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(ProductTypeProto.TREASURY_NOTE)
                .setIssuerName("US Government")
                .setBondDetails(BondDetailsProto.newBuilder()
                        .setIssueDate(ProtoSerializationUtil.serializeLocalDate(LocalDate.of(2024, 1, 15)))
                        .setMaturityDate(ProtoSerializationUtil.serializeLocalDate(MATURITY)))
                .build();
    }

    private static SecurityProto usd(UUID id) {
        return SecurityProto.newBuilder()
                .setUuid(ProtoSerializationUtil.serializeUUID(id))
                .setAsOf(ProtoSerializationUtil.serializeTimestamp(AS_OF))
                .setProductType(ProductTypeProto.CURRENCY)
                .setIssuerName("US Government")
                .build();
    }

    private static FieldMapEntry securityEntry(Field field, SecurityProto security) {
        return FieldMapEntry.newBuilder()
                .setField(FieldProto.valueOf(field.name()))
                .setFieldValuePacked(Any.pack(security))
                .build();
    }

    private static PositionProto positionOf(FieldMapEntry... entries) {
        PositionProto.Builder b = PositionProto.newBuilder()
                .setPositionType(PositionTypeProto.TRANSACTION)
                .setPositionView(PositionViewProto.DEFAULT_VIEW);
        for (FieldMapEntry e : entries) b.addFields(e);
        return b.build();
    }

    private static PositionProto linkPosition(UUID securityId) {
        return positionOf(securityEntry(Field.SECURITY, Security.linkOf(securityId, AS_OF)));
    }

    private static Position deserialize(PositionProto proto) {
        return PositionSerializer.getInstance().deserialize(proto);
    }

    private static SecurityProto securityIn(PositionProto proto, Field field) throws InvalidProtocolBufferException {
        for (FieldMapEntry e : proto.getFieldsList()) {
            if (e.getField() == FieldProto.valueOf(field.name())) {
                return e.getFieldValuePacked().unpack(SecurityProto.class);
            }
        }
        return fail("no " + field + " entry");
    }

    /** Counting stub fetcher that serves the given full protos by UUID. */
    private void serve(SecurityProto... full) {
        Security.setFetcher((id, asOf) -> {
            fetches.incrementAndGet();
            for (SecurityProto p : full) {
                if (ProtoSerializationUtil.deserializeUUID(p.getUuid()).equals(id)) return p;
            }
            return null;
        });
    }

    // ---- metric 1 ------------------------------------------------------

    @Test
    void treasuryLinkResolvesToBondSecurity() {
        UUID id = newId();
        serve(treasuryNote(id));

        Position position = deserialize(linkPosition(id));

        assertInstanceOf(BondSecurity.class, position.getField(Field.SECURITY));
    }

    // ---- metric 2 ------------------------------------------------------

    @Test
    void maturityDateComesFromResolvedNote() {
        UUID id = newId();
        SecurityProto note = treasuryNote(id);
        serve(note);

        Position position = deserialize(linkPosition(id));

        LocalDate expected = ProtoSerializationUtil.deserializeOptionalLocalDate(
                note.getBondDetails().getMaturityDate(), "maturity_date");
        assertEquals(expected, position.getField(Field.MATURITY_DATE));
        assertNotEquals(PLACEHOLDER, position.getField(Field.MATURITY_DATE));
    }

    /** A MATURITY_DATE entry with no value is absent (field.proto): the resolved note's maturity is read. */
    @Test
    void valuelessMaturityEntry() {
        UUID id = newId();
        serve(treasuryNote(id));
        PositionProto proto = positionOf(
                securityEntry(Field.SECURITY, Security.linkOf(id, AS_OF)),
                FieldMapEntry.newBuilder().setField(FieldProto.MATURITY_DATE).build());

        Position position = deserialize(proto);

        assertEquals(MATURITY, position.getField(Field.MATURITY_DATE));
    }

    // ---- metric 3 ------------------------------------------------------

    @Test
    void fetcherCalledAtMostOnce() {
        UUID id = newId();
        serve(treasuryNote(id));

        Position position = deserialize(linkPosition(id));
        position.getField(Field.SECURITY);
        position.getField(Field.MATURITY_DATE);
        position.getField(Field.SECURITY);

        assertTrue(fetches.get() <= 1, "fetches=" + fetches.get());
    }

    @Test
    void prewarmedCacheMeansNoFetch() {
        UUID id = newId();
        LinkCache.SECURITY.put(id, treasuryNote(id), AS_OF);
        serve(treasuryNote(id));

        Position position = deserialize(linkPosition(id));
        position.getField(Field.SECURITY);
        position.getField(Field.MATURITY_DATE);
        position.getField(Field.SECURITY);

        assertEquals(0, fetches.get());
        assertInstanceOf(BondSecurity.class, position.getField(Field.SECURITY));
        assertEquals(MATURITY, position.getField(Field.MATURITY_DATE));
    }

    // ---- guardrail: strip-on-write -------------------------------------

    @Test
    void reserializeKeepsLink() throws InvalidProtocolBufferException {
        UUID id = newId();
        serve(treasuryNote(id));
        PositionProto input = linkPosition(id);

        PositionProto output = PositionSerializer.getInstance().serialize(deserialize(input));

        SecurityProto written = securityIn(output, Field.SECURITY);
        assertTrue(written.getIsLink());
        assertEquals(securityIn(input, Field.SECURITY).toByteString(), written.toByteString());
    }

    @Test
    void cashImpactSecurityLinkRoundTrips() throws InvalidProtocolBufferException {
        UUID id = newId();
        serve(usd(id));
        PositionProto input = positionOf(
                securityEntry(Field.CASH_IMPACT_SECURITY, Security.linkOf(id, AS_OF)));

        Position position = deserialize(input);
        assertInstanceOf(CashSecurity.class, position.getField(Field.CASH_IMPACT_SECURITY));

        PositionProto output = PositionSerializer.getInstance().serialize(position);
        SecurityProto written = securityIn(output, Field.CASH_IMPACT_SECURITY);
        assertTrue(written.getIsLink());
        assertEquals(securityIn(input, Field.CASH_IMPACT_SECURITY).toByteString(), written.toByteString());
    }

    @Test
    void replacingSecurityDropsStaleLink() throws InvalidProtocolBufferException {
        UUID id = newId();
        serve(treasuryNote(id));
        Position position = deserialize(linkPosition(id));

        Security replacement = Security.fromProto(treasuryNote(newId()));
        position.setFieldValue(Field.SECURITY, replacement);

        SecurityProto written = securityIn(PositionSerializer.getInstance().serialize(position), Field.SECURITY);
        assertFalse(written.getIsLink());
        assertEquals(replacement.getProto(), written);
    }

    @Test
    void fullSecurityPositionSerializesAsBefore() throws InvalidProtocolBufferException {
        UUID id = newId();
        serve(treasuryNote(id));
        PositionProto input = positionOf(securityEntry(Field.SECURITY, treasuryNote(id)));

        Position position = deserialize(input);
        PositionProto output = PositionSerializer.getInstance().serialize(position);

        assertEquals(securityIn(input, Field.SECURITY), securityIn(output, Field.SECURITY));
        assertNull(position.getSecurityWireForm(Field.SECURITY));
        assertEquals(0, fetches.get());
    }

    // ---- guardrail: no fetcher -----------------------------------------

    @Test
    void noFetcherKeepsLinkAndDoesNotThrow() {
        UUID id = newId();

        Position position = assertDoesNotThrow(() -> deserialize(linkPosition(id)));

        Security security = (Security) position.getField(Field.SECURITY);
        assertTrue(security.isLink());
        assertEquals(id, security.getID());
        assertEquals(AS_OF.toInstant(), security.getAsOf().toInstant());
        assertNull(assertDoesNotThrow(() -> position.getField(Field.MATURITY_DATE)));
    }
}
