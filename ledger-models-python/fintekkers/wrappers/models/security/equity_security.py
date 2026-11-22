"""EquitySecurity wrapper.

Specialises Security for equity and ETF products (any STOCK descendant in
hierarchy.json: COMMON_STOCK, PREFERRED_STOCK, ADR, ETF, ...). Equity details
live in the SecurityProto.non_bond_details oneof under equity_details.
See docs/adr/equity_shares_outstanding.md.
"""

from decimal import Decimal
from typing import Optional

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.util.decimal import decode_decimal, is_decimal_set


class EquitySecurity(Security):
    """Wraps a SecurityProto whose non_bond_details oneof carries
    equity_details."""

    def get_shares_outstanding(self) -> Optional[Decimal]:
        """Whole-number count of shares outstanding at this version's as_of.
        Returns None when unknown: no equity_details, the field is absent or
        the decimal is empty. Never returns 0 for absent.
        """
        self._ensure_hydrated()
        if self.proto.WhichOneof("non_bond_details") != "equity_details":
            return None
        details = self.proto.equity_details
        if not details.HasField("shares_outstanding"):
            return None
        if not is_decimal_set(details.shares_outstanding):
            return None
        return decode_decimal(details.shares_outstanding)
