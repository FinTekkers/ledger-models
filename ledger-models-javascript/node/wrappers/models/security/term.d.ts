import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';
/**
 * Represents a period of time with years, months, and total days.
 * Similar to Java's Period class. Days includes weeks converted to days.
 */
export interface Period {
    years: number;
    months: number;
    days: number;
}
/**
 * Tenor class representing the maturity or term of a security.
 * Can be UNKNOWN, PERPETUAL, or TERM (with a specific period).
 */
export declare class Tenor {
    static readonly UNKNOWN_TENOR: Tenor;
    static tenorTypeEnumMap: Map<number, string>;
    private type;
    private tenor;
    constructor(type: TenorTypeProto);
    constructor(type: TenorTypeProto, term: string);
    constructor(type: TenorTypeProto, tenor: Period);
    getType(): TenorTypeProto;
    getTenor(): Period | null;
    getTenorDescription(): string;
    toString(): string;
    /**
     * Parses a tenor description string (e.g., "2Y3M") into a Period object.
     * @param tenorDescription - String like "2Y3M", "1Y6M2W", "5D", etc.
     * @returns Period object or null if the description is empty
     */
    static fromTenorDescription(tenorDescription: string): Period | null;
    /**
     * Converts a Period object to a string representation (e.g., "2Y3M").
     * @param period - Period object to convert
     * @returns String representation like "2Y3M" or empty string if period is negative
     */
    static periodToString(period: Period): string;
    /**
     * Checks if a period is negative (has any negative component).
     */
    private static isPeriodNegative;
    /**
     * Parses a period string (e.g., "2Y3M", "1Y6M2W5D") into a Period object.
     * @param periodString - String like "2Y3M", "1Y6M2W", "5D", etc.
     * @returns Period object
     * @throws Error if the period string contains invalid characters
     */
    static parsePeriod(periodString: string): Period;
}
