"""MortgageBackedSecurity wrapper.

Specialises BondSecurity for agency mortgage-backed securities (MBS). The
shared bond fields (coupon, dates, face value) live on
SecurityProto.bond_details; MBS-specific extras (pool number, agency,
WAC, WAM, pass-through rate, current factor, original face value,
current UPB, PSA speed) live on SecurityProto.mbs_extension. The two
sub-messages coexist - neither replaces the other.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from fintekkers.models.security.security_pb2 import (
    SecurityProto,
    BondDetailsProto,
    MbsExtensionProto,
)
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.bond.agency_pb2 import AgencyProto
from fintekkers.wrappers.models.security.bond_security import (
    BondSecurity,
    _decimal_value,
    _local_date,
)


class MortgageBackedSecurity(BondSecurity):
    """Wraps a SecurityProto with product_type=MORTGAGE_BACKED."""

    def get_pool_number(self) -> str:
        self._assert_not_link("pool_number")
        if not self.proto.HasField("mbs_extension"):
            return ""
        return self.proto.mbs_extension.pool_number

    def get_agency(self) -> AgencyProto:
        self._assert_not_link("agency")
        if not self.proto.HasField("mbs_extension"):
            return AgencyProto.AGENCY_UNKNOWN
        return self.proto.mbs_extension.agency

    def get_wac(self) -> Optional[Decimal]:
        self._assert_not_link("wac")
        if not self.proto.HasField("mbs_extension"):
            return None
        ext = self.proto.mbs_extension
        if not ext.HasField("wac"):
            return None
        value = ext.wac.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_wam(self) -> int:
        self._assert_not_link("wam")
        if not self.proto.HasField("mbs_extension"):
            return 0
        return self.proto.mbs_extension.wam

    def get_pass_through_rate(self) -> Optional[Decimal]:
        self._assert_not_link("pass_through_rate")
        if not self.proto.HasField("mbs_extension"):
            return None
        ext = self.proto.mbs_extension
        if not ext.HasField("pass_through_rate"):
            return None
        value = ext.pass_through_rate.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_current_factor(self) -> Optional[Decimal]:
        self._assert_not_link("current_factor")
        if not self.proto.HasField("mbs_extension"):
            return None
        ext = self.proto.mbs_extension
        if not ext.HasField("current_factor"):
            return None
        value = ext.current_factor.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_original_face_value(self) -> Optional[Decimal]:
        self._assert_not_link("original_face_value")
        if not self.proto.HasField("mbs_extension"):
            return None
        ext = self.proto.mbs_extension
        if not ext.HasField("original_face_value"):
            return None
        value = ext.original_face_value.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_current_upb(self) -> Optional[Decimal]:
        self._assert_not_link("current_upb")
        if not self.proto.HasField("mbs_extension"):
            return None
        ext = self.proto.mbs_extension
        if not ext.HasField("current_upb"):
            return None
        value = ext.current_upb.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    def get_psa_speed(self) -> Optional[Decimal]:
        self._assert_not_link("psa_speed")
        if not self.proto.HasField("mbs_extension"):
            return None
        ext = self.proto.mbs_extension
        if not ext.HasField("psa_speed"):
            return None
        value = ext.psa_speed.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)

    @staticmethod
    def from_pricer_inputs(
        face_value: Decimal,
        coupon_rate: Decimal,
        coupon_type: int,
        coupon_frequency: int,
        issue_date: date,
        maturity_date: date,
        pool_number: str,
        agency: int,
        wac: Decimal,
        wam: int,
        pass_through_rate: Decimal,
        current_factor: Decimal,
        original_face_value: Decimal,
        current_upb: Decimal,
        psa_speed: Decimal,
    ) -> SecurityProto:
        """Builds an MBS SecurityProto with both bond_details and
        mbs_extension populated, and product_type=MORTGAGE_BACKED.
        """
        bond_details = BondDetailsProto(
            coupon_rate=_decimal_value(coupon_rate),
            coupon_type=coupon_type,
            coupon_frequency=coupon_frequency,
            face_value=_decimal_value(face_value),
            issue_date=_local_date(issue_date),
            maturity_date=_local_date(maturity_date),
        )
        mbs_extension = MbsExtensionProto(
            pool_number=pool_number,
            agency=agency,
            wac=_decimal_value(wac),
            wam=wam,
            pass_through_rate=_decimal_value(pass_through_rate),
            current_factor=_decimal_value(current_factor),
            original_face_value=_decimal_value(original_face_value),
            current_upb=_decimal_value(current_upb),
            psa_speed=_decimal_value(psa_speed),
        )
        return SecurityProto(
            product_type=ProductTypeProto.MORTGAGE_BACKED,
            bond_details=bond_details,
            mbs_extension=mbs_extension,
        )
