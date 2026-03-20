"""
ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.

For each type: construct → serialize to bytes → deserialize → verify all fields match.
"""
import pytest
from fintekkers.models.security import security_pb2
from fintekkers.models.security import security_type_pb2
from fintekkers.models.security import coupon_frequency_pb2
from fintekkers.models.security import coupon_type_pb2
from fintekkers.models.security import security_quantity_type_pb2
from fintekkers.models.security.identifier import identifier_pb2, identifier_type_pb2
from fintekkers.models.security.index import index_type_pb2
from fintekkers.models.util import decimal_value_pb2, local_date_pb2


def _decimal(value: str) -> decimal_value_pb2.DecimalValueProto:
    return decimal_value_pb2.DecimalValueProto(arbitrary_precision_value=value)


def _date(year: int, month: int, day: int) -> local_date_pb2.LocalDateProto:
    return local_date_pb2.LocalDateProto(year=year, month=month, day=day)


def _identifier(id_type: int, value: str) -> identifier_pb2.IdentifierProto:
    return identifier_pb2.IdentifierProto(
        identifier_type=id_type, identifier_value=value
    )


def _roundtrip(proto: security_pb2.SecurityProto) -> security_pb2.SecurityProto:
    """Serialize to bytes and deserialize back."""
    data = proto.SerializeToString()
    parsed = security_pb2.SecurityProto()
    parsed.ParseFromString(data)
    return parsed


class TestSecurityProtoRoundTrip:
    """Round-trip tests for all 6 security types."""

    def test_bond_security(self):
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            security_type=security_type_pb2.BOND_SECURITY,
            asset_class="Fixed Income",
            issuer_name="US Treasury",
            quantity_type=security_quantity_type_pb2.ORIGINAL_FACE_VALUE,
            identifier=_identifier(identifier_type_pb2.CUSIP, "912828ZT0"),
            description="UST 5% 2030",
            coupon_rate=_decimal("5.0"),
            coupon_type=coupon_type_pb2.FIXED,
            coupon_frequency=coupon_frequency_pb2.SEMIANNUALLY,
            face_value=_decimal("1000"),
            issue_date=_date(2020, 1, 15),
            dated_date=_date(2020, 1, 15),
            maturity_date=_date(2030, 1, 15),
        )

        parsed = _roundtrip(original)

        assert parsed.security_type == security_type_pb2.BOND_SECURITY
        assert parsed.asset_class == "Fixed Income"
        assert parsed.issuer_name == "US Treasury"
        assert parsed.description == "UST 5% 2030"
        assert parsed.quantity_type == security_quantity_type_pb2.ORIGINAL_FACE_VALUE
        assert parsed.coupon_rate.arbitrary_precision_value == "5.0"
        assert parsed.coupon_type == coupon_type_pb2.FIXED
        assert parsed.coupon_frequency == coupon_frequency_pb2.SEMIANNUALLY
        assert parsed.face_value.arbitrary_precision_value == "1000"
        assert parsed.issue_date.year == 2020
        assert parsed.issue_date.month == 1
        assert parsed.issue_date.day == 15
        assert parsed.dated_date.year == 2020
        assert parsed.maturity_date.year == 2030
        assert parsed.maturity_date.month == 1
        assert parsed.maturity_date.day == 15
        assert parsed.identifier.identifier_value == "912828ZT0"
        assert parsed.identifier.identifier_type == identifier_type_pb2.CUSIP

    def test_tips_security(self):
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            security_type=security_type_pb2.TIPS,
            asset_class="Fixed Income",
            issuer_name="US Treasury",
            coupon_rate=_decimal("0.625"),
            coupon_type=coupon_type_pb2.FIXED,
            coupon_frequency=coupon_frequency_pb2.SEMIANNUALLY,
            face_value=_decimal("1000"),
            maturity_date=_date(2030, 1, 15),
            base_cpi=_decimal("256.394"),
            inflation_index_type=index_type_pb2.CPI_U,
        )

        parsed = _roundtrip(original)

        assert parsed.security_type == security_type_pb2.TIPS
        assert parsed.coupon_rate.arbitrary_precision_value == "0.625"
        assert parsed.coupon_type == coupon_type_pb2.FIXED
        assert parsed.coupon_frequency == coupon_frequency_pb2.SEMIANNUALLY
        assert parsed.face_value.arbitrary_precision_value == "1000"
        assert parsed.maturity_date.year == 2030
        assert parsed.base_cpi.arbitrary_precision_value == "256.394"
        assert parsed.inflation_index_type == index_type_pb2.CPI_U

    def test_frn_security(self):
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            security_type=security_type_pb2.FRN,
            asset_class="Fixed Income",
            issuer_name="US Treasury",
            coupon_type=coupon_type_pb2.FLOAT,
            coupon_frequency=coupon_frequency_pb2.QUARTERLY,
            face_value=_decimal("100"),
            maturity_date=_date(2028, 1, 15),
            spread=_decimal("50"),
            reference_rate_index=index_type_pb2.T_BILL_13_WEEK,
            reset_frequency=coupon_frequency_pb2.QUARTERLY,
        )

        parsed = _roundtrip(original)

        assert parsed.security_type == security_type_pb2.FRN
        assert parsed.coupon_type == coupon_type_pb2.FLOAT
        assert parsed.coupon_frequency == coupon_frequency_pb2.QUARTERLY
        assert parsed.face_value.arbitrary_precision_value == "100"
        assert parsed.maturity_date.year == 2028
        assert parsed.spread.arbitrary_precision_value == "50"
        assert parsed.reference_rate_index == index_type_pb2.T_BILL_13_WEEK
        assert parsed.reset_frequency == coupon_frequency_pb2.QUARTERLY

    def test_equity_security(self):
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            security_type=security_type_pb2.EQUITY_SECURITY,
            asset_class="Equity",
            issuer_name="Apple Inc.",
            quantity_type=security_quantity_type_pb2.UNITS,
            identifier=_identifier(identifier_type_pb2.EXCH_TICKER, "AAPL"),
            description="Apple Inc. Common Stock",
        )

        parsed = _roundtrip(original)

        assert parsed.security_type == security_type_pb2.EQUITY_SECURITY
        assert parsed.asset_class == "Equity"
        assert parsed.issuer_name == "Apple Inc."
        assert parsed.quantity_type == security_quantity_type_pb2.UNITS
        assert parsed.description == "Apple Inc. Common Stock"
        assert parsed.identifier.identifier_value == "AAPL"
        assert parsed.identifier.identifier_type == identifier_type_pb2.EXCH_TICKER

    def test_cash_security(self):
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            security_type=security_type_pb2.CASH_SECURITY,
            asset_class="Cash",
            issuer_name="Federal Reserve",
            quantity_type=security_quantity_type_pb2.UNITS,
            cash_id="USD",
            description="US Dollar",
            identifier=_identifier(identifier_type_pb2.CASH, "USD"),
        )

        parsed = _roundtrip(original)

        assert parsed.security_type == security_type_pb2.CASH_SECURITY
        assert parsed.asset_class == "Cash"
        assert parsed.cash_id == "USD"
        assert parsed.description == "US Dollar"
        assert parsed.identifier.identifier_value == "USD"
        assert parsed.identifier.identifier_type == identifier_type_pb2.CASH

    def test_index_security(self):
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            security_type=security_type_pb2.INDEX_SECURITY,
            asset_class="Index",
            issuer_name="Bureau of Labor Statistics",
            description="US CPI-U All Urban Consumers",
            index_type=index_type_pb2.CPI_U,
            identifier=_identifier(identifier_type_pb2.CUSIP, "CPI-U"),
        )

        parsed = _roundtrip(original)

        assert parsed.security_type == security_type_pb2.INDEX_SECURITY
        assert parsed.asset_class == "Index"
        assert parsed.issuer_name == "Bureau of Labor Statistics"
        assert parsed.description == "US CPI-U All Urban Consumers"
        assert parsed.index_type == index_type_pb2.CPI_U
        assert parsed.identifier.identifier_value == "CPI-U"
