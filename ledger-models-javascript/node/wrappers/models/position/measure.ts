import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';

/**
 * Static helpers around the MeasureProto enum, mirroring the wrapper pattern
 * shipped in v0.1.133–v0.1.135 (PRs #188 Identifier, #189 SecurityType +
 * AssetClass, #190 PositionFilterOperator).
 *
 * Strict: takes / returns proto enum NAMES ("PRESENT_VALUE",
 * "MODIFIED_DURATION", ...). Consumers (including UI URL conventions and
 * dropdown labels) should standardize on proto names — ledger-models is
 * the source-of-truth vocabulary and should not absorb consumer-side
 * naming conventions. See FinTekkers/ui-service#149 for the consumer
 * surface that motivated this wrapper.
 */
export class Measure {

    /**
     * Returns the names of all known MeasureProto values, EXCLUDING the
     * sentinel `UNKNOWN_MEASURE`. Drives UI dropdowns / pickers so adding
     * a new proto enum variant auto-propagates to consumers.
     *
     * Order matches proto declaration order.
     */
    static getAllTypeNames(): string[] {
        return Object.keys(MeasureProto).filter(
            k => k !== 'UNKNOWN_MEASURE'
        );
    }

    /**
     * Resolve a proto enum NAME (e.g., "PRESENT_VALUE", "DIRTY_PRICE") to
     * its numeric MeasureProto value. Throws on unknown name; the error
     * lists the valid names so typos are fixable without grepping the proto.
     */
    static fromName(name: string): MeasureProto {
        const enumObj = MeasureProto as unknown as Record<string, number>;
        const enumValue = enumObj[name];
        if (enumValue === undefined) {
            throw new Error(
                `Unknown Measure name: '${name}'. Valid names: ${Measure.getAllTypeNames().join(', ')}`
            );
        }
        return enumValue as MeasureProto;
    }
}
