"""FloatingRateNote wrapper.

Specialises BondSecurity for Treasury Floating Rate Notes. Shared bond
fields live on SecurityProto.bond_details; FRN-specific extras (spread,
reference rate index, reset frequency) live on SecurityProto.frn_extension.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from fintekkers.models.security.security_pb2 import (
    SecurityProto,
    BondDetailsProto,
    FrnExtensionProto,
)
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.models.security.coupon_frequency_pb2 import CouponFrequencyProto
from fintekkers.wrappers.models.security.bond_security import (
    BondSecurity,
    _decimal_value,
    _local_date,
)


class FloatingRateNote(BondSecurity):
    """Wraps a SecurityProto with product_type=TREASURY_FRN."""

    def get_spread(self) -> Optional[Decimal]:
        self._ensure_hydrated("spread")
        if not self.proto.HasField("frn_extension"):
            return None
        ext = self.proto.frn_extension
        if not ext.HasField("spread"):
            return None
        value = ext.spread.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_reference_rate_index(self) -> IndexTypeProto:
        self._ensure_hydrated("reference_rate_index")
        if not self.proto.HasField("frn_extension"):
            return IndexTypeProto.UNKNOWN_INDEX_TYPE
        return self.proto.frn_extension.reference_rate_index

    def get_reset_frequency(self) -> CouponFrequencyProto:
        self._ensure_hydrated("reset_frequency")
        if not self.proto.HasField("frn_extension"):
            return CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY
        return self.proto.frn_extension.reset_frequency

    @staticmethod
    def from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: int,
        coupon_frequency: int,
        issue_date: date,
        maturity_date: date,
        spread: Decimal,
        reference_rate_index: int,
        reset_frequency: int,
    ) -> SecurityProto:
        """Builds an FRN SecurityProto with both bond_details and
        frn_extension populated, and product_type=TREASURY_FRN.
        """
        bond_details = BondDetailsProto(
            coupon_rate=_decimal_value(coupon_rate),
            coupon_type=coupon_type,
            coupon_frequency=coupon_frequency,
            face_value=_decimal_value(face_value),
            issue_date=_local_date(issue_date),
            maturity_date=_local_date(maturity_date),
        )
        frn_extension = FrnExtensionProto(
            spread=_decimal_value(spread),
            reference_rate_index=reference_rate_index,
            reset_frequency=reset_frequency,
        )
        return SecurityProto(
            product_type=ProductTypeProto.TREASURY_FRN,
            bond_details=bond_details,
            frn_extension=frn_extension,
        )
