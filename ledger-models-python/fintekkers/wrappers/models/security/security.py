from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_pb2 import SecurityProto

from fintekkers.models.position.field_pb2 import *
from fintekkers.models.position.measure_pb2 import MeasureProto

from uuid import UUID
from datetime import datetime
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto
from fintekkers.wrappers.models.security.security_identifier import Identifier

from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.models.security.security_quantity_type_pb2 import SecurityQuantityTypeProto
from fintekkers.wrappers.models.security.product_type import ProductType

class IFinancialModelObject:
    def get_field(field:FieldProto) -> object:
        pass

    def get_measure(measure:MeasureProto) -> object:
        pass

    def get_fields() -> set[FieldProto]:
        pass

    def get_measures() -> set[MeasureProto]:
        pass

    def get_as_of() -> datetime:
        pass

class RawDataModelObject:
    def __init__(self, id: UUID, as_of: datetime):
        self.id = id
        self.as_of = as_of

class Security():
    def __init__(self, proto:SecurityProto):
        self.proto:SecurityProto = proto
        self._source_proto = proto  # Store the original proto for reference

    def __str__(self) -> str:
        return f"ID[{str(self.get_security_id())}], {type(self).__name__}[{self.get_issuer()}]"

    def get_fields(self) -> list[FieldProto]:
        return [
            ID, SECURITY_ID, AS_OF, ASSET_CLASS, PRODUCT_CLASS, PRODUCT_TYPE, IDENTIFIER,
            SECURITY_ISSUER_NAME, SECURITY_DESCRIPTION, MATURITY_DATE, ISSUE_DATE, CASH_IMPACT_SECURITY
        ]

    def get_field(self, field:FieldProto) -> object:
        try:
            if field in (ID, SECURITY_ID):
                return self.get_id()
            elif field == AS_OF:
                return self.get_as_of()
            elif field == ASSET_CLASS:
                return self.get_asset_class()
            elif field == PRODUCT_CLASS:
                return self.get_product_class()
            elif field == PRODUCT_TYPE:
                return self.get_product_type()
            elif field == IDENTIFIER:
                return self.get_security_id()
            elif field == SECURITY_ISSUER_NAME:
                return self.get_issuer()
            elif field == SECURITY_DESCRIPTION:
                return self.get_description()
            elif field == MATURITY_DATE:
                return self.get_maturity_date()
            elif field == ISSUE_DATE:
                return self.get_issue_date()
            elif field == CASH_IMPACT_SECURITY:
                return self.get_settlement_currency()
            else:
                field_name = FieldProto.DESCRIPTOR.values_by_number.get(field, "Unknown")
                raise ValueError(f"Field not mapped in Security wrapper: {field_name}")
        except KeyError:
            raise ValueError(f"Invalid field number: {field}")

    def get_id(self) -> str:
        uuid:FintekkersUuid = ProtoSerializationUtil.deserialize(self.proto.uuid)
        return str(uuid.uuid)
    
    def get_as_of(self) -> datetime:
        as_of:datetime = ProtoSerializationUtil.deserialize(self.proto.as_of)
        return as_of
        
    def get_asset_class(self) -> str:
        return self.proto.asset_class or "Unclassified"
    
    def get_product_class(self) -> str:
        return type(self).__name__
    
    def get_product_type(self) -> ProductType:
        security_type = self.get_security_type()
        return ProductType.from_proto_value(security_type)
    
    def get_security_id(self) -> Identifier:
        if not self.proto.HasField('identifier'):
            return None
        return Identifier(self.proto.identifier)
    
    def get_issue_date(self) -> datetime:
        if not self.proto.HasField('issue_date'):
            return None
        return ProtoSerializationUtil.deserialize(self.proto.issue_date)

    def get_maturity_date(self) -> datetime:
        if not self.proto.HasField('maturity_date'):
            return None
        return ProtoSerializationUtil.deserialize(self.proto.maturity_date)

    def get_security_type(self) -> SecurityTypeProto:
        return self.proto.security_type

    def get_description(self) -> str:
        return self.proto.description or f"{self.get_product_class()}[{self.get_issuer()}]"

    def get_issuer(self) -> str:
        return self.proto.issuer_name

    def get_settlement_currency(self) -> 'Security':
        if not self.proto.HasField('settlement_currency'):
            return None
        return Security(self.proto.settlement_currency)

    def get_quantity_type(self) -> SecurityQuantityTypeProto:
        # For bond securities, we should return UNITS (3)
        if self.get_security_type() == SecurityTypeProto.BOND_SECURITY:
            return SecurityQuantityTypeProto.UNITS
        # For other security types, return the value from the proto
        return self.proto.quantity_type

    def is_cash(self) -> bool:
        return False

    def get_security_proto(self) -> SecurityProto:
        return self._source_proto

    def __eq__(self, other):
        if isinstance(other, Security):
            return self.get_id() == other.get_id()
        else:
            return False

    def __lt__(self, other):
        if isinstance(other, Security):
            return self.get_id() < other.get_id()
        else:
            return False

    def __hash__(self):
        return hash(self.get_id())
