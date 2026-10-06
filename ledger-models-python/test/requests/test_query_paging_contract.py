"""Contract checks for the paging fields: numbers, types, comments, RPCs, ADR.

See docs/adr/query_paging.md.
"""
import re
from pathlib import Path

import pytest
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.requests.portfolio.query_portfolio_request_pb2 import QueryPortfolioRequestProto
from fintekkers.requests.portfolio.query_portfolio_response_pb2 import QueryPortfolioResponseProto
from fintekkers.requests.price.query_price_request_pb2 import QueryPriceRequestProto
from fintekkers.requests.price.query_price_response_pb2 import QueryPriceResponseProto
from fintekkers.requests.security.query_security_request_pb2 import QuerySecurityRequestProto
from fintekkers.requests.security.query_security_response_pb2 import QuerySecurityResponseProto
from fintekkers.requests.transaction.query_transaction_request_pb2 import QueryTransactionRequestProto
from fintekkers.requests.transaction.query_transaction_response_pb2 import QueryTransactionResponseProto
from fintekkers.services.portfolio_service import portfolio_service_pb2
from fintekkers.services.price_service import price_service_pb2
from fintekkers.services.security_service import security_service_pb2
from fintekkers.services.transaction_service import transaction_service_pb2

REPO_ROOT = Path(__file__).resolve().parents[3]
REQUESTS_DIR = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "requests"
ENTITIES = ["security", "transaction", "portfolio", "price"]

# (request message, expected limit number)
REQUESTS = {
    "security": (QuerySecurityRequestProto, 50),
    "transaction": (QueryTransactionRequestProto, 24),
    "portfolio": (QueryPortfolioRequestProto, 50),
    "price": (QueryPriceRequestProto, 27),
}
RESPONSES = {
    "security": QuerySecurityResponseProto,
    "transaction": QueryTransactionResponseProto,
    "portfolio": QueryPortfolioResponseProto,
    "price": QueryPriceResponseProto,
}

# Price's pre-existing limit paragraph; kept word for word under the shared block.
PRICE_DEFAULT_CAP_PARAGRAPH = [
    "Maximum number of price records the server may return. If unset or < 1",
    "the server applies a default cap (typically 1000) and surfaces a warning",
    "in QueryPriceResponseProto.errors_or_warnings. Servers may also enforce",
    "a hard ceiling above which `limit` is clamped silently.",
]

# Phrases each field's comment must carry (metric 2).
REQUIRED_PHRASES = {
    "limit": [
        "Max records returned in this", "no client page", "today's behaviour",
        "server may cap", "last page", "today's results",
    ],
    "page_token": ["Opaque", "first page", "must not parse", "today's results"],
    "next_page_token": ["Opaque", "Empty = last page", "today's results"],
}

# RPC name -> server streaming, as on main before paging; must not change.
EXPECTED_RPCS = {
    "Security": (security_service_pb2, {
        "CreateOrUpdate": False, "GetByIds": False, "Search": True, "ListIds": False, "Delete": False,
        "ValidateCreateOrUpdate": False, "ValidateQueryRequest": False, "GetFields": False,
        "GetFieldValues": False,
    }),
    "Transaction": (transaction_service_pb2, {
        "CreateOrUpdate": False, "GetByIds": False, "Search": True, "ListIds": False, "Delete": False,
        "ValidateCreateOrUpdate": False, "ValidateQueryRequest": False, "GetFields": False,
        "GetFieldValues": False,
    }),
    "Portfolio": (portfolio_service_pb2, {
        "CreateOrUpdate": False, "GetByIds": False, "Search": True, "ListIds": False, "Delete": False,
        "ValidateCreateOrUpdate": False, "ValidateQueryRequest": False,
    }),
    "Price": (price_service_pb2, {
        "CreateOrUpdate": False, "GetByIds": False, "Search": True, "ListIds": False,
        "ValidateCreateOrUpdate": False, "ValidateQueryRequest": False,
    }),
}


def field_comment(proto_path: Path, field_name: str) -> list:
    """Comment lines directly above `<type> field_name = N;`, without the `//` prefix."""
    lines = proto_path.read_text().splitlines()
    pattern = re.compile(r"^\s*(int32|string)\s+" + field_name + r"\s*=\s*\d+;")
    matches = [i for i, line in enumerate(lines) if pattern.match(line)]
    assert len(matches) == 1, f"{field_name} not found exactly once in {proto_path}"
    comment = []
    i = matches[0] - 1
    while i >= 0 and lines[i].strip().startswith("//"):
        comment.insert(0, lines[i].strip()[2:].strip())
        i -= 1
    return comment


def request_proto(entity):
    return REQUESTS_DIR / entity / f"query_{entity}_request.proto"


def response_proto(entity):
    return REQUESTS_DIR / entity / f"query_{entity}_response.proto"


def assert_plain_scalar(field, number, field_type):
    assert field.number == number
    assert field.type == field_type
    assert field.label == FieldDescriptor.LABEL_OPTIONAL
    assert field.containing_oneof is None
    assert not field.has_presence, f"{field.full_name} must be a plain proto3 scalar"


@pytest.mark.parametrize("entity", ENTITIES)
def test_request_fields_numbers_and_types(entity):
    message, limit_number = REQUESTS[entity]
    fields = message.DESCRIPTOR.fields_by_name

    assert_plain_scalar(fields["limit"], limit_number, FieldDescriptor.TYPE_INT32)
    assert_plain_scalar(fields["page_token"], 51, FieldDescriptor.TYPE_STRING)


@pytest.mark.parametrize("entity", ENTITIES)
def test_response_fields_numbers_and_types(entity):
    fields = RESPONSES[entity].DESCRIPTOR.fields_by_name

    assert_plain_scalar(fields["next_page_token"], 50, FieldDescriptor.TYPE_STRING)


@pytest.mark.parametrize("entity", ENTITIES)
def test_new_fields_sit_above_existing_numbers(entity):
    message, limit_number = REQUESTS[entity]
    new_request = {"page_token"} | ({"limit"} if limit_number == 50 else set())
    old_request = [f.number for f in message.DESCRIPTOR.fields if f.name not in new_request]
    old_response = [f.number for f in RESPONSES[entity].DESCRIPTOR.fields if f.name != "next_page_token"]

    assert max(old_request) < 50
    assert max(old_response) < 50


def test_comment_blocks_identical_across_entities():
    for field_name, path_for in [("limit", request_proto), ("page_token", request_proto),
                                 ("next_page_token", response_proto)]:
        security_block = field_comment(path_for("security"), field_name)
        assert security_block, f"{field_name} has no comment"
        for entity in ENTITIES:
            block = field_comment(path_for(entity), field_name)
            if entity == "price" and field_name == "limit":
                assert block == security_block + [""] + PRICE_DEFAULT_CAP_PARAGRAPH
            else:
                assert block == security_block, f"{entity}.{field_name} comment differs from security"


@pytest.mark.parametrize("field_name,path_for", [
    ("limit", request_proto), ("page_token", request_proto), ("next_page_token", response_proto),
])
def test_comment_states_contract(field_name, path_for):
    text = " ".join(field_comment(path_for("security"), field_name))

    for phrase in REQUIRED_PHRASES[field_name]:
        assert phrase in text, f"{field_name} comment is missing {phrase!r}"


def test_price_response_warning_text_unchanged():
    text = response_proto("price").read_text()

    assert ("//contingencies. Servers populate this with a warning when `limit` was unset and a default cap was\n"
            "  //applied, or when other notable behavior occurred (matching QueryTransactionResponseProto).\n"
            "  util.errors.SummaryProto errors_or_warnings = 40;") in text


@pytest.mark.parametrize("service_name", list(EXPECTED_RPCS))
def test_rpc_signatures_unchanged(service_name):
    module, expected = EXPECTED_RPCS[service_name]
    service = module.DESCRIPTOR.services_by_name[service_name]

    actual = {m.name: m.server_streaming for m in service.methods}
    assert actual == expected
    assert not any(m.client_streaming for m in service.methods)


def test_adr_exists_and_covers_paging():
    adr = REPO_ROOT / "docs" / "adr" / "query_paging.md"
    text = adr.read_text()

    for term in ["limit", "page_token", "next_page_token", "streaming"]:
        assert term in text
