package common.models.security;

import common.models.IRawDataModelObject;
import org.apache.commons.lang3.StringUtils;

import java.time.Period;
import java.time.ZonedDateTime;
import java.util.UUID;

public class Tenor implements IRawDataModelObject {
    public static Tenor UNKNOWN_TENOR = new Tenor(TenorType.UNKNOWN);

    private TenorType type;
    private Period tenor;

    public Tenor(TenorType type) {
        this.type = type;
    }

    public Tenor(TenorType type, String term) {
        this.type = type;
        this.tenor = fromTenorDescription(term);
    }

    public Tenor(TenorType type, Period tenor) {
        if(!TenorType.TERM.equals(type)) {
            throw new RuntimeException("Cannot instantiate a tenor with a term unless the TenorType is TERM");
        }

        this.type = type;
        this.tenor = tenor;
    }

    public TenorType getType() {
        return type;
    }

    public Period getTenor() {
        return tenor;
    }

    
    public String getTenorDescription() {
        Period tenor = getTenor();

        return periodToString(tenor);
    }

    public static Period fromTenorDescription(String tenorDescription) {
        if(StringUtils.isEmpty(tenorDescription))
            return null;

        return parsePeriod(tenorDescription);
    }

    public static String periodToString(Period period) {
        if(period.isNegative()) {
            return "";
        }

        int years = period.getYears();
        int months = period.getMonths();
        int weeks = period.getDays() / 7;
        int days = period.getDays() % 7;

        StringBuilder sb = new StringBuilder();
        if (years > 0) {
            sb.append(years).append("Y");
        }
        if (months > 0) {
            sb.append(months).append("M");
        }
        if (weeks > 0) {
            sb.append(weeks).append("W");
        }
        if (days > 0) {
            sb.append(days).append("D");
        }

        return sb.toString().trim();
    }

    public static Period parsePeriod(String periodString) {
        int years = 0;
        int months = 0;
        int weeks = 0;
        int days = 0;

        String numberString = "";
        for (int i = 0; i < periodString.length(); i++) {
            char c = periodString.charAt(i);
            if (Character.isDigit(c)) {
                numberString += c;
            } else {
                int number = Integer.parseInt(numberString);
                switch (c) {
                    case 'Y':
                        years = number;
                        break;
                    case 'M':
                        if (i < periodString.length() - 1 && periodString.charAt(i + 1) == 'W') {
                            weeks = number;
                            i++; // Skip next character (W)
                        } else {
                            months = number;
                        }
                        break;
                    case 'W':
                        weeks = number;
                        break;
                    case 'D':
                        days = number;
                        break;
                    default:
                        throw new IllegalArgumentException("Invalid character in period string: " + c);
                }
                numberString = "";
            }
        }

        return Period.of(years, months, days + weeks * 7);
    }

    //Below methods are just to allow the Serializer to inherit. Might want to refactor the Serializer contract
    @Override
    public UUID getID() {
        throw new UnsupportedOperationException();
    }

    @Override
    public ZonedDateTime getValidFrom() {
        throw new UnsupportedOperationException();
    }

    @Override
    public ZonedDateTime getValidTo() {
        throw new UnsupportedOperationException();
    }

    @Override
    public ZonedDateTime getAsOf() {
        throw new UnsupportedOperationException();
    }
}

