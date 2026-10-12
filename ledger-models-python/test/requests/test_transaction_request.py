from datetime import date
from decimal import Decimal
from fintekkers.models.position.field_pb2 import FieldProto

from fintekkers.models.position.position_status_pb2 import PositionStatusProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto

from fintekkers.requests.transaction.create_transaction_request_pb2 import CreateTransactionRequestProto
from fintekkers.requests.transaction.query_transaction_request_pb2 import QueryTransactionRequestProto

from fintekkers.wrappers.requests.transaction import CreateTransactionRequest, QueryTransactionRequest

def test_create_transaction_request():
    request = CreateTransactionRequest.create_transaction_request(
        None, None, date.today(), date.today(), PositionStatusProto.HYPOTHETICAL, TransactionTypeProto.SELL, Decimal("50.0"), 1
    )

    proto:CreateTransactionRequestProto = request.proto

    assert proto.create_transaction_input.position_status == PositionStatusProto.HYPOTHETICAL
    assert proto.create_transaction_input.transaction_type == TransactionTypeProto.SELL
    assert proto.create_transaction_input.quantity.arbitrary_precision_value == "1"
    assert proto.create_transaction_input.price.price.arbitrary_precision_value == "50.0"
    

def test_query_transaction_request():
    request = QueryTransactionRequest.create_query_request(
        fields={
            FieldProto.TRADE_DATE: LocalDateProto(year=2023, month=1, day=1)
        }
    )

    proto:QueryTransactionRequestProto = request.search_transaction_input

    assert len(proto.filters) == 1
        
