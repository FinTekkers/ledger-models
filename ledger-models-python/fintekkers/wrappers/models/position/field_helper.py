from typing import Dict, List
from fintekkers.models.position.field_pb2 import FieldProto

class FieldHelper:
    @staticmethod
    def get_field_names() -> Dict[int, str]:
        """
        Get a mapping of field enum values to their names.
        
        Returns:
            Dict[int, str]: Dictionary mapping field enum values to their names
        """
        return {field.value: field.name for field in FieldProto}

    @staticmethod
    def get_field_name(field: FieldProto) -> str:
        """
        Get the name of a field.
        
        Args:
            field: The field enum value
            
        Returns:
            str: The name of the field
        """
        return FieldProto.Name(field)

    @staticmethod
    def get_field_by_name(name: str) -> FieldProto:
        """
        Get a field enum value by its name.
        
        Args:
            name: The name of the field
            
        Returns:
            FieldProto: The field enum value
            
        Raises:
            ValueError: If the field name is not found
        """
        try:
            return FieldProto.Value(name)
        except ValueError:
            raise ValueError(f"Field name '{name}' not found. Available fields: {', '.join(FieldHelper.get_field_names().values())}")

    @staticmethod
    def list_fields() -> List[str]:
        """
        Get a list of all available field names.
        
        Returns:
            List[str]: List of field names
        """
        return list(FieldHelper.get_field_names().values()) 