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
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.wrappers.util.object_types import stamp
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.util.decimal import encode_decimal
from fintekkers.wrappers.models.issues.issuance import Issuance
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.tenor import Tenor


def _local_date(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def _decimal_value(dec: Decimal) -> DecimalValueProto:
    return encode_decimal(dec)


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

    def get_issuance_tenor(self, issuance: Optional[Issuance]) -> Tenor:
        """The tenor of one auction of this bond: Java's ``Period.between``
        that issuance's auction_issue_date and the bond's maturity, the same
        formula as Java's ``BondSecurity.getTenor()``. A reopened 26-week bill
        reads 26W for its original auction and 13W for a reopening 13 weeks
        before maturity. An UNKNOWN_TENOR_TYPE tenor when either date is unset.

        Read the period with ``get_tenor()``. ``get_tenor_description()`` and
        ``as_proto()`` round 27 or more days up to a month (P2M29D prints as
        3M), so their string differs from Java's ``Period.toString()``.
        """
        issue = issuance.get_issue_date() if issuance is not None else None
        self._ensure_hydrated()
        bond = self._get_bond_like_details()
        if issue is None or bond is None or not bond.HasField("maturity_date"):
            return Tenor(TenorTypeProto.UNKNOWN_TENOR_TYPE)
        return Tenor.of_period(Tenor.period_between(issue, self.get_maturity_date()))

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
        return stamp(SecurityProto(
            product_type=ProductTypeProto.TREASURY_NOTE,
            bond_details=bond_details,
        ), ObjectTypeProto.OBJECT_TYPE_SECURITY)
