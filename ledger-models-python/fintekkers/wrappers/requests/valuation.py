"""Typed valuation requests (LM-410). See docs/adr/product_input_builders.md."""
from __future__ import annotations

from typing import Iterable, Optional

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.requests.valuation.product_inputs_pb2 import ProductInput
from fintekkers.requests.valuation.valuation_request_pb2 import SettlementConventionProto, ValuationRequestProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.security.product_inputs import check_product_input
from fintekkers.wrappers.util.object_types import stamp_own


class ValuationRequests:
    @staticmethod
    def typed(asof: LocalTimestampProto, product_input: ProductInput,
              position: Optional[PositionProto], measures: Iterable[MeasureProto]) -> ValuationRequestProto:
        """A ValuationRequestProto valued from `product_input` alone.

        Sets asof_datetime (23), measures (30), position_input (21) and
        product_input (70).
        `product_input` is checked with check_product_input first, so a tips
        input with no cpi raises MissingMarketDataError here too. The caller's
        protos are copied in as they are, not stamped (LM-322).
        """
        missing = [violation(field, None, f"{field} is required")
                   for field, value in (("asof_datetime", asof), ("position_input", position)) if value is None]
        if missing:
            raise ModelValidationError(missing)
        check_product_input(product_input)
        return stamp_own(ValuationRequestProto(
            measures=list(measures),
            asof_datetime=asof,
            position_input=position,
            product_input=product_input,
        ))

    @staticmethod
    def settlement_convention(trade_date: Optional[LocalDateProto], lag_business_days: int,
                              calendar_id: str) -> SettlementConventionProto:
        """A SettlementConventionProto for ValuationRequestProto.settlement_convention (80), LM-509.

        Checks only the rules in the proto comment that need no calendar:
        trade_date is set, the lag is not negative and calendar_id is not
        blank. It never computes a settlement date, and an unknown calendar_id
        passes: valuation-service owns the calendars. A lag of 0 is valid
        (same-day settlement). Attach it with
        ``request.settlement_convention.CopyFrom(convention)``.
        """
        violations = []
        if trade_date is None:
            violations.append(violation("settlement_convention.trade_date", None, "trade_date is required"))
        if lag_business_days < 0:
            violations.append(violation("settlement_convention.settlement_lag_business_days", None,
                                        f"settlement_lag_business_days must be 0 or more, got {lag_business_days}"))
        if not calendar_id or not calendar_id.strip():
            violations.append(violation("settlement_convention.calendar_id", None, "calendar_id is required"))
        if violations:
            raise ModelValidationError(violations)
        return SettlementConventionProto(
            trade_date=trade_date,
            settlement_lag_business_days=lag_business_days,
            calendar_id=calendar_id,
        )
