from decimal import Decimal

from fintekkers.wrappers.models.cost_basis import weighted_average_purchase_price


def test_sells_do_not_change_the_buys_only_average():
    fills = [
        (Decimal("100"), Decimal("10")),
        (Decimal("100"), Decimal("20")),
        (Decimal("-50"), Decimal("25")),
    ]

    result = weighted_average_purchase_price(fills)

    assert result == Decimal("15")
    assert str(result) == "15"


def test_no_buys_returns_none():
    assert weighted_average_purchase_price([(Decimal("-50"), Decimal("25"))]) is None


def test_repeating_result_rounds_to_12_places_half_even():
    result = weighted_average_purchase_price([
        (Decimal("1"), Decimal("1")),
        (Decimal("2"), Decimal("2")),
    ])

    assert str(result) == "1.666666666667"
