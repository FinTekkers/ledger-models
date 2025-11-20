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
}

