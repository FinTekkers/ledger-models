import unittest
from datetime import datetime
from uuid import UUID
from google.protobuf.timestamp_pb2 import Timestamp
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.security import Security

class TestPrice(unittest.TestCase):
    def setUp(self):
        # Create a test security with proper initialization
        security_proto = SecurityProto(
            uuid=UUIDProto(raw_uuid=UUID(int=0).bytes),
            as_of=LocalTimestampProto(
                timestamp=Timestamp(),
                time_zone="America/New_York"
            ),
            is_link=False,
            object_class="Security",
            version="0.0.1",
            security_type=SecurityTypeProto.BOND_SECURITY,
            asset_class="Fixed Income",
            issuer_name="Test Issuer",
            identifier=IdentifierProto(
                identifier_type=IdentifierTypeProto.CUSIP,
                identifier_value="123456789"
            )
        )
        self.test_security = Security(security_proto)
        
        # Create test timestamp
        self.test_timestamp = Timestamp()
        self.test_timestamp.GetCurrentTime()
        
        # Create test price value
        self.test_price_value = 100.50
        
        # Create a test price instance
        self.price = Price.create_price(
            security=self.test_security,
            price=self.test_price_value,
            as_of_date=self.test_timestamp
        )

    def test_create_price(self):
        """Test price creation with valid inputs"""
        self.assertIsInstance(self.price, Price)
        self.assertIsInstance(self.price.proto, PriceProto)
        self.assertEqual(self.price.get_price(), self.test_price_value)
        self.assertIsInstance(self.price.get_uuid(), UUID)

    def test_get_price(self):
        """Test getting price value"""
        price_value = self.price.get_price()
        self.assertIsInstance(price_value, float)
        self.assertEqual(price_value, self.test_price_value)

    def test_get_as_of(self):
        """Test getting as_of timestamp"""
        as_of = self.price.get_as_of()
        self.assertIsInstance(as_of, datetime)

    def test_get_uuid(self):
        """Test getting UUID"""
        uuid = self.price.get_uuid()
        self.assertIsInstance(uuid, UUID)

    def test_str_representation(self):
        """Test string representation of price"""
        str_repr = str(self.price)
        self.assertIsInstance(str_repr, str)
        self.assertIn(str(self.test_price_value), str_repr)
        self.assertIn(str(self.price.get_uuid()), str_repr)

    def test_price_proto_structure(self):
        """Test the structure of the created price proto"""
        proto = self.price.proto
        self.assertTrue(proto.HasField('uuid'))
        self.assertTrue(proto.HasField('as_of'))
        self.assertTrue(proto.HasField('price'))
        self.assertEqual(proto.is_link, False)
        self.assertEqual(proto.object_class, "Portfolio")
        self.assertEqual(proto.version, "0.0.1")

if __name__ == '__main__':
    unittest.main()
