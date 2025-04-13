
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.wrappers.models.position import Position

def test_transaction_position():
    protos = [
        PositionProto.FromString(b'\n\x08Position\x12\x050.0.1P\x01X\x01\xa2\x01\x10\x08\x01\x12\x0cR\n60000000.0\xaa\x01\xa2\x01\x08\x0e"\x9d\x01\n>type.googleapis.com/fintekkers.models.portfolio.PortfolioProto\x12[\n\tPortfolio\x12\x050.0.1*\x12\n\x10\x9a\x0b\nG\xb1\xc6I\xc1\x86\xc5\xd6\x12W\xbc\xa2\xd72\x14\n\x00\x12\x10America/New_YorkR\x1dFederal Reserve SOMA Holdings\xaa\x01\x04\x08 (\x01\xaa\x01V\x08<"R\n/type.googleapis.com/google.protobuf.StringValue\x12\x1f\n\x1dFederal Reserve SOMA Holdings\xaa\x01f\x086"b\n>type.googleapis.com/fintekkers.models.security.IdentifierProto\x12 \n\nIdentifier\x12\x050.0.1*\t912810RE00\x03\xaa\x01=\x084"9\n/type.googleapis.com/google.protobuf.StringValue\x12\x06\n\x04BOND\xaa\x01H\x08\x1e"D\n9type.googleapis.com/fintekkers.models.util.LocalDateProto\x12\x07\x08\xe5\x0f\x10\x03\x18\x11'),
        PositionProto.FromString(b'\n\x08Position\x12\x050.0.1P\x01X\x01\xa2\x01\x14\x08\x01\x12\x10R\x0e-16515000000.0\xaa\x01\x04\x08 (\x05\xaa\x01N\x08\x0f"J\n4type.googleapis.com/fintekkers.models.util.UUIDProto\x12\x12\n\x10\x9a\x0b\nG\xb1\xc6I\xc1\x86\xc5\xd6\x12W\xbc\xa2\xd7\xaa\x01H\x08\x1e"D\n9type.googleapis.com/fintekkers.models.util.LocalDateProto\x12\x07\x08\xe5\x0f\x10\x0c\x18\x0f')
    ]

    for proto in protos:
        proto:PositionProto

        position:Position = Position(proto)

        for field in position.get_fields():
            obj = position.get_field(field)
            assert obj != None
            position.get_field_display(field)   

        for measure in position.get_measures():
            value = position.get_measure(measure_to_get=measure)      
            assert value != 0.0      
      
def test_tax_lot_position():
    proto = PositionProto.FromString(b'\n\x08Position\x12\x050.0.1P\x01X\x02\xa2\x01\t\x08\x01\x12\x05R\x030.0\xaa\x01H\x08("D\n9type.googleapis.com/fintekkers.models.util.LocalDateProto\x12\x07\x08\xe4\x0f\x10\x04\x18\x01\xaa\x01f\x086"b\n>type.googleapis.com/fintekkers.models.security.IdentifierProto\x12 \n\nIdentifier\x12\x050.0.1*\t9128285B20\x03\xaa\x01V\x08<"R\n/type.googleapis.com/google.protobuf.StringValue\x12\x1f\n\x1dFederal Reserve SOMA Holdings\xaa\x01\x04\x08\x13(\x02\xaa\x01\xa2\x01\x08\x0e"\x9d\x01\n>type.googleapis.com/fintekkers.models.portfolio.PortfolioProto\x12[\n\tPortfolio\x12\x050.0.1*\x12\n\x10\x9a\x0b\nG\xb1\xc6I\xc1\x86\xc5\xd6\x12W\xbc\xa2\xd72\x14\n\x00\x12\x10America/New_YorkR\x1dFederal Reserve SOMA Holdings\xaa\x01=\x084"9\n/type.googleapis.com/google.protobuf.StringValue\x12\x06\n\x04NOTE')
    proto:PositionProto

    position:Position = Position(proto)

    assert len(position.get_fields()) > 3

    for field in position.get_fields():
        field:FieldMapEntry
        
        obj = position.get_field(field)

        assert obj != None

        display = position.get_field_display(field)               
        print(display)


    for measure in position.get_measures():
        value = position.get_measure(measure_to_get=measure)     
        print(value) 
        assert value == 0.0      
      
