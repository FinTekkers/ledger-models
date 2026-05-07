import { AssetClassProto } from '../../../fintekkers/models/security/asset_class_pb';
/**
 * Static helpers around the AssetClass proto enum, mirroring the
 * Identifier wrapper pattern shipped in v0.1.133 (PR #188) and the
 * SecurityType wrapper alongside this file.
 *
 * Note: SecurityProto.asset_class is currently a `string` field
 * (security.proto field 11). This enum defines the canonical vocabulary;
 * the field type stays string in this release to avoid coordinating a
 * breaking change with downstream services. A follow-up will flip the
 * field type after a data-normalization audit.
 *
 * Until then: producers SHOULD use `AssetClass.getAllTypeNames()` as
 * the source of truth for the legal string values; consumers SHOULD
 * use `AssetClass.fromName(name)` to validate a string against the
 * canonical vocabulary.
 */
export declare class AssetClass {
    /**
     * Returns the names of all known AssetClassProto values, EXCLUDING
     * the sentinel `UNKNOWN_ASSET_CLASS`. Drives UI dropdowns / pickers
     * so adding a new proto enum variant auto-propagates to consumers.
     *
     * Order matches proto declaration order.
     */
    static getAllTypeNames(): string[];
    /**
     * Resolve a proto enum NAME (e.g., "FIXED_INCOME", "EQUITY") to its
     * numeric AssetClassProto value. Throws on unknown name; the error
     * lists the valid names so typos are fixable without grepping the
     * proto.
     *
     * @param name proto enum key (e.g., "FIXED_INCOME")
     * @returns the numeric AssetClassProto value
     */
    static fromName(name: string): AssetClassProto;
}
