"""The TIPS spec for PROFIT_LOSS and PROFIT_LOSS_PERCENT (LM-405). Both the
measure.proto comments and the catalog entries state the nominal clean formula
with both sides index-adjusted, the lot settlement date, the absent rule and
31 CFR 356 Appendix B rounding, with the 912810RL4 example. The example is
re-derived here from the owner-supplied inputs in
test-fixtures/tips/912810RL4.json, never from service output. REFERENCE_CPI,
INDEX_RATIO, MARKET_VALUE and ADJUSTED_COST_BASIS state Appendix B rounding, no
shipped text says "unrounded", and the non-TIPS PROFIT_LOSS and
PROFIT_LOSS_PERCENT text from before LM-405 stays.

Comments are found by the name they document, never by line number.
"""
import calendar
import json
import re
from datetime import date
from decimal import ROUND_HALF_UP, Decimal, localcontext
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
PRODUCT_INPUTS = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "requests" / "valuation" / "product_inputs.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"
# Snapshot from main before LM-405. A missing file fails at import: never skipped.
BEFORE = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-405-unchanged.json").read_text())
EXAMPLE = json.loads((REPO_ROOT / "test-fixtures" / "tips" / "912810RL4.json").read_text())
# Text that ships in released packages; test-fixtures/ and docs/adr/ keep history.
SHIPPED = [
    MEASURE,
    PRODUCT_INPUTS,
    CATALOG,
    REPO_ROOT / "ledger-models-java" / "src" / "main" / "java" / "common" / "models" / "postion" / "Measure.java",
    REPO_ROOT / "ledger-models-rust" / "fintekkers.models.position.rs",
]

PNL = ["PROFIT_LOSS", "PROFIT_LOSS_PERCENT"]
APPENDIX_B = ["REFERENCE_CPI", "INDEX_RATIO", "MARKET_VALUE", "ADJUSTED_COST_BASIS", "PROFIT_LOSS"]
FORMULA = {
    "PROFIT_LOSS": [
        "profitloss = marketside - costside",
        "marketside = clean_price / 100 * indexratio(valuation date) * directed_quantity",
        "price_i / 100 * indexratio(s_i) * face_i",
        "taxlotproto.price",
        "taxlotproto.open_quantity",
        "open_date plus the product's settlement lag",
        "t+1 business day for treasuries",
        "valuation-service owns the lag",
        "accrued interest is excluded on both sides",
    ],
    "PROFIT_LOSS_PERCENT": [
        "profitlosspercent = profitloss / costside",
        "accrued interest is excluded on both sides",
    ],
}
# Each trigger is its own phrase: a bare "absent" would pass on any one of them.
ABSENT = [
    "there are no lots",
    "a lot has no open_date",
    "a needed cpi-u month is missing",
    "never 0",
    "never the real-price fallback",
]
NUMBERS = ["96,961.94", "96,159.37", "-802.57"]


def _block(path: Path, declaration: str) -> str:
    """The `//` comment lines directly above the line that declares
    `declaration`, plus that line, as in the file."""
    lines = path.read_text().splitlines()
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}\s*=")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end + 1])


def _prose(text: str) -> str:
    """Comment markers dropped, whitespace collapsed, lower case."""
    return " ".join(text.replace("//", " ").split()).lower()


def _entries() -> dict:
    return {m["name"]: m for m in json.loads(CATALOG.read_text())["measures"]}


def _catalog_text(name: str) -> str:
    entry = _entries()[name]
    return _prose(" ".join([entry["description"], entry["formula"], entry["units"]] + entry["model_assumptions"]))


def _texts(name: str) -> dict:
    return {"proto": _prose(_block(MEASURE, name)), "catalog": _catalog_text(name)}


SOURCES = ["proto", "catalog"]


# ── Metric 1: formula, absent rule, Appendix B and the example ─────────────

@pytest.mark.parametrize("source", SOURCES)
@pytest.mark.parametrize("name,phrase", [(n, p) for n in PNL for p in FORMULA[n]])
def test_tips_formula_is_stated(name, phrase, source):
    assert phrase in _texts(name)[source]


@pytest.mark.parametrize("source", SOURCES)
@pytest.mark.parametrize("phrase", ABSENT)
@pytest.mark.parametrize("name", PNL)
def test_absent_rule_names_every_trigger(name, phrase, source):
    assert phrase in _texts(name)[source]


@pytest.mark.parametrize("source", SOURCES)
@pytest.mark.parametrize("number", NUMBERS)
@pytest.mark.parametrize("name", PNL)
def test_912810rl4_example_numbers_are_stated(name, number, source):
    assert number in _texts(name)[source]


@pytest.mark.parametrize("source", SOURCES)
@pytest.mark.parametrize("name", APPENDIX_B)
def test_appendix_b_rounding_is_stated(name, source):
    text = _texts(name)[source]
    assert "31 cfr 356" in text
    assert "5 decimals" in text


@pytest.mark.parametrize("source", SOURCES)
def test_cents_rounding_is_labelled_a_project_rule(source):
    assert "project rule, not appendix b text" in _texts("PROFIT_LOSS")[source]


@pytest.mark.parametrize("path", SHIPPED, ids=[p.name for p in SHIPPED])
def test_no_unrounded_note_remains(path):
    assert "unrounded" not in path.read_text().lower()


@pytest.mark.parametrize("source", SOURCES)
def test_adjusted_cost_basis_no_longer_says_lot_dates_need_no_cpi(source):
    assert "lot dates need no cpi" not in _texts("ADJUSTED_COST_BASIS")[source]


# ── Metric 2: the catalog ──────────────────────────────────────────────────

def test_catalog_parses_and_pnl_entries_carry_the_example():
    entries = json.loads(CATALOG.read_text())["measures"]
    by_name = {m["name"]: m for m in entries}
    for name in PNL:
        text = json.dumps(by_name[name], ensure_ascii=False)
        for number in NUMBERS:
            assert number in text, (name, number)
    for entry in entries:
        assert "unrounded" not in json.dumps(entry).lower(), entry["name"]


# ── Guardrail 1: the example comes from the formula and the source tables ──

def _round(value: Decimal, places: str) -> Decimal:
    return value.quantize(Decimal(places), rounding=ROUND_HALF_UP)


def _reading(year: int, month: int) -> Decimal:
    found = [r["value"] for r in EXAMPLE["cpi_u_nsa"]["readings"] if (r["year"], r["month"]) == (year, month)]
    assert len(found) == 1, (year, month)
    return Decimal(found[0])


def _months_before(day: date, k: int) -> tuple:
    index = day.year * 12 + day.month - 1 - k
    return index // 12, index % 12 + 1


def _reference_cpi(day: date) -> Decimal:
    """REFERENCE_CPI from the readings for months m-3 and m-2, rounded per
    31 CFR 356 Appendix B."""
    low, high = _reading(*_months_before(day, 3)), _reading(*_months_before(day, 2))
    days_in_month = calendar.monthrange(day.year, day.month)[1]
    return _round(low + Decimal(day.day - 1) / Decimal(days_in_month) * (high - low), "0.00001")


def _index_ratio(day: date) -> Decimal:
    return _round(_reference_cpi(day) / Decimal(EXAMPLE["security"]["base_cpi"]), "0.00001")


def _derived() -> dict:
    with localcontext() as ctx:
        ctx.prec = 50
        lot, valuation = EXAMPLE["lot"], EXAMPLE["valuation"]
        settles = date.fromisoformat(lot["settlement_date"])
        valued = date.fromisoformat(valuation["date"])
        face = Decimal(lot["face"])
        cost = _round(Decimal(lot["real_price"]) / 100 * _index_ratio(settles) * face, "0.01")
        market = _round(Decimal(valuation["real_clean_price"]) / 100 * _index_ratio(valued) * face, "0.01")
        return {
            "lot_reference_cpi": _reference_cpi(settles),
            "lot_index_ratio": _index_ratio(settles),
            "cost": cost,
            "valuation_reference_cpi": _reference_cpi(valued),
            "valuation_index_ratio": _index_ratio(valued),
            "market": market,
            "profit_loss": market - cost,
            "profit_loss_percent": _round((market - cost) / cost, "0.0000001"),
        }


def _money(value: Decimal) -> str:
    return f"{value:,.2f}"


def test_lot_settles_one_business_day_after_open_date():
    opened = date.fromisoformat(EXAMPLE["lot"]["open_date"])
    settles = date.fromisoformat(EXAMPLE["lot"]["settlement_date"])
    assert opened.weekday() < 4 and (settles - opened).days == 1


@pytest.mark.parametrize("key", list(EXAMPLE["expected"]))
def test_example_is_re_derived_from_the_inputs(key):
    assert _derived()[key] == Decimal(EXAMPLE["expected"][key])


def test_profit_loss_is_the_difference_of_the_rounded_sides():
    derived = _derived()
    assert (derived["cost"], derived["market"], derived["profit_loss"]) == (
        Decimal("96961.94"), Decimal("96159.37"), Decimal("-802.57"))


@pytest.mark.parametrize("source", SOURCES)
def test_documented_numbers_equal_the_derived_ones(source):
    derived = _derived()
    pl, plp = _texts("PROFIT_LOSS")[source], _texts("PROFIT_LOSS_PERCENT")[source]
    for key in ("lot_reference_cpi", "lot_index_ratio", "valuation_reference_cpi", "valuation_index_ratio"):
        assert str(derived[key]) in pl, key
    sides = (_money(derived["market"]), _money(derived["cost"]))
    assert f"costside = 68.1875 / 100 * {derived['lot_index_ratio']} * 100,000 = {sides[1]}" in pl
    assert f"marketside = 67.625 / 100 * {derived['valuation_index_ratio']} * 100,000 = {sides[0]}" in pl
    assert f"profitloss = {sides[0]} - {sides[1]} = {_money(derived['profit_loss'])}" in pl
    assert f"= {_money(derived['profit_loss'])} / {sides[1]} = {derived['profit_loss_percent']}" in plp


def test_reference_cpi_example_rounds_to_5_decimals():
    assert _round(Decimal("320.0") + Decimal(15) / Decimal(31) * Decimal("1.5"), "0.00001") == Decimal("320.72581")
    assert "= 320.72580645... → 320.72581" in _prose(_block(MEASURE, "REFERENCE_CPI"))


# ── Guardrail 2: the non-TIPS text stays ───────────────────────────────────

def _in_order(old: list, new: list) -> bool:
    """Every item of `old` appears in `new`, in the same order."""
    rest = iter(new)
    return all(item in rest for item in old)


@pytest.mark.parametrize("name", PNL)
def test_original_proto_comment_lines_are_kept_in_order(name):
    old = BEFORE["measure_proto_comment_lines"][name]
    new = _block(MEASURE, name).splitlines()
    assert _in_order(old, new)
    # The original formula, examples and absent rule all sit above the TIPS paragraph.
    tips = next(i for i, line in enumerate(new) if line.startswith("  // Formula (TIPS):"))
    cut = next(i for i, line in enumerate(old) if "Applicability:" in line)
    body = [line for line in old[:cut] if line.strip() != "//"]
    assert all(new.index(line) < tips for line in body)


@pytest.mark.parametrize("name", PNL)
def test_original_catalog_entry_is_kept(name):
    before, entry = BEFORE["catalog"][name], _entries()[name]
    assert entry["formula"].startswith(before["formula"] + "; TIPS: ")
    assert _in_order(before["model_assumptions"], entry["model_assumptions"])
    assert entry["model_assumptions"][:len(before["model_assumptions"])] == before["model_assumptions"]
    assert entry["depends_on"] == before["depends_on"] + ["INDEX_RATIO", "TAX_LOTS"]
    unchanged = set(before) - {"formula", "model_assumptions", "depends_on"}
    assert {k: entry[k] for k in unchanged} == {k: before[k] for k in unchanged}
    assert set(entry) == set(before)


def test_baseline_covers_both_measures():
    assert list(BEFORE["measure_proto_comment_lines"]) == PNL
    assert list(BEFORE["catalog"]) == PNL
