"""LM-482: security_metric.proto names its security by id only, so it never
imports security.proto."""
from fintekkers.models.security import security_metric_pb2


def test_security_metric_proto_does_not_import_security_proto():
    imports = {d.name for d in security_metric_pb2.DESCRIPTOR.dependencies}
    assert "fintekkers/models/util/uuid.proto" in imports
    assert "fintekkers/models/security/security.proto" not in imports
