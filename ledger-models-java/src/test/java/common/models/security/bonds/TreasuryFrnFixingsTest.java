package common.models.security.bonds;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.models.security.BondSecurity;
import common.models.security.Tenor;
import common.models.security.TenorType;
import common.util.ObjectTypes;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.bond.IssuanceProto;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
import fintekkers.models.util.LocalDate.LocalDateProto;
import fintekkers.models.util.ObjectTypeProto;
import fintekkers.requests.valuation.ReferenceRateFixingProto;
import org.junit.jupiter.api.Test;
import protos.serializers.util.proto.ProtoSerializationUtil;
import testutil.Decimals;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LM-385: per-issuance tenor, standardBillTerm and select against the shared
 * fixture {@code test-fixtures/treasury-frn-fixings.json}. Python runs the
 * same cases with the same expected values.
 */
class TreasuryFrnFixingsTest {

    private static final Path FIXTURE = Path.of("..", "test-fixtures", "treasury-frn-fixings.json");

    private static JsonObject fixture() throws IOException {
        return JsonParser.parseString(Files.readString(FIXTURE)).getAsJsonObject();
    }

    private static LocalDate date(String iso) {
        return LocalDate.parse(iso);
    }

    private static OptionalInt expectedWeeks(JsonObject c) {
        JsonElement w = c.get("standard_bill_term_weeks");
        return w.isJsonNull() ? OptionalInt.empty() : OptionalInt.of(w.getAsInt());
    }

    private static BondSecurity bill(LocalDate maturity, List<IssuanceProto> issuances) {
        BondDetailsProto.Builder bd = BondDetailsProto.newBuilder().addAllIssuanceInfo(issuances);
        if (maturity != null) bd.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(maturity));
        SecurityProto proto = ObjectTypes.stamp(SecurityProto.newBuilder(), ObjectTypeProto.OBJECT_TYPE_SECURITY)
                .setProductType(ProductTypeProto.TBILL)
                .setBondDetails(bd)
                .build();
        return new BondSecurity(proto);
    }

    private static IssuanceProto issuance(LocalDate auctionIssueDate) {
        return IssuanceProto.newBuilder()
                .setAuctionIssueDate(ProtoSerializationUtil.serializeLocalDate(auctionIssueDate))
                .build();
    }

    private static List<BondSecurity> bills(JsonArray json) {
        List<BondSecurity> out = new ArrayList<>();
        for (JsonElement e : json) {
            JsonObject b = e.getAsJsonObject();
            List<IssuanceProto> issuances = new ArrayList<>();
            for (JsonElement ie : b.getAsJsonArray("issuances")) {
                JsonObject i = ie.getAsJsonObject();
                IssuanceProto.Builder p = IssuanceProto.newBuilder()
                        .setAuctionDate(ProtoSerializationUtil.serializeLocalDate(date(i.get("auction_date").getAsString())))
                        .setAuctionIssueDate(ProtoSerializationUtil.serializeLocalDate(date(i.get("auction_issue_date").getAsString())));
                if (i.has("high_discount_rate")) {
                    // Decimals.decimal keeps the string's scale: "4.300" is unscaled 4300, scale 3.
                    p.setHighDiscountRate(Decimals.decimal(i.get("high_discount_rate").getAsString()));
                }
                issuances.add(p.build());
            }
            out.add(bill(date(b.get("maturity_date").getAsString()), issuances));
        }
        return out;
    }

    /** The input high_discount_rate proto of the issuance auctioned on {@code auctionDate}. */
    private static DecimalValueProto inputRate(List<BondSecurity> bills, LocalDate auctionDate) {
        for (BondSecurity b : bills) {
            for (Issuance i : b.getIssuances()) {
                if (auctionDate.equals(i.getAuctionDate()) && i.getHighDiscountRate() != null) {
                    return i.getProto().getHighDiscountRate();
                }
            }
        }
        throw new AssertionError("no input issuance auctioned " + auctionDate);
    }

    /** The input auction_issue_date proto of the rated issuance auctioned on {@code auctionDate}. */
    private static LocalDateProto inputIssueDate(List<BondSecurity> bills, LocalDate auctionDate) {
        for (BondSecurity b : bills) {
            for (Issuance i : b.getIssuances()) {
                if (auctionDate.equals(i.getAuctionDate()) && i.getHighDiscountRate() != null) {
                    return i.getProto().getAuctionIssueDate();
                }
            }
        }
        throw new AssertionError("no input issuance auctioned " + auctionDate);
    }

    // ---- metric 1: per-issuance tenor -----------------------------------

    @Test
    void issuanceTenors_matchFixture() throws IOException {
        JsonArray cases = fixture().getAsJsonArray("issuance_tenors");
        assertEquals(6, cases.size());
        for (JsonElement e : cases) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("case").getAsString();
            LocalDate issue = date(c.get("auction_issue_date").getAsString());
            Issuance issuance = new Issuance(issuance(issue));
            BondSecurity bond = bill(date(c.get("maturity_date").getAsString()), List.of(issuance.getProto()));

            Tenor tenor = bond.getIssuanceTenor(issuance);

            assertEquals(TenorType.TERM, tenor.getType(), name);
            assertEquals(Period.parse(c.get("period").getAsString()), tenor.getTenor(), name);
            assertEquals(c.get("days").getAsLong(), ChronoUnit.DAYS.between(issue, issue.plus(tenor.getTenor())), name);
            assertEquals(expectedWeeks(c), TreasuryFrnFixings.standardBillTerm(tenor, issue), name);
        }
    }

    @Test
    void issuanceTenor_reopenedBill_is26WThen13W() {
        IssuanceProto original = issuance(date("2026-04-23"));
        IssuanceProto reopening = issuance(date("2026-07-23"));
        BondSecurity bond = bill(date("2026-10-22"), List.of(original, reopening));
        List<Issuance> issuances = bond.getIssuances();

        assertEquals(OptionalInt.of(26), TreasuryFrnFixings.standardBillTerm(
                bond.getIssuanceTenor(issuances.get(0)), date("2026-04-23")));
        assertEquals(OptionalInt.of(13), TreasuryFrnFixings.standardBillTerm(
                bond.getIssuanceTenor(issuances.get(1)), date("2026-07-23")));
    }

    @Test
    void issuanceTenor_unknownWhenADateIsMissing() {
        BondSecurity noMaturity = bill(null, List.of());
        assertEquals(TenorType.UNKNOWN, noMaturity.getIssuanceTenor(new Issuance(issuance(date("2026-07-23")))).getType());

        BondSecurity bond = bill(date("2026-10-22"), List.of());
        assertEquals(TenorType.UNKNOWN, bond.getIssuanceTenor(new Issuance(IssuanceProto.getDefaultInstance())).getType());
    }

    @Test
    void issuanceTenor_maturityBeforeIssue_isNegativeLikePeriodBetween() {
        BondSecurity bond = bill(date("2026-01-15"), List.of());
        Tenor tenor = bond.getIssuanceTenor(new Issuance(issuance(date("2026-02-14"))));

        assertEquals(Period.of(0, 0, -30), tenor.getTenor());
        assertEquals(OptionalInt.empty(), TreasuryFrnFixings.standardBillTerm(tenor, date("2026-02-14")));
    }

    // ---- metric 2: standardBillTerm -------------------------------------

    @Test
    void standardBillTerms_matchFixture() throws IOException {
        JsonArray cases = fixture().getAsJsonArray("standard_bill_terms");
        assertEquals(6, cases.size());
        int runs = 0;
        for (JsonElement e : cases) {
            JsonObject c = e.getAsJsonObject();
            JsonArray anchors = c.getAsJsonArray("anchors");
            assertEquals(2, anchors.size());
            Tenor tenor = new Tenor(TenorType.TERM, Period.parse(c.get("period").getAsString()));
            for (JsonElement a : anchors) {
                assertEquals(expectedWeeks(c), TreasuryFrnFixings.standardBillTerm(tenor, date(a.getAsString())),
                        c.get("case").getAsString() + " @ " + a.getAsString());
                runs++;
            }
        }
        assertEquals(12, runs);
    }

    @Test
    void standardBillTerm_emptyForNonTermNullTenorOrNullAnchor() {
        assertEquals(OptionalInt.empty(), TreasuryFrnFixings.standardBillTerm(Tenor.UNKNOWN_TENOR, date("2026-01-15")));
        assertEquals(OptionalInt.empty(), TreasuryFrnFixings.standardBillTerm(new Tenor(TenorType.PERPETUAL), date("2026-01-15")));
        assertEquals(OptionalInt.empty(), TreasuryFrnFixings.standardBillTerm(null, date("2026-01-15")));
        assertEquals(OptionalInt.empty(), TreasuryFrnFixings.standardBillTerm(
                new Tenor(TenorType.TERM, Period.ofDays(91)), null));
    }

    // ---- metric 3: select -----------------------------------------------

    private static int assertSelectBlock(JsonObject block) {
        List<BondSecurity> bills = bills(block.getAsJsonArray("bills"));
        JsonArray cases = block.getAsJsonArray("cases");
        for (JsonElement e : cases) {
            JsonObject c = e.getAsJsonObject();
            String name = c.get("case").getAsString();
            Optional<ReferenceRateFixingProto> got = TreasuryFrnFixings.select(bills, date(c.get("date").getAsString()));
            JsonElement want = c.get("fixing");
            if (want.isJsonNull()) {
                assertTrue(got.isEmpty(), name);
                continue;
            }
            JsonObject w = want.getAsJsonObject();
            assertTrue(got.isPresent(), name);
            ReferenceRateFixingProto f = got.get();
            LocalDate fixingDate = date(w.get("fixing_date").getAsString());
            assertEquals(IndexTypeProto.valueOf(w.get("index").getAsString()), f.getIndex(), name);
            // Scale-exact: BigDecimal.equals, never compareTo ("4.3" != "4.300").
            assertEquals(new BigDecimal(w.get("rate").getAsString()),
                    ProtoSerializationUtil.deserializeBigDecimal(f.getRate()), name);
            assertEquals(w.get("rate").getAsString(), Decimals.text(f.getRate()), name);
            // The rate proto is the input high_discount_rate, field by field.
            assertEquals(inputRate(bills, fixingDate), f.getRate(), name);
            assertEquals(ProtoSerializationUtil.serializeLocalDate(fixingDate), f.getFixingDate(), name);
            assertEquals(ProtoSerializationUtil.serializeLocalDate(date(w.get("bill_maturity_date").getAsString())),
                    f.getBillMaturityDate(), name);
            // LM-389: bill_issue_date is the chosen issuance's auction_issue_date.
            assertTrue(w.has("bill_issue_date"), name + ": fixture fixing has no bill_issue_date");
            assertTrue(f.hasBillIssueDate(), name);
            assertEquals(ProtoSerializationUtil.serializeLocalDate(date(w.get("bill_issue_date").getAsString())),
                    f.getBillIssueDate(), name);
            assertEquals(inputIssueDate(bills, fixingDate), f.getBillIssueDate(), name);
        }
        return cases.size();
    }

    @Test
    void select_matchesFixture() throws IOException {
        assertEquals(4, assertSelectBlock(fixture().getAsJsonObject("select")));
    }

    @Test
    void selectSkips_matchesFixture() throws IOException {
        assertEquals(2, assertSelectBlock(fixture().getAsJsonObject("select_skips")));
    }

    @Test
    void select_reopening_billIssueDateIsTheReopenings() throws IOException {
        List<BondSecurity> bills = bills(fixture().getAsJsonObject("select").getAsJsonArray("bills"));

        ReferenceRateFixingProto f = TreasuryFrnFixings.select(bills, date("2026-07-20")).orElseThrow();

        assertEquals(ProtoSerializationUtil.serializeLocalDate(date("2026-07-23")), f.getBillIssueDate());
        assertNotEquals(ProtoSerializationUtil.serializeLocalDate(date("2026-04-23")), f.getBillIssueDate());
    }

    @Test
    void select_billIssueDate_isCopiedNotDerived() {
        // Issued four days after the auction (e.g. a holiday), so the issue date
        // is neither maturity - 91 days nor auction + 3 days: 2026-07-23.
        IssuanceProto late = IssuanceProto.newBuilder()
                .setAuctionDate(ProtoSerializationUtil.serializeLocalDate(date("2026-07-20")))
                .setAuctionIssueDate(ProtoSerializationUtil.serializeLocalDate(date("2026-07-24")))
                .setHighDiscountRate(Decimals.decimal("4.215"))
                .build();
        BondSecurity bill = bill(date("2026-10-22"), List.of(late));

        ReferenceRateFixingProto f = TreasuryFrnFixings.select(List.of(bill), date("2026-07-20")).orElseThrow();

        assertEquals(ProtoSerializationUtil.serializeLocalDate(date("2026-07-24")), f.getBillIssueDate());
        assertNotEquals(ProtoSerializationUtil.serializeLocalDate(date("2026-07-23")), f.getBillIssueDate());
    }

    @Test
    void select_emptyBillList_isEmpty() {
        assertTrue(TreasuryFrnFixings.select(List.of(), date("2026-07-20")).isEmpty());
    }

    @Test
    void select_skipsEmptyHighDiscountRateWithoutThrowing() {
        IssuanceProto empty = IssuanceProto.newBuilder()
                .setAuctionDate(ProtoSerializationUtil.serializeLocalDate(date("2026-07-20")))
                .setAuctionIssueDate(ProtoSerializationUtil.serializeLocalDate(date("2026-07-23")))
                .setHighDiscountRate(DecimalValueProto.getDefaultInstance())
                .build();
        assertTrue(empty.hasHighDiscountRate());
        assertNull(new Issuance(empty).getHighDiscountRate());

        BondSecurity bill = bill(date("2026-10-22"), List.of(empty));
        assertTrue(TreasuryFrnFixings.select(List.of(bill), date("2026-07-20")).isEmpty());
    }

    @Test
    void issuance_auctionDateAndHighDiscountRateAccessors() {
        IssuanceProto proto = IssuanceProto.newBuilder()
                .setAuctionDate(ProtoSerializationUtil.serializeLocalDate(date("2026-07-20")))
                .setHighDiscountRate(Decimals.decimal("4.300"))
                .build();
        Issuance issuance = new Issuance(proto);
        assertEquals(date("2026-07-20"), issuance.getAuctionDate());
        assertEquals(new BigDecimal("4.300"), issuance.getHighDiscountRate());

        Issuance unset = new Issuance(IssuanceProto.getDefaultInstance());
        assertNull(unset.getAuctionDate());
        assertNull(unset.getHighDiscountRate());
    }
}
