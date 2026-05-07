import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';

/**
 * Static helpers around the SecurityType proto enum, mirroring the
 * Identifier wrapper pattern shipped in v0.1.133 (PR #188).
 *
 * Lets TS/JS consumers stop hand-typing literal unions and switch
 * statements over `'BOND_SECURITY' | 'TIPS' | 'FRN' | ...` — adding a
 * new variant on the proto side propagates automatically.
 */
export class SecurityType {

    /**
     * Returns the names of all known SecurityTypeProto values, EXCLUDING
     * the sentinel `UNKNOWN_SECURITY_TYPE`. Drives UI dropdowns / pickers
     * so a new proto enum variant auto-propagates to consumers without
     * any UI-side code change.
     *
     * Order matches proto declaration order (Object.keys preserves
     * insertion order on the generated JS enum object).
     */
    static getAllTypeNames(): string[] {
        return Object.keys(SecurityTypeProto).filter(
            k => k !== 'UNKNOWN_SECURITY_TYPE'
        );
    }

    /**
     * Resolve a proto enum NAME (e.g., "BOND_SECURITY", "EQUITY_SECURITY")
     * to its numeric SecurityTypeProto value. Throws on unknown name; the
     * error lists the valid names so typos are fixable without grepping
     * the proto.
     *
     * @param name proto enum key (e.g., "BOND_SECURITY")
     * @returns the numeric SecurityTypeProto value
     */
    static fromName(name: string): SecurityTypeProto {
        const enumObj = SecurityTypeProto as unknown as Record<string, number>;
        const enumValue = enumObj[name];
        if (enumValue === undefined) {
            throw new Error(
                `Unknown SecurityType name: '${name}'. Valid names: ${SecurityType.getAllTypeNames().join(', ')}`
            );
        }
        return enumValue as SecurityTypeProto;
    }
}
