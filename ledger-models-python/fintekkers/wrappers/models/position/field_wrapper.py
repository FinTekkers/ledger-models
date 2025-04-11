from typing import List, Iterator, Union
from fintekkers.models.position.field_pb2 import FieldProto

class FieldWrapper:
    """
    A wrapper class for FieldProto that provides a more intuitive interface
    for accessing field names and values.
    """
    def __init__(self, field: FieldProto):
        """
        Initialize a FieldWrapper with a FieldProto.
        
        Args:
            field: The FieldProto to wrap
        """
        self._field = field
    
    @property
    def name(self) -> str:
        """
        Get the name of the field.
        
        Returns:
            str: The name of the field
        """
        return FieldProto.Name(self._field)
    
    @property
    def value(self) -> int:
        """
        Get the value of the field.
        
        Returns:
            int: The value of the field
        """
        return self._field
    
    def __str__(self) -> str:
        """
        Get a string representation of the field.
        
        Returns:
            str: The name of the field
        """
        return self.name
    
    def __repr__(self) -> str:
        """
        Get a string representation of the field.
        
        Returns:
            str: The name of the field
        """
        return f"FieldWrapper({self.name})"


class FieldList:
    """
    A wrapper class for a list of FieldProto that provides a more intuitive interface
    for accessing field names and values.
    """
    def __init__(self, fields: List[FieldProto]):
        """
        Initialize a FieldList with a list of FieldProto.
        
        Args:
            fields: The list of FieldProto to wrap
        """
        self._fields = fields
    
    def __len__(self) -> int:
        """
        Get the number of fields.
        
        Returns:
            int: The number of fields
        """
        return len(self._fields)
    
    def __getitem__(self, index: int) -> FieldWrapper:
        """
        Get a field by index.
        
        Args:
            index: The index of the field
            
        Returns:
            FieldWrapper: The field wrapper
        """
        return FieldWrapper(self._fields[index])
    
    def __iter__(self) -> Iterator[FieldWrapper]:
        """
        Get an iterator over the fields.
        
        Returns:
            Iterator[FieldWrapper]: An iterator over the fields
        """
        return (FieldWrapper(field) for field in self._fields)
    
    def names(self) -> List[str]:
        """
        Get a list of field names.
        
        Returns:
            List[str]: A list of field names
        """
        return [FieldWrapper(field).name for field in self._fields]
    
    def values(self) -> List[int]:
        """
        Get a list of field values.
        
        Returns:
            List[int]: A list of field values
        """
        return [field for field in self._fields]
    
    def __str__(self) -> str:
        """
        Get a string representation of the fields.
        
        Returns:
            str: A comma-separated list of field names
        """
        return ", ".join(self.names())
    
    def __repr__(self) -> str:
        """
        Get a string representation of the fields.
        
        Returns:
            str: A comma-separated list of field names
        """
        return f"FieldList([{self}])"


def wrap_fields(fields: List[FieldProto]) -> FieldList:
    """
    Wrap a list of FieldProto in a FieldList.
    
    Args:
        fields: The list of FieldProto to wrap
        
    Returns:
        FieldList: The field list wrapper
    """
    return FieldList(fields) 