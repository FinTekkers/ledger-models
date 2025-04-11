from enum import Enum
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto

class ProductType(Enum):
    """
    The type of security, as modelled in code. This should not be used for business purposes
    as code might be refactored.
    """
    FRN = (SecurityTypeProto.FRN, "FRN", "Floating Rate Note (FRN)")
    TIPS = (SecurityTypeProto.TIPS, "TIPS", "Treasury Inflation Protected Security (TIPS)")
    BILL = (SecurityTypeProto.BOND_SECURITY, "Bill", "Treasury Bill")
    NOTE = (SecurityTypeProto.BOND_SECURITY, "Note", "Treasury Note")
    BOND = (SecurityTypeProto.BOND_SECURITY, "Bond", "Treasury Bond")
    EQUITY = (SecurityTypeProto.EQUITY_SECURITY, "Equity", "Cash Equity")
    CASH = (SecurityTypeProto.CASH_SECURITY, "Cash", "Cash")
    UNCLASSIFIED = (SecurityTypeProto.UNKNOWN_SECURITY_TYPE, "N/A", "Unclassified")

    def __init__(self, proto_value, short_name, long_name):
        self._proto_value = proto_value
        self._short_name = short_name
        self._long_name = long_name

    @property
    def proto(self):
        """Returns the SecurityTypeProto value for this product type."""
        return self._proto_value

    def get_short_name(self):
        """Returns the short name of the product type."""
        return self._short_name

    def get_long_name(self):
        """Returns the long name/description of the product type."""
        return self._long_name

    def get_proto_value(self):
        return self._proto_value

    def __str__(self):
        """Returns the short name when the enum is converted to string."""
        return self._short_name

    @classmethod
    def from_proto_value(cls, proto_value):
        if hasattr(proto_value, 'value'):
            proto_value = proto_value.value
        
        # Special handling for BOND_SECURITY
        if proto_value == SecurityTypeProto.BOND_SECURITY:
            return cls.BOND  # Default to BOND for BOND_SECURITY
        
        for product_type in cls:
            if product_type._proto_value == proto_value:
                return product_type
        return cls.UNCLASSIFIED

    @classmethod
    def from_short_name(cls, short_name):
        try:
            return next(pt for pt in cls if pt._short_name == short_name)
        except StopIteration:
            return cls.UNCLASSIFIED

    def _value_tuple(self):
        return (self._proto_value, self._short_name, self._long_name)

    def __eq__(self, other):
        if isinstance(other, ProductType):
            return self._value_tuple() == other._value_tuple()
        return False 