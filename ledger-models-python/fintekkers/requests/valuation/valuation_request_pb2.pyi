from fintekkers.models.security import security_pb2 as _security_pb2
from fintekkers.models.position import position_pb2 as _position_pb2
from fintekkers.models.price import price_pb2 as _price_pb2
from fintekkers.models.util import local_timestamp_pb2 as _local_timestamp_pb2
from fintekkers.requests.util import operation_pb2 as _operation_pb2
from fintekkers.models.position import measure_pb2 as _measure_pb2
from fintekkers.requests.valuation import product_inputs_pb2 as _product_inputs_pb2
from fintekkers.models.util import object_type_pb2 as _object_type_pb2
from fintekkers.models.util import version_pb2 as _version_pb2
from fintekkers.models.portfolio import amortisation_elections_pb2 as _amortisation_elections_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ValuationRequestProto(_message.Message):
    __slots__ = ("object_type", "version", "operation_type", "measures", "security_input", "position_input", "price_input", "asof_datetime", "amortisation_elections", "tax_lots", "product_input")
    OBJECT_TYPE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    OPERATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    MEASURES_FIELD_NUMBER: _ClassVar[int]
    SECURITY_INPUT_FIELD_NUMBER: _ClassVar[int]
    POSITION_INPUT_FIELD_NUMBER: _ClassVar[int]
    PRICE_INPUT_FIELD_NUMBER: _ClassVar[int]
    ASOF_DATETIME_FIELD_NUMBER: _ClassVar[int]
    AMORTISATION_ELECTIONS_FIELD_NUMBER: _ClassVar[int]
    TAX_LOTS_FIELD_NUMBER: _ClassVar[int]
    PRODUCT_INPUT_FIELD_NUMBER: _ClassVar[int]
    object_type: _object_type_pb2.ObjectTypeProto
    version: _version_pb2.VersionProto
    operation_type: _operation_pb2.RequestOperationTypeProto
    measures: _containers.RepeatedScalarFieldContainer[_measure_pb2.MeasureProto]
    security_input: _security_pb2.SecurityProto
    position_input: _position_pb2.PositionProto
    price_input: _price_pb2.PriceProto
    asof_datetime: _local_timestamp_pb2.LocalTimestampProto
    amortisation_elections: _amortisation_elections_pb2.AmortisationElectionsProto
    tax_lots: _containers.RepeatedCompositeFieldContainer[_product_inputs_pb2.TaxLotInputProto]
    product_input: _product_inputs_pb2.ProductInput
    def __init__(self, object_type: _Optional[_Union[_object_type_pb2.ObjectTypeProto, str]] = ..., version: _Optional[_Union[_version_pb2.VersionProto, _Mapping]] = ..., operation_type: _Optional[_Union[_operation_pb2.RequestOperationTypeProto, str]] = ..., measures: _Optional[_Iterable[_Union[_measure_pb2.MeasureProto, str]]] = ..., security_input: _Optional[_Union[_security_pb2.SecurityProto, _Mapping]] = ..., position_input: _Optional[_Union[_position_pb2.PositionProto, _Mapping]] = ..., price_input: _Optional[_Union[_price_pb2.PriceProto, _Mapping]] = ..., asof_datetime: _Optional[_Union[_local_timestamp_pb2.LocalTimestampProto, _Mapping]] = ..., amortisation_elections: _Optional[_Union[_amortisation_elections_pb2.AmortisationElectionsProto, _Mapping]] = ..., tax_lots: _Optional[_Iterable[_Union[_product_inputs_pb2.TaxLotInputProto, _Mapping]]] = ..., product_input: _Optional[_Union[_product_inputs_pb2.ProductInput, _Mapping]] = ...) -> None: ...
