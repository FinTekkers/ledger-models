import calendar
from datetime import date

from dateutil.relativedelta import relativedelta

from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.models.security.tenor_pb2 import TenorProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.wrappers.util.object_types import stamp
class Tenor:
    UNKNOWN_TENOR = None
    type:TenorTypeProto = None
    tenor:relativedelta = None
    
    def __init__(self, type:TenorTypeProto, term:str=None):
        self.type = type
        if term != None:
            self.tenor = Tenor.from_tenor_description(term)
    
    
    def __str__(self) -> str:
        result = []
        type_name = TenorTypeProto.Name(self.get_type())
        result.append(type_name)

        if self.get_type() == TenorTypeProto.TERM:
            result.append(": ")
            result.append(self.get_tenor_description())

        return "".join(result)

    @staticmethod
    def of_period(period: relativedelta) -> "Tenor":
        """A TERM tenor holding ``period`` as is."""
        tenor = Tenor(TenorTypeProto.TERM)
        tenor.tenor = period
        return tenor

    @staticmethod
    def period_between(start: date, end: date) -> relativedelta:
        """Java's ``Period.between(start, end)`` as a relativedelta built from
        fields. Never ``relativedelta(end, start)``: that normalises
        2026-08-31 -> 2026-11-30 to 3 months, where Java gives P2M30D.
        Years and months split by truncation toward zero, as Java does."""
        total_months = (end.year * 12 + end.month) - (start.year * 12 + start.month)
        days = end.day - start.day
        if total_months > 0 and days < 0:
            total_months -= 1
            days = (end - (start + relativedelta(months=total_months))).days
        elif total_months < 0 and days > 0:
            total_months += 1
            days -= calendar.monthrange(end.year, end.month)[1]
        years = abs(total_months) // 12 * (1 if total_months >= 0 else -1)
        months = total_months - 12 * years
        return relativedelta(years=years, months=months, days=days)

    @classmethod
    def from_tenor_description(cls, tenor_description) -> relativedelta:
        if not tenor_description and tenor_description != "":
            return None
        
        return Tenor.parse_period(tenor_description)
    
    def get_type(self) -> TenorTypeProto:
        return self.type


    def get_type_name(self) -> str:
        return TenorTypeProto.Name(self.type)
    
    def get_tenor(self) -> relativedelta:
        return self.tenor
    
    def get_tenor_description(self) -> str:
        if self.get_type() == TenorTypeProto.UNKNOWN_TENOR_TYPE:
            return TenorTypeProto.Name(self.get_type())
        if self.get_type() == TenorTypeProto.PERPETUAL:
            return TenorTypeProto.Name(self.get_type())
        
        return Tenor.period_to_string(self.tenor)
    
    def as_proto(self) -> TenorProto:
        return stamp(TenorProto(
            tenor_type=self.type,
            term_value=self.get_tenor_description()
        ), ObjectTypeProto.OBJECT_TYPE_TENOR)

    @staticmethod
    def period_to_string(period:relativedelta) -> str:
        years = period.years
        months = period.months
        weeks = period.days // 7
        days = period.days % 7
        
        # Calculate total days from weeks and days
        total_days = weeks * 7 + days
        
        # Round up months when total days >= 27 (approximately 4 weeks)
        # This covers cases like 3W6D (27 days) which should round up
        if total_days >= 27:
            months += 1
            weeks = 0  # Weeks are absorbed into months
            days = 0  # Days are discarded when rounding up
        # Also round up months when months >= 11 and there are any weeks (>= 2 weeks)
        # This covers cases like 11M2W which should round to 12M = 1Y
        elif months >= 11 and weeks >= 2:
            months += 1
            weeks = 0
            days = 0
        # Discard days when there are no weeks (e.g., 6M1D -> 6M)
        elif weeks == 0 and days > 0:
            days = 0
        
        # Round up years when months reach 12 or more
        if months >= 12:
            years += months // 12
            months = months % 12
        
        result = ""
        if years > 0:
            result += f"{years}Y"
        if months > 0:
            result += f"{months}M"
        if weeks > 0:
            result += f"{weeks}W"
        if days > 0:
            result += f"{days}D"
        
        return result.strip()
    
    @staticmethod
    def parse_period(period_string) -> relativedelta:
        years = 0
        months = 0
        weeks = 0
        days = 0
        
        number_string = ""
        for c in period_string:
            if c.isdigit():
                number_string += c
            else:
                number = int(number_string)
                if c == 'Y':
                    years = number
                elif c == 'M':
                    if period_string.index(c) < len(period_string) - 1 and period_string[period_string.index(c) + 1] == 'W':
                        weeks = number
                        number_string = ""
                        continue
                    else:
                        months = number
                elif c == 'W':
                    weeks = number
                elif c == 'D':
                    days = number
                else:
                    raise ValueError("Invalid character in period string: {}".format(c))
                number_string = ""
        
        return relativedelta(days=days, weeks=weeks, months=months, years=years)

