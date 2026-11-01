"""LM-410: product_inputs.for_security and ValuationRequests.typed.

The shared cases live in test-fixtures/product-inputs/, one file per case,
read by the Java, JS and Rust tests too: all four must produce the same bytes
and raise the same errors. Regenerate them (only when a case is meant to
change) by running this file as a script from `ledger-models-python`:
`python test/requests/test_product_input_builders.py`.
See docs/adr/product_input_builders.md.
"""
import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import pytest
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_pb2 import PositionProto, PositionTypeProto
from fintekkers.models.position.position_util_pb2 import MeasureMapEntry
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.bond.agency_pb2 import AgencyProto
from fintekkers.models.security.coupon_frequency_pb2 import CouponFrequencyProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import (
    BondDetailsProto,
    FrnExtensionProto,
    IndexDetailsProto,
    MbsExtensionProto,
    SecurityProto,
    TipsExtensionProto,
)
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.valuation.product_inputs_pb2 import (
    BondInput,
    CurvePoint,
    InflationIndexInput,
    MonthlyIndexReading,
    MonthlyIndexReadings,
    ProductInput,
    ReferenceRateFixingProto,
    TipsInput,
    YieldCurveInput,
)
from fintekkers.wrappers.models.errors import (
    MissingMarketDataError,
    ModelValidationError,
    UnmappedProductTypeError,
)
from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security import product_hierarchy
from fintekkers.wrappers.models.security.product_inputs import (
    MarketData,
    MarketDataKind,
    arm_for,
    for_security,
)
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.util.decimal import encode_decimal
from fintekkers.wrappers.requests.valuation import ValuationRequests
from fintekkers.wrappers.services.valuation import ValuationService

REPO = Path(__file__).resolve().parents[3]
FIXTURES = REPO / "test-fixtures" / "product-inputs"
MEASURES_JSON = REPO / "ledger-models-protos" / "catalog" / "measures.json"
UNIT_PRICED = ("equity", "cash")


def _load(path: Path) -> dict:
    case = json.loads(path.read_text())
    case["name"] = path.stem
    return case


def _cases() -> list:
    return [_load(p) for p in sorted(FIXTURES.glob("*.json"))]


SUCCESS = [c for c in _cases() if "arm" in c]
ERRORS = [c for c in _cases() if "error" in c]


def _parse(message_class, hex_bytes: str):
    return message_class.FromString(bytes.fromhex(hex_bytes))


def _market_data(case: dict) -> MarketData:
    md = case.get("market_data", {})
    return MarketData(
        cpi=_parse(InflationIndexInput, md["cpi_hex"]) if "cpi_hex" in md else None,
        fixings=tuple(_parse(ReferenceRateFixingProto, h) for h in md.get("fixings_hex", [])),
        curve=_parse(YieldCurveInput, md["curve_hex"]) if "curve_hex" in md else None,
    )


def _inputs(case: dict):
    return _parse(SecurityProto, case["security_hex"]), _parse(PriceProto, case["price_hex"]), _market_data(case)


def _typed_args(case: dict):
    typed = case["typed"]
    return (
        _parse(LocalTimestampProto, typed["asof_hex"]),
        _parse(PositionProto, typed["position_hex"]),
        [MeasureProto.Value(m) for m in typed["measures"]],
    )


def _bytes(message) -> str:
    return message.SerializeToString(deterministic=True).hex()


def _assert_error(raised: Exception, error: dict) -> None:
    assert type(raised).__name__ == error["type"]
    if error["type"] == "MissingMarketDataError":
        assert raised.arm == error["arm"]
        assert raised.kind == error["kind"]
        assert error["arm"] in str(raised) and error["kind"] in str(raised)
        assert raised.field == error["field"]


# --- for_security -------------------------------------------------------------

def test_fixtures_cover_every_arm_in_valuation_arms():
    """Every arm the synced hierarchy.json mirror names has a success fixture."""
    section = product_hierarchy.registry_section("valuation_arms")
    arms = {entry["arm"] for entry in section["entries"]}
    assert {c["arm"] for c in SUCCESS} == arms
    assert len(SUCCESS) == len(arms), "one success fixture per arm"


@pytest.mark.parametrize("case", SUCCESS, ids=lambda c: c["name"])
def test_for_security_matches_fixture_bytes(case):
    security, price, md = _inputs(case)
    assert _bytes(for_security(security, price, md)) == case["expected_hex"]


@pytest.mark.parametrize("case", SUCCESS, ids=lambda c: c["name"])
def test_for_security_fields(case):
    """R1: the arm is arm_for's, and each field is the input it came from."""
    security, price, md = _inputs(case)
    out = for_security(security, price, md)
    arm = out.WhichOneof("input")
    assert arm == arm_for(security) == case["arm"]
    body = getattr(out, arm)
    assert body.security == security
    if arm in UNIT_PRICED:
        assert body.unit_price == price.price
        assert "clean_price" not in body.DESCRIPTOR.fields_by_name
    else:
        assert body.clean_price == price.price
        assert "unit_price" not in body.DESCRIPTOR.fields_by_name
        assert not body.HasField("cost_basis")
    if arm == "tips":
        assert body.cpi == md.cpi
    if arm == "frn":
        assert list(body.fixings) == list(md.fixings)
        assert body.curve == md.curve


@pytest.mark.parametrize("case", ERRORS, ids=lambda c: c["name"])
def test_for_security_raises_fixture_error(case):
    security, price, md = _inputs(case)
    with pytest.raises((MissingMarketDataError, UnmappedProductTypeError)) as raised:
        for_security(security, price, md)
    _assert_error(raised.value, case["error"])


def test_for_security_without_market_data_raises_missing_cpi():
    """R5: market_data omitted is the same as none supplied."""
    case = _load(FIXTURES / "tips.json")
    security, price, _ = _inputs(case)
    with pytest.raises(MissingMarketDataError) as raised:
        for_security(security, price)
    assert (raised.value.arm, raised.value.kind) == ("tips", "CPI_U")


# --- ValuationRequests.typed ---------------------------------------------------

@pytest.mark.parametrize("case", SUCCESS, ids=lambda c: c["name"])
def test_typed_matches_fixture_and_sets_only_typed_fields(case):
    security, price, md = _inputs(case)
    asof, position, measures = _typed_args(case)
    product_input = for_security(security, price, md)
    request = ValuationRequests.typed(asof, product_input, position, measures)
    assert _bytes(request) == case["typed"]["expected_hex"]
    assert request.HasField("position_input")
    assert request.position_input == position
    assert request.product_input == product_input


@pytest.mark.parametrize("case", ERRORS, ids=lambda c: c["name"])
def test_typed_raises_fixture_error(case):
    asof, position, measures = _typed_args(case)
    product_input = _parse(ProductInput, case["typed"]["product_input_hex"])
    with pytest.raises((MissingMarketDataError, UnmappedProductTypeError)) as raised:
        ValuationRequests.typed(asof, product_input, position, measures)
    _assert_error(raised.value, case["error"])


def test_typed_requires_position():
    case = _load(FIXTURES / "bond.json")
    security, price, md = _inputs(case)
    asof, _, measures = _typed_args(case)
    with pytest.raises(ModelValidationError) as raised:
        ValuationRequests.typed(asof, for_security(security, price, md), None, measures)
    assert raised.value.field == "position_input"


def test_typed_rejects_an_arm_arm_for_did_not_pick():
    case = _load(FIXTURES / "tips.json")
    security, price, _ = _inputs(case)
    asof, position, measures = _typed_args(case)
    wrong = ProductInput(bond=BondInput(security=security, clean_price=price.price))
    with pytest.raises(ModelValidationError) as raised:
        ValuationRequests.typed(asof, wrong, position, measures)
    assert not isinstance(raised.value, MissingMarketDataError)
    assert raised.value.field == "product_input.bond"


def test_typed_rejects_an_input_with_no_arm():
    case = _load(FIXTURES / "bond.json")
    asof, position, measures = _typed_args(case)
    with pytest.raises(ModelValidationError) as raised:
        ValuationRequests.typed(asof, ProductInput(), position, measures)
    assert raised.value.field == "product_input"


# --- run_valuation (metric 4) --------------------------------------------------

class _RecordingStub:
    def __init__(self):
        self.requests = []

    def RunValuation(self, request):
        self.requests.append(request)
        return None


def _service() -> ValuationService:
    service = object.__new__(ValuationService)
    service.stub = _RecordingStub()
    return service


@pytest.mark.parametrize("case", SUCCESS, ids=lambda c: c["name"])
def test_run_valuation_sends_only_product_input_and_position(case):
    security, price, md = _inputs(case)
    _, position, measures = _typed_args(case)
    service = _service()
    service.run_valuation(security=Security(security), position=Position(position), price=Price(price),
                          measures=measures, asOf=datetime(2026, 10, 14, 9, 30), market_data=md)
    [request] = service.stub.requests
    set_fields = {f.number for f, _ in request.ListFields()}
    assert 20 not in set_fields and 22 not in set_fields
    assert {21, 70} <= set_fields
    assert request.product_input == for_security(security, price, md)


def test_run_valuation_raises_on_missing_cpi_and_sends_nothing():
    security, price, _ = _inputs(_load(FIXTURES / "tips.json"))
    service = _service()
    with pytest.raises(MissingMarketDataError):
        service.run_valuation(security=Security(security), position=Position(PositionProto()),
                              price=Price(price), measures=[MeasureProto.MARKET_VALUE])
    assert service.stub.requests == []


def test_run_valuation_raises_on_missing_inputs_and_sends_nothing():
    service = _service()
    with pytest.raises(ModelValidationError) as raised:
        service.run_valuation(measures=[MeasureProto.MARKET_VALUE])
    assert [v.field for v in raised.value.violations] == ["security", "position", "price"]
    assert service.stub.requests == []


# --- Guardrail: one CPI-U name ---------------------------------------------------

def test_cpi_u_is_the_measures_catalog_name_and_the_only_cpi_kind():
    """The CPI-U market-data kind is the CPI_U input the measures catalog
    already names (REFERENCE_CPI depends_on), and there is no second one."""
    catalog = json.loads(MEASURES_JSON.read_text())
    depends_on = {d for m in catalog["measures"] for d in m.get("depends_on") or []}
    assert MarketDataKind.CPI_U.value in depends_on
    assert [k.value for k in MarketDataKind if "CPI" in k.value] == ["CPI_U"]
    assert IndexTypeProto.Name(IndexTypeProto.CPI_U) == MarketDataKind.CPI_U.value


# --- Fixture generator ---------------------------------------------------------

def _uuid(n: int) -> UUIDProto:
    return UUIDProto(raw_uuid=UUID(int=n).bytes)


def _date(y: int, m: int, d: int) -> LocalDateProto:
    return LocalDateProto(year=y, month=m, day=d)


def _dec(value: str):
    return encode_decimal(Decimal(value))


def _bond_details(coupon: str, coupon_type: int, frequency: int, face: str = "1000") -> BondDetailsProto:
    return BondDetailsProto(coupon_rate=_dec(coupon), coupon_type=coupon_type, coupon_frequency=frequency,
                            face_value=_dec(face), issue_date=_date(2024, 1, 15), maturity_date=_date(2034, 1, 15))


def _security(n: int, product_type: int, **fields) -> SecurityProto:
    return SecurityProto(uuid=_uuid(n), product_type=product_type, issuer_name="Fixture", **fields)


def _price(n: int, value: str) -> PriceProto:
    return PriceProto(uuid=_uuid(n), price=_dec(value))


def _cpi_index() -> SecurityProto:
    return SecurityProto(uuid=_uuid(50), issuer_name="CPI-U NSA",
                         index_details=IndexDetailsProto(index_type=IndexTypeProto.CPI_U))


def _write_fixtures():
    asof = LocalTimestampProto(timestamp=Timestamp(seconds=1_792_000_000), time_zone="America/New_York")
    position = PositionProto(position_type=PositionTypeProto.TRANSACTION, measures=[
        MeasureMapEntry(measure=MeasureProto.DIRECTED_QUANTITY, measure_decimal_value=_dec("100"))])
    measures = ["MARKET_VALUE"]

    tips = _security(2, ProductTypeProto.TIPS,
                     bond_details=_bond_details("1.25", CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY),
                     tips_extension=TipsExtensionProto(base_cpi=_dec("299.1"), index_date=_date(2024, 1, 1),
                                                       inflation_index_type=IndexTypeProto.CPI_U))
    readings = InflationIndexInput(index=_cpi_index(), readings=MonthlyIndexReadings(readings=[
        MonthlyIndexReading(year=2026, month=7, value=_dec("321.500")),
        MonthlyIndexReading(year=2026, month=8, value=_dec("322.105")),
    ]))
    frn = _security(3, ProductTypeProto.TREASURY_FRN,
                    bond_details=_bond_details("0", CouponTypeProto.FLOAT, CouponFrequencyProto.QUARTERLY),
                    frn_extension=FrnExtensionProto(spread=_dec("0.125"), reference_rate_index=IndexTypeProto.T_BILL_13_WEEK,
                                                    reset_frequency=CouponFrequencyProto.QUARTERLY))
    fixing = ReferenceRateFixingProto(index=IndexTypeProto.T_BILL_13_WEEK, fixing_date=_date(2026, 10, 19),
                                      rate=_dec("4.215"), bill_maturity_date=_date(2027, 1, 21),
                                      bill_issue_date=_date(2026, 10, 22))
    curve = YieldCurveInput(index=IndexTypeProto.T_BILL_13_WEEK, reference_date=_date(2026, 10, 14), points=[
        CurvePoint(tenor=_dec("0.25"), rate=_dec("0.0425")), CurvePoint(tenor=_dec("1"), rate=_dec("0.0410"))])
    mbs = _security(4, ProductTypeProto.MORTGAGE_BACKED,
                    bond_details=_bond_details("5.5", CouponTypeProto.FIXED, CouponFrequencyProto.MONTHLY, "1000000"),
                    mbs_extension=MbsExtensionProto(pool_number="FN AS1234", agency=AgencyProto.FNMA, wac=_dec("6.0"),
                                                    wam=348, pass_through_rate=_dec("5.5"), current_factor=_dec("0.9"),
                                                    original_face_value=_dec("1000000"), current_upb=_dec("900000"),
                                                    psa_speed=_dec("150")))

    success = {
        "bond": (_security(1, ProductTypeProto.TREASURY_NOTE,
                           bond_details=_bond_details("4.25", CouponTypeProto.FIXED, CouponFrequencyProto.SEMIANNUALLY)),
                 _price(101, "99.75"), MarketData()),
        "tips": (tips, _price(102, "101.5"), MarketData(cpi=readings)),
        "frn": (frn, _price(103, "100.0125"), MarketData(fixings=(fixing,), curve=curve)),
        "mbs": (mbs, _price(104, "101.5"), MarketData()),
        "equity": (_security(5, ProductTypeProto.COMMON_STOCK), _price(105, "187.25"), MarketData()),
        "cash": (_security(6, ProductTypeProto.MONEY_MARKET_FUND), _price(106, "1.00"), MarketData()),
    }
    missing = {"type": "MissingMarketDataError", "arm": "tips", "kind": "CPI_U", "field": "tips.cpi"}
    tips_price = _price(102, "101.5")
    fx = _security(7, ProductTypeProto.FX_SPOT)
    errors = {
        "tips-missing-cpi": (tips, tips_price, MarketData(), missing,
                             ProductInput(tips=TipsInput(security=tips, clean_price=tips_price.price))),
        "tips-empty-cpi": (tips, tips_price, MarketData(cpi=InflationIndexInput(index=_cpi_index())), missing,
                           ProductInput(tips=TipsInput(security=tips, clean_price=tips_price.price,
                                                       cpi=InflationIndexInput(index=_cpi_index())))),
        "unmapped": (fx, _price(107, "1.0850"), MarketData(), {"type": "UnmappedProductTypeError"},
                     ProductInput(bond=BondInput(security=fx))),
    }

    def inputs(security, price, md):
        out = {"security_hex": _bytes(security), "price_hex": _bytes(price)}
        market_data = {}
        if md.cpi is not None:
            market_data["cpi_hex"] = _bytes(md.cpi)
        if md.fixings:
            market_data["fixings_hex"] = [_bytes(f) for f in md.fixings]
        if md.curve is not None:
            market_data["curve_hex"] = _bytes(md.curve)
        if market_data:
            out["market_data"] = market_data
        return out

    typed_args = {"asof_hex": _bytes(asof), "position_hex": _bytes(position), "measures": measures}
    doc = ("LM-410 shared case for ProductInputs.forSecurity and ValuationRequests.typed; read by the Java, "
           "JS, Python and Rust tests. Generated by ledger-models-python/test/requests/"
           "test_product_input_builders.py. See docs/adr/product_input_builders.md.")
    FIXTURES.mkdir(exist_ok=True)
    for name, (security, price, md) in success.items():
        product_input = for_security(security, price, md)
        request = ValuationRequests.typed(asof, product_input, position, [MeasureProto.Value(m) for m in measures])
        case = {"_doc": doc, **inputs(security, price, md), "arm": name, "expected_hex": _bytes(product_input),
                "typed": {**typed_args, "expected_hex": _bytes(request)}}
        (FIXTURES / f"{name}.json").write_text(json.dumps(case, indent=2) + "\n")
    for name, (security, price, md, error, product_input) in errors.items():
        case = {"_doc": doc, **inputs(security, price, md), "error": error,
                "typed": {**typed_args, "product_input_hex": _bytes(product_input)}}
        (FIXTURES / f"{name}.json").write_text(json.dumps(case, indent=2) + "\n")


if __name__ == "__main__":
    _write_fixtures()
