from fintekkers.models.security.security_type_pb2 import SecurityTypeProto

class ProductType:
    UNCLASSIFIED = None
    CASH = None
    EQUITY = None
    BOND = None
    TIPS = None
    FRN = None

    def __init__(self, security_type: SecurityTypeProto):
        if isinstance(security_type, int):
            self._security_type = security_type
            self._name = SecurityTypeProto.DESCRIPTOR.values_by_number[security_type].name
        else:
            self._security_type = security_type
            self._name = security_type.name

    @property
    def proto(self):
        return self._security_type

    def __eq__(self, other):
        if isinstance(other, ProductType):
            return self._security_type == other._security_type
        return False

    def __str__(self):
        return self._name

    def __repr__(self):
        return f"ProductType.{self._name}"

# Initialize static instances
ProductType.UNCLASSIFIED = ProductType(SecurityTypeProto.UNKNOWN_SECURITY_TYPE)
ProductType.CASH = ProductType(SecurityTypeProto.CASH_SECURITY)
ProductType.EQUITY = ProductType(SecurityTypeProto.EQUITY_SECURITY)
ProductType.BOND = ProductType(SecurityTypeProto.BOND_SECURITY)
ProductType.TIPS = ProductType(SecurityTypeProto.TIPS)
ProductType.FRN = ProductType(SecurityTypeProto.FRN) 