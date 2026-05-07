"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionFilterOperator = void 0;
// The proto module exports the enum as `PositionFilterOperator` (no `Proto`
// suffix, unlike SecurityTypeProto / AssetClassProto / IdentifierTypeProto).
// Renamed on import to free the natural class name for the wrapper. Consumers
// who want the enum type for their own annotations can import directly from
// the proto module:
//
//   import { PositionFilterOperator } from '@fintekkers/.../position_util_pb';
//
// vs. importing the wrapper helpers from this file:
//
//   import { PositionFilterOperator } from '@fintekkers/.../position_filter_operator';
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
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
class PositionFilterOperator {
    /**
     * Returns the names of all known PositionFilterOperator values, EXCLUDING
     * the sentinel `UNKNOWN_OPERATOR`. Drives UI dropdowns / pickers so
     * adding a new proto enum variant auto-propagates to consumers.
     *
     * Order matches proto declaration order.
     */
    static getAllTypeNames() {
        return Object.keys(position_util_pb_1.PositionFilterOperator).filter(k => k !== 'UNKNOWN_OPERATOR');
    }
    /**
     * Resolve a proto enum NAME (e.g., "MORE_THAN", "EQUALS") to its numeric
     * PositionFilterOperator value. Throws on unknown name; the error lists
     * the valid names so typos are fixable without grepping the proto.
     */
    static fromName(name) {
        const enumObj = position_util_pb_1.PositionFilterOperator;
        const enumValue = enumObj[name];
        if (enumValue === undefined) {
            throw new Error(`Unknown PositionFilterOperator name: '${name}'. Valid names: ${PositionFilterOperator.getAllTypeNames().join(', ')}`);
        }
        return enumValue;
    }
}
exports.PositionFilterOperator = PositionFilterOperator;
//# sourceMappingURL=position_filter_operator.js.map