package common.models.security.bonds;

import common.models.security.BondSecurity;
import common.models.security.Tenor;
import common.models.security.TenorType;
import fintekkers.models.security.bond.IssuanceProto;
import fintekkers.models.security.index.IndexTypeProto;
import fintekkers.requests.valuation.ReferenceRateFixingProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;

/**
 * Picks a Treasury FRN's 13-week bill fixing from Treasury bill auctions.
 * Python has the same helpers in
 * {@code fintekkers.wrappers.models.security.treasury_frn_fixings}; both are
 * tested against {@code test-fixtures/treasury-frn-fixings.json}.
 * See {@code docs/adr/frn_reference_rate_fixings.md} (LM-382, LM-385).
 *
 * <p>Deprecated (LM-410): FRN fixings now come from price-service (MDI-100)
 * and reach {@code ProductInputs.forSecurity} ready to use through
 * {@code MarketData}; nothing here picks them any more. To be deleted in
 * LM-411, once ledger-service no longer calls it (LS-202). See
 * docs/adr/product_input_builders.md.
 */
public final class TreasuryFrnFixings {

    /** Treasury's standard bill terms, in weeks. */
    private static final int[] STANDARD_BILL_WEEKS = {4, 6, 8, 13, 17, 26, 52};

    /** A tenor snaps to a standard term when its day count is within this many days of it. */
    private static final int TOLERANCE_DAYS = 3;

    private static final int THIRTEEN_WEEKS = 13;

    private TreasuryFrnFixings() {
    }

    /**
     * The standard bill term, in weeks, that {@code tenor} is within
     * {@value #TOLERANCE_DAYS} days of: 4, 6, 8, 13, 17, 26 or 52. Days are
     * counted from {@code anchor} to {@code anchor + tenor}. Empty when no
     * term is that close, or when the tenor is null, not a TERM, or the
     * anchor is null.
     */
    public static OptionalInt standardBillTerm(Tenor tenor, LocalDate anchor) {
        if (tenor == null || anchor == null || tenor.getType() != TenorType.TERM || tenor.getTenor() == null) {
            return OptionalInt.empty();
        }
        long days = ChronoUnit.DAYS.between(anchor, anchor.plus(tenor.getTenor()));
        for (int weeks : STANDARD_BILL_WEEKS) {
            if (Math.abs(days - 7L * weeks) <= TOLERANCE_DAYS) {
                return OptionalInt.of(weeks);
            }
        }
        return OptionalInt.empty();
    }

    /**
     * The 13-week bill fixing on {@code date}: of every issuance of every bill
     * that has an auction date, an issue date and a high discount rate, was
     * auctioned on or before {@code date} and snaps to 13 weeks, the one with
     * the latest auction date. On a tie the first in input order wins.
     *
     * <p>The fixing's {@code rate} is the issuance's {@code high_discount_rate}
     * unchanged, {@code fixing_date} its {@code auction_date},
     * {@code bill_maturity_date} the bill's maturity and {@code bill_issue_date}
     * its {@code auction_issue_date}, copied as is (LM-389). Empty when nothing
     * qualifies.
     */
    public static Optional<ReferenceRateFixingProto> select(List<BondSecurity> bills, LocalDate date) {
        if (bills == null || date == null) {
            return Optional.empty();
        }
        BondSecurity bestBill = null;
        Issuance best = null;
        LocalDate bestAuctionDate = null;
        for (BondSecurity bill : bills) {
            if (bill == null || bill.getMaturityDate() == null) continue;
            for (Issuance issuance : bill.getIssuances()) {
                LocalDate auctionDate = issuance.getAuctionDate();
                LocalDate issueDate = issuance.getIssueDate();
                if (auctionDate == null || issueDate == null || issuance.getHighDiscountRate() == null) continue;
                if (auctionDate.isAfter(date)) continue;
                OptionalInt weeks = standardBillTerm(bill.getIssuanceTenor(issuance), issueDate);
                if (weeks.isEmpty() || weeks.getAsInt() != THIRTEEN_WEEKS) continue;
                if (bestAuctionDate == null || auctionDate.isAfter(bestAuctionDate)) {
                    bestBill = bill;
                    best = issuance;
                    bestAuctionDate = auctionDate;
                }
            }
        }
        if (best == null) {
            return Optional.empty();
        }
        IssuanceProto proto = best.getProto();
        return Optional.of(ReferenceRateFixingProto.newBuilder()
                .setIndex(IndexTypeProto.T_BILL_13_WEEK)
                .setFixingDate(proto.getAuctionDate())
                .setRate(proto.getHighDiscountRate())
                .setBillMaturityDate(ProtoSerializationUtil.serializeLocalDate(bestBill.getMaturityDate()))
                .setBillIssueDate(proto.getAuctionIssueDate())
                .build());
    }
}
