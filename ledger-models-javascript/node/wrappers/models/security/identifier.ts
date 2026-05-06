import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';

export class Identifier {
    proto: IdentifierProto;

    constructor(proto: IdentifierProto) {
        this.proto = proto;
    }

    static identifierTypeEnumMap: Map<number, string>;

    static {
        Identifier.identifierTypeEnumMap = new Map<number, string>();

        Object.keys(IdentifierTypeProto).forEach(key => {
            Identifier.identifierTypeEnumMap.set(IdentifierTypeProto[key as keyof typeof IdentifierTypeProto], key);
        });
    }

    /**
     * Returns the identifier type name based on the enum value.
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a 
     * reverse map with the enum ID as the key and the enum descriptor as the value.
     * 
     * @returns IdentifierType as a string (e.g., "ISIN", "CUSIP", "EXCH_TICKER")
     */
    getIdentifierTypeName(): string {
        const identifierType = this.proto.getIdentifierType();
        return Identifier.identifierTypeEnumMap.get(identifierType) ?? 'UNKNOWN_IDENTIFIER_TYPE';
    }

    /**
     * Returns the identifier value (e.g., "US0378331005" for an ISIN)
     */
    getIdentifierValue(): string {
        return this.proto.getIdentifierValue();
    }

    /**
     * Returns the identifier type enum value
     */
    getIdentifierType(): IdentifierTypeProto {
        return this.proto.getIdentifierType();
    }

    /**
     * Returns a string representation in the format: "IDENTIFIER_TYPE:identifier_value"
     * Example: "ISIN:US0378331005" or "CUSIP:037833100"
     */
    toString(): string {
        const typeName = this.getIdentifierTypeName();
        const value = this.getIdentifierValue();
        return `${typeName}:${value}`;
    }

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
    static fromName(name: string, value: string): Identifier {
        const enumObj = IdentifierTypeProto as unknown as Record<string, number>;
        const enumValue = enumObj[name];
        if (enumValue === undefined) {
            throw new Error(
                `Unknown IdentifierType name: '${name}'. Valid names: ${Identifier.getAllTypeNames().join(', ')}`
            );
        }
        const proto = new IdentifierProto();
        proto.setIdentifierType(enumValue);
        proto.setIdentifierValue(value);
        return new Identifier(proto);
    }

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
    static getAllTypeNames(): string[] {
        return Object.keys(IdentifierTypeProto).filter(
            k => k !== 'UNKNOWN_IDENTIFIER_TYPE'
        );
    }
}

