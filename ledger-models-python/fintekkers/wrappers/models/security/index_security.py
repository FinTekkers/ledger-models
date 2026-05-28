"""IndexSecurity wrapper.

Specialises Security for index products (CPI-U, SOFR index, S&P 500, ...).
Index details live in the SecurityProto.non_bond_details oneof under
index_details.
"""

from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.wrappers.models.security.security import Security


class IndexSecurity(Security):
    """Wraps a SecurityProto whose non_bond_details oneof carries
    index_details."""

    def get_index_type(self) -> IndexTypeProto:
        """Returns the IndexTypeProto value carried by this security's
        index_details. Returns UNKNOWN_INDEX_TYPE when no index_details is
        populated (e.g. the security is mis-typed as an index).
        """
        self._ensure_hydrated()
        if self.proto.WhichOneof("non_bond_details") != "index_details":
            return IndexTypeProto.UNKNOWN_INDEX_TYPE
        return self.proto.index_details.index_type
