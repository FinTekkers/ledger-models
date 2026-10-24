"""LM-385: per-issuance tenor, standard_bill_term and select against the shared
fixture test-fixtures/treasury-frn-fixings.json. Java runs the same cases with
the same expected values (TreasuryFrnFixingsTest).

Periods are read with Tenor.get_tenor() only, never get_tenor_description():
that rounds 27 or more days up to a month (P2M29D prints as 3M).
"""

import json
import re
from datetime import date
from decimal import Decimal
from pathlib import Path

from dateutil.relativedelta import relativedelta

from fintekkers.models.security.bond.issuance_pb2 import IssuanceProto
from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import BondDetailsProto, SecurityProto
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.wrappers.models.issues.issuance import Issuance
from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.tenor import Tenor
from fintekkers.wrappers.models.security.treasury_frn_fixings import select, standard_bill_term
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

FIXTURE = Path(__file__).resolve().parents[4] / "test-fixtures" / "treasury-frn-fixings.json"

_ISO_PERIOD = re.compile(r"^P(?:(-?\d+)Y)?(?:(-?\d+)M)?(?:(-?\d+)D)?$")


def _fixture() -> dict:
    return json.loads(FIXTURE.read_text())


def _period_fields(iso: str) -> tuple[int, int, int]:
    """(years, months, days) of an ISO-8601 P<y>Y<m>M<d>D string, as Java's
    Period.toString() writes it. Tenor.parse_period cannot read the P prefix."""
    m = _ISO_PERIOD.match(iso)
    assert m, iso
    return tuple(int(g) if g else 0 for g in m.groups())


def _fields(period) -> tuple[int, int, int]:
    return (period.years, period.months, period.days)


def _d(iso: str) -> date:
    return date.fromisoformat(iso)


def _date_proto(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def _bill(maturity, issuances: list[IssuanceProto]) -> BondSecurity:
    bd = BondDetailsProto(issuance_info=issuances)
    if maturity is not None:
        bd.maturity_date.CopyFrom(_date_proto(maturity))
    return BondSecurity(SecurityProto(product_type=ProductTypeProto.TBILL, bond_details=bd))


def _issuance(auction_issue_date: date) -> IssuanceProto:
    return IssuanceProto(auction_issue_date=_date_proto(auction_issue_date))


def _bills(json_bills: list) -> list[BondSecurity]:
    out = []
    for b in json_bills:
        protos = []
        for i in b["issuances"]:
            p = IssuanceProto(
                auction_date=_date_proto(_d(i["auction_date"])),
                auction_issue_date=_date_proto(_d(i["auction_issue_date"])),
            )
            if "high_discount_rate" in i:
                # encode_decimal keeps the string's scale: "4.300" is unscaled 4300, scale 3.
                p.high_discount_rate.CopyFrom(encode_decimal(Decimal(i["high_discount_rate"])))
            protos.append(p)
        out.append(_bill(_d(b["maturity_date"]), protos))
    return out


def _input_rate(bills: list[BondSecurity], auction_date: date) -> DecimalValueProto:
    for b in bills:
        for i in b.get_issuances():
            if i.get_auction_date() == auction_date and i.get_high_discount_rate() is not None:
                return i.proto.high_discount_rate
    raise AssertionError(f"no input issuance auctioned {auction_date}")


# ---- metric 1: per-issuance tenor -----------------------------------------


def test_issuance_tenors_match_fixture():
    cases = _fixture()["issuance_tenors"]
    assert len(cases) == 6
    for c in cases:
        issue = _d(c["auction_issue_date"])
        proto = _issuance(issue)
        bond = _bill(_d(c["maturity_date"]), [proto])

        tenor = bond.get_issuance_tenor(Issuance(proto))

        assert tenor.get_type() == TenorTypeProto.TERM, c["case"]
        assert _fields(tenor.get_tenor()) == _period_fields(c["period"]), c["case"]
        assert ((issue + tenor.get_tenor()) - issue).days == c["days"], c["case"]
        assert standard_bill_term(tenor, issue) == c["standard_bill_term_weeks"], c["case"]


def test_issuance_tenor_reopened_bill_is_26w_then_13w():
    bond = _bill(_d("2026-10-22"), [_issuance(_d("2026-04-23")), _issuance(_d("2026-07-23"))])
    original, reopening = bond.get_issuances()

    assert standard_bill_term(bond.get_issuance_tenor(original), _d("2026-04-23")) == 26
    assert standard_bill_term(bond.get_issuance_tenor(reopening), _d("2026-07-23")) == 13


def test_issuance_tenor_unknown_when_a_date_is_missing():
    no_maturity = _bill(None, [])
    assert no_maturity.get_issuance_tenor(Issuance(_issuance(_d("2026-07-23")))).get_type() == (
        TenorTypeProto.UNKNOWN_TENOR_TYPE
    )
    bond = _bill(_d("2026-10-22"), [])
    assert bond.get_issuance_tenor(Issuance(IssuanceProto())).get_type() == TenorTypeProto.UNKNOWN_TENOR_TYPE


def test_issuance_tenor_maturity_before_issue_is_negative_like_period_between():
    # Java: Period.between(2026-02-14, 2026-01-15) == P-30D.
    bond = _bill(_d("2026-01-15"), [])
    tenor = bond.get_issuance_tenor(Issuance(_issuance(_d("2026-02-14"))))
    assert _fields(tenor.get_tenor()) == (0, 0, -30)
    assert standard_bill_term(tenor, _d("2026-02-14")) is None
    # Java: Period.between(2027-03-10, 2026-01-15) == P-1Y-1M-26D (truncation toward zero).
    assert _fields(Tenor.period_between(_d("2027-03-10"), _d("2026-01-15"))) == (-1, -1, -26)


# ---- metric 2: standard_bill_term -----------------------------------------


def test_standard_bill_terms_match_fixture():
    cases = _fixture()["standard_bill_terms"]
    assert len(cases) == 6
    runs = 0
    for c in cases:
        assert len(c["anchors"]) == 2
        years, months, days = _period_fields(c["period"])
        tenor = Tenor.of_period(relativedelta(years=years, months=months, days=days))
        for anchor in c["anchors"]:
            assert standard_bill_term(tenor, _d(anchor)) == c["standard_bill_term_weeks"], (c["case"], anchor)
            runs += 1
    assert runs == 12


def test_standard_bill_term_none_for_non_term_none_tenor_or_none_anchor():
    assert standard_bill_term(Tenor(TenorTypeProto.UNKNOWN_TENOR_TYPE), _d("2026-01-15")) is None
    assert standard_bill_term(Tenor(TenorTypeProto.PERPETUAL), _d("2026-01-15")) is None
    assert standard_bill_term(None, _d("2026-01-15")) is None
    ninety_one_days = Tenor.period_between(_d("2026-01-15"), _d("2026-04-16"))
    assert standard_bill_term(Tenor.of_period(ninety_one_days), None) is None


# ---- metric 3: select -----------------------------------------------------


def _assert_select_block(block: dict) -> int:
    bills = _bills(block["bills"])
    for c in block["cases"]:
        got = select(bills, _d(c["date"]))
        want = c["fixing"]
        if want is None:
            assert got is None, c["case"]
            continue
        assert got is not None, c["case"]
        fixing_date = _d(want["fixing_date"])
        assert got.index == IndexTypeProto.Value(want["index"]), c["case"]
        # Scale-exact: "4.300" stays "4.300".
        assert str(decode_decimal(got.rate)) == want["rate"], c["case"]
        # The rate proto is the input high_discount_rate, field by field.
        assert got.rate == _input_rate(bills, fixing_date), c["case"]
        assert got.fixing_date == _date_proto(fixing_date), c["case"]
        assert got.bill_maturity_date == _date_proto(_d(want["bill_maturity_date"])), c["case"]
    return len(block["cases"])


def test_select_matches_fixture():
    assert _assert_select_block(_fixture()["select"]) == 4


def test_select_skips_matches_fixture():
    assert _assert_select_block(_fixture()["select_skips"]) == 2


def test_select_empty_bill_list_is_none():
    assert select([], _d("2026-07-20")) is None


def test_select_skips_empty_high_discount_rate_without_raising():
    empty = IssuanceProto(
        auction_date=_date_proto(_d("2026-07-20")),
        auction_issue_date=_date_proto(_d("2026-07-23")),
        high_discount_rate=DecimalValueProto(),
    )
    assert empty.HasField("high_discount_rate")
    assert Issuance(empty).get_high_discount_rate() is None

    assert select([_bill(_d("2026-10-22"), [empty])], _d("2026-07-20")) is None


def test_issuance_auction_date_and_high_discount_rate_accessors():
    issuance = Issuance(
        IssuanceProto(
            auction_date=_date_proto(_d("2026-07-20")),
            high_discount_rate=encode_decimal(Decimal("4.300")),
        )
    )
    assert issuance.get_auction_date() == _d("2026-07-20")
    assert str(issuance.get_high_discount_rate()) == "4.300"

    unset = Issuance(IssuanceProto())
    assert unset.get_auction_date() is None
    assert unset.get_high_discount_rate() is None
