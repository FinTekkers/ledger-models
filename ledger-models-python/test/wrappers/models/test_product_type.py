import pytest
from fintekkers.wrappers.models.security.product_type import ProductType

def test_product_type_values():
    """Test that all ProductType values are correctly initialized with their short and long names."""
    # Test FRN
    assert ProductType.FRN.get_short_name() == "FRN"
    assert ProductType.FRN.get_long_name() == "Floating Rate Note (FRN)"
    assert str(ProductType.FRN) == "FRN"

    # Test TIPS
    assert ProductType.TIPS.get_short_name() == "TIPS"
    assert ProductType.TIPS.get_long_name() == "Treasury Inflation Protected Security (TIPS)"
    assert str(ProductType.TIPS) == "TIPS"

    # Test BILL
    assert ProductType.BILL.get_short_name() == "Bill"
    assert ProductType.BILL.get_long_name() == "Treasury Bill"
    assert str(ProductType.BILL) == "Bill"

    # Test NOTE
    assert ProductType.NOTE.get_short_name() == "Note"
    assert ProductType.NOTE.get_long_name() == "Treasury Note"
    assert str(ProductType.NOTE) == "Note"

    # Test BOND
    assert ProductType.BOND.get_short_name() == "Bond"
    assert ProductType.BOND.get_long_name() == "Treasury Bond"
    assert str(ProductType.BOND) == "Bond"

    # Test EQUITY
    assert ProductType.EQUITY.get_short_name() == "Equity"
    assert ProductType.EQUITY.get_long_name() == "Cash Equity"
    assert str(ProductType.EQUITY) == "Equity"

    # Test CASH
    assert ProductType.CASH.get_short_name() == "Cash"
    assert ProductType.CASH.get_long_name() == "Cash"
    assert str(ProductType.CASH) == "Cash"

    # Test UNCLASSIFIED
    assert ProductType.UNCLASSIFIED.get_short_name() == "N/A"
    assert ProductType.UNCLASSIFIED.get_long_name() == "Unclassified"
    assert str(ProductType.UNCLASSIFIED) == "N/A"

def test_product_type_enum_behavior():
    """Test additional enum behavior like comparison and iteration."""
    # Test that all values are unique
    values = set()
    for product_type in ProductType:
        values.add(product_type.get_short_name())
    assert len(values) == len(ProductType)

    # Test that we can get a ProductType by name
    assert ProductType["FRN"] == ProductType.FRN
    assert ProductType["TIPS"] == ProductType.TIPS

    # Test that we can't get a non-existent ProductType
    with pytest.raises(KeyError):
        ProductType["NONEXISTENT"]

    # Test enum comparison
    assert ProductType.FRN != ProductType.TIPS
    assert ProductType.FRN == ProductType.FRN 