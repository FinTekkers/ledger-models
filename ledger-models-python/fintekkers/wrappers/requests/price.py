import time
from datetime import date, datetime
from uuid import UUID
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from google.protobuf.any_pb2 import Any
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.coupon_frequency_pb2 import NO_COUPON, SEMIANNUALLY
from fintekkers.models.security.coupon_type_pb2 import FIXED, FLOAT, ZERO
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import CUSIP
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.security_quantity_type_pb2 import ORIGINAL_FACE_VALUE
from fintekkers.models.security.security_type_pb2 import (
    BOND_SECURITY,
    FRN,
    SecurityTypeProto,
)
from fintekkers.models.util.date_range_pb2 import DateRangeProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto

from fintekkers.models.security.bond.issuance_pb2 import IssuanceProto

from fintekkers.requests.price.create_price_request_pb2 import CreatePriceRequestProto
from fintekkers.requests.price.query_price_request_pb2 import PriceFrequencyProto, PriceHorizonProto, QueryPriceRequestProto
from fintekkers.requests.security.create_security_request_pb2 import (
    CreateSecurityRequestProto,
)
from fintekkers.requests.security.query_security_request_pb2 import (
    QuerySecurityRequestProto,
)

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.util.date_utils import get_date_proto
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


class CreatePriceRequest:
    @staticmethod
    def create_price_request(
        security: SecurityProto,
        price: float = 0.0,
    ):
        """
        Creates a request to create a price for the current asOf date with the provided price

            Parameters:
                    Security: the Security Proto for this price
                    price: the float value of the price

            Returns:
                    request (CreatePriceRequest): A request wrapper, with the fields attached
        """
        return CreatePriceRequest.create_or_update_request(security, price)

    @staticmethod
    def create_or_update_request(
        security,
        price: float,
        as_of_date: datetime = None,
        price_uuid: UUID = None,
    ):
        """Create a price upsert request.

        Parameters:
            security: SecurityProto (or Security wrapper) for this price.
            price: float price value.
            as_of_date: datetime for the price observation; defaults to now.
            price_uuid: deterministic UUID for idempotency; defaults to uuid4().
        """
        if as_of_date is None:
            as_of_date = datetime.now()
        if price_uuid is None:
            price_uuid = FintekkersUuid.new_uuid().as_uuid()

        # Accept either a SecurityProto or a Security wrapper
        security_proto = security.proto if hasattr(security, "proto") else security

        as_of_proto: LocalTimestampProto = ProtoSerializationUtil.serialize(as_of_date)

        proto: CreatePriceRequestProto = CreatePriceRequestProto(
            object_class="CreatePriceRequestProto",
            version="0.0.1",
            create_price_input=PriceProto(
                object_class="PriceProto",
                version="0.0.1",
                uuid=UUIDProto(raw_uuid=price_uuid.bytes),
                as_of=as_of_proto,
                valid_from=as_of_proto,
                price=ProtoSerializationUtil.serialize(price),
                security=security_proto,
            ),
        )

        return CreatePriceRequest(proto=proto)

    def __init__(self, proto: CreateSecurityRequestProto):
        self.proto = proto


class QueryPriceRequest:
    def __init__(self, proto: CreatePriceRequestProto):
        self.proto = proto

    @staticmethod
    def create_query_request(fields: dict,
                             frequency: PriceFrequencyProto,
                             horizon: PriceHorizonProto):
        """
        Returns a query request from a dict of field/values using a price horizon.

                Parameters:
                        fields (dict): A dictionary of fields with values
                        frequency: The price frequency (e.g. DAILY, HOURLY)
                        horizon: The price horizon (e.g. 1_DAY, 1_MONTH)

                Returns:
                        request (QueryPriceRequest): A request wrapper, with the fields attached
        """

        filters = QueryPriceRequest._build_filters(fields)

        as_of_proto: LocalTimestampProto = ProtoSerializationUtil.serialize(
            datetime.now()
        )

        request = QueryPriceRequestProto(
            search_price_input=PositionFilterProto(filters=filters),
            as_of=as_of_proto,
            frequency=frequency,
            horizon=horizon
        )

        return QueryPriceRequest(proto=request)

    @staticmethod
    def create_query_request_with_date_range(fields: dict,
                             frequency: PriceFrequencyProto,
                             start_date: date,
                             end_date: date):
        """
        Returns a query request from a dict of field/values using a date range.

                Parameters:
                        fields (dict): A dictionary of fields with values
                        frequency: The price frequency
                        start_date: Start of the date range
                        end_date: End of the date range

                Returns:
                        request (QueryPriceRequest): A request wrapper, with the fields attached
        """

        filters = QueryPriceRequest._build_filters(fields)

        as_of_proto: LocalTimestampProto = ProtoSerializationUtil.serialize(
            datetime.now()
        )

        start_ts_proto = ProtoSerializationUtil.serialize(datetime.combine(start_date, datetime.min.time())) if start_date else None
        end_ts_proto = ProtoSerializationUtil.serialize(datetime.combine(end_date, datetime.max.time())) if end_date else None

        date_range_proto = DateRangeProto(start=start_ts_proto, end=end_ts_proto) if start_date and end_date else None

        request = QueryPriceRequestProto(
            search_price_input=PositionFilterProto(filters=filters),
            as_of=as_of_proto,
            frequency=frequency,
            date_range=date_range_proto
        )

        return QueryPriceRequest(proto=request)

    @staticmethod
    def _build_filters(fields: dict) -> list:
        filters = []
        for field in fields:
            field_value = fields[field]
            if isinstance(field_value, str):
                entry = FieldMapEntry(field=field, string_value=field_value)
            else:
                packed_value: Any = Any()
                packed_value.Pack(msg=field_value)
                entry = FieldMapEntry(field=field, field_value_packed=packed_value)
            filters.append(entry)
        return filters
