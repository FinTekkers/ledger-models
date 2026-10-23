#!/usr/bin/env python3
"""Wire diff: every change to the protos' wire shape must be allowed (LM-318).

Compiles ledger-models-protos at a base commit and in the working tree,
then compares every message field (number, name, type, label), enum value
and extension. Options and comments are not wire shape and don't count.
Each change must match a rule in ALLOWED, which names the item that made it;
anything else fails. A PR that changes the wire adds its rule here.

Usage: wire-diff.py [base]. base defaults to the merge base with origin/main
(or main). Needs grpcio-tools (ledger-models-python's venv).
"""

import json
import subprocess
import sys
import tarfile
import tempfile
from io import BytesIO
from pathlib import Path

from google.protobuf import descriptor_pb2
from grpc_tools import protoc

REPO = Path(__file__).resolve().parents[2]
PROTOS = "ledger-models-protos"
FD = descriptor_pb2.FieldDescriptorProto

OBJECT_TYPE = ".fintekkers.models.util.ObjectTypeProto"
VERSION = ".fintekkers.models.util.VersionProto"


def git(*args: str) -> bytes:
    return subprocess.run(["git", *args], cwd=REPO, check=True, capture_output=True).stdout


def default_base() -> str:
    for ref in ("origin/main", "main"):
        try:
            return git("merge-base", "HEAD", ref).decode().strip()
        except subprocess.CalledProcessError:
            continue
    sys.exit("wire-diff: no origin/main or main to compare with; pass a base commit")


def compile_set(root: Path) -> descriptor_pb2.FileDescriptorSet:
    files = sorted(str(p.relative_to(root)) for p in root.rglob("*.proto"))
    with tempfile.NamedTemporaryFile(suffix=".binpb") as out:
        include = str(Path(protoc.__file__).parent / "_proto")
        if protoc.main(["protoc", f"-I{root}", f"-I{include}", f"--descriptor_set_out={out.name}", *files]) != 0:
            sys.exit(f"wire-diff: protoc failed on {root}")
        return descriptor_pb2.FileDescriptorSet.FromString(Path(out.name).read_bytes())


def shape(fds: descriptor_pb2.FileDescriptorSet) -> dict:
    """{key: description} for every field, enum value and extension."""
    out = {}

    def field(f: FD) -> str:
        label = "repeated " if f.label == FD.LABEL_REPEATED else ""
        kind = f.type_name or FD.Type.Name(f.type)[5:].lower()
        return f"{label}{kind} {f.name}"

    def enums(prefix: str, items) -> None:
        for e in items:
            out[f"enum {prefix}.{e.name}"] = "enum"
            for v in e.value:
                out[f"value {prefix}.{e.name} = {v.number}"] = v.name

    def messages(prefix: str, items) -> None:
        for m in items:
            name = f"{prefix}.{m.name}"
            out[f"message {name}"] = "message"
            for f in m.field:
                out[f"field {name} = {f.number}"] = field(f)
            for x in m.extension:
                out[f"extension {x.extendee} = {x.number}"] = field(x)
            enums(name, m.enum_type)
            messages(name, m.nested_type)

    for f in fds.file:
        prefix = f".{f.package}" if f.package else ""
        messages(prefix, f.message_type)
        enums(prefix, f.enum_type)
        for x in f.extension:
            out[f"extension {x.extendee} = {x.number}"] = field(x)
    return out


def message_of(key: str) -> str:
    return key.split(" ")[1]


def lm318(key: str, old, new, head: dict) -> bool:
    """LM-318: object_class / version replaced in place, 1001-1004 and the
    decimal string deleted, VersionProto added, legacy_object_class gone."""
    kind = key.split(" ")[0]
    if kind == "field":
        msg = message_of(key)
        number = int(key.rsplit("= ", 1)[1])
        stamped = head.get(f"field {msg} = 1") == f"{OBJECT_TYPE} object_type"
        if stamped and number == 1:
            return old == "string object_class" and new == f"{OBJECT_TYPE} object_type"
        if stamped and number == 2:
            return old == "string version" and new == f"{VERSION} version"
        if stamped and 1001 <= number <= 1004:
            return new is None and old in {
                f"{OBJECT_TYPE} object_type", "uint32 version_major",
                "uint32 version_minor", "uint32 version_patch"}
        if msg == ".fintekkers.models.util.DecimalValueProto" and number == 10:
            return old == "string arbitrary_precision_value" and new is None
    if key == f"message {VERSION}":
        return old is None
    if key.startswith(f"field {VERSION} = "):
        return old is None and new in {"uint32 major", "uint32 minor", "uint32 patch"}
    if key == "extension .google.protobuf.EnumValueOptions = 50001":
        return old == "repeated string legacy_object_class" and new is None
    return False


def lm332(key: str, old, new, head: dict) -> bool:
    """LM-332: IndexConstituentProto.currency deleted; the linked security has it."""
    return (key == "field .fintekkers.models.security.IndexConstituentProto = 5"
            and old == "string currency" and new is None)


VALUATION = ".fintekkers.requests.valuation"
DECIMAL = ".fintekkers.models.util.DecimalValueProto"
LM343 = {
    f"message {VALUATION}.InflationIndexInput": "message",
    f"field {VALUATION}.InflationIndexInput = 1": ".fintekkers.models.security.SecurityProto index",
    f"field {VALUATION}.InflationIndexInput = 2": f"{VALUATION}.MonthlyIndexReadings readings",
    f"field {VALUATION}.InflationIndexInput = 3": f"{DECIMAL} reference_cpi",
    f"message {VALUATION}.MonthlyIndexReadings": "message",
    f"field {VALUATION}.MonthlyIndexReadings = 1": f"repeated {VALUATION}.MonthlyIndexReading readings",
    f"message {VALUATION}.MonthlyIndexReading": "message",
    f"field {VALUATION}.MonthlyIndexReading = 1": "int32 year",
    f"field {VALUATION}.MonthlyIndexReading = 2": "int32 month",
    f"field {VALUATION}.MonthlyIndexReading = 3": f"{DECIMAL} value",
    f"field {VALUATION}.TipsInput = 4": f"{VALUATION}.InflationIndexInput cpi",
    "value .fintekkers.models.position.MeasureProto = 28": "REFERENCE_CPI",
    "value .fintekkers.models.position.MeasureProto = 29": "INDEX_RATIO",
}


def lm343(key: str, old, new, head: dict) -> bool:
    """LM-343: InflationIndexInput, MonthlyIndexReading(s), TipsInput.cpi and
    the REFERENCE_CPI / INDEX_RATIO measures added. Nothing else; no source
    or timestamp field on InflationIndexInput."""
    return old is None and key in LM343 and new == LM343[key]


PRICE_RESPONSE = ".fintekkers.requests.price.QueryPriceResponseProto"
LM348 = {
    f"field {PRICE_RESPONSE} = 60": "bool truncated",
    f"field {PRICE_RESPONSE} = 61": "int32 row_cap",
}


def lm348(key: str, old, new, head: dict) -> bool:
    """LM-348: QueryPriceResponseProto.truncated / row_cap added. Nothing else;
    no request field, cursor or paging RPC."""
    return old is None and key in LM348 and new == LM348[key]


def lm349(key: str, old, new, head: dict) -> bool:
    """LM-349: QueryPositionResponseProto.errors_or_warnings = 40 added,
    matching the other query responses."""
    return (key == "field .fintekkers.requests.position.QueryPositionResponseProto = 40"
            and old is None and new == ".fintekkers.requests.util.errors.SummaryProto errors_or_warnings")


LM344 = {
    f"field {f['message']} = {f['number']}": f"{f['type']} {f['name']}"
    for f in json.loads((REPO / "test-fixtures/removed-fields/lm-344.json").read_text())["fields"]
}


def lm344(key: str, old, new, head: dict) -> bool:
    """LM-344: ValuationRequestProto 24 and 25 and TipsInput 3 deleted (0.5).
    Only deletions of exactly these fields; their numbers and names are reserved."""
    return new is None and key in LM344 and old == LM344[key]


LM365_FIXTURE = json.loads((REPO / "test-fixtures/field-changes/lm-365.json").read_text())
LM365 = {
    f"field {f['message']} = {f['number']}": f"{'repeated ' if f.get('repeated') else ''}{f['type']} {f['name']}"
    for f in LM365_FIXTURE["added"]
}
LM365[f"message {VALUATION}.ReferenceRateFixingProto"] = "message"


def lm365(key: str, old, new, head: dict) -> bool:
    """LM-365: ReferenceRateFixingProto, FrnInput.fixings = 11 and
    IssuanceProto.high_discount_rate = 28 added. Additions of exactly these
    fields and types only; no map, new enum or renumbered field."""
    return old is None and key in LM365 and new == LM365[key]


def lm367(key: str, old, new, head: dict) -> bool:
    """LM-367: AuctionTypeProto.MULTIPLE_PRICE = 2 added. Nothing else; the
    existing values and IssuanceProto.price_for_single_price_auction keep
    their numbers, names and types."""
    return (key == "value .fintekkers.models.security.bond.AuctionTypeProto = 2"
            and old is None and new == "MULTIPLE_PRICE")


PORTFOLIO = ".fintekkers.models.portfolio"
ELECTIONS = f"{PORTFOLIO}.AmortisationElectionsProto"
TAX_LOT = ".fintekkers.models.position.TaxLotProto"
COST_BASIS = f"{VALUATION}.CostBasisInput"
LM364 = {
    f"message {ELECTIONS}": "message",
    f"field {ELECTIONS} = 10": f"{PORTFOLIO}.PremiumAmortisationElectionProto bond_premium",
    f"field {ELECTIONS} = 11": f"{PORTFOLIO}.MarketDiscountInclusionProto market_discount_inclusion",
    f"field {ELECTIONS} = 12": f"{PORTFOLIO}.MarketDiscountAccrualMethodProto market_discount_accrual",
    f"enum {PORTFOLIO}.PremiumAmortisationElectionProto": "enum",
    f"value {PORTFOLIO}.PremiumAmortisationElectionProto = 0": "UNSPECIFIED_PREMIUM_ELECTION",
    f"value {PORTFOLIO}.PremiumAmortisationElectionProto = 1": "PREMIUM_ELECTED",
    f"value {PORTFOLIO}.PremiumAmortisationElectionProto = 2": "PREMIUM_NOT_ELECTED",
    f"enum {PORTFOLIO}.MarketDiscountInclusionProto": "enum",
    f"value {PORTFOLIO}.MarketDiscountInclusionProto = 0": "UNSPECIFIED_MARKET_DISCOUNT_INCLUSION",
    f"value {PORTFOLIO}.MarketDiscountInclusionProto = 1": "AT_DISPOSITION",
    f"value {PORTFOLIO}.MarketDiscountInclusionProto = 2": "INCLUDE_CURRENTLY",
    f"enum {PORTFOLIO}.MarketDiscountAccrualMethodProto": "enum",
    f"value {PORTFOLIO}.MarketDiscountAccrualMethodProto = 0": "UNSPECIFIED_ACCRUAL_METHOD",
    f"value {PORTFOLIO}.MarketDiscountAccrualMethodProto = 1": "RATABLE",
    f"value {PORTFOLIO}.MarketDiscountAccrualMethodProto = 2": "CONSTANT_YIELD",
    f"field {PORTFOLIO}.PortfolioProto = 11": f"{ELECTIONS} amortisation_elections",
    f"message {TAX_LOT}": "message",
    f"field {TAX_LOT} = 1": ".fintekkers.models.util.LocalDateProto open_date",
    f"field {TAX_LOT} = 2": f"{DECIMAL} open_quantity",
    f"field {TAX_LOT} = 3": f"{DECIMAL} price",
    f"message {COST_BASIS}": "message",
    f"field {COST_BASIS} = 1": f"{ELECTIONS} elections",
    f"field {COST_BASIS} = 2": f"repeated {TAX_LOT} lots",
    f"field {VALUATION}.BondInput = 20": f"{COST_BASIS} cost_basis",
    f"field {VALUATION}.TipsInput = 20": f"{COST_BASIS} cost_basis",
    f"field {VALUATION}.FrnInput = 20": f"{COST_BASIS} cost_basis",
}


def lm364(key: str, old, new, head: dict) -> bool:
    """LM-364: AmortisationElectionsProto and its three enums,
    PortfolioProto.amortisation_elections = 11, TaxLotProto, CostBasisInput
    and cost_basis = 20 on BondInput, TipsInput and FrnInput added. Additions
    of exactly these only; nothing on ValuationRequestProto, whose 24 and 25
    stay reserved."""
    return old is None and key in LM364 and new == LM364[key]


LM382 = {
    f"field {f['message']} = {f['number']}": f"{f['type']} {f['name']}"
    for f in json.loads((REPO / "test-fixtures/field-changes/lm-382.json").read_text())["added"]
}


def lm382(key: str, old, new, head: dict) -> bool:
    """LM-382: IssuanceProto.auction_date = 29 and
    ReferenceRateFixingProto.bill_maturity_date = 4 added, both LocalDateProto.
    Additions of exactly these only; no stored term field."""
    return old is None and key in LM382 and new == LM382[key]


ALLOWED = [lm318, lm332, lm343, lm348, lm349, lm344, lm365, lm367, lm364, lm382]


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else default_base()
    with tempfile.TemporaryDirectory() as tmp:
        with tarfile.open(fileobj=BytesIO(git("archive", "--format=tar", base, PROTOS))) as tar:
            tar.extractall(tmp, filter="data")
        before = shape(compile_set(Path(tmp) / PROTOS))
    after = shape(compile_set(REPO / PROTOS))

    changes = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
    bad = [k for k in changes if not any(rule(k, before.get(k), after.get(k), after) for rule in ALLOWED)]
    for k in bad:
        print(f"wire-diff: not allowed: {k}: {before.get(k)} -> {after.get(k)}", file=sys.stderr)
    print(f"wire-diff: {len(changes)} wire changes since {base[:12]}, {len(bad)} not allowed")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
