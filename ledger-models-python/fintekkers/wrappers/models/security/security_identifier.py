from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto

class Identifier():
    def __init__(self, identifier_type, identifier_value=None):
        if isinstance(identifier_type, IdentifierProto):
            self.proto = identifier_type
        else:
            proto = IdentifierProto()
            if isinstance(identifier_type, str):
                proto.identifier_type = getattr(IdentifierTypeProto, identifier_type)
            else:
                proto.identifier_type = identifier_type
            proto.identifier_value = identifier_value
            self.proto = proto

    def __str__(self):
        identifier_type_name = IdentifierTypeProto.DESCRIPTOR.values_by_number[self.proto.identifier_type].name
        return f"{identifier_type_name}:{self.proto.identifier_value}"
    
    def get_identifier_value(self) -> str:
        return self.proto.identifier_value
    
    def get_identifier_type(self) -> IdentifierTypeProto:
        return self.proto.identifier_type