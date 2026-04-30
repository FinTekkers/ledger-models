"""
Step 3 tests — FrnInput / ProductInput proto round-trips.

For each new message type: construct → serialize to bytes → deserialize → verify all fields match.
"""
import pytest
from fintekkers.requests.valuation import product_inputs_pb2
from fintekkers.requests.valuation import valuation_request_pb2
from fintekkers.models.security.index import index_type_pb2
from fintekkers.models.util import decimal_value_pb2, local_date_pb2


def _decimal(value: str) -> decimal_value_pb2.DecimalValueProto:
    return decimal_value_pb2.DecimalValueProto(arbitrary_precision_value=value)


def _date(year: int, month: int, day: int) -> local_date_pb2.LocalDateProto:
    return local_date_pb2.LocalDateProto(year=year, month=month, day=day)


def _sofr_curve() -> product_inputs_pb2.YieldCurveInput:
    return product_inputs_pb2.YieldCurveInput(
        index=index_type_pb2.SOFR,
        reference_date=_date(2025, 1, 31),
        points=[
            product_inputs_pb2.CurvePoint(tenor=_decimal("0.25"), rate=_decimal("0.0530")),
            product_inputs_pb2.CurvePoint(tenor=_decimal("0.5"),  rate=_decimal("0.0520")),
            product_inputs_pb2.CurvePoint(tenor=_decimal("1.0"),  rate=_decimal("0.0500")),
            product_inputs_pb2.CurvePoint(tenor=_decimal("2.0"),  rate=_decimal("0.0470")),
            product_inputs_pb2.CurvePoint(tenor=_decimal("5.0"),  rate=_decimal("0.0430")),
        ],
    )


def _roundtrip_curve(original: product_inputs_pb2.YieldCurveInput) -> product_inputs_pb2.YieldCurveInput:
    data = original.SerializeToString()
    parsed = product_inputs_pb2.YieldCurveInput()
    parsed.ParseFromString(data)
    return parsed


def _roundtrip_frn(original: product_inputs_pb2.FrnInput) -> product_inputs_pb2.FrnInput:
    data = original.SerializeToString()
    parsed = product_inputs_pb2.FrnInput()
    parsed.ParseFromString(data)
    return parsed


def _roundtrip_product_input(original: product_inputs_pb2.ProductInput) -> product_inputs_pb2.ProductInput:
    data = original.SerializeToString()
    parsed = product_inputs_pb2.ProductInput()
    parsed.ParseFromString(data)
    return parsed


class TestCurvePointRoundTrip:
    def test_all_fields_survive(self):
        original = product_inputs_pb2.CurvePoint(
            tenor=_decimal("2.0"),
            rate=_decimal("0.0470"),
        )
        data = original.SerializeToString()
        parsed = product_inputs_pb2.CurvePoint()
        parsed.ParseFromString(data)

        assert parsed.tenor.arbitrary_precision_value == "2.0"
        assert parsed.rate.arbitrary_precision_value == "0.0470"


class TestYieldCurveInputRoundTrip:
    def test_index_and_date_survive(self):
        parsed = _roundtrip_curve(_sofr_curve())
        assert parsed.index == index_type_pb2.SOFR
        assert parsed.reference_date.year == 2025
        assert parsed.reference_date.month == 1
        assert parsed.reference_date.day == 31

    def test_all_five_points_survive(self):
        parsed = _roundtrip_curve(_sofr_curve())
        assert len(parsed.points) == 5

    def test_point_order_preserved(self):
        expected_tenors = ["0.25", "0.5", "1.0", "2.0", "5.0"]
        parsed = _roundtrip_curve(_sofr_curve())
        for i, tenor in enumerate(expected_tenors):
            assert parsed.points[i].tenor.arbitrary_precision_value == tenor

    def test_first_and_last_point_rates(self):
        parsed = _roundtrip_curve(_sofr_curve())
        assert parsed.points[0].rate.arbitrary_precision_value == "0.0530"
        assert parsed.points[4].rate.arbitrary_precision_value == "0.0430"


class TestFrnInputRoundTrip:
    def test_clean_price_survives(self):
        original = product_inputs_pb2.FrnInput(
            clean_price=_decimal("99.75"),
            curve=_sofr_curve(),
        )
        parsed = _roundtrip_frn(original)
        assert parsed.clean_price.arbitrary_precision_value == "99.75"

    def test_curve_survives(self):
        original = product_inputs_pb2.FrnInput(
            clean_price=_decimal("99.75"),
            curve=_sofr_curve(),
        )
        parsed = _roundtrip_frn(original)
        assert parsed.curve.index == index_type_pb2.SOFR
        assert len(parsed.curve.points) == 5


class TestProductInputRoundTrip:
    def test_frn_variant_survives(self):
        frn = product_inputs_pb2.FrnInput(
            clean_price=_decimal("99.875"),
            curve=_sofr_curve(),
        )
        original = product_inputs_pb2.ProductInput(frn=frn)
        parsed = _roundtrip_product_input(original)

        assert parsed.HasField("frn")
        assert parsed.frn.clean_price.arbitrary_precision_value == "99.875"
        assert parsed.frn.curve.index == index_type_pb2.SOFR

    def test_frn_is_only_set_variant(self):
        original = product_inputs_pb2.ProductInput(
            frn=product_inputs_pb2.FrnInput(clean_price=_decimal("100.0")),
        )
        parsed = _roundtrip_product_input(original)
        assert parsed.WhichOneof("input") == "frn"


class TestValuationRequestBackwardCompatibility:
    def test_product_input_field_survives_on_request(self):
        frn = product_inputs_pb2.FrnInput(
            clean_price=_decimal("100.25"),
            curve=_sofr_curve(),
        )
        original = valuation_request_pb2.ValuationRequestProto(
            object_class="ValuationRequest",
            version="0.0.1",
            product_input=product_inputs_pb2.ProductInput(frn=frn),
        )
        data = original.SerializeToString()
        parsed = valuation_request_pb2.ValuationRequestProto()
        parsed.ParseFromString(data)

        assert parsed.object_class == "ValuationRequest"
        assert parsed.product_input.HasField("frn")
        assert parsed.product_input.frn.clean_price.arbitrary_precision_value == "100.25"

    def test_request_without_product_input_unaffected(self):
        original = valuation_request_pb2.ValuationRequestProto(
            object_class="ValuationRequest",
            version="0.0.1",
        )
        data = original.SerializeToString()
        parsed = valuation_request_pb2.ValuationRequestProto()
        parsed.ParseFromString(data)

        assert parsed.object_class == "ValuationRequest"
        assert not parsed.HasField("product_input")


class TestNewRfrIndexTypesRoundTrip:
    @pytest.mark.parametrize("index,label", [
        (index_type_pb2.SONIA, "SONIA"),
        (index_type_pb2.ESTR,  "ESTR"),
        (index_type_pb2.TONA,  "TONA"),
    ])
    def test_rfr_index_survives(self, index, label):
        original = product_inputs_pb2.YieldCurveInput(
            index=index,
            reference_date=_date(2025, 1, 31),
            points=[product_inputs_pb2.CurvePoint(tenor=_decimal("1.0"), rate=_decimal("0.04"))],
        )
        parsed = _roundtrip_curve(original)
        assert parsed.index == index, f"{label} did not survive roundtrip"
