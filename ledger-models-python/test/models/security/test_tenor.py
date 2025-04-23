#Test the Tenor class

from fintekkers.wrappers.models.security.tenor import Tenor
from dateutil.relativedelta import relativedelta
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto

def test_tenor_initializer_with_term_and_string_tenor():
    tenor = Tenor(TenorTypeProto.TERM, "1Y")
    assert tenor.get_tenor() == relativedelta(years=1)
    assert tenor.get_tenor_description() == "1Y"


def test_tenor_get_type_name():
    tenor = Tenor(TenorTypeProto.TERM, "1Y")
    assert tenor.get_type_name() == "TERM"

    tenor = Tenor(TenorTypeProto.PERPETUAL, None)
    assert tenor.get_type_name() == "PERPETUAL"
    assert tenor.get_tenor_description() == TenorTypeProto.Name(TenorTypeProto.PERPETUAL)

def test_str_representation():
    tenor = Tenor(TenorTypeProto.TERM, "1Y")
    assert str(tenor) == "TERM: 1Y"
