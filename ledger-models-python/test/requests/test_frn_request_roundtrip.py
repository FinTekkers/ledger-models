"""
Step 3 tests — FrnInput / ProductInput proto round-trips.

For each new message type: construct → serialize to bytes → deserialize → verify all fields match.
"""
import json
from decimal import Decimal
from pathlib import Path

import pytest
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.security import security_pb2
from fintekkers.models.security.bond import issuance_pb2
from fintekkers.requests.valuation import product_inputs_pb2
from fintekkers.requests.valuation import valuation_request_pb2
from fintekkers.models.security.index import index_type_pb2
from fintekkers.models.util import decimal_value_pb2, local_date_pb2
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal


def _decimal(value: str) -> decimal_value_pb2.DecimalValueProto:
    return encode_decimal(Decimal(value))


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

        assert format(decode_decimal(parsed.tenor), "f") == "2.0"
        assert format(decode_decimal(parsed.rate), "f") == "0.0470"


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
            assert format(decode_decimal(parsed.points[i].tenor), "f") == tenor

    def test_first_and_last_point_rates(self):
        parsed = _roundtrip_curve(_sofr_curve())
        assert format(decode_decimal(parsed.points[0].rate), "f") == "0.0530"
        assert format(decode_decimal(parsed.points[4].rate), "f") == "0.0430"


class TestFrnInputRoundTrip:
    def test_clean_price_survives(self):
        original = product_inputs_pb2.FrnInput(
            clean_price=_decimal("99.75"),
            curve=_sofr_curve(),
        )
        parsed = _roundtrip_frn(original)
        assert format(decode_decimal(parsed.clean_price), "f") == "99.75"

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
        assert format(decode_decimal(parsed.frn.clean_price), "f") == "99.875"
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
            product_input=product_inputs_pb2.ProductInput(frn=frn),
        )
        data = original.SerializeToString()
        parsed = valuation_request_pb2.ValuationRequestProto()
        parsed.ParseFromString(data)

        assert parsed.product_input.HasField("frn")
        assert format(decode_decimal(parsed.product_input.frn.clean_price), "f") == "100.25"

    def test_request_without_product_input_unaffected(self):
        original = valuation_request_pb2.ValuationRequestProto(
        )
        data = original.SerializeToString()
        parsed = valuation_request_pb2.ValuationRequestProto()
        parsed.ParseFromString(data)

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


# LM-365: published reference-rate fixings on FrnInput. T_BILL_13_WEEK is a
# non-default enum value, so it is on the wire.
def _fixing(index, date, rate: str) -> product_inputs_pb2.ReferenceRateFixingProto:
    return product_inputs_pb2.ReferenceRateFixingProto(index=index, fixing_date=date, rate=_decimal(rate))


class TestReferenceRateFixingRoundTrip:
    def test_all_fields_survive(self):
        original = _fixing(index_type_pb2.T_BILL_13_WEEK, _date(2026, 10, 19), "0.0432")
        parsed = product_inputs_pb2.ReferenceRateFixingProto.FromString(original.SerializeToString())

        assert parsed.index == index_type_pb2.T_BILL_13_WEEK
        assert parsed.fixing_date.year == 2026
        assert parsed.fixing_date.month == 10
        assert parsed.fixing_date.day == 19
        assert format(decode_decimal(parsed.rate), "f") == "0.0432"

    def test_two_fixings_survive_in_order(self):
        original = product_inputs_pb2.FrnInput(
            clean_price=_decimal("99.75"),
            fixings=[
                _fixing(index_type_pb2.T_BILL_13_WEEK, _date(2026, 10, 19), "0.0432"),
                _fixing(index_type_pb2.SOFR, _date(2026, 10, 26), "0.0429"),
            ],
        )
        parsed = _roundtrip_frn(original)

        assert len(parsed.fixings) == 2
        expected = [
            (index_type_pb2.T_BILL_13_WEEK, 19, "0.0432"),
            (index_type_pb2.SOFR, 26, "0.0429"),
        ]
        for fixing, (index, day, rate) in zip(parsed.fixings, expected):
            assert fixing.index == index
            assert fixing.fixing_date.year == 2026
            assert fixing.fixing_date.month == 10
            assert fixing.fixing_date.day == day
            assert format(decode_decimal(fixing.rate), "f") == rate
        assert format(decode_decimal(parsed.clean_price), "f") == "99.75"


# LM-382: the T_BILL_13_WEEK fixing carries its bill's maturity, and the
# issuance its auction date. Each date differs, so a swapped field fails.
class TestLm382RoundTrip:
    def test_bill_maturity_date_survives(self):
        original = _fixing(index_type_pb2.T_BILL_13_WEEK, _date(2026, 7, 20), "4.215")
        original.bill_maturity_date.CopyFrom(_date(2026, 10, 22))
        parsed = product_inputs_pb2.ReferenceRateFixingProto.FromString(original.SerializeToString())

        assert parsed.index == index_type_pb2.T_BILL_13_WEEK
        assert parsed.fixing_date == _date(2026, 7, 20)
        assert parsed.HasField("bill_maturity_date")
        assert parsed.bill_maturity_date == _date(2026, 10, 22)
        assert format(decode_decimal(parsed.rate), "f") == "4.215"

    def test_auction_date_survives(self):
        original = issuance_pb2.IssuanceProto(
            auction_announcement_date=_date(2026, 7, 16),
            auction_date=_date(2026, 7, 20),
            auction_issue_date=_date(2026, 7, 23),
            high_discount_rate=_decimal("4.215"),
        )
        parsed = issuance_pb2.IssuanceProto.FromString(original.SerializeToString())

        assert parsed.HasField("auction_date")
        assert parsed.auction_date == _date(2026, 7, 20)
        assert parsed.auction_issue_date == _date(2026, 7, 23)
        assert parsed.auction_announcement_date == _date(2026, 7, 16)
        assert format(decode_decimal(parsed.high_discount_rate), "f") == "4.215"

    def test_new_fields_decode_unset_when_absent(self):
        fixing = product_inputs_pb2.ReferenceRateFixingProto.FromString(
            _fixing(index_type_pb2.SOFR, _date(2026, 10, 26), "0.0429").SerializeToString())
        issuance = issuance_pb2.IssuanceProto.FromString(
            issuance_pb2.IssuanceProto(auction_issue_date=_date(2026, 7, 23)).SerializeToString())

        assert not fixing.HasField("bill_maturity_date")
        assert not fixing.HasField("bill_issue_date")
        assert not issuance.HasField("auction_date")
        assert issuance.auction_issue_date == _date(2026, 7, 23)


# LM-389: the T_BILL_13_WEEK fixing carries its auction's issue date.
# Fixing, issue and maturity dates all differ, so a swapped field fails.
class TestLm389RoundTrip:
    def test_bill_issue_date_survives(self):
        original = _fixing(index_type_pb2.T_BILL_13_WEEK, _date(2026, 7, 20), "4.215")
        original.bill_maturity_date.CopyFrom(_date(2026, 10, 22))
        original.bill_issue_date.CopyFrom(_date(2026, 7, 23))
        parsed = product_inputs_pb2.ReferenceRateFixingProto.FromString(original.SerializeToString())

        assert parsed.HasField("bill_issue_date")
        assert parsed.bill_issue_date == _date(2026, 7, 23)
        assert parsed.fixing_date == _date(2026, 7, 20)
        assert parsed.bill_maturity_date == _date(2026, 10, 22)

    def test_bill_issue_date_unset_for_sofr(self):
        parsed = product_inputs_pb2.ReferenceRateFixingProto.FromString(
            _fixing(index_type_pb2.SOFR, _date(2026, 10, 26), "0.0429").SerializeToString())

        assert not parsed.HasField("bill_issue_date")


REPO_ROOT = Path(__file__).resolve().parents[3]
FIELD_CHANGES = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-365.json").read_text())
LM382_ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-382.json").read_text())["added"]
LM389_ADDED = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-389.json").read_text())["added"]
LM365_MESSAGES = {
    d.full_name: d
    for d in (
        product_inputs_pb2.FrnInput.DESCRIPTOR,
        product_inputs_pb2.ReferenceRateFixingProto.DESCRIPTOR,
        issuance_pb2.IssuanceProto.DESCRIPTOR,
    )
}


def _type_name(field: FieldDescriptor) -> str:
    if field.message_type is not None:
        return f".{field.message_type.full_name}"
    if field.enum_type is not None:
        return f".{field.enum_type.full_name}"
    return str(field.type)


def _check(entry: dict) -> None:
    message = LM365_MESSAGES[entry["message"][1:]]
    field = message.fields_by_number.get(entry["number"])
    assert field is not None, f"{message.full_name} has no field {entry['number']}"
    assert field.name == entry["name"], entry
    assert _type_name(field) == entry["type"], entry
    assert (field.label == FieldDescriptor.LABEL_REPEATED) == entry.get("repeated", False), entry


class TestLm365Descriptors:
    @pytest.mark.parametrize("entry", FIELD_CHANGES["kept"], ids=lambda e: f"{e['message']}={e['number']}")
    def test_kept_field_keeps_number_name_and_type(self, entry):
        _check(entry)

    @pytest.mark.parametrize("entry", FIELD_CHANGES["added"], ids=lambda e: f"{e['message']}={e['number']}")
    def test_added_field_has_number_name_and_type(self, entry):
        _check(entry)

    @pytest.mark.parametrize("entry", LM382_ADDED, ids=lambda e: f"{e['message']}={e['number']}")
    def test_lm382_added_field_has_number_name_and_type(self, entry):
        _check(entry)

    @pytest.mark.parametrize("entry", LM389_ADDED, ids=lambda e: f"{e['message']}={e['number']}")
    def test_lm389_added_field_has_number_name_and_type(self, entry):
        _check(entry)

    def test_field_sets_are_exactly_kept_and_added(self):
        # LM-382's and LM-389's additions join LM-365's kept and added fields.
        expected: dict = {}
        for entry in FIELD_CHANGES["kept"] + FIELD_CHANGES["added"] + LM382_ADDED + LM389_ADDED:
            expected.setdefault(entry["message"][1:], set()).add(entry["number"])
        assert expected.keys() == LM365_MESSAGES.keys()
        for name, message in LM365_MESSAGES.items():
            assert set(message.fields_by_number) == expected[name], name

    def test_fixings_is_repeated_message_not_map(self):
        fixings = product_inputs_pb2.FrnInput.DESCRIPTOR.fields_by_name["fixings"]
        assert fixings.label == FieldDescriptor.LABEL_REPEATED
        assert fixings.message_type is product_inputs_pb2.ReferenceRateFixingProto.DESCRIPTOR
        assert not fixings.message_type.GetOptions().map_entry

    def test_fixing_index_is_the_reference_rate_index_enum(self):
        index = product_inputs_pb2.ReferenceRateFixingProto.DESCRIPTOR.fields_by_name["index"]
        reference_rate_index = security_pb2.FrnExtensionProto.DESCRIPTOR.fields_by_name["reference_rate_index"]
        assert index.enum_type.full_name == reference_rate_index.enum_type.full_name
        assert index.enum_type.full_name == "fintekkers.models.security.index.IndexTypeProto"
