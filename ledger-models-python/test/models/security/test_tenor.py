#Test the Tenor class

from fintekkers.wrappers.models.security.tenor import Tenor
from dateutil.relativedelta import relativedelta
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto

def test_tenor_initializer_with_term_and_string_tenor():
    tenor = Tenor(TenorTypeProto.TERM, "1Y")
    assert tenor.get_tenor() == relativedelta(years=1)
    assert tenor.get_tenor_description() == "1Y"


def test_tenor_get_type_name():
    tenor = Tenor(TenorTypeProto.TERM, "1Y")
    assert tenor.get_type_name() == "TERM"

    tenor = Tenor(TenorTypeProto.PERPETUAL, None)
    assert tenor.get_type_name() == "PERPETUAL"
    assert tenor.get_tenor_description() == TenorTypeProto.Name(TenorTypeProto.PERPETUAL)

def test_str_representation():
    tenor = Tenor(TenorTypeProto.TERM, "1Y")
    assert str(tenor) == "TERM: 1Y"


def test_period_to_string_rounding_weeks_to_months():
    """Test that 4 or more weeks round up to months"""
    # 3M4W1D should round to 4M
    period = relativedelta(months=3, days=4*7 + 1)  # 3 months, 4 weeks, 1 day
    result = Tenor.period_to_string(period)
    assert result == "4M", f"Expected '4M', got '{result}'"


def test_period_to_string_rounding_months_to_years():
    """Test that 12 or more months round up to years"""
    # 11M4W2D should round to 1Y
    period = relativedelta(months=11, weeks=4, days=1)  # 11 months, 4 weeks, 2 days
    result = Tenor.period_to_string(period)
    assert result == "1Y", f"Expected '1Y', got '{result}'"


def test_period_to_string_rounding_years_with_months():
    """Test that months rounding up to years correctly adds to existing years"""
    # 9Y11M4W2D should round to 10Y
    period = relativedelta(years=9, months=11, days=4*7 + 2)  # 9 years, 11 months, 4 weeks, 2 days
    result = Tenor.period_to_string(period)
    assert result == "10Y", f"Expected '10Y', got '{result}'"


def test_period_to_string_rounding_large_years():
    """Test rounding with large year values"""
    # 29Y11M4W1D should round to 30Y
    period = relativedelta(years=29, months=11, days=4*7 + 1)  # 29 years, 11 months, 4 weeks, 1 day
    result = Tenor.period_to_string(period)
    assert result == "30Y", f"Expected '30Y', got '{result}'"


def test_period_to_string_no_rounding_needed():
    """Test that periods that don't need rounding remain unchanged"""
    # 1Y2M3W should remain 1Y2M3W
    period = relativedelta(years=1, months=2, days=3*7)
    result = Tenor.period_to_string(period)
    assert result == "1Y2M3W", f"Expected '1Y2M3W', got '{result}'"
    
    # 5M2W should remain 5M2W
    period = relativedelta(months=5, days=2*7)
    result = Tenor.period_to_string(period)
    assert result == "5M2W", f"Expected '5M2W', got '{result}'"


def test_period_to_string_exactly_4_weeks():
    """Test that exactly 4 weeks (with 0 days) rounds up"""
    # 3M4W should round to 4M
    period = relativedelta(months=3, days=4*7)  # 3 months, exactly 4 weeks
    result = Tenor.period_to_string(period)
    assert result == "4M", f"Expected '4M', got '{result}'"


def test_period_to_string_more_than_4_weeks():
    """Test that more than 4 weeks also rounds up"""
    # 2M5W should round to 3M
    period = relativedelta(months=2, days=5*7)  # 2 months, 5 weeks
    result = Tenor.period_to_string(period)
    assert result == "3M", f"Expected '3M', got '{result}'"


def test_period_to_string_multiple_year_rounding():
    """Test rounding when months round up to multiple years"""
    # 0Y24M4W should round to 2Y
    period = relativedelta(months=24, days=4*7)  # 24 months, 4 weeks
    result = Tenor.period_to_string(period)
    assert result == "2Y1M", f"Expected '2Y1M', got '{result}'"
    
    # 5Y24M4W should round to 7Y
    period = relativedelta(years=5, months=24, days=4*7)  # 5 years, 24 months, 4 weeks
    result = Tenor.period_to_string(period)
    assert result == "7Y1M", f"Expected '7Y1M', got '{result}'"


def test_period_to_string_remaining_months_after_year_rounding():
    """Test that remaining months after year rounding are preserved"""
    # 0Y13M4W should round to 1Y1M
    period = relativedelta(months=13, days=4*7)  # 13 months, 4 weeks
    result = Tenor.period_to_string(period)
    assert result == "1Y2M", f"Expected '1Y2M', got '{result}'"
    
    # 2Y14M4W should round to 3Y2M
    period = relativedelta(years=2, months=14, days=4*7)  # 2 years, 14 months, 4 weeks
    result = Tenor.period_to_string(period)
    assert result == "3Y3M", f"Expected '3Y3M', got '{result}'"


def test_period_to_string_rounding_27_days():
    """Test that 27 days (3W6D) rounds up to next month"""
    # 3M3W6D should round to 4M
    period = relativedelta(months=3, days=3*7 + 6)  # 3 months, 3 weeks, 6 days = 27 days
    result = Tenor.period_to_string(period)
    assert result == "4M", f"Expected '4M', got '{result}'"


def test_period_to_string_discard_days_without_weeks():
    """Test that days are discarded when there are no weeks"""
    # 6M1D should round to 6M
    period = relativedelta(months=6, days=1)  # 6 months, 1 day
    result = Tenor.period_to_string(period)
    assert result == "6M", f"Expected '6M', got '{result}'"


def test_period_to_string_rounding_11_months_with_weeks():
    """Test that 11 months with 2+ weeks rounds up to next year"""
    # 19Y11M2W should round to 20Y
    period = relativedelta(years=19, months=11, days=2*7)  # 19 years, 11 months, 2 weeks
    result = Tenor.period_to_string(period)
    assert result == "20Y", f"Expected '20Y', got '{result}'"
