from datetime import date
from decimal import Decimal
from typing import Optional

from fintekkers.models.security.bond.issuance_pb2 import IssuanceProto
from fintekkers.models.security.bond.auction_type_pb2 import AuctionTypeProto
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


class Issuance:
    """Wraps a single IssuanceProto, exposing typed accessors over its
    DecimalValueProto / LocalDateProto fields. Unset proto fields return None.
    """

    def __init__(self, proto: IssuanceProto):
        self.proto: IssuanceProto = proto

    # --- Dates ----------------------------------------------------------
    def get_issue_date(self) -> Optional[date]:
        if not self.proto.HasField("auction_issue_date"):
            return None
        d = self.proto.auction_issue_date
        return date(d.year, d.month, d.day)

    def get_announcement_date(self) -> Optional[date]:
        if not self.proto.HasField("auction_announcement_date"):
            return None
        d = self.proto.auction_announcement_date
        return date(d.year, d.month, d.day)

    # --- Decimal amounts ------------------------------------------------
    def get_original_face_value(self) -> Optional[Decimal]:
        return self._decimal_or_none("auction_offering_amount")

    def get_total_accepted(self) -> Optional[Decimal]:
        return self._decimal_or_none("total_accepted")

    def get_post_auction_outstanding_quantity(self) -> Optional[Decimal]:
        return self._decimal_or_none("post_auction_outstanding_quantity")

    def get_mature_security_amount(self) -> Optional[Decimal]:
        return self._decimal_or_none("mature_security_amount")

    def get_price_for_single_price_auction(self) -> Optional[Decimal]:
        return self._decimal_or_none("price_for_single_price_auction")

    # --- Enums ----------------------------------------------------------
    def get_auction_type(self) -> AuctionTypeProto:
        return self.proto.auction_type

    # --- helpers --------------------------------------------------------
    def _decimal_or_none(self, field_name: str) -> Optional[Decimal]:
        if not self.proto.HasField(field_name):
            return None
        dec_proto = getattr(self.proto, field_name)
        value = dec_proto.arbitrary_precision_value
        if value == "":
            return None
        return Decimal(value)


class IssuanceHistory:
    """Wraps a list of IssuanceProto, offering chronological sorting and a
    tabular print of the auction history. Use Issuance to wrap individual
    rows.
    """

    def __init__(self, proto: list[IssuanceProto]):
        self.proto: list[IssuanceProto] = proto

    def sort_by_auction_announcement_date(self):
        self.proto = sorted(
            self.proto,
            key=lambda x: ProtoSerializationUtil.deserialize(
                x.auction_announcement_date
            ),
        )
        return self

    def issuances(self) -> list[Issuance]:
        return [Issuance(p) for p in self.proto]

    def print_auction_history(self):
        print(
            "announcement_date,mature_security_amount,total_accepted,post_auction_outstanding_quantity"
        )

        for issue in self.proto:
            issue: IssuanceProto

            auction_announcement_date: date = ProtoSerializationUtil.deserialize(
                issue.auction_announcement_date
            )
            mature_security_amount = 0.0
            total_accepted = 0.0
            post_auction_outstanding_quantity = 0.0

            if (
                issue.mature_security_amount is not None
                and issue.mature_security_amount.arbitrary_precision_value != ""
            ):
                mature_security_amount: float = ProtoSerializationUtil.deserialize(
                    issue.mature_security_amount
                )

            if (
                issue.total_accepted is not None
                and issue.total_accepted.arbitrary_precision_value != ""
            ):
                total_accepted: float = ProtoSerializationUtil.deserialize(
                    issue.total_accepted
                )

            if (
                issue.post_auction_outstanding_quantity is not None
                and issue.post_auction_outstanding_quantity.arbitrary_precision_value
                != ""
            ):
                post_auction_outstanding_quantity: float = (
                    ProtoSerializationUtil.deserialize(
                        issue.post_auction_outstanding_quantity
                    )
                )

            print(
                "{},${:,.2f},${:,.2f},${:,.2f}".format(
                    auction_announcement_date,
                    mature_security_amount,
                    total_accepted,
                    post_auction_outstanding_quantity,
                )
            )
