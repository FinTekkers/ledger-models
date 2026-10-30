"""Picks a Treasury FRN's 13-week bill fixing from Treasury bill auctions.

Same helpers as Java's ``common.models.security.bonds.TreasuryFrnFixings``;
both are tested against ``test-fixtures/treasury-frn-fixings.json``. See
``docs/adr/frn_reference_rate_fixings.md`` (LM-382, LM-385).

Deprecated (LM-410): FRN fixings now come from price-service (MDI-100) and
reach for_security ready to use through MarketData; nothing here picks them
any more. To be deleted in LM-411, once ledger-service no longer calls the
Java copy (LS-202). See ``docs/adr/product_input_builders.md``.
"""

from datetime import date
from typing import Optional

from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.requests.valuation.product_inputs_pb2 import ReferenceRateFixingProto
from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.tenor import Tenor

# Treasury's standard bill terms, in weeks.
STANDARD_BILL_WEEKS = (4, 6, 8, 13, 17, 26, 52)

# A tenor snaps to a standard term when its day count is within this many days of it.
TOLERANCE_DAYS = 3

_THIRTEEN_WEEKS = 13


def standard_bill_term(tenor: Optional[Tenor], anchor: Optional[date]) -> Optional[int]:
    """The standard bill term, in weeks, that ``tenor`` is within
    TOLERANCE_DAYS days of: 4, 6, 8, 13, 17, 26 or 52. Days are counted from
    ``anchor`` to ``anchor + tenor``. None when no term is that close, or when
    the tenor is None, not a TERM, or the anchor is None.
    """
    if tenor is None or anchor is None or tenor.get_type() != TenorTypeProto.TERM:
        return None
    period = tenor.get_tenor()
    if period is None:
        return None
    # relativedelta adds years and months (clipping to month end), then days,
    # as Java's LocalDate.plus(Period) does.
    days = ((anchor + period) - anchor).days
    for weeks in STANDARD_BILL_WEEKS:
        if abs(days - 7 * weeks) <= TOLERANCE_DAYS:
            return weeks
    return None


def select(bills: list[BondSecurity], as_of: date) -> Optional[ReferenceRateFixingProto]:
    """The 13-week bill fixing on ``as_of``: of every issuance of every bill
    that has an auction date, an issue date and a high discount rate, was
    auctioned on or before ``as_of`` and snaps to 13 weeks, the one with the
    latest auction date. On a tie the first in input order wins.

    The fixing's ``rate`` is the issuance's ``high_discount_rate`` unchanged,
    ``fixing_date`` its ``auction_date``, ``bill_maturity_date`` the
    bill's maturity and ``bill_issue_date`` its ``auction_issue_date``,
    copied as is (LM-389). None when nothing qualifies.
    """
    if not bills or as_of is None:
        return None
    best = None
    best_bill = None
    best_auction_date = None
    for bill in bills:
        if bill is None:
            continue
        bill._ensure_hydrated()
        bond = bill._get_bond_like_details()
        if bond is None or not bond.HasField("maturity_date"):
            continue
        for issuance in bill.get_issuances():
            auction_date = issuance.get_auction_date()
            issue_date = issuance.get_issue_date()
            if auction_date is None or issue_date is None or issuance.get_high_discount_rate() is None:
                continue
            if auction_date > as_of:
                continue
            if standard_bill_term(bill.get_issuance_tenor(issuance), issue_date) != _THIRTEEN_WEEKS:
                continue
            if best_auction_date is None or auction_date > best_auction_date:
                best, best_bill, best_auction_date = issuance, bill, auction_date
    if best is None:
        return None
    maturity = best_bill.get_maturity_date()
    fixing = ReferenceRateFixingProto(index=IndexTypeProto.T_BILL_13_WEEK)
    fixing.fixing_date.CopyFrom(best.proto.auction_date)
    fixing.rate.CopyFrom(best.proto.high_discount_rate)
    fixing.bill_maturity_date.CopyFrom(
        LocalDateProto(year=maturity.year, month=maturity.month, day=maturity.day)
    )
    fixing.bill_issue_date.CopyFrom(best.proto.auction_issue_date)
    return fixing
