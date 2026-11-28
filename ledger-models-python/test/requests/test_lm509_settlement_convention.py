"""The settlement convention contract (LM-509).

ValuationRequestProto carries an optional SettlementConventionProto (80) with
trade_date (1), settlement_lag_business_days (2) and calendar_id (3).
ValuationResponseProto returns settlement_date (60) and measure_asof_date (61).
DV01 = 25 is unchanged; measure 31, which LM-509 added, is removed and
reserved (LM-514). Every new field round-trips, request bytes written by
v1.1.62 parse with the convention unset, and the proto comments are the spec:
settlement = trade date plus lag in business days on the named calendar, and
no comment ties settlement to asof_datetime without citing
settlement_convention. ValuationRequests.settlement_convention checks only
the calendar-free rules the comment states.

Comments are found by the name they document, never by line number.
"""
import json
import re
from decimal import Decimal
from pathlib import Path

import pytest
from google.protobuf import descriptor_pb2
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_util_pb2 import MeasureMapEntry
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.requests.valuation.valuation_request_pb2 import SettlementConventionProto, ValuationRequestProto
from fintekkers.requests.valuation.valuation_response_pb2 import ValuationResponseProto
from fintekkers.wrappers.models.errors import ModelValidationError
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal
from fintekkers.wrappers.requests.valuation import ValuationRequests

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos" / "fintekkers"
MEASURE = PROTOS / "models" / "position" / "measure.proto"
PRODUCT_INPUTS = PROTOS / "requests" / "valuation" / "product_inputs.proto"
REQUEST = PROTOS / "requests" / "valuation" / "valuation_request.proto"
RESPONSE = PROTOS / "requests" / "valuation" / "valuation_response.proto"
ADR = REPO_ROOT / "docs" / "adr" / "settlement_convention.md"
OLD_REQUEST_HEX = REPO_ROOT / "test-fixtures" / "wire" / "lm-509-request-v1.1.62.hex"
DV01_BEFORE = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-509-dv01-before.json").read_text())

LOCAL_DATE = "fintekkers.models.util.LocalDateProto"
NO_CONVENTION = "Unset when the request has no convention."
SETTLEMENT_RULE = ("trade_date plus settlement_lag_business_days business days on the calendar_id"
                   " calendar")
LAG_ZERO_ROLL = ("With a lag of 0, a trade_date that is not a business day on the calendar rolls forward to"
                 " the next business day.")
LAG_ZERO_EXAMPLE = "Example: trade_date 2026-11-28 (Saturday), lag 0, US_SIFMA settles on 2026-11-30."


def _block(path: Path, declaration: str) -> str:
    """The `//` comment lines directly above the line that declares
    `declaration` (`name =` or `message name`), plus that line."""
    lines = path.read_text().splitlines()
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}(\s*=|\s*\{{)")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end + 1])


def _prose(text: str) -> str:
    """Comment markers dropped, whitespace collapsed."""
    return " ".join(text.replace("//", " ").split())


def _date(year: int, month: int, day: int) -> LocalDateProto:
    return LocalDateProto(year=year, month=month, day=day)


# --- Descriptor (metric line 1) ---------------------------------------------

def _field_proto(message, name: str) -> descriptor_pb2.FieldDescriptorProto:
    proto = descriptor_pb2.DescriptorProto()
    message.DESCRIPTOR.CopyToProto(proto)
    [field] = [f for f in proto.field if f.name == name]
    assert not any(r.start <= field.number < r.end for r in proto.reserved_range), name
    return field


@pytest.mark.parametrize("message, name, number, kind", [
    (ValuationRequestProto, "settlement_convention", 80, "fintekkers.requests.valuation.SettlementConventionProto"),
    (SettlementConventionProto, "trade_date", 1, LOCAL_DATE),
    (SettlementConventionProto, "settlement_lag_business_days", 2, FieldDescriptor.TYPE_UINT32),
    (SettlementConventionProto, "calendar_id", 3, FieldDescriptor.TYPE_STRING),
    (ValuationResponseProto, "settlement_date", 60, LOCAL_DATE),
    (ValuationResponseProto, "measure_asof_date", 61, LOCAL_DATE),
])
def test_new_field_number_and_type(message, name, number, kind):
    field = message.DESCRIPTOR.fields_by_name[name]
    assert field.number == number
    assert field.label == FieldDescriptor.LABEL_OPTIONAL
    if isinstance(kind, str):
        assert field.message_type.full_name == kind
    else:
        assert field.type == kind
    _field_proto(message, name)


def test_new_request_and_response_numbers_were_unused():
    # The numbers on main (c020a989) before LM-509; reserved 20, 22, 24, 25.
    assert set(ValuationRequestProto.DESCRIPTOR.fields_by_number) == {1, 2, 10, 21, 23, 30, 70, 80}
    assert set(ValuationResponseProto.DESCRIPTOR.fields_by_number) == {1, 2, 20, 30, 40, 50, 60, 61}


def test_settlement_convention_has_explicit_presence():
    assert ValuationRequestProto.DESCRIPTOR.fields_by_name["settlement_convention"].has_presence
    assert not ValuationRequestProto().HasField("settlement_convention")


# LM-514: the removed name, split so that the metric-2 grep finds it only on
# the reserved line in measure.proto.
REMOVED_31 = "DV01" "_PER_MILLION"


def test_dv01_stays_25_and_31_is_reserved():
    assert MeasureProto.Value("DV01") == 25
    assert MeasureProto.Name(25) == "DV01"
    assert 31 not in MeasureProto.values()
    assert REMOVED_31 not in MeasureProto.keys()
    enum = descriptor_pb2.EnumDescriptorProto()
    MeasureProto.DESCRIPTOR.CopyToProto(enum)
    # Enum reserved ranges are end-inclusive.
    assert any(r.start <= 31 <= r.end for r in enum.reserved_range)
    assert set(enum.reserved_name) == {REMOVED_31}
    lines = [line.strip() for line in MEASURE.read_text().splitlines()]
    assert "reserved 31;" in lines
    assert f'reserved "{REMOVED_31}";' in lines


def test_dv01_proto_comment_and_declaration_unchanged():
    assert _block(MEASURE, "DV01") + "\n" == DV01_BEFORE["proto_block"]


# --- Round trip (metric line 2, R1) -----------------------------------------

def _full_request() -> ValuationRequestProto:
    request = ValuationRequestProto(measures=[MeasureProto.DV01])
    request.settlement_convention.CopyFrom(
        ValuationRequests.settlement_convention(_date(2026, 11, 25), 1, "US_SIFMA"))
    return request


def test_request_round_trip_with_every_new_field():
    request = _full_request()
    parsed = ValuationRequestProto.FromString(request.SerializeToString())
    assert parsed == request
    assert parsed.HasField("settlement_convention")
    convention = parsed.settlement_convention
    assert (convention.trade_date.year, convention.trade_date.month, convention.trade_date.day) == (2026, 11, 25)
    assert convention.settlement_lag_business_days == 1
    assert convention.calendar_id == "US_SIFMA"
    assert list(parsed.measures) == [MeasureProto.DV01]


def test_response_round_trip_with_both_dates_and_a_dv01_result():
    response = ValuationResponseProto(
        valuation_request=_full_request(),
        settlement_date=_date(2026, 11, 27),
        measure_asof_date=_date(2026, 11, 27),
        measure_results=[MeasureMapEntry(measure=MeasureProto.DV01,
                                         measure_decimal_value=encode_decimal(Decimal("502.50")))],
    )
    parsed = ValuationResponseProto.FromString(response.SerializeToString())
    assert parsed == response
    assert parsed.settlement_date == _date(2026, 11, 27)
    assert parsed.measure_asof_date == _date(2026, 11, 27)
    [result] = parsed.measure_results
    assert result.measure == MeasureProto.DV01
    assert str(decode_decimal(result.measure_decimal_value)) == "502.50"


def test_zero_lag_convention_reports_present():
    request = ValuationRequestProto()
    request.settlement_convention.CopyFrom(ValuationRequests.settlement_convention(_date(2026, 11, 25), 0, "US_SIFMA"))
    parsed = ValuationRequestProto.FromString(request.SerializeToString())
    assert parsed.HasField("settlement_convention")
    assert parsed.settlement_convention.settlement_lag_business_days == 0


# --- Backward compat (metric line 3) ----------------------------------------

def test_v1_1_62_request_bytes_parse_with_the_convention_unset():
    parsed = ValuationRequestProto.FromString(bytes.fromhex(OLD_REQUEST_HEX.read_text().strip()))
    assert not parsed.HasField("settlement_convention")
    assert list(parsed.measures) == [MeasureProto.DV01]
    assert parsed.asof_datetime.timestamp.ToJsonString() == "2026-11-27T21:00:00Z"
    assert parsed.asof_datetime.time_zone == "America/New_York"
    assert parsed.HasField("position_input")
    assert parsed.product_input.bond.security.issuer_name == "US Treasury"
    assert str(decode_decimal(parsed.product_input.bond.clean_price)) == "99.75"
    # Nothing unknown: the old bytes hold only fields this version knows.
    assert parsed.SerializeToString() == bytes.fromhex(OLD_REQUEST_HEX.read_text().strip())


def test_response_without_convention_leaves_both_dates_unset():
    parsed = ValuationResponseProto.FromString(ValuationResponseProto(measure_results=[]).SerializeToString())
    assert not parsed.HasField("settlement_date")
    assert not parsed.HasField("measure_asof_date")


# --- Comment spec (metric line 4, R2, R3) -----------------------------------

def test_settlement_convention_comments_define_the_settlement_date():
    message = _prose(_block(REQUEST, "message SettlementConventionProto"))
    field = _prose(_block(REQUEST, "settlement_convention"))
    response = _prose(_block(RESPONSE, "settlement_date"))
    for text in (message, field, response):
        assert SETTLEMENT_RULE in text
    for phrase in ("A lag of 0 settles on trade_date itself",
                   "A business day is a weekday that is not a holiday on that calendar",
                   "trade_date unset while settlement_convention is set",
                   "calendar_id empty or blank, or a calendar valuation-service does not know",
                   "INVALID_ARGUMENT"):
        assert phrase in message, phrase
    assert "Unset: the effective settlement date is the UTC date of asof_datetime, exactly as before LM-509" in field
    assert "asof_datetime still selects the market data either way" in field
    assert "unset is distinct from a lag of 0" in field
    assert "e.g. US_SIFMA" in _prose(_block(REQUEST, "calendar_id"))


def test_lag_zero_rolls_forward_when_trade_date_is_not_a_business_day():
    """LM-512: the proto comment and the ADR state the lag-0 roll rule and its example word for word."""
    message = _prose(_block(REQUEST, "message SettlementConventionProto"))
    adr = " ".join(ADR.read_text().split())
    for text in (message, adr):
        assert LAG_ZERO_ROLL in text
        assert LAG_ZERO_EXAMPLE in text
    assert "rolled forward to the next business day" in _prose(_block(REQUEST, "settlement_lag_business_days"))
    # The lag >= 1 rule and its example are unchanged.
    assert "business day 1 is the first business day after trade_date" in message
    assert ("Example: trade_date 2026-11-25, lag 1, US_SIFMA. 2026-11-26 is Thanksgiving"
            " (a SIFMA holiday) and 2026-11-27 is a SIFMA early close, which is still a"
            " business day, so the settlement date is 2026-11-27.") in message


def test_response_dates_are_unset_without_a_convention_and_measure_asof_equals_settlement():
    settlement = _prose(_block(RESPONSE, "settlement_date"))
    asof = _prose(_block(RESPONSE, "measure_asof_date"))
    assert NO_CONVENTION in settlement and NO_CONVENTION in asof
    assert "The date every measure in measure_results is computed at" in asof
    assert "equals settlement_date today" in asof
    assert "future forward valuation" in asof


def _paragraphs(path: Path):
    """Each run of `//` lines with no blank `//` line in it."""
    paragraph = []
    for line in path.read_text().splitlines() + [""]:
        text = line.strip()
        if text.startswith("//") and text.strip("/ "):
            paragraph.append(text)
            continue
        if paragraph:
            yield " ".join(paragraph)
        paragraph = []


@pytest.mark.parametrize("path", [PRODUCT_INPUTS, MEASURE], ids=["product_inputs", "measure"])
def test_no_comment_ties_settlement_to_asof_datetime_without_citing_settlement_convention(path):
    tied = [p for p in _paragraphs(path) if "asof_datetime" in p]
    assert tied, path.name
    uncited = [p for p in tied if "settlement_convention" not in p]
    assert not uncited, uncited


# --- Helper rules (R5, O7) --------------------------------------------------

def _fields(error: ModelValidationError):
    return [v.field for v in error.violations]


def test_helper_rejects_a_blank_calendar():
    for blank in ("", "   "):
        with pytest.raises(ModelValidationError) as raised:
            ValuationRequests.settlement_convention(_date(2026, 11, 25), 1, blank)
        assert _fields(raised.value) == ["settlement_convention.calendar_id"]


def test_helper_rejects_an_unset_trade_date():
    with pytest.raises(ModelValidationError) as raised:
        ValuationRequests.settlement_convention(None, 1, "US_SIFMA")
    assert _fields(raised.value) == ["settlement_convention.trade_date"]


def test_helper_rejects_a_negative_lag():
    with pytest.raises(ModelValidationError) as raised:
        ValuationRequests.settlement_convention(_date(2026, 11, 25), -1, "US_SIFMA")
    assert _fields(raised.value) == ["settlement_convention.settlement_lag_business_days"]


def test_helper_reports_every_broken_rule_at_once():
    with pytest.raises(ModelValidationError) as raised:
        ValuationRequests.settlement_convention(None, -1, "")
    assert _fields(raised.value) == ["settlement_convention.trade_date",
                                     "settlement_convention.settlement_lag_business_days",
                                     "settlement_convention.calendar_id"]


def test_helper_accepts_a_zero_lag():
    convention = ValuationRequests.settlement_convention(_date(2026, 11, 25), 0, "US_SIFMA")
    assert convention.settlement_lag_business_days == 0
    assert convention.HasField("trade_date")


def test_helper_passes_an_unknown_calendar_through():
    # valuation-service owns the calendars and rejects an unknown id.
    convention = ValuationRequests.settlement_convention(_date(2026, 11, 25), 1, "XX_UNKNOWN")
    assert convention.calendar_id == "XX_UNKNOWN"
