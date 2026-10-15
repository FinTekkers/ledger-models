from uuid import UUID, uuid4

from fintekkers.wrappers.models.errors import ModelValidationError, violation


class FintekkersUuid:
    uuid: UUID

    def __init__(self, uuid: UUID):
        self.uuid = uuid

    def __str__(self) -> str:
        return self.uuid.__str__()

    @staticmethod
    def from_uuid(uuid: UUID):
        return FintekkersUuid(uuid)

    @staticmethod
    def from_bytes(raw_uuid: list[bytes]):
        """Raises ModelValidationError naming `raw_uuid` unless it is exactly
        16 bytes (LM-334). Still a ValueError, as before."""
        if len(raw_uuid) != 16:
            raise ModelValidationError([violation(
                "raw_uuid", None, f"expected 16 bytes but got {len(raw_uuid)}")])
        return FintekkersUuid(UUID(bytes=raw_uuid))

    @staticmethod
    def new_uuid():
        return FintekkersUuid(uuid4())

    def as_uuid(self) -> UUID:
        return self.uuid

    def as_bytes(self) -> list[bytes]:
        return self.uuid.bytes
