import { PositionFilterOperator as PositionFilterOperatorEnum } from '../../../fintekkers/models/position/position_util_pb';
/**
 * Static helpers around the PositionFilterOperator proto enum, mirroring
 * the Identifier / SecurityType / AssetClass wrapper pattern shipped in
 * v0.1.133–v0.1.134 (PRs #188, #189).
 *
 * Strict: takes / returns proto enum NAMES ("MORE_THAN", "LESS_THAN_OR_EQUALS",
 * ...). Consumers (including UI URL conventions) should standardize on
 * proto names — ledger-models is the source-of-truth vocabulary and
 * should not absorb consumer-side naming conventions. See
 * FinTekkers/second-brain#229 for the ui-service migration path.
 */
export declare class PositionFilterOperator {
    /**
     * Returns the names of all known PositionFilterOperator values, EXCLUDING
     * the sentinel `UNKNOWN_OPERATOR`. Drives UI dropdowns / pickers so
     * adding a new proto enum variant auto-propagates to consumers.
     *
     * Order matches proto declaration order.
     */
    static getAllTypeNames(): string[];
    /**
     * Resolve a proto enum NAME (e.g., "MORE_THAN", "EQUALS") to its numeric
     * PositionFilterOperator value. Throws on unknown name; the error lists
     * the valid names so typos are fixable without grepping the proto.
     */
    static fromName(name: string): PositionFilterOperatorEnum;
}
