
import unittest

from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto

from fintekkers.wrappers.models.security.tenor import Tenor


def test_tenor():
    tenor:Tenor = Tenor(TenorTypeProto.TERM, "18M")
    assert "1Y6M" == tenor.get_tenor_description()
    

def test_tenor_double():
    tenor:Tenor = Tenor(TenorTypeProto.TERM, "1Y6M")
    assert "1Y6M" == tenor.get_tenor_description()

        
