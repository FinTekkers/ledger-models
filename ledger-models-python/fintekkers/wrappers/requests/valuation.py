"""Typed valuation requests (LM-410). See docs/adr/product_input_builders.md."""
from typing import Iterable, Optional

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.requests.valuation.product_inputs_pb2 import ProductInput
from fintekkers.requests.valuation.valuation_request_pb2 import ValuationRequestProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.security.product_inputs import check_product_input
from fintekkers.wrappers.util.object_types import stamp_own


class ValuationRequests:
    @staticmethod
    def typed(asof: LocalTimestampProto, product_input: ProductInput,
              position: Optional[PositionProto], measures: Iterable[MeasureProto]) -> ValuationRequestProto:
        """A ValuationRequestProto valued from `product_input` alone.

        Sets asof_datetime (23), measures (30), position_input (21) and
        product_input (70). Never sets security_input (20) or price_input (22).
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
