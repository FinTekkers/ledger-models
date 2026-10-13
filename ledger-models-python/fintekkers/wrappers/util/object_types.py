"""Object type and version (LM-297, LM-318).

Every message that names its type carries `ObjectTypeProto object_type = 1`
and `VersionProto version = 2`. Writers call `stamp`, which sets the type and
`SCHEMA_VERSION`; `stamp_own` passes the message's own type (LM-320). Readers
call `read_type` / `read_version`. The old `object_class` / `version` strings
were replaced in place by LM-318: bytes written before it are not readable.
See docs/adr/compact_object_type_and_version.md.
"""
from typing import Dict, Optional, Tuple

from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.models.util.version_pb2 import VersionProto

Version = Tuple[int, int, int]

# The schema version `stamp` writes. Not the library release.
SCHEMA_VERSION: Version = (0, 0, 1)

# Each message with object_type, by proto full name, to its own ObjectTypeProto
# value (LM-320). test_object_type_coverage.py fails when a message in the
# descriptor pool is missing.
_OWN_TYPES: Dict[str, int] = {
    "fintekkers.models.portfolio.PortfolioProto": ObjectTypeProto.OBJECT_TYPE_PORTFOLIO,
    "fintekkers.models.position.PositionProto": ObjectTypeProto.OBJECT_TYPE_POSITION,
    "fintekkers.models.position.PositionFilterProto": ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER,
    "fintekkers.models.price.PriceProto": ObjectTypeProto.OBJECT_TYPE_PRICE,
    "fintekkers.models.security.IdentifierProto": ObjectTypeProto.OBJECT_TYPE_IDENTIFIER,
    "fintekkers.models.security.SecurityProto": ObjectTypeProto.OBJECT_TYPE_SECURITY,
    "fintekkers.models.security.TenorProto": ObjectTypeProto.OBJECT_TYPE_TENOR,
    "fintekkers.models.strategy.StrategyProto": ObjectTypeProto.OBJECT_TYPE_STRATEGY,
    "fintekkers.models.strategy.StrategyAllocationProto": ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION,
    "fintekkers.models.transaction.TransactionProto": ObjectTypeProto.OBJECT_TYPE_TRANSACTION,
    "fintekkers.requests.portfolio.CreatePortfolioRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST,
    "fintekkers.requests.portfolio.QueryPortfolioRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST,
    "fintekkers.requests.price.CreatePriceRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST,
    "fintekkers.requests.price.QueryPriceRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST,
    "fintekkers.requests.security.CreateSecurityRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST,
    "fintekkers.requests.security.QuerySecurityRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST,
    "fintekkers.requests.transaction.CreateTransactionRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST,
    "fintekkers.requests.transaction.QueryTransactionRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST,
    # LM-320: the rest of the messages with object_type.
    "fintekkers.models.security.bond.IssuanceProto": ObjectTypeProto.OBJECT_TYPE_ISSUANCE,
    "fintekkers.models.security.IndexCompositionProto": ObjectTypeProto.OBJECT_TYPE_INDEX_COMPOSITION,
    "fintekkers.models.util.DateRangeProto": ObjectTypeProto.OBJECT_TYPE_DATE_RANGE,
    "fintekkers.models.util.api.API_Key": ObjectTypeProto.OBJECT_TYPE_API_KEY,
    "fintekkers.models.util.lock.NodeState": ObjectTypeProto.OBJECT_TYPE_NODE_STATE,
    "fintekkers.models.util.lock.NodePartition": ObjectTypeProto.OBJECT_TYPE_NODE_PARTITION,
    "fintekkers.requests.index_composition.CreateIndexCompositionRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_REQUEST,
    "fintekkers.requests.index_composition.CreateIndexCompositionResponseProto": ObjectTypeProto.OBJECT_TYPE_CREATE_INDEX_COMPOSITION_RESPONSE,
    "fintekkers.requests.index_composition.GetIndexCompositionRequestProto": ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_REQUEST,
    "fintekkers.requests.index_composition.GetIndexCompositionResponseProto": ObjectTypeProto.OBJECT_TYPE_GET_INDEX_COMPOSITION_RESPONSE,
    "fintekkers.requests.portfolio.CreatePortfolioResponseProto": ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_RESPONSE,
    "fintekkers.requests.portfolio.QueryPortfolioResponseProto": ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_RESPONSE,
    "fintekkers.requests.position.QueryPositionRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_REQUEST,
    "fintekkers.requests.position.QueryPositionResponseProto": ObjectTypeProto.OBJECT_TYPE_QUERY_POSITION_RESPONSE,
    "fintekkers.requests.price.CreatePriceResponseProto": ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_RESPONSE,
    "fintekkers.requests.price.QueryPriceResponseProto": ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_RESPONSE,
    "fintekkers.requests.security.CreateSecurityResponseProto": ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_RESPONSE,
    "fintekkers.requests.security.QuerySecurityResponseProto": ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_RESPONSE,
    "fintekkers.requests.security.GetFieldsResponseProto": ObjectTypeProto.OBJECT_TYPE_GET_FIELDS_RESPONSE,
    "fintekkers.requests.security.GetFieldValuesRequestProto": ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_REQUEST,
    "fintekkers.requests.security.GetFieldValuesResponseProto": ObjectTypeProto.OBJECT_TYPE_GET_FIELD_VALUES_RESPONSE,
    "fintekkers.requests.transaction.CreateTransactionResponseProto": ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_RESPONSE,
    "fintekkers.requests.transaction.QueryTransactionResponseProto": ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_RESPONSE,
    "fintekkers.requests.util.DeleteRequestProto": ObjectTypeProto.OBJECT_TYPE_DELETE_REQUEST,
    "fintekkers.requests.util.DeleteResponseProto": ObjectTypeProto.OBJECT_TYPE_DELETE_RESPONSE,
    "fintekkers.requests.util.lock.LockRequestProto": ObjectTypeProto.OBJECT_TYPE_LOCK_REQUEST,
    "fintekkers.requests.util.lock.LockResponseProto": ObjectTypeProto.OBJECT_TYPE_LOCK_RESPONSE,
    "fintekkers.requests.valuation.ValuationRequestProto": ObjectTypeProto.OBJECT_TYPE_VALUATION_REQUEST,
    "fintekkers.requests.valuation.ValuationResponseProto": ObjectTypeProto.OBJECT_TYPE_VALUATION_RESPONSE,
    "fintekkers.requests.valuation.CurveRequestProto": ObjectTypeProto.OBJECT_TYPE_CURVE_REQUEST,
    "fintekkers.requests.valuation.CurveResponseProto": ObjectTypeProto.OBJECT_TYPE_CURVE_RESPONSE,
}


def stamp(message, object_type: int):
    """Sets object_type and version (SCHEMA_VERSION) on `message`; returns it.

    `object_type` is the message's own ObjectTypeProto value.
    """
    major, minor, patch = SCHEMA_VERSION
    message.object_type = object_type
    message.version.CopyFrom(VersionProto(major=major, minor=minor, patch=patch))
    return message


def own_type(message) -> Optional[int]:
    """The message's own ObjectTypeProto value, or None when it has none."""
    return _OWN_TYPES.get(message.DESCRIPTOR.full_name)


def stamp_own(message):
    """`stamp` with the message's own ObjectTypeProto value (LM-320); returns it.

    Raises ValueError naming the message type when it has no own value.
    """
    object_type = own_type(message)
    if object_type is None:
        raise ValueError(f"{message.DESCRIPTOR.full_name} has no own ObjectTypeProto")
    return stamp(message, object_type)


def read_type(message) -> int:
    """The message's ObjectTypeProto value; OBJECT_TYPE_UNKNOWN when unset.

    A value added after this build is returned as its number.
    """
    return message.object_type


def read_version(message) -> Optional[Version]:
    """The message's (major, minor, patch), or None when version is absent."""
    if not message.HasField("version"):
        return None
    return (message.version.major, message.version.minor, message.version.patch)

