"""
TipsInput.cpi (LM-343) round-trips through a full ValuationRequestProto, the
deprecated CPI / reference-rate fields still round-trip, and the new messages
carry exactly the planned fields.
"""
from decimal import Decimal

from fintekkers.models.price import price_pb2
from fintekkers.models.security import product_type_pb2, security_pb2
from fintekkers.models.security.index import index_type_pb2
from fintekkers.models.util import decimal_value_pb2
from fintekkers.requests.valuation import product_inputs_pb2
from fintekkers.requests.valuation import valuation_request_pb2
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal


def _decimal(value: str) -> decimal_value_pb2.DecimalValueProto:
    return encode_decimal(Decimal(value))


def _text(d: decimal_value_pb2.DecimalValueProto) -> str:
    return str(decode_decimal(d))


def _cpi_index() -> security_pb2.SecurityProto:
    return security_pb2.SecurityProto(
        issuer_name="CPI-U NSA",
        index_details=security_pb2.IndexDetailsProto(index_type=index_type_pb2.CPI_U),
    )


def _tips_security() -> security_pb2.SecurityProto:
    return security_pb2.SecurityProto(
        product_type=product_type_pb2.TIPS,
        tips_extension=security_pb2.TipsExtensionProto(
            base_cpi=_decimal("260.47400"), inflation_index_type=index_type_pb2.CPI_U,
        ),
    )


def _request(tips: product_inputs_pb2.TipsInput) -> valuation_request_pb2.ValuationRequestProto:
    return valuation_request_pb2.ValuationRequestProto(
        product_input=product_inputs_pb2.ProductInput(tips=tips),
    )


def _roundtrip(original: valuation_request_pb2.ValuationRequestProto) -> valuation_request_pb2.ValuationRequestProto:
    parsed = valuation_request_pb2.ValuationRequestProto()
    parsed.ParseFromString(original.SerializeToString())
    return parsed


def _roundtrip_tips(original: valuation_request_pb2.ValuationRequestProto) -> product_inputs_pb2.TipsInput:
    parsed = _roundtrip(original)
    assert parsed.product_input.WhichOneof("input") == "tips"
    return parsed.product_input.tips


class TestTipsInputCpiRoundTrip:
    def test_readings_survive_valuation_request(self):
        cpi = product_inputs_pb2.InflationIndexInput(
            index=_cpi_index(),
            readings=product_inputs_pb2.MonthlyIndexReadings(readings=[
                product_inputs_pb2.MonthlyIndexReading(year=2026, month=4, value=_decimal("320.000")),
                product_inputs_pb2.MonthlyIndexReading(year=2026, month=5, value=_decimal("321.500")),
            ]),
        )
        tips = product_inputs_pb2.TipsInput(
            security=_tips_security(), clean_price=_decimal("97.50"), cpi=cpi,
        )

        parsed = _roundtrip_tips(_request(tips))

        assert parsed.HasField("cpi")
        assert parsed.cpi.WhichOneof("cpi") == "readings"
        assert parsed.cpi.index.issuer_name == "CPI-U NSA"
        assert parsed.cpi.index.index_details.index_type == index_type_pb2.CPI_U
        readings = parsed.cpi.readings.readings
        assert [(r.year, r.month, _text(r.value)) for r in readings] == [
            (2026, 4, "320.000"),
            (2026, 5, "321.500"),
        ]
        assert _text(parsed.clean_price) == "97.50"

    def test_reference_cpi_survives_valuation_request(self):
        cpi = product_inputs_pb2.InflationIndexInput(
            index=_cpi_index(), reference_cpi=_decimal("310.32600"),
        )
        tips = product_inputs_pb2.TipsInput(
            security=_tips_security(), clean_price=_decimal("97.50"), cpi=cpi,
        )

        parsed = _roundtrip_tips(_request(tips))

        assert parsed.cpi.WhichOneof("cpi") == "reference_cpi"
        assert not parsed.cpi.HasField("readings")
        assert parsed.cpi.index.issuer_name == "CPI-U NSA"
        assert _text(parsed.cpi.reference_cpi) == "310.32600"


class TestDeprecatedFields:
    def test_deprecated_fields_still_roundtrip_unchanged(self):
        tips = product_inputs_pb2.TipsInput(
            security=_tips_security(), current_cpi=_decimal("310.32600"),
        )
        original = _request(tips)
        original.cpi_price_input.CopyFrom(
            price_pb2.PriceProto(price=_decimal("310.326"), security=_cpi_index()))
        original.reference_rate_input.CopyFrom(price_pb2.PriceProto(price=_decimal("5.33")))

        parsed = _roundtrip(original)

        assert parsed == original
        assert _text(parsed.product_input.tips.current_cpi) == "310.32600"
        assert not parsed.product_input.tips.HasField("cpi")
        assert _text(parsed.cpi_price_input.price) == "310.326"
        assert parsed.cpi_price_input.security.issuer_name == "CPI-U NSA"
        assert _text(parsed.reference_rate_input.price) == "5.33"

    def test_fields_are_marked_deprecated_and_keep_their_numbers(self):
        request_fields = valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.fields_by_name
        tips_fields = product_inputs_pb2.TipsInput.DESCRIPTOR.fields_by_name
        for field, number in (
            (request_fields["cpi_price_input"], 24),
            (request_fields["reference_rate_input"], 25),
            (tips_fields["current_cpi"], 3),
        ):
            assert field.number == number
            assert field.GetOptions().deprecated is True, field.full_name

    def test_tips_cpi_is_not_deprecated(self):
        cpi = product_inputs_pb2.TipsInput.DESCRIPTOR.fields_by_name["cpi"]
        assert cpi.number == 4
        assert cpi.GetOptions().deprecated is False


class TestInflationIndexInputShape:
    """No source field and no timestamp: the messages carry exactly these fields."""

    @staticmethod
    def _fields(message) -> dict:
        return {f.name: f.number for f in message.DESCRIPTOR.fields}

    def test_inflation_index_input_fields(self):
        message = product_inputs_pb2.InflationIndexInput
        assert self._fields(message) == {"index": 1, "readings": 2, "reference_cpi": 3}
        oneof = message.DESCRIPTOR.oneofs_by_name["cpi"]
        assert sorted(f.name for f in oneof.fields) == ["readings", "reference_cpi"]
        assert len(message.DESCRIPTOR.oneofs) == 1

    def test_monthly_index_readings_fields(self):
        assert self._fields(product_inputs_pb2.MonthlyIndexReadings) == {"readings": 1}

    def test_monthly_index_reading_fields(self):
        assert self._fields(product_inputs_pb2.MonthlyIndexReading) == {"year": 1, "month": 2, "value": 3}
