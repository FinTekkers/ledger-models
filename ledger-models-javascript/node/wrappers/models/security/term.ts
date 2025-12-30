import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';

/**
 * Represents a period of time with years, months, and total days.
 * Similar to Java's Period class. Days includes weeks converted to days.
 */
export interface Period {
    years: number;
    months: number;
    days: number; // Total days (includes weeks converted to days)
}

/**
 * Tenor class representing the maturity or term of a security.
 * Can be UNKNOWN, PERPETUAL, or TERM (with a specific period).
 */
export class Tenor {
    public static readonly UNKNOWN_TENOR = new Tenor(TenorTypeProto.UNKNOWN_TENOR_TYPE);

    static tenorTypeEnumMap: Map<number, string>;

    static {
        Tenor.tenorTypeEnumMap = new Map<number, string>();

        Object.keys(TenorTypeProto).forEach(key => {
            Tenor.tenorTypeEnumMap.set(TenorTypeProto[key as keyof typeof TenorTypeProto], key);
        });
    }

    private type: TenorTypeProto;
    private tenor: Period | null;

    constructor(type: TenorTypeProto);
    constructor(type: TenorTypeProto, term: string);
    constructor(type: TenorTypeProto, tenor: Period);
    constructor(type: TenorTypeProto, termOrTenor?: string | Period) {
        this.type = type;

        if (termOrTenor === undefined) {
            this.tenor = null;
        } else if (typeof termOrTenor === 'string') {
            this.tenor = Tenor.fromTenorDescription(termOrTenor);
        } else {
            if (type !== TenorTypeProto.TERM) {
                throw new Error('Cannot instantiate a tenor with a term unless the TenorType is TERM');
            }
            this.tenor = termOrTenor;
        }
    }

    getType(): TenorTypeProto {
        return this.type;
    }

    getTenor(): Period | null {
        return this.tenor;
    }

    getTenorDescription(): string {
        const tenor = this.getTenor();
        if (!tenor) {
            return '';
        }
        return Tenor.periodToString(tenor);
    }

    toString(): string {
        let str = Tenor.tenorTypeEnumMap.get(this.type) ?? 'UNKNOWN';

        if (this.type === TenorTypeProto.TERM) {
            str += ': ';
            str += this.getTenorDescription();
        }

        return str;
    }

    /**
     * Parses a tenor description string (e.g., "2Y3M") into a Period object.
     * @param tenorDescription - String like "2Y3M", "1Y6M2W", "5D", etc.
     * @returns Period object or null if the description is empty
     */
    public static fromTenorDescription(tenorDescription: string): Period | null {
        if (!tenorDescription || tenorDescription.trim() === '') {
            return null;
        }

        return Tenor.parsePeriod(tenorDescription);
    }

    /**
     * Converts a Period object to a string representation (e.g., "2Y3M").
     * @param period - Period object to convert
     * @returns String representation like "2Y3M" or empty string if period is negative
     */
    public static periodToString(period: Period): string {
        if (Tenor.isPeriodNegative(period)) {
            return '';
        }

        let years = period.years;
        let months = period.months;
        // Extract weeks and remaining days from total days
        let weeks = Math.floor(period.days / 7);
        let days = period.days % 7;

        // Calculate total days from weeks and days
        const totalDays = weeks * 7 + days;

        // Round up months when total days >= 27 (approximately 4 weeks)
        // This covers cases like 3W6D (27 days) which should round up
        if (totalDays >= 27) {
            months += 1;
            weeks = 0; // Weeks are absorbed into months
            days = 0; // Days are discarded when rounding up
        }
        // Also round up months when months >= 11 and there are any weeks (>= 2 weeks)
        // This covers cases like 11M2W which should round to 12M = 1Y
        else if (months >= 11 && weeks >= 2) {
            months += 1;
            weeks = 0;
            days = 0;
        }
        // Discard days when there are no weeks (e.g., 6M1D -> 6M)
        else if (weeks === 0 && days > 0) {
            days = 0;
        }

        // Round up years when months reach 12 or more
        if (months >= 12) {
            years += Math.floor(months / 12);
            months = months % 12;
        }

        const parts: string[] = [];
        if (years > 0) {
            parts.push(`${years}Y`);
        }
        if (months > 0) {
            parts.push(`${months}M`);
        }
        if (weeks > 0) {
            parts.push(`${weeks}W`);
        }
        if (days > 0) {
            parts.push(`${days}D`);
        }

        return parts.join('').trim();
    }

    /**
     * Checks if a period is negative (has any negative component).
     */
    private static isPeriodNegative(period: Period): boolean {
        return period.years < 0 || period.months < 0 || period.days < 0;
    }

    /**
     * Parses a period string (e.g., "2Y3M", "1Y6M2W5D") into a Period object.
     * @param periodString - String like "2Y3M", "1Y6M2W", "5D", etc.
     * @returns Period object
     * @throws Error if the period string contains invalid characters
     */
    public static parsePeriod(periodString: string): Period {
        let years = 0;
        let months = 0;
        let weeks = 0;
        let days = 0;

        let numberString = '';
        for (let i = 0; i < periodString.length; i++) {
            const c = periodString.charAt(i);
            if (/\d/.test(c)) {
                numberString += c;
            } else {
                if (numberString === '') {
                    throw new Error(`Invalid period string: expected number before '${c}'`);
                }
                const number = parseInt(numberString, 10);
                switch (c) {
                    case 'Y':
                        years = number;
                        break;
                    case 'M':
                        // Check if next character is 'W' (for months-weeks ambiguity)
                        if (i < periodString.length - 1 && periodString.charAt(i + 1) === 'W') {
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
                        throw new Error(`Invalid character in period string: ${c}`);
                }
                numberString = '';
            }
        }

        // Convert weeks to days and combine with days (matching Java Period.of behavior)
        return {
            years,
            months,
            days: days + weeks * 7
        };
    }
}
