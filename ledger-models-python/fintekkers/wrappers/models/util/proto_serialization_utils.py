from datetime import date
from decimal import Decimal
from typing import Any

from google.protobuf import wrappers_pb2
from google.protobuf.any_pb2 import Any

from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.security.tenor_pb2 import TenorProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto

class ProtoSerializationUtils:
    _KNOWN_DESCRIPTORS = {
        wrappers_pb2.StringValue.DESCRIPTOR,
        LocalDateProto.DESCRIPTOR,
        wrappers_pb2.Int32Value.DESCRIPTOR,
        wrappers_pb2.BoolValue.DESCRIPTOR,
        wrappers_pb2.DoubleValue.DESCRIPTOR,
        TenorProto.DESCRIPTOR,
        IdentifierProto.DESCRIPTOR,
        SecurityTypeProto.DESCRIPTOR,
    }

    @staticmethod
    def unpack_value(value: Any) -> Any:
        """
        Unpacks a protobuf Any value into its corresponding Python type.
        """
        # First check if this is a known type
        for descriptor in ProtoSerializationUtils._KNOWN_DESCRIPTORS:
            if value.Is(descriptor):
                if descriptor == wrappers_pb2.StringValue.DESCRIPTOR:
                    string_value = wrappers_pb2.StringValue()
                    value.Unpack(string_value)
                    return string_value.value
                elif descriptor == LocalDateProto.DESCRIPTOR:
                    date_value = LocalDateProto()
                    value.Unpack(date_value)
                    return date(year=date_value.year, month=date_value.month, day=date_value.day)
                elif descriptor == wrappers_pb2.Int32Value.DESCRIPTOR:
                    int_value = wrappers_pb2.Int32Value()
                    value.Unpack(int_value)
                    return int_value.value
                elif descriptor == wrappers_pb2.BoolValue.DESCRIPTOR:
                    bool_value = wrappers_pb2.BoolValue()
                    value.Unpack(bool_value)
                    return bool_value.value
                elif descriptor == wrappers_pb2.DoubleValue.DESCRIPTOR:
                    double_value = wrappers_pb2.DoubleValue()
                    value.Unpack(double_value)
                    return Decimal(str(double_value.value))
                elif descriptor == TenorProto.DESCRIPTOR:
                    tenor_value = TenorProto()
                    value.Unpack(tenor_value)
                    from fintekkers.wrappers.models.security.tenor import Tenor
                    return Tenor.from_proto(tenor_value)
                elif descriptor == IdentifierProto.DESCRIPTOR:
                    identifier_value = IdentifierProto()
                    value.Unpack(identifier_value)
                    from fintekkers.wrappers.models.security.security_identifier import Identifier
                    return Identifier(identifier_value)
                elif descriptor == SecurityTypeProto.DESCRIPTOR:
                    security_type = SecurityTypeProto()
                    value.Unpack(security_type)
                    from fintekkers.wrappers.models.security.product_type import ProductType
                    return ProductType.from_proto_value(security_type)

        # If we get here, it's an unknown type
        raise ValueError(f"Could not unpack value of type {value.type_url}")

    @staticmethod
    def pack_value(value: Any) -> Any:
        """
        Packs a Python value into a protobuf Any.
        """
        any_value = Any()
        
        if isinstance(value, str):
            string_value = wrappers_pb2.StringValue(value=value)
            any_value.Pack(string_value)
        elif isinstance(value, int):
            int_value = wrappers_pb2.Int32Value(value=value)
            any_value.Pack(int_value)
        elif isinstance(value, bool):
            bool_value = wrappers_pb2.BoolValue(value=value)
            any_value.Pack(bool_value)
        elif isinstance(value, float) or isinstance(value, Decimal):
            double_value = wrappers_pb2.DoubleValue(value=float(value))
            any_value.Pack(double_value)
        else:
            raise ValueError(f"Could not pack value of type {type(value)}")
        
        return any_value 