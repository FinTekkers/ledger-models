"""BondSecurity wrapper.

Specialises Security for bond-shaped products (TBILL, TREASURY_NOTE,
TREASURY_BOND, TIPS, TREASURY_FRN, ...). Reads from
SecurityProto.bond_details, which is the canonical home for the eight
shared bond fields per security.proto. TIPS/FRN extras live on
SecurityProto.tips_extension and SecurityProto.frn_extension and are
exposed by the TIPSBond / FloatingRateNote subclasses.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from fintekkers.models.security.security_pb2 import (
    SecurityProto,
    BondDetailsProto,
)
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.issues.issuance import Issuance
from fintekkers.wrappers.models.security.security import Security


def _local_date(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def _decimal_value(dec: Decimal) -> DecimalValueProto:
    return DecimalValueProto(arbitrary_precision_value=str(dec))


class BondSecurity(Security):
    """Wraps a SecurityProto whose product_type descends from BOND."""

    def get_issuances(self) -> list[Issuance]:
        """Returns the bond's issuance history as wrapped Issuance objects.
        Empty list when no auctions have been recorded.
        """
        self._ensure_hydrated()
        if not self.proto.HasField("bond_details"):
            return []
        return [Issuance(p) for p in self.proto.bond_details.issuance_info]

    @staticmethod
    def from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: int,
        coupon_frequency: int,
        issue_date: date,
        maturity_date: date,
    ) -> SecurityProto:
        """Builds a minimal SecurityProto suitable for a bond pricer call.
        Populates SecurityProto.bond_details with the six pricer inputs and
        sets product_type=TREASURY_NOTE. Callers can override product_type
        after construction for other bond shapes.
        """
        bond_details = BondDetailsProto(
            coupon_rate=_decimal_value(coupon_rate),
            coupon_type=coupon_type,
            coupon_frequency=coupon_frequency,
            face_value=_decimal_value(face_value),
            issue_date=_local_date(issue_date),
            maturity_date=_local_date(maturity_date),
        )
        return SecurityProto(
            product_type=ProductTypeProto.TREASURY_NOTE,
            bond_details=bond_details,
        )
