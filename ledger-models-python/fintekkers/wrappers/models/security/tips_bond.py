"""TIPSBond wrapper.

Specialises BondSecurity for Treasury Inflation-Protected Securities. The
shared bond fields (coupon, dates, face value) live on
SecurityProto.bond_details; TIPS-specific extras (base CPI, index date,
inflation index type) live on SecurityProto.tips_extension. The two
sub-messages coexist — neither replaces the other.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from fintekkers.models.security.security_pb2 import (
    SecurityProto,
    BondDetailsProto,
    TipsExtensionProto,
)
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.wrappers.models.security.bond_security import (
    BondSecurity,
    _decimal_value,
    _local_date,
)


class TIPSBond(BondSecurity):
    """Wraps a SecurityProto with product_type=TIPS."""

    def get_base_cpi(self) -> Optional[Decimal]:
        self._assert_not_link("base_cpi")
        if not self.proto.HasField("tips_extension"):
            return None
        ext = self.proto.tips_extension
        if not ext.HasField("base_cpi"):
            return None
        value = ext.base_cpi.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_index_date(self) -> Optional[date]:
        self._assert_not_link("index_date")
        if not self.proto.HasField("tips_extension"):
            return None
        ext = self.proto.tips_extension
        if not ext.HasField("index_date"):
            return None
        d = ext.index_date
        return date(d.year, d.month, d.day)

    def get_inflation_index_type(self) -> IndexTypeProto:
        self._assert_not_link("inflation_index_type")
        if not self.proto.HasField("tips_extension"):
            return IndexTypeProto.UNKNOWN_INDEX_TYPE
        return self.proto.tips_extension.inflation_index_type

    @staticmethod
    def from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: int,
        coupon_frequency: int,
        issue_date: date,
        maturity_date: date,
        base_cpi: Decimal,
        index_date: date,
        inflation_index_type: int,
    ) -> SecurityProto:
        """Builds a TIPS SecurityProto with both bond_details and
        tips_extension populated, and product_type=TIPS.
        """
        bond_details = BondDetailsProto(
            coupon_rate=_decimal_value(coupon_rate),
            coupon_type=coupon_type,
            coupon_frequency=coupon_frequency,
            face_value=_decimal_value(face_value),
            issue_date=_local_date(issue_date),
            maturity_date=_local_date(maturity_date),
        )
        tips_extension = TipsExtensionProto(
            base_cpi=_decimal_value(base_cpi),
            index_date=_local_date(index_date),
            inflation_index_type=inflation_index_type,
        )
        return SecurityProto(
            product_type=ProductTypeProto.TIPS,
            bond_details=bond_details,
            tips_extension=tips_extension,
        )
