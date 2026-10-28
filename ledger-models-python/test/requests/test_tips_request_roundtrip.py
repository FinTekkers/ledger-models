"""
TipsInput.cpi (LM-343) round-trips through a full ValuationRequestProto, the
fields removed in 0.5 (LM-344) are gone and reserved, and the new messages
carry exactly the planned fields. Readings with extra lot months (LM-405), and
with only m-3 and m-2, round-trip unchanged.
"""
import json
from decimal import Decimal
from pathlib import Path

from google.protobuf import descriptor_pb2, timestamp_pb2

from fintekkers.models.security import product_type_pb2, security_pb2
from fintekkers.models.security.index import index_type_pb2
from fintekkers.models.util import decimal_value_pb2, local_timestamp_pb2
from fintekkers.requests.valuation import product_inputs_pb2
from fintekkers.requests.valuation import valuation_request_pb2
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

REPO_ROOT = Path(__file__).resolve().parents[3]
REMOVED_FIELDS = json.loads((REPO_ROOT / "test-fixtures" / "removed-fields" / "lm-344.json").read_text())
MESSAGES = {
    m.DESCRIPTOR.full_name: m
    for m in (valuation_request_pb2.ValuationRequestProto, product_inputs_pb2.TipsInput)
}


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


def _request(tips: product_inputs_pb2.TipsInput, asof_seconds: int = 0) -> valuation_request_pb2.ValuationRequestProto:
    request = valuation_request_pb2.ValuationRequestProto(
        product_input=product_inputs_pb2.ProductInput(tips=tips),
    )
    if asof_seconds:
        request.asof_datetime.CopyFrom(
            local_timestamp_pb2.LocalTimestampProto(timestamp=timestamp_pb2.Timestamp(seconds=asof_seconds)))
    return request


def _roundtrip(original: valuation_request_pb2.ValuationRequestProto) -> valuation_request_pb2.ValuationRequestProto:
    parsed = valuation_request_pb2.ValuationRequestProto()
    parsed.ParseFromString(original.SerializeToString())
    return parsed


def _roundtrip_tips(original: valuation_request_pb2.ValuationRequestProto) -> product_inputs_pb2.TipsInput:
    parsed = _roundtrip(original)
    assert parsed.product_input.WhichOneof("input") == "tips"
    return parsed.product_input.tips


def _readings_tips(readings: list) -> product_inputs_pb2.TipsInput:
    return product_inputs_pb2.TipsInput(
        security=_tips_security(), clean_price=_decimal("97.50"),
        cpi=product_inputs_pb2.InflationIndexInput(
            index=_cpi_index(),
            readings=product_inputs_pb2.MonthlyIndexReadings(readings=[
                product_inputs_pb2.MonthlyIndexReading(year=y, month=m, value=_decimal(v)) for y, m, v in readings
            ]),
        ),
    )


class TestTipsInputCpiRoundTrip:
    def test_readings_with_extra_lot_months_survive_valuation_request(self):
        """LM-405: m-3 and m-2 of the valuation month plus two earlier lot
        months, out of order, keep their order and decimal strings."""
        # 2026-02-17T14:30:00Z: m-3 and m-2 are 2025-11 and 2025-12. A lot
        # settling in 2025-11 adds 2025-08 and 2025-09.
        readings = [
            (2025, 12, "324.05400"),
            (2025, 8, "323.97600"),
            (2025, 11, "324.12200"),
            (2025, 9, "324.80000"),
        ]
        original = _request(_readings_tips(readings), asof_seconds=1771338600)

        parsed = _roundtrip(original)

        assert parsed == original
        assert parsed.asof_datetime.timestamp.ToJsonString() == "2026-02-17T14:30:00Z"
        tips = parsed.product_input.tips
        assert tips.cpi.WhichOneof("cpi") == "readings"
        assert [(r.year, r.month, _text(r.value)) for r in tips.cpi.readings.readings] == readings

    def test_backward_compat_m3_m2_readings_survive_valuation_request(self):
        """A request with only the m-3 and m-2 readings stays valid and
        round-trips unchanged (LM-405 guardrail)."""
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

        # 2026-07-16T00:00:00Z: m-3 and m-2 are 2026-04 and 2026-05.
        original = _request(tips, asof_seconds=1784160000)
        assert _roundtrip(original) == original

        parsed = _roundtrip_tips(original)

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


class TestRemovedFields:
    """LM-344: ValuationRequestProto 24 and 25 and TipsInput 3 are removed in 0.5."""

    @staticmethod
    def _message(entry: dict):
        return MESSAGES[entry["message"].lstrip(".")]

    def test_removed_fields_are_gone_and_reserved(self):
        assert len(REMOVED_FIELDS["fields"]) == 3
        for f in REMOVED_FIELDS["fields"]:
            descriptor = self._message(f).DESCRIPTOR
            assert f["number"] not in descriptor.fields_by_number, descriptor.full_name
            assert f["name"] not in descriptor.fields_by_name, descriptor.full_name
            proto = descriptor_pb2.DescriptorProto()
            descriptor.CopyToProto(proto)
            # Ranges are half-open: reserved 24, 25 may be one range [24, 26).
            assert any(r.start <= f["number"] < r.end for r in proto.reserved_range), (
                f"{descriptor.full_name} does not reserve {f['number']}")
            assert f["name"] in proto.reserved_name, descriptor.full_name

    def test_tips_cpi_is_kept(self):
        kept = REMOVED_FIELDS["kept"]
        field = self._message(kept).DESCRIPTOR.fields_by_number[kept["number"]]
        assert field.name == kept["name"]

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
