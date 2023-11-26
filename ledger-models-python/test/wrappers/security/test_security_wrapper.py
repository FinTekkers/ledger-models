from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.security import Security


def test_security_wrapper():
    protos = [
        SecurityProto.FromString(
            b"\n\x08Security\x12\x050.0.1*\x12\n\x10\xb6H\x9du\x91,@\x9b\xa9 \xe4:\x83\xd5#B2\x16\n\x02\x08\x01\x12\x10America/New_YorkP\x03Z\x0cFixed Incomeb\rUS Governmentj\x82\x01\n\x08Security\x12\x050.0.1*\x12\n\x10\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x012\x1f\n\x0b\x08\x80\x99\xf4\xfb\x8d\xff\xff\xff\xff\x01\x12\x10America/New_YorkP\x01Z\x04Cashb\x03USDp\x03\xc2\x02\x1a\n\nIdentifier\x12\x050.0.1*\x03USD02\xca\x02\x03USD\x92\x03\x07CASHUSDp\x01\xc2\x02 \n\nIdentifier\x12\x050.0.1*\t912796Y290\x03\xe2\x03\x05R\x030.0\xe8\x03\x03\xf0\x03\x05\x82\x04\x08R\x061000.0\x8a\x04\x07\x08\xe7\x0f\x10\x01\x18\x1a\x92\x04\x07\x08\xe7\x0f\x10\x07\x18\x1b"
        ),
    ]

    for proto in protos:
        proto: SecurityProto

        security: Security = Security(proto)

        # check that each field returns a value. Doesn't assert the type/value is correct. We do that manually for a
        # few key fields
        for field in security.get_fields():
            field: FieldProto
            obj = security.get_field(field)
            assert obj != None

        assert security.get_as_of() == security.get_field(FieldProto.AS_OF)
        assert "datetime" in str(security.get_field(FieldProto.AS_OF).__class__)
        assert "UUID" in str(security.get_field(FieldProto.ID).__class__)
        assert "UUID" in str(security.get_field(FieldProto.SECURITY_ID).__class__)
        assert "Identifier" in str(security.get_field(FieldProto.IDENTIFIER).__class__)

        assert str(security) == "ID[CUSIP:912796Y29], Security[US Government]"
