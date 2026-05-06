import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
export declare class Identifier {
    proto: IdentifierProto;
    constructor(proto: IdentifierProto);
    static identifierTypeEnumMap: Map<number, string>;
    /**
     * Returns the identifier type name based on the enum value.
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum descriptor as the value.
     *
     * @returns IdentifierType as a string (e.g., "ISIN", "CUSIP", "EXCH_TICKER")
     */
    getIdentifierTypeName(): string;
    /**
     * Returns the identifier value (e.g., "US0378331005" for an ISIN)
     */
    getIdentifierValue(): string;
    /**
     * Returns the identifier type enum value
     */
    getIdentifierType(): IdentifierTypeProto;
    /**
     * Returns a string representation in the format: "IDENTIFIER_TYPE:identifier_value"
     * Example: "ISIN:US0378331005" or "CUSIP:037833100"
     */
    toString(): string;
    /**
     * Build an Identifier from the proto enum's NAME (e.g., "ISIN", "CUSIP",
     * "EXCH_TICKER") plus the identifier value. Saves callers from rolling
     * their own name->enum switch — adding a new enum variant on the proto
     * side propagates automatically.
     *
     * Throws if `name` isn't a known IdentifierTypeProto key. The error
     * lists the valid names so the caller can fix the typo without grepping.
     *
     * @param name proto enum key (e.g., "ISIN")
     * @param value the identifier value (e.g., "US0378331005")
     */
    static fromName(name: string, value: string): Identifier;
    /**
     * Returns the names of all known IdentifierType enum values, EXCLUDING
     * the sentinel `UNKNOWN_IDENTIFIER_TYPE`. Drives UI dropdowns / pickers
     * so adding a new proto enum variant auto-propagates to consumers
     * without any UI-side code change.
     *
     * Order matches proto declaration order (Object.keys preserves
     * insertion order on the generated JS enum object).
     *
     * @returns string[] of identifier type names, e.g.
     *   ["EXCH_TICKER", "ISIN", "CUSIP", "OSI", "FIGI", "SERIES_ID", "CASH"]
     */
    static getAllTypeNames(): string[];
}
