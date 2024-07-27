from datetime import datetime
from uuid import uuid4

from google.protobuf.timestamp_pb2 import Timestamp
from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid


class Portfolio:
    def __init__(self, proto: PortfolioProto):
        self.proto: PortfolioProto = proto

    def __str__(self):
        return f"ID[{self.proto.uuid}], Portfolio[{self.proto.portfolio_name}]"

    def get_name(self):
        return self.proto.portfolio_name

    # def uuid(self) -> UUID:
    #     uuid:FintekkersUuid = ProtoSerializationUtil.deserialize(self.proto.uuid)
    #     return uuid.uuid

    @staticmethod
    def create_portfolio(portfolio_name: str) -> PortfolioProto:
        uuid_value = uuid4()
        portfolio = PortfolioProto(
            as_of=LocalTimestampProto(
                timestamp=Timestamp(), time_zone="America/New_York"
            ),
            is_link=False,
            object_class="Portfolio",
            portfolio_name=portfolio_name,
            uuid=UUIDProto(raw_uuid=uuid_value.bytes),
            version="0.0.1",
        )

        return portfolio
