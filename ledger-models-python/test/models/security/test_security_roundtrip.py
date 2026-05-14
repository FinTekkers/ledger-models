"""
ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.

For each type: construct → serialize to bytes → deserialize → verify all fields match.
"""
import pytest
from fintekkers.models.security import security_pb2
from fintekkers.models.security import product_type_pb2
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
    """v0.4.0 round-trip tests — structured shape only.

    Bond fields → bond_details. TIPS extras → tips_extension.
    FRN extras → frn_extension. Cash/Equity/Index → non_bond_details oneof.
    Flat fields removed in v0.4.0 (#277 / #278).
    """

    def test_bond_security(self):
        bond_details = security_pb2.BondDetailsProto(
            coupon_rate=_decimal("5.0"),
            coupon_type=coupon_type_pb2.FIXED,
            coupon_frequency=coupon_frequency_pb2.SEMIANNUALLY,
            face_value=_decimal("1000"),
            issue_date=_date(2020, 1, 15),
            dated_date=_date(2020, 1, 15),
            maturity_date=_date(2030, 1, 15),
        )
        original = security_pb2.SecurityProto(
            object_class="Security",
            version="0.0.1",
            product_type=product_type_pb2.TREASURY_NOTE,
            asset_class="Fixed Income",
            issuer_name="US Treasury",
            quantity_type=security_quantity_type_pb2.ORIGINAL_FACE_VALUE,
            identifiers=[_identifier(identifier_type_pb2.CUSIP, "912828ZT0")],
            description="UST 5% 2030",
            bond_details=bond_details,
        )

        parsed = _roundtrip(original)

        assert parsed.product_type == product_type_pb2.TREASURY_NOTE
        assert parsed.asset_class == "Fixed Income"
        assert parsed.issuer_name == "US Treasury"
        assert parsed.description == "UST 5% 2030"
        assert parsed.bond_details.coupon_rate.arbitrary_precision_value == "5.0"
        assert parsed.bond_details.coupon_type == coupon_type_pb2.FIXED
        assert parsed.bond_details.face_value.arbitrary_precision_value == "1000"
        assert parsed.bond_details.issue_date.year == 2020
        assert parsed.bond_details.maturity_date.year == 2030
        assert parsed.identifiers[0].identifier_value == "912828ZT0"

    def test_tips_security(self):
        original = security_pb2.SecurityProto(
            product_type=product_type_pb2.TIPS,
            asset_class="Fixed Income",
            issuer_name="US Treasury",
            bond_details=security_pb2.BondDetailsProto(
                coupon_rate=_decimal("0.625"),
                coupon_type=coupon_type_pb2.FIXED,
                coupon_frequency=coupon_frequency_pb2.SEMIANNUALLY,
                face_value=_decimal("1000"),
                maturity_date=_date(2030, 1, 15),
            ),
            tips_extension=security_pb2.TipsExtensionProto(
                base_cpi=_decimal("256.394"),
                inflation_index_type=index_type_pb2.CPI_U,
            ),
        )

        parsed = _roundtrip(original)

        assert parsed.product_type == product_type_pb2.TIPS
        assert parsed.bond_details.coupon_rate.arbitrary_precision_value == "0.625"
        assert parsed.bond_details.face_value.arbitrary_precision_value == "1000"
        assert parsed.tips_extension.base_cpi.arbitrary_precision_value == "256.394"
        assert parsed.tips_extension.inflation_index_type == index_type_pb2.CPI_U

    def test_frn_security(self):
        original = security_pb2.SecurityProto(
            product_type=product_type_pb2.TREASURY_FRN,
            asset_class="Fixed Income",
            issuer_name="US Treasury",
            bond_details=security_pb2.BondDetailsProto(
                coupon_type=coupon_type_pb2.FLOAT,
                coupon_frequency=coupon_frequency_pb2.QUARTERLY,
                face_value=_decimal("100"),
                maturity_date=_date(2028, 1, 15),
            ),
            frn_extension=security_pb2.FrnExtensionProto(
                spread=_decimal("50"),
                reference_rate_index=index_type_pb2.T_BILL_13_WEEK,
                reset_frequency=coupon_frequency_pb2.QUARTERLY,
            ),
        )

        parsed = _roundtrip(original)

        assert parsed.product_type == product_type_pb2.TREASURY_FRN
        assert parsed.bond_details.coupon_type == coupon_type_pb2.FLOAT
        assert parsed.bond_details.maturity_date.year == 2028
        assert parsed.frn_extension.spread.arbitrary_precision_value == "50"
        assert parsed.frn_extension.reference_rate_index == index_type_pb2.T_BILL_13_WEEK
        assert parsed.frn_extension.reset_frequency == coupon_frequency_pb2.QUARTERLY

    def test_equity_security(self):
        original = security_pb2.SecurityProto(
            product_type=product_type_pb2.COMMON_STOCK,
            asset_class="Equity",
            issuer_name="Apple Inc.",
            identifiers=[_identifier(identifier_type_pb2.EXCH_TICKER, "AAPL")],
            description="Apple Inc. Common Stock",
            equity_details=security_pb2.EquityDetailsProto(),
        )

        parsed = _roundtrip(original)

        assert parsed.product_type == product_type_pb2.COMMON_STOCK
        assert parsed.asset_class == "Equity"
        assert parsed.identifiers[0].identifier_value == "AAPL"
        assert parsed.HasField("equity_details")

    def test_cash_security(self):
        original = security_pb2.SecurityProto(
            product_type=product_type_pb2.CURRENCY,
            asset_class="Cash",
            issuer_name="Federal Reserve",
            description="US Dollar",
            identifiers=[_identifier(identifier_type_pb2.CASH, "USD")],
            cash_details=security_pb2.CashDetailsProto(cash_id="USD"),
        )

        parsed = _roundtrip(original)

        assert parsed.product_type == product_type_pb2.CURRENCY
        assert parsed.cash_details.cash_id == "USD"
        assert parsed.identifiers[0].identifier_value == "USD"

    def test_index_security(self):
        original = security_pb2.SecurityProto(
            product_type=product_type_pb2.EQUITY_INDEX,
            asset_class="Index",
            issuer_name="Bureau of Labor Statistics",
            description="US CPI-U All Urban Consumers",
            identifiers=[_identifier(identifier_type_pb2.CUSIP, "CPI-U")],
            index_details=security_pb2.IndexDetailsProto(index_type=index_type_pb2.CPI_U),
        )

        parsed = _roundtrip(original)

        assert parsed.product_type == product_type_pb2.EQUITY_INDEX
        assert parsed.index_details.index_type == index_type_pb2.CPI_U
        assert parsed.identifiers[0].identifier_value == "CPI-U"


# ---------- v0.2.5: link helpers + constituents + wire-compat ----------

class TestV025LinkHelpersAndConstituents:
    def test_link_of_populates_uuid_and_as_of_and_sets_is_link(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4
        from datetime import datetime, timezone

        uid = uuid4()
        as_of = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        link = Security.link_of(uid, as_of)

        assert link.is_link is True
        assert bytes(link.uuid.raw_uuid) == uid.bytes
        assert link.HasField("as_of")
        # No other fields populated
        assert link.asset_class == ""
        assert link.issuer_name == ""

    def test_link_of_latest_skips_as_of(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4

        uid = uuid4()
        link = Security.link_of_latest(uid)
        assert link.is_link is True
        assert bytes(link.uuid.raw_uuid) == uid.bytes
        assert not link.HasField("as_of"), \
            "link_of_latest must leave as_of unset (resolver returns latest)"

    def test_link_of_requires_as_of(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4

        with pytest.raises(ValueError, match="as_of is required"):
            Security.link_of(uuid4(), None)

    def test_is_link_reads_proto_flag(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4
        from datetime import datetime, timezone

        full = Security(security_pb2.SecurityProto())
        assert full.is_link() is False

        link_proto = Security.link_of(uuid4(),
                                       datetime(2025, 1, 1, tzinfo=timezone.utc))
        link = Security(link_proto)
        assert link.is_link() is True

    def test_accessors_raise_on_link(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4
        from datetime import datetime, timezone

        link = Security(Security.link_of(
            uuid4(), datetime(2025, 1, 1, tzinfo=timezone.utc)))

        with pytest.raises(RuntimeError, match="link-mode"):
            link.get_asset_class()
        with pytest.raises(RuntimeError, match="link-mode"):
            link.get_product_type_proto()
        with pytest.raises(RuntimeError, match="link-mode"):
            link.get_security_id()

    def test_link_round_trips_via_serialize(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4
        from datetime import datetime, timezone

        uid = uuid4()
        as_of = datetime(2025, 6, 1, 0, 0, 0, tzinfo=timezone.utc)
        link = Security.link_of(uid, as_of)
        parsed = _roundtrip(link)
        assert parsed.is_link is True
        assert bytes(parsed.uuid.raw_uuid) == uid.bytes

    def test_index_details_constituents_round_trip(self):
        from fintekkers.wrappers.models.security.security import Security
        from uuid import uuid4
        from datetime import datetime, timezone

        as_of = datetime(2025, 1, 1, tzinfo=timezone.utc)
        c1 = Security.link_of(uuid4(), as_of)
        c2 = Security.link_of(uuid4(), as_of)

        index_details = security_pb2.IndexDetailsProto(
            index_type=index_type_pb2.CPI_U,
            constituents=[c1, c2],
        )
        original = security_pb2.SecurityProto(
            product_type=product_type_pb2.EQUITY_INDEX,
            index_details=index_details,
        )

        parsed = _roundtrip(original)
        assert len(parsed.index_details.constituents) == 2
        assert parsed.index_details.constituents[0].is_link is True
        assert parsed.index_details.constituents[0].HasField("as_of")

    def test_legs_wire_compat_with_legacy_security_id_proto_bytes(self):
        # SecurityIdProto carried uuid at tag 1 — identical wire format to
        # SecurityProto.uuid. Build the legacy wire shape by encoding a
        # SecurityProto with only uuid set; same bytes.
        from uuid import uuid4
        from fintekkers.models.util.uuid_pb2 import UUIDProto

        uid = uuid4()
        legacy = security_pb2.SecurityProto(
            uuid=UUIDProto(raw_uuid=uid.bytes),
        )
        bytes_ = legacy.SerializeToString()

        parsed = security_pb2.SecurityProto()
        parsed.ParseFromString(bytes_)
        assert bytes(parsed.uuid.raw_uuid) == uid.bytes
